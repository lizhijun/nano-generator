#!/usr/bin/env python3
"""
合并 LoRA 权重到基座模型
"""

from pathlib import Path
from unsloth import FastLanguageModel

# 配置
BASE_DIR = Path(__file__).parent.parent
LORA_PATH = BASE_DIR / "models/lora_adapter"
MERGED_OUTPUT_PATH = BASE_DIR / "models/merged"


def main():
    print("=" * 50)
    print("Merging LoRA weights")
    print("=" * 50)
    
    if not LORA_PATH.exists():
        print(f"Error: LoRA adapter not found: {LORA_PATH}")
        print("Please run train_lora.py first")
        return
    
    print("\n[1/3] Loading model with LoRA adapter...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=str(LORA_PATH),
        max_seq_length=2048,
        dtype=None,
        load_in_4bit=True,
    )
    
    print("\n[2/3] Merging LoRA weights...")
    # 合并 LoRA 权重
    model = model.merge_and_unload()
    
    print("\n[3/3] Saving merged model...")
    MERGED_OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(MERGED_OUTPUT_PATH)
    tokenizer.save_pretrained(MERGED_OUTPUT_PATH)
    
    print(f"\nMerged model saved to: {MERGED_OUTPUT_PATH}")
    print("\nNext step: Run convert_to_gguf.py")


if __name__ == "__main__":
    main()
