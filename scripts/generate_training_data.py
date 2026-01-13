#!/usr/bin/env python3
"""
生成训练数据脚本

读取原始提示词，调用 LLM 为每条生成简单的中文描述，
最终输出训练数据格式：{instruction, input, output}
"""

import json
import os
import asyncio
import pandas as pd
from pathlib import Path
from typing import Optional
import anthropic
from tqdm.asyncio import tqdm_asyncio

# 配置
BASE_DIR = Path(__file__).parent.parent
RAW_DATA_PATH = BASE_DIR / "data/raw/NanoBananaProPrompts.xlsx"
OUTPUT_PATH = BASE_DIR / "data/processed/raw_training_data.json"

# 系统提示词
SYSTEM_PROMPT = """你是一个专业的提示词分析专家。你的任务是分析给定的图像生成提示词，并生成一个简洁的中文描述。

要求：
1. 描述应该简洁，通常 10-30 个中文字
2. 抓住提示词的核心要素：主体、场景、风格
3. 使用自然的中文表达
4. 不需要包含技术参数（如分辨率、相机型号等）

示例：
- 输入：复杂的 JSON 格式提示词，描述霓虹灯下的赛博朋克女孩
- 输出：霓虹街头的赛博朋克女孩，夜景氛围

- 输入：描述一个在咖啡馆看书的年轻女性
- 输出：咖啡馆里看书的文艺女生

- 输入：街拍风格的时尚男士，城市背景
- 输出：都市街拍时尚男士"""

USER_PROMPT_TEMPLATE = """请为以下图像生成提示词生成一个简洁的中文描述（10-30字）：

提示词类型：{prompt_type}

提示词内容：
{prompt}

请直接输出中文描述，不要有任何解释或前缀。"""


async def generate_description(
    client: anthropic.AsyncAnthropic,
    prompt: str,
    prompt_type: str,
    semaphore: asyncio.Semaphore,
    max_retries: int = 3
) -> Optional[str]:
    """调用 Claude API 生成简单描述"""
    async with semaphore:
        for attempt in range(max_retries):
            try:
                message = await client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=100,
                    system=SYSTEM_PROMPT,
                    messages=[
                        {
                            "role": "user",
                            "content": USER_PROMPT_TEMPLATE.format(
                                prompt_type=prompt_type,
                                prompt=prompt[:3000]  # 截断过长的提示词
                            )
                        }
                    ]
                )
                return message.content[0].text.strip()
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"Error after {max_retries} attempts: {e}")
                    return None
                await asyncio.sleep(2 ** attempt)  # 指数退避
    return None


async def process_batch(
    client: anthropic.AsyncAnthropic,
    df: pd.DataFrame,
    start_idx: int,
    batch_size: int,
    semaphore: asyncio.Semaphore
) -> list:
    """处理一批数据"""
    end_idx = min(start_idx + batch_size, len(df))
    batch = df.iloc[start_idx:end_idx]
    
    tasks = []
    for _, row in batch.iterrows():
        task = generate_description(
            client,
            row['prompt'],
            row['prompt_type'],
            semaphore
        )
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    
    training_data = []
    for i, (_, row) in enumerate(batch.iterrows()):
        if results[i]:
            training_data.append({
                "simple_description": results[i],
                "prompt": row['prompt'],
                "prompt_type": row['prompt_type'],
                "original_index": start_idx + i
            })
    
    return training_data


async def main():
    # 检查 API Key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        print("Please set it: export ANTHROPIC_API_KEY='your-api-key'")
        return
    
    # 读取原始数据
    print(f"Reading data from {RAW_DATA_PATH}")
    df = pd.read_excel(RAW_DATA_PATH, header=2)
    print(f"Loaded {len(df)} prompts")
    
    # 过滤掉空数据
    df = df.dropna(subset=['prompt'])
    print(f"After filtering: {len(df)} valid prompts")
    
    # 检查是否已有部分处理结果
    existing_data = []
    processed_indices = set()
    if OUTPUT_PATH.exists():
        with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            processed_indices = {item['original_index'] for item in existing_data}
        print(f"Found {len(existing_data)} already processed items")
    
    # 过滤已处理的数据
    remaining_indices = [i for i in range(len(df)) if i not in processed_indices]
    print(f"Remaining to process: {len(remaining_indices)} items")
    
    if not remaining_indices:
        print("All items already processed!")
        return
    
    # 初始化客户端
    client = anthropic.AsyncAnthropic(api_key=api_key)
    
    # 并发控制
    semaphore = asyncio.Semaphore(5)  # 最多 5 个并发请求
    batch_size = 20
    
    # 处理数据
    all_results = existing_data.copy()
    
    print(f"\nProcessing {len(remaining_indices)} prompts...")
    
    for i in tqdm_asyncio(range(0, len(remaining_indices), batch_size), desc="Batches"):
        batch_indices = remaining_indices[i:i + batch_size]
        batch_df = df.iloc[batch_indices].copy()
        batch_df['_original_idx'] = batch_indices
        
        tasks = []
        for idx, row in batch_df.iterrows():
            task = generate_description(
                client,
                row['prompt'],
                row['prompt_type'],
                semaphore
            )
            tasks.append((row['_original_idx'], row, task))
        
        for orig_idx, row, task in tasks:
            result = await task
            if result:
                all_results.append({
                    "simple_description": result,
                    "prompt": row['prompt'],
                    "prompt_type": row['prompt_type'],
                    "original_index": orig_idx
                })
        
        # 每批次保存一次（断点续传）
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\nDone! Generated {len(all_results)} training samples")
    print(f"Output saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
