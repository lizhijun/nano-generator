# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## 项目概述

NanoBananaPro 提示词生成器 - 基于 496 条高质量图像提示词进行 LoRA 微调，从简单中文描述生成专业级提示词。通过 Ollama 部署，配合 Next.js 前端。

## 常用命令

### 前端应用 (`/app`)

```bash
cd app
pnpm dev          # 开发服务器 (localhost:3000)
pnpm build        # 生产构建
pnpm lint         # ESLint 检查
```

### 数据准备 (`/scripts`)

```bash
cd scripts
pip install -r requirements.txt

# 完整流程
./run_all.sh

# 单独步骤
python generate_training_data.py      # Claude API 生成描述
python generate_training_data_ollama.py  # 备选：本地 Ollama
python augment_data.py                # 数据增强（每条生成2个变体）
python prepare_dataset.py             # 格式化 + 90/10 训练/验证划分
```

### 模型训练 (`/training`)

```bash
cd training
pip install -r requirements.txt

python train_lora.py          # LoRA 训练（GPU + Unsloth）
python train_lora_mac.py      # Mac MPS 训练（Apple Silicon）
python merge_and_convert.py   # 合并 LoRA + 转换 GGUF
python evaluate.py            # 验证集评估
python test_model.py          # 快速测试模型
```

### Ollama 部署

```bash
ollama create nano-banana-pro -f Modelfile
ollama run nano-banana-pro
```

## 架构概览

```
nano-generator/
├── app/                     # Next.js 16 前端
│   └── src/
│       ├── app/
│       │   ├── page.tsx                 # 主页面（输入/输出 UI）
│       │   └── api/generate/route.ts    # Ollama 代理（流式响应）
│       ├── components/
│       │   ├── prompt-input.tsx         # 用户输入 + 示例标签
│       │   ├── format-selector.tsx      # 文本/JSON 格式切换
│       │   └── prompt-preview.tsx       # 流式输出展示
│       ├── hooks/
│       │   └── use-generate.ts          # 生成状态 + 流式处理
│       └── lib/
│           └── ollama.ts                # Ollama API 封装
├── data/
│   ├── raw/NanoBananaProPrompts.xlsx    # 原始数据：496 条提示词
│   └── processed/
│       ├── training_data.json           # 训练集
│       └── validation_data.json         # 验证集
├── scripts/                 # 数据准备脚本
├── training/                # LoRA 训练脚本
│   └── configs/train_config.yaml        # 训练超参数
├── models/
│   ├── lora_adapter/        # LoRA 权重输出
│   └── gguf/                # Ollama 可用模型
└── Modelfile                # Ollama 配置文件
```

## 数据流

**训练流程：**
```
原始提示词(XLSX) → generate_training_data.py → augment_data.py → prepare_dataset.py → train_lora.py → merge_and_convert.py → GGUF 模型
```

**运行时：**
```
用户输入 → Next.js API Route → Ollama (localhost:11434) → 流式响应 → UI 展示
```

## 关键配置

### 训练配置 (`training/configs/train_config.yaml`)
- 基座模型：`Qwen/Qwen2.5-7B-Instruct`
- LoRA：rank=16, alpha=32, dropout=0.05
- 训练：3 epochs, batch_size=2, lr=2e-4

### Ollama 配置 (`Modelfile`)
- Temperature: 0.7, top_p: 0.9
- Max tokens: 2048

## 环境变量

```bash
ANTHROPIC_API_KEY        # Claude 数据生成所需
OLLAMA_MODEL             # 默认: qwen2.5-coder:latest
NEXT_PUBLIC_OLLAMA_URL   # 默认: http://localhost:11434
```

## 技术栈

**前端：** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (new-york 风格), Radix UI

**训练：** Unsloth (GPU) 或 PEFT+Transformers (Mac MPS), Qwen2.5-3B/7B-Instruct

**部署：** Ollama + GGUF 格式
