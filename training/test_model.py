#!/usr/bin/env python3
"""
测试微调后的模型

可以测试:
1. LoRA 适配器 (未合并)
2. 合并后的模型
3. Ollama 部署的模型
"""

import json
import torch
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent


def test_lora_adapter():
    """测试 LoRA 适配器"""
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    
    print("=" * 50)
    print("Testing LoRA Adapter")
    print("=" * 50)
    
    lora_path = BASE_DIR / "models/lora_adapter"
    if not lora_path.exists():
        print(f"LoRA adapter not found at {lora_path}")
        return
    
    base_model_name = "Qwen/Qwen2.5-3B-Instruct"
    
    print("Loading base model...")
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )
    
    print("Loading LoRA adapter...")
    model = PeftModel.from_pretrained(model, str(lora_path))
    
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    
    return model, tokenizer


def test_merged_model():
    """测试合并后的模型"""
    from transformers import AutoModelForCausalLM, AutoTokenizer
    
    print("=" * 50)
    print("Testing Merged Model")
    print("=" * 50)
    
    merged_path = BASE_DIR / "models/merged"
    if not merged_path.exists():
        print(f"Merged model not found at {merged_path}")
        return None, None
    
    print("Loading merged model...")
    model = AutoModelForCausalLM.from_pretrained(
        str(merged_path),
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )
    
    tokenizer = AutoTokenizer.from_pretrained(str(merged_path), trust_remote_code=True)
    
    return model, tokenizer


def generate_prompt(model, tokenizer, user_input: str) -> str:
    """生成提示词"""
    messages = [
        {"role": "system", "content": "你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。"},
        {"role": "user", "content": user_input}
    ]
    
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
    
    response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
    return response.strip()


def run_test(model, tokenizer):
    """运行测试"""
    test_inputs = [
        "一只可爱的猫咪",
        "赛博朋克风格的城市",
        "水墨画风格的山水",
        "太空中的宇航员",
        "古风美女",
    ]
    
    print("\n" + "=" * 50)
    print("Generation Test")
    print("=" * 50)
    
    for user_input in test_inputs:
        print(f"\n输入: {user_input}")
        print("-" * 30)
        try:
            result = generate_prompt(model, tokenizer, user_input)
            print(f"输出: {result[:500]}...")  # 截断显示
        except Exception as e:
            print(f"Error: {e}")
        print()


def interactive_test(model, tokenizer):
    """交互式测试"""
    print("\n" + "=" * 50)
    print("Interactive Mode (输入 'quit' 退出)")
    print("=" * 50)
    
    while True:
        user_input = input("\n请输入描述: ").strip()
        if user_input.lower() in ['quit', 'exit', 'q']:
            break
        if not user_input:
            continue
        
        print("生成中...")
        result = generate_prompt(model, tokenizer, user_input)
        print(f"\n生成的提示词:\n{result}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="测试微调后的模型")
    parser.add_argument("--mode", choices=["lora", "merged"], default="lora",
                       help="测试模式: lora=测试适配器, merged=测试合并后的模型")
    parser.add_argument("--interactive", "-i", action="store_true",
                       help="交互式测试模式")
    args = parser.parse_args()
    
    # 加载模型
    if args.mode == "lora":
        model, tokenizer = test_lora_adapter()
    else:
        model, tokenizer = test_merged_model()
    
    if model is None:
        return
    
    # 运行测试
    run_test(model, tokenizer)
    
    # 交互式测试
    if args.interactive:
        interactive_test(model, tokenizer)


if __name__ == "__main__":
    main()
