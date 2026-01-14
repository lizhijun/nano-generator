# 从零到一：用 LoRA 微调打造本地 AI 提示词生成器

> 基于 496 条高质量数据，微调 Qwen2.5 模型，构建可离线运行的图像提示词生成器

## 背景

在 AI 图像生成领域，一个好的提示词往往决定了输出质量。专业级提示词通常包含主体描述、场景设定、光照条件、摄影参数等多个维度，对普通用户来说门槛较高。

我们的目标：**让用户输入一句简单的中文描述，自动生成专业级图像提示词**。

```
输入：霓虹街头的赛博朋克女孩
输出：A confident young woman standing in a neon-lit cyberpunk street at night,
      wearing a sleek black leather jacket, short purple hair with glowing highlights,
      dramatic rim lighting from neon signs, shallow depth of field, cinematic composition,
      8k resolution, hyper-realistic, Blade Runner aesthetic...
```

## 技术方案概览

```
┌─────────────────────────────────────────────────────────────────┐
│  数据准备                                                        │
│  ┌─────────────┐    Claude API    ┌─────────────────────────┐   │
│  │ 496条提示词  │ ───────────────→ │ ~1500条训练数据          │   │
│  │ (高质量输出) │   反向生成描述    │ (简单描述 → 完整提示词)   │   │
│  └─────────────┘                  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LoRA 微调                                                       │
│  ┌─────────────┐    PEFT/Unsloth   ┌────────────────────────┐  │
│  │ Qwen2.5-3B  │ ─────────────────→ │ 微调后模型 (LoRA)      │  │
│  │ Instruct    │    3 epochs        │ 仅增加 ~20MB 参数      │  │
│  └─────────────┘                    └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  本地部署                                                        │
│  ┌─────────────┐    Ollama       ┌─────────────────────────┐   │
│  │ GGUF 模型   │ ──────────────→ │ Next.js Web 应用        │   │
│  │             │    本地推理      │ 流式输出 + 格式切换      │   │
│  └─────────────┘                 └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 一、数据准备：反向工程

### 1.1 问题：我们有输出，没有输入

通常的监督学习是「给定输入，学习输出」。但我们手上只有 496 条高质量的图像提示词（输出），没有对应的简单描述（输入）。

**解决方案：用 LLM 反向生成输入**

```python
# scripts/generate_training_data.py

SYSTEM_PROMPT = """你是一个专业的提示词分析专家。分析给定的图像生成提示词，生成简洁的中文描述。

要求：
1. 描述应该简洁，通常 10-30 个中文字
2. 抓住核心要素：主体、场景、风格
3. 不需要包含技术参数

示例：
- 输入：复杂的 JSON 格式提示词，描述霓虹灯下的赛博朋克女孩
- 输出：霓虹街头的赛博朋克女孩，夜景氛围
"""

async def generate_description(client, prompt, prompt_type, semaphore):
    """调用 Claude API 生成简单描述"""
    async with semaphore:
        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=100,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": f"请为以下图像生成提示词生成简洁的中文描述：\n\n{prompt[:3000]}"
            }]
        )
        return message.content[0].text.strip()
```

**关键设计点：**

- **并发控制**：使用 `asyncio.Semaphore(5)` 限制并发，避免触发 API 限流
- **断点续传**：每批次处理后保存结果，支持中断后继续
- **指数退避**：失败时 `await asyncio.sleep(2 ** attempt)` 逐步延长等待时间

### 1.2 数据增强：从 496 到 1500+

单条数据配多个描述变体，扩大训练集规模：

```python
# scripts/augment_data.py

SYSTEM_PROMPT = """为给定的图像描述生成不同风格的变体。
要求：
1. 保持核心含义不变
2. 使用不同的表达方式、词汇或句式
3. 变体之间要有明显差异
"""

