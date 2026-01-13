# NanoBananaPro 提示词生成器

## 项目概述

基于 496 条高质量 NanoBananaPro 提示词，通过 LoRA 微调小模型，构建一个本地可运行的提示词生成器。用户输入简单描述即可生成专业级图像提示词。

---

## 一、数据分析结论

### 1.1 文件概况

| 指标 | 数值 |
|------|------|
| 总提示词数 | 496 条 |
| 文本格式 (text) | 284 条 (57.3%) |
| JSON 格式 (json) | 212 条 (42.7%) |
| 平均长度 | 977 字符 |
| 最长 | 7030 字符 |

### 1.2 主题分布

| 主题类别 | 数量 | 占比 |
|----------|------|------|
| 人像/肖像 | 376 | 75.8% |
| 时尚/服装 | 363 | 73.2% |
| 夜景/霓虹 | 281 | 56.7% |
| 动物 | 174 | 35.1% |
| 自然/风景 | 171 | 34.5% |
| 汽车/交通 | 141 | 28.4% |

### 1.3 高质量提示词核心要素

1. **主体描述** (who/what) - 人物类型、身份特征
2. **外观细节** (clothing, hair, expression) - 服装、发型、表情
3. **动作/姿势** (pose, action) - 姿态、动作描述
4. **环境/背景** (setting, background) - 场景设定
5. **光照条件** (lighting) - 灯光类型和效果
6. **技术参数** (camera, resolution) - 相机、分辨率
7. **风格/氛围** (style, mood) - 整体风格

### 1.4 常用质量短语

- **真实感**: photorealistic, hyper-realistic, ultra-realistic
- **光照**: cinematic lighting, golden hour, studio lighting, rim light
- **景深**: depth of field, shallow depth, bokeh
- **质量**: 8k resolution, film grain, high detail

---

## 二、技术方案

### 2.1 核心思路

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: 数据准备                                           │
│  ┌─────────────┐    LLM 生成    ┌─────────────────────────┐ │
│  │ 496条提示词  │ ──────────────→ │ 496对训练数据            │ │
│  │ (输出)      │   简单描述      │ (简单输入 → 完整提示词)   │ │
│  └─────────────┘                └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: LoRA 微调                                          │
│  ┌─────────────┐    LoRA      ┌─────────────────────────┐   │
│  │ 基座模型     │ ───────────→ │ 微调后模型               │   │
│  │ Qwen2.5-7B  │   微调       │ NanoBanana-LoRA         │   │
│  └─────────────┘              └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: 部署应用                                           │
│  ┌─────────────┐   Ollama    ┌─────────────────────────┐   │
│  │ 微调模型     │ ──────────→ │ Web 应用                 │   │
│  │ GGUF 格式   │   本地部署   │ Vue3 + Ollama API       │   │
│  └─────────────┘              └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

**训练侧：**
- 基座模型：Qwen2.5-7B-Instruct（中英双语、指令跟随能力强）
- 微调框架：LLaMA-Factory / Unsloth
- 训练方式：LoRA (rank=16, alpha=32)
- 硬件要求：Mac M2/M3 16GB+ 或 GPU 8GB+

**应用侧：**
- 模型部署：Ollama（本地运行）
- 前端框架：Next.js 15 (App Router) + TypeScript
- UI 组件：shadcn/ui（可选）
- 样式：Tailwind CSS

---

## 三、实现计划

### Phase 1: 数据准备 (1-2天)

#### 1.1 合成训练数据

用 LLM（Claude/GPT-4）为每条提示词生成对应的「简单描述」：

**输入**（原始提示词）：
```json
{"subject":{"primary":"young woman","action":"standing confidently"},"scene":{"environment":"neon-lit street","time":"night"},"lighting":{"type":"neon","effects":["rim light","reflections"]},"style":{"quality":"8k","aesthetic":"cyberpunk"}}
```

**生成的简单描述**：
```
霓虹街道上自信站立的年轻女性，赛博朋克风格，夜景
```

**最终训练数据格式**：
```json
{
  "instruction": "根据以下描述生成 NanoBananaPro 提示词，输出 JSON 格式：\n霓虹街道上自信站立的年轻女性，赛博朋克风格，夜景",
  "output": "{\"subject\":{\"primary\":\"young woman\",\"action\":\"standing confidently\"},\"scene\":{\"environment\":\"neon-lit street\",\"time\":\"night\"},\"lighting\":{\"type\":\"neon\",\"effects\":[\"rim light\",\"reflections\"]},\"style\":{\"quality\":\"8k\",\"aesthetic\":\"cyberpunk\"}}"
}
```

#### 1.2 数据增强

