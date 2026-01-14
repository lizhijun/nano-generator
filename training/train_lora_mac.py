#!/usr/bin/env python3
"""
LoRA 微调脚本 (Mac MPS 版本)

使用 PEFT + Transformers 在 Mac M系列上微调
适用于较小的模型如 Qwen2.5-1.5B 或 Qwen2.5-3B
"""

import json
import torch
from pathlib import Path
from datasets import Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, TaskType

# 配置
BASE_DIR = Path(__file__).parent.parent
TRAIN_DATA_PATH = BASE_DIR / "data/processed/training_data.json"
VAL_DATA_PATH = BASE_DIR / "data/processed/validation_data.json"
OUTPUT_DIR = BASE_DIR / "models/lora_adapter"

# 模型配置 - 使用 1.5B 加速训练
MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct"  # 更快的训练速度
MAX_SEQ_LENGTH = 512  # 减少序列长度加速

# LoRA 配置
LORA_CONFIG = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)


def load_data():
    """加载训练数据"""
    with open(TRAIN_DATA_PATH, 'r', encoding='utf-8') as f:
        train_data = json.load(f)
    
    with open(VAL_DATA_PATH, 'r', encoding='utf-8') as f:
        val_data = json.load(f)
    
    return train_data, val_data


def format_prompt(sample):
    """格式化为 Qwen 聊天模板"""
    return f"""<|im_start|>system
你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。<|im_end|>
<|im_start|>user
{sample['instruction']}<|im_end|>
<|im_start|>assistant
{sample['output']}<|im_end|>"""


def tokenize_function(examples, tokenizer):
    """Tokenize 数据"""
    texts = [format_prompt({"instruction": inst, "output": out}) 
             for inst, out in zip(examples['instruction'], examples['output'])]
    
    result = tokenizer(
        texts,
        truncation=True,
        max_length=MAX_SEQ_LENGTH,
        padding="max_length",
    )
    result["labels"] = result["input_ids"].copy()
    return result


def main():
    print("=" * 50)
    print("NanoBananaPro LoRA Training (Mac MPS)")
    print("=" * 50)
    
    # 检查设备
    if torch.backends.mps.is_available():
        device = torch.device("mps")
        print(f"Using device: MPS (Apple Silicon)")
    else:
        device = torch.device("cpu")
        print(f"Using device: CPU")
    
    # 检查数据
    if not TRAIN_DATA_PATH.exists():
        print(f"Error: Training data not found: {TRAIN_DATA_PATH}")
        return
    
    # 加载数据
    print("\n[1/5] Loading data...")
    train_data, val_data = load_data()
    print(f"Training samples: {len(train_data)}")
    print(f"Validation samples: {len(val_data)}")
    
    # 转换为 Dataset
    train_dataset = Dataset.from_list(train_data)
    val_dataset = Dataset.from_list(val_data)
    
    # 加载 tokenizer
    print("\n[2/5] Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # Tokenize 数据
    print("\n[3/5] Tokenizing data...")
    train_dataset = train_dataset.map(
        lambda x: tokenize_function(x, tokenizer),
        batched=True,
        remove_columns=train_dataset.column_names
    )
    val_dataset = val_dataset.map(
        lambda x: tokenize_function(x, tokenizer),
        batched=True,
        remove_columns=val_dataset.column_names
    )
    
    # 加载模型
    print("\n[4/5] Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,
        trust_remote_code=True,
    )
    # 移动到 MPS 设备
    model = model.to(device)
    
    # 添加 LoRA
    print("Adding LoRA adapter...")
    model = get_peft_model(model, LORA_CONFIG)
    model.print_trainable_parameters()
    
    # 训练参数 - 针对 M3 Pro 36GB 优化
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=1,  # 减少到 1 个 epoch 快速验证
        per_device_train_batch_size=2,  # 1.5B 可以用更大 batch
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
        logging_steps=20,
        save_steps=50,  # 更频繁保存
        eval_strategy="steps",
        eval_steps=100,
        save_total_limit=2,
        fp16=False,
        bf16=False,  # MPS 不支持 bf16
        optim="adamw_torch",
        weight_decay=0.01,
        max_grad_norm=1.0,
        seed=42,
        dataloader_pin_memory=False,  # MPS 需要禁用
        report_to="none",
        use_cpu=False,
    )
    
    # 数据整理器
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
    )
    
    # 创建训练器
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=data_collator,
    )
    
    # 检查是否有 checkpoint 可以恢复
    checkpoint_dirs = list(OUTPUT_DIR.glob("checkpoint-*"))
    resume_from = None
    if checkpoint_dirs:
        latest_checkpoint = max(checkpoint_dirs, key=lambda x: int(x.name.split("-")[1]))
        resume_from = str(latest_checkpoint)
        print(f"\nResuming from checkpoint: {resume_from}")
    
    # 开始训练
    print("\n[5/5] Starting training...")
    print("-" * 50)
    trainer.train(resume_from_checkpoint=resume_from)
    
    # 保存模型
    print("\n[Done] Saving model...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    print(f"\nModel saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