# 原始："霓虹街头的赛博朋克女孩"
# 变体1："夜色中霓虹灯映照的朋克风女性"
# 变体2："赛博朋克城市街道上的时尚女孩"
```

**增强效果**：496 原始数据 → 约 1488 条训练数据（每条生成 2 个变体）

### 1.3 数据格式化

将数据转换为指令微调格式：

```python
# scripts/prepare_dataset.py

INSTRUCTION_TEMPLATE = """根据以下描述生成 NanoBananaPro 图像提示词。

要求：
1. 输出{format_type}格式的详细提示词
2. 包含主体描述、外观、场景、光照、风格等要素
3. 使用专业的摄影/图像生成术语

描述：{description}"""

def format_training_sample(item):
    return {
        "instruction": INSTRUCTION_TEMPLATE.format(
            format_type="JSON" if item['prompt_type'] == 'json' else "自然语言",
            description=item['simple_description']
        ),
        "input": "",
        "output": item['prompt']
    }
```

**数据划分**：90% 训练集 / 10% 验证集（固定 seed=42 保证可复现）

## 二、LoRA 微调：高效训练

### 2.1 为什么选择 LoRA

| 方案 | 显存需求 | 训练时间 | 模型体积 |
|------|----------|----------|----------|
| 全参数微调 7B | 60GB+ | 数小时 | 14GB |
| LoRA 微调 7B | 8GB | 1-2小时 | 原模型 + 20MB |
| LoRA 微调 3B | 6GB | 30分钟 | 原模型 + 15MB |

LoRA (Low-Rank Adaptation) 的核心思想：**冻结原模型参数，只训练低秩分解的增量矩阵**

```
原始权重 W (d × k)
            ↓
W' = W + BA，其中 B (d × r), A (r × k), r << min(d, k)
```

### 2.2 训练配置

```yaml
# training/configs/train_config.yaml

# 基座模型
model_name_or_path: Qwen/Qwen2.5-3B-Instruct  # 或 7B

# LoRA 超参数
lora_rank: 16          # 低秩维度，越大表达能力越强
lora_alpha: 32         # 缩放因子，通常设为 2×rank
lora_dropout: 0.05     # 防止过拟合
lora_target: q_proj,k_proj,v_proj,o_proj,gate_proj,up_proj,down_proj

# 训练参数
num_train_epochs: 3
per_device_train_batch_size: 2
gradient_accumulation_steps: 4   # 等效 batch_size = 8
learning_rate: 2.0e-4
lr_scheduler_type: cosine
warmup_ratio: 0.1
```

### 2.3 训练实现

**GPU 版本（使用 Unsloth 加速）**

```python
# training/train_lora.py

from unsloth import FastLanguageModel
from trl import SFTTrainer

# 加载模型（4-bit 量化节省显存）
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-7B-Instruct",
    max_seq_length=2048,
    load_in_4bit=True,
)

# 添加 LoRA 适配器
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    use_gradient_checkpointing="unsloth",  # 进一步节省显存
)

# 格式化提示词模板
def format_prompt(sample):
    return f"""<|im_start|>system
你是 NanoBananaPro 提示词生成专家。<|im_end|>
<|im_start|>user
{sample['instruction']}<|im_end|>
<|im_start|>assistant
{sample['output']}<|im_end|>"""

# 训练
trainer = SFTTrainer(
    model=model,
    train_dataset=train_dataset,
    formatting_func=format_prompt,
    args=training_args,
)
trainer.train()
```

**Mac MPS 版本（Apple Silicon 适配）**

```python
# training/train_lora_mac.py

from peft import LoraConfig, get_peft_model

# MPS 特殊配置
device = torch.device("mps")
model = model.to(device)

training_args = TrainingArguments(
    per_device_train_batch_size=1,   # MPS 用小 batch
    gradient_accumulation_steps=8,    # 等效 batch_size
    fp16=False, bf16=False,           # MPS 不支持
    dataloader_pin_memory=False,      # MPS 需要禁用
)
```

### 2.4 模型转换

训练完成后，需要将 LoRA 权重合并并转换为 Ollama 可用格式：

```python
# training/merge_and_convert.py

