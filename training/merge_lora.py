#!/usr/bin/env python3
"""
合并 LoRA 权重到基础模型

将 LoRA adapter 与基础模型合并，生成独立的完整模型
"""

import torch
from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE_DIR = Path(__file__).parent.parent
LORA_PATH = BASE_DIR / "models/lora_adapter"
OUTPUT_PATH = BASE_DIR / "models/merged"
BASE_MODEL = "Qwen/Qwen2.5-1.5B-Instruct"


def merge_lora():
    """合并 LoRA 权重"""
    
    print("=" * 60)
    print("Merging LoRA Weights")
    print("=" * 60)
    
    # 检查 LoRA adapter 是否存在
    if not (LORA_PATH / "adapter_config.json").exists():
        raise FileNotFoundError(f"LoRA adapter not found at {LORA_PATH}")
    
    # 加载基础模型
    print(f"\n1. Loading base model: {BASE_MODEL}")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
        trust_remote_code=True,
    )
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    
    # 加载 LoRA adapter
    print(f"\n2. Loading LoRA adapter from: {LORA_PATH}")
    model = PeftModel.from_pretrained(model, str(LORA_PATH))
    
    # 合并权重
    print("\n3. Merging weights...")
    model = model.merge_and_unload()
    
    # 保存合并后的模型
    print(f"\n4. Saving merged model to: {OUTPUT_PATH}")
    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    
    model.save_pretrained(str(OUTPUT_PATH))
    tokenizer.save_pretrained(str(OUTPUT_PATH))
    
    # 统计文件大小
    total_size = sum(f.stat().st_size for f in OUTPUT_PATH.glob("*") if f.is_file())
    print(f"\n5. Done! Total size: {total_size / 1024 / 1024 / 1024:.2f} GB")
    
    # 列出文件
    print("\nFiles created:")
    for f in sorted(OUTPUT_PATH.iterdir()):
        if f.is_file():
            size_mb = f.stat().st_size / 1024 / 1024
            print(f"  - {f.name}: {size_mb:.2f} MB")
    
    return str(OUTPUT_PATH)


def verify_merged_model():
    """验证合并后的模型"""
    
    print("\n" + "=" * 60)
    print("Verifying Merged Model")
    print("=" * 60)
    
    if not (OUTPUT_PATH / "config.json").exists():
        print("Merged model not found!")
        return False
    
    print("\nLoading merged model...")
    model = AutoModelForCausalLM.from_pretrained(
        str(OUTPUT_PATH),
        torch_dtype=torch.float16,
        trust_remote_code=True,
    )
    tokenizer = AutoTokenizer.from_pretrained(str(OUTPUT_PATH), trust_remote_code=True)
    
    # 测试生成
    test_input = "可爱的小猫"
    messages = [
        {"role": "system", "content": "你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。"},
        {"role": "user", "content": test_input}
    ]
    
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    inputs = tokenizer(text, return_tensors="pt")
    
    print(f"\nTest input: {test_input}")
    print("Generating...")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
    
    response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
    print(f"\nOutput:\n{response.strip()}")
    
    return True


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", "-v", action="store_true", help="只验证已合并的模型")
    args = parser.parse_args()
    
    if args.verify:
        verify_merged_model()
    else:
        merge_lora()
        verify_merged_model()
