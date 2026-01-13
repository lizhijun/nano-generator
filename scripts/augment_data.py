#!/usr/bin/env python3
"""
数据增强脚本

为每条训练数据生成 2-3 个描述变体，扩展数据集规模
"""

import json
import os
import asyncio
from pathlib import Path
from typing import Optional
import anthropic
from tqdm.asyncio import tqdm_asyncio

# 配置
BASE_DIR = Path(__file__).parent.parent
INPUT_PATH = BASE_DIR / "data/processed/raw_training_data.json"
OUTPUT_PATH = BASE_DIR / "data/processed/augmented_training_data.json"

# 系统提示词
SYSTEM_PROMPT = """你是一个专业的文本改写专家。你的任务是为给定的图像描述生成不同风格的变体。

要求：
1. 保持核心含义不变
2. 使用不同的表达方式、词汇或句式
3. 变体长度可以略有不同（10-35字）
4. 变体之间要有明显差异

输出格式：每行一个变体，共 2 个变体"""

USER_PROMPT_TEMPLATE = """原始描述：{description}

请生成 2 个不同风格的变体描述。每行一个，不要编号或其他标记。"""


async def generate_variants(
    client: anthropic.AsyncAnthropic,
    description: str,
    semaphore: asyncio.Semaphore,
    max_retries: int = 3
) -> list[str]:
    """生成描述变体"""
    async with semaphore:
        for attempt in range(max_retries):
            try:
                message = await client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=200,
                    system=SYSTEM_PROMPT,
                    messages=[
                        {
                            "role": "user",
                            "content": USER_PROMPT_TEMPLATE.format(description=description)
                        }
                    ]
                )
                # 解析输出
                lines = message.content[0].text.strip().split('\n')
                variants = [line.strip() for line in lines if line.strip()]
                return variants[:2]  # 最多取 2 个
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"Error: {e}")
                    return []
                await asyncio.sleep(2 ** attempt)
    return []


async def main():
    # 检查 API Key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        return
    
    # 读取原始训练数据
    if not INPUT_PATH.exists():
        print(f"Error: Input file not found: {INPUT_PATH}")
        print("Please run generate_training_data.py first")
        return
    
    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    
    print(f"Loaded {len(raw_data)} training samples")
    
    # 检查已有增强数据
    existing_data = []
    processed_indices = set()
    if OUTPUT_PATH.exists():
        with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            processed_indices = {item.get('original_index') for item in existing_data if 'original_index' in item}
        print(f"Found {len(existing_data)} already augmented items")
    
    # 初始化客户端
    client = anthropic.AsyncAnthropic(api_key=api_key)
    semaphore = asyncio.Semaphore(5)
    
    # 处理数据
    all_results = existing_data.copy()
    
    for item in tqdm_asyncio(raw_data, desc="Augmenting"):
        orig_idx = item.get('original_index')
        
        # 跳过已处理的
        if orig_idx in processed_indices:
            continue
        
        # 原始数据
        all_results.append({
            "simple_description": item['simple_description'],
            "prompt": item['prompt'],
            "prompt_type": item['prompt_type'],
            "original_index": orig_idx,
            "is_augmented": False
        })
        
        # 生成变体
        variants = await generate_variants(
            client,
            item['simple_description'],
            semaphore
        )
        
        for variant in variants:
            all_results.append({
                "simple_description": variant,
                "prompt": item['prompt'],
                "prompt_type": item['prompt_type'],
                "original_index": orig_idx,
                "is_augmented": True
            })
        
        processed_indices.add(orig_idx)
        
        # 每 50 条保存一次
        if len(processed_indices) % 50 == 0:
            with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
                json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    # 最终保存
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\nDone! Total {len(all_results)} training samples (including augmented)")
    print(f"Output saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
