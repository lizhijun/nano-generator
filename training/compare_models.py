#!/usr/bin/env python3
"""
对比测试：基础模型 vs 微调模型

生成对比报告，评估微调效果
"""

import json
import torch
import time
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent.parent


def load_base_model():
    """加载基础模型（未微调）"""
    from transformers import AutoModelForCausalLM, AutoTokenizer
    
    print("Loading base model (Qwen2.5-1.5B-Instruct)...")
    model_name = "Qwen/Qwen2.5-1.5B-Instruct"
    
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    
    return model, tokenizer


def load_finetuned_model():
    """加载微调后的模型"""
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    
    lora_path = BASE_DIR / "models/lora_adapter"
    merged_path = BASE_DIR / "models/merged"
    
    # 优先使用合并后的模型
    if merged_path.exists() and (merged_path / "config.json").exists():
        print("Loading merged model...")
        model = AutoModelForCausalLM.from_pretrained(
            str(merged_path),
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )
        tokenizer = AutoTokenizer.from_pretrained(str(merged_path), trust_remote_code=True)
    elif lora_path.exists() and (lora_path / "adapter_config.json").exists():
        print("Loading base model + LoRA adapter...")
        base_model_name = "Qwen/Qwen2.5-1.5B-Instruct"
        model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )
        model = PeftModel.from_pretrained(model, str(lora_path))
        tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    else:
        raise FileNotFoundError("No finetuned model found!")
    
    return model, tokenizer


def generate(model, tokenizer, user_input: str, system_prompt: str = None) -> str:
    """生成输出"""
    if system_prompt is None:
        system_prompt = "你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。"
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]
    
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    
    start_time = time.time()
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
    elapsed = time.time() - start_time
    
    response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
    return response.strip(), elapsed


def run_comparison():
    """运行对比测试"""
    
    # 测试用例
    test_cases = [
        "一只可爱的猫咪",
        "赛博朋克城市夜景",
        "中国水墨画风格的山水",
        "宇航员在太空漫步",
        "古风仙侠美女",
        "日落海滩",
        "机械朋克机器人",
        "梵高风格的星空",
        "可爱的柴犬表情包",
        "未来科技感的汽车",
    ]
    
    results = []
    
    # 加载基础模型
    print("\n" + "=" * 60)
    print("Loading Base Model")
    print("=" * 60)
    base_model, base_tokenizer = load_base_model()
    
    # 基础模型生成
    print("\n" + "=" * 60)
    print("Generating with Base Model")
    print("=" * 60)
    
    base_outputs = []
    for i, test_input in enumerate(test_cases):
        print(f"[{i+1}/{len(test_cases)}] {test_input}")
        output, elapsed = generate(base_model, base_tokenizer, test_input)
        base_outputs.append({
            "input": test_input,
            "output": output,
            "time": elapsed
        })
    
    # 释放基础模型内存
    del base_model
    torch.cuda.empty_cache() if torch.cuda.is_available() else None
    
    # 加载微调模型
    print("\n" + "=" * 60)
    print("Loading Finetuned Model")
    print("=" * 60)
    
    try:
        ft_model, ft_tokenizer = load_finetuned_model()
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Please run training first!")
        return
    
    # 微调模型生成
    print("\n" + "=" * 60)
    print("Generating with Finetuned Model")
    print("=" * 60)
    
    ft_outputs = []
    for i, test_input in enumerate(test_cases):
        print(f"[{i+1}/{len(test_cases)}] {test_input}")
        output, elapsed = generate(ft_model, ft_tokenizer, test_input)
        ft_outputs.append({
            "input": test_input,
            "output": output,
            "time": elapsed
        })
    
    # 生成对比报告
    print("\n" + "=" * 60)
    print("COMPARISON REPORT")
    print("=" * 60)
    
    for i, test_input in enumerate(test_cases):
        print(f"\n{'─' * 60}")
        print(f"输入: {test_input}")
        print(f"{'─' * 60}")
        print(f"\n【基础模型】({base_outputs[i]['time']:.2f}s)")
        print(base_outputs[i]['output'][:300] + "..." if len(base_outputs[i]['output']) > 300 else base_outputs[i]['output'])
        print(f"\n【微调模型】({ft_outputs[i]['time']:.2f}s)")
        print(ft_outputs[i]['output'][:300] + "..." if len(ft_outputs[i]['output']) > 300 else ft_outputs[i]['output'])
    
    # 保存完整报告
    report = {
        "timestamp": datetime.now().isoformat(),
        "test_cases": test_cases,
        "base_model": {
            "name": "Qwen/Qwen2.5-1.5B-Instruct",
            "outputs": base_outputs
        },
        "finetuned_model": {
            "outputs": ft_outputs
        }
    }
    
    report_path = BASE_DIR / "data/comparison_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n完整报告已保存到: {report_path}")
    
    # 统计
    print("\n" + "=" * 60)
    print("STATISTICS")
    print("=" * 60)
    base_avg_time = sum(o['time'] for o in base_outputs) / len(base_outputs)
    ft_avg_time = sum(o['time'] for o in ft_outputs) / len(ft_outputs)
    base_avg_len = sum(len(o['output']) for o in base_outputs) / len(base_outputs)
    ft_avg_len = sum(len(o['output']) for o in ft_outputs) / len(ft_outputs)
    
    print(f"平均生成时间 - 基础模型: {base_avg_time:.2f}s, 微调模型: {ft_avg_time:.2f}s")
    print(f"平均输出长度 - 基础模型: {base_avg_len:.0f}字符, 微调模型: {ft_avg_len:.0f}字符")


def quick_test():
    """快速测试（只加载微调模型）"""
    print("=" * 60)
    print("Quick Test - Finetuned Model Only")
    print("=" * 60)
    
    try:
        model, tokenizer = load_finetuned_model()
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return
    
    test_inputs = [
        "可爱的小狗",
        "日本动漫风格的少女",
        "科幻太空站",
    ]
    
    for user_input in test_inputs:
        print(f"\n输入: {user_input}")
        print("-" * 40)
        output, elapsed = generate(model, tokenizer, user_input)
        print(f"输出 ({elapsed:.2f}s):\n{output}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--quick", "-q", action="store_true", help="快速测试模式")
    args = parser.parse_args()
    
    if args.quick:
        quick_test()
    else:
        run_comparison()
