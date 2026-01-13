#!/usr/bin/env python3
"""
LoRA 微调脚本 (使用 Unsloth)

在 Mac M系列或 NVIDIA GPU 上微调 Qwen2.5-7B
"""

import json
import torch
from pathlib import Path
from datasets import Dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments

# 配置
BASE_DIR = Path(__file__).parent.parent
TRAIN_DATA_PATH = BASE_DIR / "data/processed/training_data.json"
VAL_DATA_PATH = BASE_DIR / "data/processed/validation_data.json"
OUTPUT_DIR = BASE_DIR / "models/lora_adapter"

# 模型配置
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"
MAX_SEQ_LENGTH = 2048

# LoRA 配置
LORA_R = 16
LORA_ALPHA = 32
LORA_DROPOUT = 0.05


def load_data():
    """加载训练数据"""
    with open(TRAIN_DATA_PATH, 'r', encoding='utf-8') as f:
        train_data = json.load(f)
    
    with open(VAL_DATA_PATH, 'r', encoding='utf-8') as f:
        val_data = json.load(f)
    
    return train_data, val_data


def format_prompt(sample):
    """格式化为模型输入格式"""
    return f"""<|im_start|>system
你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。<|im_end|>
<|im_start|>user
{sample['instruction']}<|im_end|>
<|im_start|>assistant
{sample['output']}<|im_end|>"""


def main():
    print("=" * 50)
    print("NanoBananaPro LoRA Training")
    print("=" * 50)
    
    # 检查数据
    if not TRAIN_DATA_PATH.exists():
        print(f"Error: Training data not found: {TRAIN_DATA_PATH}")
        print("Please run data preparation scripts first")
        return
    
    # 加载数据
    print("\n[1/5] Loading data...")
    train_data, val_data = load_data()
    print(f"Training samples: {len(train_data)}")
    print(f"Validation samples: {len(val_data)}")
    
    # 转换为 Dataset
    train_dataset = Dataset.from_list(train_data)
    val_dataset = Dataset.from_list(val_data)
    
    # 加载模型
    print("\n[2/5] Loading model...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=None,  # 自动检测
        load_in_4bit=True,  # 4-bit 量化节省显存
    )
    
    # 添加 LoRA 适配器
    print("\n[3/5] Adding LoRA adapter...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_R,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )
    
    # 训练参数
    print("\n[4/5] Setting up trainer...")
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.1,
        logging_steps=10,
        save_steps=100,
        eval_strategy="steps",
        eval_steps=100,
        save_total_limit=3,
        bf16=True,
        optim="adamw_8bit",
        weight_decay=0.01,
        max_grad_norm=1.0,
        seed=42,
    )
    
    # 创建训练器
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        args=training_args,
        formatting_func=format_prompt,
        max_seq_length=MAX_SEQ_LENGTH,
    )
    
    # 开始训练
    print("\n[5/5] Starting training...")
    print("-" * 50)
    trainer.train()
    
    # 保存模型
    print("\n[Done] Saving model...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    print(f"\nModel saved to: {OUTPUT_DIR}")
    print("\nNext steps:")
    print("1. Run merge_lora.py to merge LoRA weights")
    print("2. Run convert_to_gguf.py to convert for Ollama")


if __name__ == "__main__":
    main()
