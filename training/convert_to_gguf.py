#!/usr/bin/env python3
"""
转换模型为 GGUF 格式（供 Ollama 使用）

需要先安装 llama.cpp:
  git clone https://github.com/ggerganov/llama.cpp
  cd llama.cpp && make
"""

import subprocess
import sys
from pathlib import Path

# 配置
BASE_DIR = Path(__file__).parent.parent
MERGED_MODEL_PATH = BASE_DIR / "models/merged"
GGUF_OUTPUT_PATH = BASE_DIR / "models/gguf/nano-banana-pro.gguf"

# llama.cpp 路径（需要根据实际安装位置修改）
LLAMA_CPP_PATH = Path.home() / "llama.cpp"


def check_llama_cpp():
    """检查 llama.cpp 是否安装"""
    convert_script = LLAMA_CPP_PATH / "convert_hf_to_gguf.py"
    if not convert_script.exists():
        print("Error: llama.cpp not found")
        print(f"Expected path: {LLAMA_CPP_PATH}")
        print("\nPlease install llama.cpp:")
        print("  git clone https://github.com/ggerganov/llama.cpp")
        print("  cd llama.cpp && make")
        return False
    return True


def convert_to_gguf():
    """转换为 GGUF 格式"""
    if not check_llama_cpp():
        return False
    
    if not MERGED_MODEL_PATH.exists():
        print(f"Error: Merged model not found: {MERGED_MODEL_PATH}")
        print("Please run merge_lora.py first")
        return False
    
    GGUF_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    convert_script = LLAMA_CPP_PATH / "convert_hf_to_gguf.py"
    
    print("Converting to GGUF format...")
    print(f"Input: {MERGED_MODEL_PATH}")
    print(f"Output: {GGUF_OUTPUT_PATH}")
    
    cmd = [
        sys.executable,
        str(convert_script),
        str(MERGED_MODEL_PATH),
        "--outfile", str(GGUF_OUTPUT_PATH),
        "--outtype", "q8_0"  # 8-bit 量化
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    
    print(result.stdout)
    return True


def create_modelfile():
    """创建 Ollama Modelfile"""
    modelfile_path = BASE_DIR / "Modelfile"
    
    content = f"""# NanoBananaPro Prompt Generator
FROM {GGUF_OUTPUT_PATH}

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_predict 2048

SYSTEM \"\"\"你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。

你的输出应该：
1. 包含详细的主体描述、外观、场景、光照、风格等要素
2. 使用专业的摄影/图像生成术语
3. 根据用户要求输出文本或 JSON 格式
\"\"\"
"""
    
    with open(modelfile_path, 'w') as f:
        f.write(content)
    
    print(f"\nModelfile created: {modelfile_path}")


def main():
    print("=" * 50)
    print("Convert to GGUF for Ollama")
    print("=" * 50)
    
    if convert_to_gguf():
        print("\n[Done] GGUF conversion successful!")
        create_modelfile()
        
        print("\n" + "=" * 50)
        print("Next steps:")
        print("=" * 50)
        print(f"1. Create Ollama model:")
        print(f"   ollama create nano-banana-pro -f {BASE_DIR / 'Modelfile'}")
        print(f"\n2. Test the model:")
        print(f"   ollama run nano-banana-pro '街拍时尚女孩，霓虹灯背景'")
    else:
        print("\nConversion failed!")


if __name__ == "__main__":
    main()