from peft import PeftModel

# 1. 加载基础模型和 LoRA
base_model = AutoModelForCausalLM.from_pretrained(BASE_MODEL_NAME)
model = PeftModel.from_pretrained(base_model, LORA_ADAPTER_PATH)

# 2. 合并权重
model = model.merge_and_unload()
model.save_pretrained(MERGED_MODEL_PATH)

# 3. 转换为 GGUF（需要 llama.cpp）
# python convert_hf_to_gguf.py {merged_path} --outtype f16
```

## 三、Ollama 部署

### 3.1 Modelfile 配置

```dockerfile
# Modelfile

FROM ./models/gguf/nano-banana-pro.gguf

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_predict 2048
PARAMETER stop "<|im_end|>"

SYSTEM """你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。

你的输出应该：
1. 包含详细的主体描述、外观、场景、光照、风格等要素
2. 使用专业的摄影/图像生成术语
3. 确保提示词足够详细，能够生成高质量的图像"""

TEMPLATE """<|im_start|>system
{{ .System }}<|im_end|>
<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""
```

### 3.2 创建模型

```bash
ollama create nano-banana-pro -f Modelfile
ollama run nano-banana-pro
```

## 四、前端实现：流式输出

### 4.1 Ollama API 封装

```typescript
// app/src/lib/ollama.ts

export async function* generateStream(options: GenerateOptions): AsyncGenerator<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...options, stream: true }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split("\n").filter(line => line.trim())

    for (const line of lines) {
      const data = JSON.parse(line)
      if (data.response) yield data.response
    }
  }
}
```

### 4.2 API Route（流式代理）

```typescript
// app/src/app/api/generate/route.ts

export async function POST(request: NextRequest) {
  const { description, format, model } = await request.json()
  const prompt = buildPrompt(description, format)

  // 创建流式响应
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of generateStream({
        model,
        prompt,
        system: SYSTEM_PROMPT,
        options: { temperature: 0.7, top_p: 0.9, num_predict: 2048 },
      })) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}
```

### 4.3 前端 Hook

```typescript
// app/src/hooks/use-generate.ts

export function useGenerate() {
  const [output, setOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = async (description: string, format: "text" | "json") => {
    setIsGenerating(true)
    setOutput("")

    const response = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ description, format }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setOutput(prev => prev + decoder.decode(value))
    }

    setIsGenerating(false)
  }

  return { output, isGenerating, generate }
}
```

## 五、关键技术点总结

| 环节 | 技术选型 | 关键配置 |
|------|----------|----------|
| 数据生成 | Claude API + asyncio | 并发控制 5、断点续传 |
| 数据增强 | LLM 生成变体 | 每条 2 个变体，3倍数据量 |
| 模型选型 | Qwen2.5-3B/7B-Instruct | 中英双语、指令跟随能力强 |
| 微调方法 | LoRA (PEFT) | r=16, alpha=32, 7层 target |
| 训练框架 | Unsloth / Transformers | 4-bit 量化、gradient checkpointing |
| 模型部署 | Ollama + GGUF | 本地推理、低延迟 |
| 前端交互 | Next.js + Streaming | ReadableStream API |

## 六、效果与展望

**当前效果**：
- 从 10 字左右的描述生成 500-2000 字符的专业提示词
- 支持文本和 JSON 两种输出格式
- 本地推理，完全离线可用
- 3B 模型在 M3 Pro 上推理速度约 30 tokens/s

**后续优化方向**：
1. 收集用户反馈，持续扩充训练数据
2. 尝试 DPO (Direct Preference Optimization) 进一步对齐
3. 增加风格选择、参数调节等交互功能
4. 支持图像参考输入（多模态）

---

*本文基于 NanoBananaPro 项目实践，如有问题欢迎交流讨论。*
