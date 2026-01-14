#!/usr/bin/env python3
"""
合并 LoRA 适配器并转换为 GGUF 格式

步骤:
1. 加载基础模型和 LoRA 适配器
2. 合并权重
3. 保存合并后的模型
4. 转换为 GGUF (需要 llama.cpp)
"""

import os
import sys
import torch
import subprocess
from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# 配置
BASE_DIR = Path(__file__).parent.parent
LORA_ADAPTER_PATH = BASE_DIR / "models/lora_adapter"
MERGED_MODEL_PATH = BASE_DIR / "models/merged"
GGUF_OUTPUT_PATH = BASE_DIR / "models/gguf"

# 基础模型
BASE_MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"


def merge_lora():
    """合并 LoRA 权重到基础模型"""
    print("=" * 50)
    print("Step 1: Merging LoRA adapter")
    print("=" * 50)
    
    if not LORA_ADAPTER_PATH.exists():
        print(f"Error: LoRA adapter not found at {LORA_ADAPTER_PATH}")
        return False
    
    # 检查必要文件
    required_files = ["adapter_config.json", "adapter_model.safetensors"]
    for f in required_files:
        if not (LORA_ADAPTER_PATH / f).exists():
            # 也检查 .bin 格式
            if f == "adapter_model.safetensors":
                if not (LORA_ADAPTER_PATH / "adapter_model.bin").exists():
                    print(f"Error: Missing {f}")
                    return False
    
    print(f"Loading base model: {BASE_MODEL_NAME}")
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        torch_dtype=torch.float16,
        trust_remote_code=True,
        device_map="cpu",  # 合并时用 CPU 节省内存
    )
    
    print(f"Loading LoRA adapter from: {LORA_ADAPTER_PATH}")
    model = PeftModel.from_pretrained(base_model, str(LORA_ADAPTER_PATH))
    
    print("Merging weights...")
    model = model.merge_and_unload()
    
    print(f"Saving merged model to: {MERGED_MODEL_PATH}")
    MERGED_MODEL_PATH.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(MERGED_MODEL_PATH), safe_serialization=True)
    
    # 保存 tokenizer
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME, trust_remote_code=True)
    tokenizer.save_pretrained(str(MERGED_MODEL_PATH))
    
    print("Merge complete!")
    return True


def convert_to_gguf():
    """转换为 GGUF 格式"""
    print("\n" + "=" * 50)
    print("Step 2: Converting to GGUF")
    print("=" * 50)
    
    if not MERGED_MODEL_PATH.exists():
        print(f"Error: Merged model not found at {MERGED_MODEL_PATH}")
        return False
    
    # 检查 llama.cpp 转换脚本
    llama_cpp_paths = [
        Path.home() / "llm/llama.cpp",
        Path.home() / "llama.cpp",
        Path("/opt/llama.cpp"),
    ]
    
    convert_script = None
    for path in llama_cpp_paths:
        script = path / "convert_hf_to_gguf.py"
        if script.exists():
            convert_script = script
            break
    
    if convert_script is None:
        print("Warning: llama.cpp not found. Skipping GGUF conversion.")
        print("To convert manually, clone llama.cpp and run:")
        print(f"  python convert_hf_to_gguf.py {MERGED_MODEL_PATH} --outtype f16")
        print("\nAlternatively, you can use the merged model directly with transformers.")
        return True
    
    GGUF_OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    output_file = GGUF_OUTPUT_PATH / "nano-prompt-generator.gguf"
    
    print(f"Using convert script: {convert_script}")
    print(f"Output: {output_file}")
    
    cmd = [
        sys.executable, str(convert_script),
        str(MERGED_MODEL_PATH),
        "--outtype", "f16",
        "--outfile", str(output_file),
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("GGUF conversion complete!")
            return True
        else:
            print(f"Conversion failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"Error during conversion: {e}")
        return False


def create_ollama_modelfile():
    """创建 Ollama Modelfile"""
    print("\n" + "=" * 50)
    print("Step 3: Creating Ollama Modelfile")
    print("=" * 50)
    
    gguf_file = GGUF_OUTPUT_PATH / "nano-prompt-generator.gguf"
    modelfile_path = BASE_DIR / "models/Modelfile"
    
    # 如果 GGUF 不存在，使用占位符
    gguf_path_str = str(gguf_file) if gguf_file.exists() else "/path/to/nano-prompt-generator.gguf"
    
    modelfile_content = f'''# NanoBananaPro Prompt Generator
FROM {gguf_path_str}

TEMPLATE """{{{{- if .System }}}}<|im_start|>system
{{{{ .System }}}}<|im_end|>
{{{{- end }}}}
<|im_start|>user
{{{{ .Prompt }}}}<|im_end|>
<|im_start|>assistant
"""

SYSTEM """你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。"""

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER stop "<|im_end|>"
'''
    
    with open(modelfile_path, 'w', encoding='utf-8') as f:
        f.write(modelfile_content)
    
    print(f"Modelfile created at: {modelfile_path}")
    print("\nTo create Ollama model, run:")
    print(f"  ollama create nano-prompt -f {modelfile_path}")
    
    return True


def main():
    print("NanoBananaPro Model Conversion Pipeline")
    print("=" * 50)
    
    # Step 1: 合并 LoRA
    if not merge_lora():
        print("\nMerge failed. Exiting.")
        return
    
    # Step 2: 转换为 GGUF
    convert_to_gguf()
    
    # Step 3: 创建 Ollama Modelfile
    create_ollama_modelfile()
    
    print("\n" + "=" * 50)
    print("Pipeline complete!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. If GGUF conversion succeeded:")
    print(f"   ollama create nano-prompt -f {BASE_DIR}/models/Modelfile")
    print("\n2. Or use the merged model directly with transformers:")
    print(f"   model = AutoModelForCausalLM.from_pretrained('{MERGED_MODEL_PATH}')")


if __name__ == "__main__":
    main()
