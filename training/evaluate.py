#!/usr/bin/env python3
"""
评估微调效果

使用验证集评估模型，计算相似度分数
"""

import json
import torch
from pathlib import Path
from tqdm import tqdm
import re

BASE_DIR = Path(__file__).parent.parent


def load_validation_data():
    """加载验证集"""
    val_path = BASE_DIR / "data/processed/validation_data.json"
    with open(val_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_model(use_finetuned=True):
    """加载模型"""
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    
    base_model_name = "Qwen/Qwen2.5-3B-Instruct"
    
    if use_finetuned:
        lora_path = BASE_DIR / "models/lora_adapter"
        merged_path = BASE_DIR / "models/merged"
        
        if merged_path.exists() and (merged_path / "config.json").exists():
            print("Loading merged model...")
            model = AutoModelForCausalLM.from_pretrained(
                str(merged_path),
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True,
            )
            tokenizer = AutoTokenizer.from_pretrained(str(merged_path), trust_remote_code=True)
        elif lora_path.exists():
            print("Loading LoRA adapter...")
            model = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True,
            )
            model = PeftModel.from_pretrained(model, str(lora_path))
            tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
        else:
            raise FileNotFoundError("Finetuned model not found")
    else:
        print("Loading base model...")
        model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )
        tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    
    return model, tokenizer


def generate(model, tokenizer, user_input: str) -> str:
    """生成输出"""
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
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.3,  # 低温度，更确定性
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
    
    response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
    return response.strip()


def calculate_keyword_overlap(generated: str, reference: str) -> float:
    """计算关键词重叠率"""
    # 提取英文单词和关键短语
    def extract_keywords(text):
        # 英文单词
        words = set(re.findall(r'[a-zA-Z]{3,}', text.lower()))
        # 数字参数 (如 --ar 16:9)
        params = set(re.findall(r'--\w+\s+[\d:]+', text))
        return words | params
    
    gen_keywords = extract_keywords(generated)
    ref_keywords = extract_keywords(reference)
    
    if not ref_keywords:
        return 0.0
    
    overlap = gen_keywords & ref_keywords
    return len(overlap) / len(ref_keywords)


def calculate_structure_score(generated: str, reference: str) -> float:
    """计算结构相似度"""
    score = 0.0
    
    # 检查是否是 JSON 格式
    ref_is_json = reference.strip().startswith('{') or reference.strip().startswith('[')
    gen_is_json = generated.strip().startswith('{') or generated.strip().startswith('[')
    
    if ref_is_json == gen_is_json:
        score += 0.3
    
    # 检查长度相似度
    ref_len = len(reference)
    gen_len = len(generated)
    len_ratio = min(ref_len, gen_len) / max(ref_len, gen_len) if max(ref_len, gen_len) > 0 else 0
    score += 0.3 * len_ratio
    
    # 检查是否包含常见的 prompt 元素
    prompt_elements = ['style', 'quality', 'lighting', 'detailed', 'realistic', 
                       '8k', '4k', 'masterpiece', 'best quality', '--ar', '--v']
    
    ref_elements = sum(1 for e in prompt_elements if e.lower() in reference.lower())
    gen_elements = sum(1 for e in prompt_elements if e.lower() in generated.lower())
    
    if ref_elements > 0:
        element_ratio = min(gen_elements, ref_elements) / ref_elements
        score += 0.4 * element_ratio
    else:
        score += 0.2  # 如果参考没有这些元素，给一个基础分
    
    return score


def evaluate(model, tokenizer, val_data, num_samples=50):
    """评估模型"""
    results = []
    
    # 随机采样
    import random
    samples = random.sample(val_data, min(num_samples, len(val_data)))
    
    print(f"\nEvaluating on {len(samples)} samples...")
    
    for sample in tqdm(samples):
        instruction = sample['instruction']
        reference = sample['output']
        
        generated = generate(model, tokenizer, instruction)
        
        # 计算分数
        keyword_score = calculate_keyword_overlap(generated, reference)
        structure_score = calculate_structure_score(generated, reference)
        
        results.append({
            'instruction': instruction,
            'reference': reference,
            'generated': generated,
            'keyword_score': keyword_score,
            'structure_score': structure_score,
        })
    
    return results


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", action="store_true", help="评估基础模型")
    parser.add_argument("--samples", "-n", type=int, default=30, help="评估样本数")
    args = parser.parse_args()
    
    # 加载数据
    print("Loading validation data...")
    val_data = load_validation_data()
    print(f"Total validation samples: {len(val_data)}")
    
    # 加载模型
    try:
        model, tokenizer = load_model(use_finetuned=not args.base)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return
    
    # 评估
    model_name = "Base Model" if args.base else "Finetuned Model"
    print(f"\n{'=' * 60}")
    print(f"Evaluating: {model_name}")
    print(f"{'=' * 60}")
    
    results = evaluate(model, tokenizer, val_data, args.samples)
    
    # 统计结果
    avg_keyword = sum(r['keyword_score'] for r in results) / len(results)
    avg_structure = sum(r['structure_score'] for r in results) / len(results)
    overall_score = (avg_keyword + avg_structure) / 2
    
    print(f"\n{'=' * 60}")
    print("EVALUATION RESULTS")
    print(f"{'=' * 60}")
    print(f"Model: {model_name}")
    print(f"Samples: {len(results)}")
    print(f"Keyword Overlap Score: {avg_keyword:.2%}")
    print(f"Structure Score: {avg_structure:.2%}")
    print(f"Overall Score: {overall_score:.2%}")
    
    # 显示一些示例
    print(f"\n{'=' * 60}")
    print("SAMPLE OUTPUTS")
    print(f"{'=' * 60}")
    
    for i, r in enumerate(results[:3]):
        print(f"\n[Sample {i+1}]")
        print(f"Input: {r['instruction']}")
        print(f"Reference: {r['reference'][:150]}...")
        print(f"Generated: {r['generated'][:150]}...")
        print(f"Scores: keyword={r['keyword_score']:.2%}, structure={r['structure_score']:.2%}")
    
    # 保存结果
    output_path = BASE_DIR / f"data/eval_results_{'base' if args.base else 'finetuned'}.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'model': model_name,
            'avg_keyword_score': avg_keyword,
            'avg_structure_score': avg_structure,
            'overall_score': overall_score,
            'results': results
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()
