#!/usr/bin/env python3
"""
生成训练数据脚本 (Ollama 版本)

读取原始提示词，调用本地 Ollama 模型为每条生成简单的中文描述
"""

import json
import asyncio
import aiohttp
import pandas as pd
from pathlib import Path
from tqdm import tqdm

# 配置
BASE_DIR = Path(__file__).parent.parent
RAW_DATA_PATH = BASE_DIR / "data/raw/NanoBananaProPrompts.xlsx"
OUTPUT_PATH = BASE_DIR / "data/processed/raw_training_data.json"

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5-coder:latest"  # 使用 qwen2.5-coder（不会输出思考过程）

# 系统提示词
SYSTEM_PROMPT = """你是一个专业的提示词分析专家。分析图像生成提示词，输出简洁中文描述。

要求：
1. 10-30个中文字
2. 抓住核心：主体、场景、风格
3. 自然中文表达
4. 不含技术参数
5. 只输出描述，无解释"""


async def generate_description(
    session: aiohttp.ClientSession,
    prompt: str,
    prompt_type: str,
    semaphore: asyncio.Semaphore,
    max_retries: int = 3
) -> str | None:
    """调用 Ollama API 生成简单描述"""
    
    user_prompt = f"""为以下图像提示词生成简洁中文描述（10-30字）：

{prompt[:2000]}

直接输出描述："""

    async with semaphore:
        for attempt in range(max_retries):
            try:
                async with session.post(
                    OLLAMA_URL,
                    json={
                        "model": MODEL,
                        "prompt": f"{SYSTEM_PROMPT}\n\n{user_prompt}",
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "num_predict": 100
                        }
                    },
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        response = result.get("response", "").strip()
                        # 清理输出
                        # 移除 <think> 标签内容
                        import re
                        response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
                        response = re.sub(r'<think>.*', '', response, flags=re.DOTALL)
                        
                        lines = response.split('\n')
                        for line in lines:
                            line = line.strip()
                            # 跳过空行、思考内容、标签
                            if not line or line.startswith('<') or line.startswith('思考') or line.startswith('接下来'):
                                continue
                            # 移除可能的引号和前缀
                            line = line.strip('"\'')
                            line = re.sub(r'^(描述：|输出：|答案：)', '', line)
                            if 5 <= len(line) <= 60:
                                return line
                        # 如果没找到合适的行，返回清理后的第一行
                        cleaned = [l.strip('"\'') for l in lines if l.strip() and not l.startswith('<')]
                        return cleaned[0] if cleaned else None
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"Error: {e}")
                    return None
                await asyncio.sleep(1)
    return None


async def main():
    # 检查 Ollama 是否运行
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:11434/api/tags") as resp:
                if resp.status != 200:
                    print("Error: Ollama is not running")
                    print("Please start Ollama: ollama serve")
                    return
    except Exception:
        print("Error: Cannot connect to Ollama")
        print("Please start Ollama: ollama serve")
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
    
    # 并发控制
    semaphore = asyncio.Semaphore(3)  # Ollama 本地运行，限制并发
    
    # 处理数据
    all_results = existing_data.copy()
    
    print(f"\nProcessing {len(remaining_indices)} prompts using {MODEL}...")
    
    async with aiohttp.ClientSession() as session:
        for idx in tqdm(remaining_indices, desc="Generating"):
            row = df.iloc[idx]
            
            result = await generate_description(
                session,
                row['prompt'],
                row['prompt_type'],
                semaphore
            )
            
            if result:
                all_results.append({
                    "simple_description": result,
                    "prompt": row['prompt'],
                    "prompt_type": row['prompt_type'],
                    "original_index": idx
                })
            
            # 每 20 条保存一次
            if len(all_results) % 20 == 0:
                OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
                with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
                    json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    # 最终保存
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\nDone! Generated {len(all_results)} training samples")
    print(f"Output saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
