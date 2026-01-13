#!/usr/bin/env python3
"""
评估模型效果

测试生成的提示词质量
"""

import json
import aiohttp
import asyncio
from pathlib import Path

# 配置
BASE_DIR = Path(__file__).parent.parent
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "nano-banana-pro"  # 微调后的模型

# 测试用例
TEST_CASES = [
    {
        "input": "街拍时尚女孩，霓虹灯背景",
        "expected_elements": ["woman", "street", "neon", "fashion"]
    },
    {
        "input": "咖啡馆里看书的文艺青年",
        "expected_elements": ["café", "book", "reading", "indoor"]
    },
    {
        "input": "赛博朋克风格的城市夜景",
        "expected_elements": ["cyberpunk", "city", "night", "neon"]
    },
    {
        "input": "海边日落，金色阳光下的冲浪者",
        "expected_elements": ["beach", "sunset", "golden", "surfer"]
    },
    {
        "input": "时尚男士街拍，都市背景，电影感光影",
        "expected_elements": ["man", "street", "urban", "cinematic"]
    },
]


async def generate_prompt(session, input_text: str) -> str:
    """调用模型生成提示词"""
    try:
        async with session.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": f"根据以下描述生成 NanoBananaPro 图像提示词：\n\n{input_text}",
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 1024
                }
            },
            timeout=aiohttp.ClientTimeout(total=60)
        ) as resp:
            if resp.status == 200:
                result = await resp.json()
                return result.get("response", "")
    except Exception as e:
        return f"Error: {e}"
    return ""


def evaluate_output(output: str, expected_elements: list[str]) -> dict:
    """评估输出质量"""
    output_lower = output.lower()
    
    # 检查期望元素
    found_elements = [elem for elem in expected_elements if elem in output_lower]
    element_score = len(found_elements) / len(expected_elements)
    
    # 检查长度（好的提示词通常 200-2000 字符）
    length = len(output)
    length_score = 1.0 if 200 <= length <= 2000 else 0.5 if 100 <= length <= 3000 else 0.2
    
    # 检查专业术语
    pro_terms = [
        "photorealistic", "cinematic", "lighting", "depth of field",
        "8k", "realistic", "high detail", "bokeh", "portrait"
    ]
    found_terms = [term for term in pro_terms if term in output_lower]
    term_score = min(len(found_terms) / 3, 1.0)  # 至少3个术语得满分
    
    # 检查是否为 JSON 格式
    is_json = output.strip().startswith('{') and output.strip().endswith('}')
    
    return {
        "element_score": element_score,
        "found_elements": found_elements,
        "length": length,
        "length_score": length_score,
        "term_score": term_score,
        "found_terms": found_terms,
        "is_json": is_json,
        "total_score": (element_score + length_score + term_score) / 3
    }


async def main():
    print("=" * 60)
    print("NanoBananaPro Model Evaluation")
    print("=" * 60)
    
    # 检查模型是否存在
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:11434/api/tags") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    models = [m["name"] for m in data.get("models", [])]
                    if MODEL_NAME not in models and f"{MODEL_NAME}:latest" not in models:
                        print(f"Warning: Model '{MODEL_NAME}' not found in Ollama")
                        print(f"Available models: {models}")
                        print("\nPlease create the model first:")
                        print(f"  ollama create {MODEL_NAME} -f Modelfile")
                        return
    except Exception as e:
        print(f"Error connecting to Ollama: {e}")
        return
    
    print(f"\nTesting model: {MODEL_NAME}")
    print(f"Test cases: {len(TEST_CASES)}")
    print("-" * 60)
    
    results = []
    
    async with aiohttp.ClientSession() as session:
        for i, test in enumerate(TEST_CASES, 1):
            print(f"\n[Test {i}/{len(TEST_CASES)}]")
            print(f"Input: {test['input']}")
            
            output = await generate_prompt(session, test['input'])
            evaluation = evaluate_output(output, test['expected_elements'])
            
            print(f"Output length: {evaluation['length']} chars")
            print(f"Found elements: {evaluation['found_elements']}")
            print(f"Found pro terms: {evaluation['found_terms']}")
            print(f"Is JSON: {evaluation['is_json']}")
            print(f"Total score: {evaluation['total_score']:.2f}")
            print(f"\nGenerated prompt preview:")
            print("-" * 40)
            print(output[:500] + ("..." if len(output) > 500 else ""))
            
            results.append({
                "input": test['input'],
                "output": output,
                "evaluation": evaluation
            })
    
    # 汇总结果
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    avg_score = sum(r['evaluation']['total_score'] for r in results) / len(results)
    avg_length = sum(r['evaluation']['length'] for r in results) / len(results)
    
    print(f"Average score: {avg_score:.2f}")
    print(f"Average length: {avg_length:.0f} chars")
    print(f"JSON outputs: {sum(1 for r in results if r['evaluation']['is_json'])}/{len(results)}")
    
    # 保存详细结果
    output_path = BASE_DIR / "data/processed/evaluation_results.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nDetailed results saved to: {output_path}")


if __name__ == "__main__":
    asyncio.run(main())
