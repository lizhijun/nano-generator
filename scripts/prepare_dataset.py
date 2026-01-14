#!/usr/bin/env python3
"""
数据集准备脚本

将增强后的数据转换为 LLaMA-Factory / Unsloth 训练格式
并划分训练集和验证集
"""

import json
import random
from pathlib import Path

# 配置
BASE_DIR = Path(__file__).parent.parent
INPUT_PATH = BASE_DIR / "data/processed/augmented_training_data.json"
TRAIN_OUTPUT_PATH = BASE_DIR / "data/processed/training_data.json"
VAL_OUTPUT_PATH = BASE_DIR / "data/processed/validation_data.json"

# 训练/验证集比例
TRAIN_RATIO = 0.9

# 指令模板
INSTRUCTION_TEMPLATE_TEXT = """根据以下描述生成 NanoBananaPro 图像提示词。

要求：
1. 输出自然语言格式的详细提示词
2. 包含主体描述、外观、场景、光照、风格等要素
3. 使用专业的摄影/图像生成术语

描述：{description}"""

INSTRUCTION_TEMPLATE_JSON = """根据以下描述生成 NanoBananaPro 图像提示词。

要求：
1. 输出 JSON 格式的结构化提示词
2. 包含 subject、environment、lighting、style 等字段
3. 使用专业的摄影/图像生成术语

描述：{description}"""


def detect_prompt_type(prompt: str) -> str:
    """检测提示词类型"""
    prompt_stripped = prompt.strip()
    if prompt_stripped.startswith('{') or prompt_stripped.startswith('['):
        return 'json'
    return 'text'


def format_training_sample(item: dict) -> dict:
    """格式化单条训练数据"""
    prompt = item['prompt']
    prompt_type = item.get('prompt_type') or detect_prompt_type(prompt)
    description = item['simple_description']
    
    if prompt_type == 'json':
        instruction = INSTRUCTION_TEMPLATE_JSON.format(description=description)
    else:
        instruction = INSTRUCTION_TEMPLATE_TEXT.format(description=description)
    
    return {
        "instruction": instruction,
        "input": "",
        "output": item['prompt']
    }


def main():
    # 读取增强数据
    if not INPUT_PATH.exists():
        print(f"Error: Input file not found: {INPUT_PATH}")
        print("Please run augment_data.py first")
        return
    
    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} samples")
    
    # 转换格式
    formatted_data = [format_training_sample(item) for item in data]
    
    # 打乱数据
    random.seed(42)
    random.shuffle(formatted_data)
    
    # 划分训练集和验证集
    split_idx = int(len(formatted_data) * TRAIN_RATIO)
    train_data = formatted_data[:split_idx]
    val_data = formatted_data[split_idx:]
    
    print(f"Training set: {len(train_data)} samples")
    print(f"Validation set: {len(val_data)} samples")
    
    # 保存
    TRAIN_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    with open(TRAIN_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(train_data, f, ensure_ascii=False, indent=2)
    
    with open(VAL_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(val_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nTraining data saved to: {TRAIN_OUTPUT_PATH}")
    print(f"Validation data saved to: {VAL_OUTPUT_PATH}")
    
    # 输出示例
    print("\n" + "=" * 50)
    print("Sample training data:")
    print("=" * 50)
    sample = train_data[0]
    print(f"Instruction:\n{sample['instruction'][:200]}...")
    print(f"\nOutput:\n{sample['output'][:300]}...")


if __name__ == "__main__":
    main()