- 为每条数据生成 2-3 个不同风格的简单描述变体
- 目标：扩展到 1000-1500 条训练数据
- 按 9:1 划分训练集和验证集

#### 1.3 关键脚本

```
scripts/
├── generate_training_data.py   # 调用 LLM 生成简单描述
├── augment_data.py             # 数据增强
├── prepare_dataset.py          # 转换为训练格式
└── validate_data.py            # 数据质量检查
```

### Phase 2: LoRA 微调 (1-2天)

#### 2.1 环境准备

```bash
# 使用 Unsloth（Mac/GPU 友好）
pip install unsloth
# 或使用 LLaMA-Factory
git clone https://github.com/hiyouga/LLaMA-Factory.git
```

#### 2.2 训练配置

```yaml
# train_config.yaml
model_name: Qwen/Qwen2.5-7B-Instruct
lora_rank: 16
lora_alpha: 32
lora_dropout: 0.05
learning_rate: 2e-4
num_epochs: 3
batch_size: 4
max_length: 2048
```

#### 2.3 训练脚本

```
training/
├── train_lora.py               # LoRA 微调脚本
├── merge_lora.py               # 合并 LoRA 权重
├── convert_to_gguf.py          # 转换为 GGUF 格式
└── evaluate.py                 # 评估模型效果
```

### Phase 3: 模型部署 (0.5天)

#### 3.1 Ollama 部署

```bash
# 创建 Modelfile
FROM ./nano-banana-pro.gguf

PARAMETER temperature 0.7
PARAMETER top_p 0.9

SYSTEM """你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像提示词。"""

# 创建模型
ollama create nano-banana-pro -f Modelfile
```

#### 3.2 API 测试

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "nano-banana-pro",
  "prompt": "街拍女孩，霓虹灯背景，时尚风格"
}'
```

### Phase 4: Web 应用开发 (2-3天)

#### 4.1 项目结构

```
app/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 主页面
│   │   └── api/
│   │       └── generate/
│   │           └── route.ts    # API Route (代理 Ollama)
│   ├── components/
│   │   ├── prompt-input.tsx    # 输入组件
│   │   ├── style-selector.tsx  # 风格选择
│   │   ├── format-selector.tsx # 格式选择
│   │   ├── prompt-preview.tsx  # 预览面板
│   │   └── example-gallery.tsx # 示例展示
│   ├── lib/
│   │   └── ollama.ts           # Ollama API 封装
│   ├── hooks/
│   │   └── use-generate.ts     # 生成逻辑 hook
│   └── data/
│       └── examples.ts         # 精选示例
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

#### 4.2 核心功能

1. **输入区**：用户输入简单描述
2. **风格选择**：人像/时尚/场景/产品等
3. **格式选择**：文本格式或 JSON 格式
4. **生成按钮**：通过 API Route 调用 Ollama
5. **流式输出**：实时展示生成过程
6. **预览面板**：展示结果，支持编辑
7. **复制功能**：一键复制提示词
8. **示例库**：展示高质量范例
9. **历史记录**：localStorage 保存历史

---

## 四、目录结构

```
nano-generator/
├── data/
│   ├── raw/
│   │   └── NanoBananaProPrompts.xlsx   # 原始数据
│   ├── processed/
│   │   ├── training_data.json          # 训练数据
│   │   └── validation_data.json        # 验证数据
│   └── examples/
│       └── curated_examples.json       # 精选示例
├── scripts/
│   ├── generate_training_data.py
│   ├── augment_data.py
│   ├── prepare_dataset.py
│   └── validate_data.py
├── training/
│   ├── train_lora.py
│   ├── merge_lora.py
│   ├── convert_to_gguf.py
│   ├── evaluate.py
│   └── configs/
│       └── train_config.yaml
├── models/
│   ├── lora_adapter/                   # LoRA 权重
│   └── gguf/
│       └── nano-banana-pro.gguf        # 最终模型
├── app/                                # Vue 应用
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── Modelfile                           # Ollama 配置
└── README.md
```

---

## 五、时间估算

| 阶段 | 任务 | 时间 |
|------|------|------|
| Phase 1 | 数据准备（合成 + 增强） | 1-2 天 |
| Phase 2 | LoRA 微调 | 1-2 天 |
| Phase 3 | Ollama 部署 | 0.5 天 |
| Phase 4 | Web 应用开发 | 2-3 天 |
| **总计** | | **5-7 天** |

---

## 六、下一步

1. [ ] 开始 Phase 1：编写数据准备脚本
2. [ ] 调用 LLM 生成训练数据
3. [ ] 数据增强到 1000+ 条
4. [ ] 开始 LoRA 微调
