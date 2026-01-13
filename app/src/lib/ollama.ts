/**
 * Ollama API 封装
 */

const OLLAMA_BASE_URL = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434"

export interface GenerateOptions {
  model: string
  prompt: string
  system?: string
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    num_predict?: number
  }
}

export interface GenerateResponse {
  model: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  eval_count?: number
  eval_duration?: number
}

/**
 * 检查 Ollama 服务是否可用
 */
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 获取可用模型列表
 */
export async function listModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    if (!response.ok) return []
    const data = await response.json()
    return data.models?.map((m: { name: string }) => m.name) || []
  } catch {
    return []
  }
}

/**
 * 非流式生成
 */
export async function generate(options: GenerateOptions): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...options,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`)
  }

  const data: GenerateResponse = await response.json()
  return data.response
}

/**
 * 流式生成
 */
export async function* generateStream(
  options: GenerateOptions
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...options,
      stream: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split("\n").filter((line) => line.trim())

    for (const line of lines) {
      try {
        const data: GenerateResponse = JSON.parse(line)
        if (data.response) {
          yield data.response
        }
      } catch {
        // 忽略解析错误
      }
    }
  }
}

/**
 * 生成 NanoBananaPro 提示词的系统提示
 */
export const SYSTEM_PROMPT = `你是 NanoBananaPro 提示词生成专家。根据用户的简单描述，生成高质量的图像生成提示词。

你的输出应该：
1. 包含详细的主体描述、外观、场景、光照、风格等要素
2. 使用专业的摄影/图像生成术语（如 photorealistic, cinematic lighting, shallow depth of field, 8k resolution 等）
3. 根据用户要求输出文本或 JSON 格式
4. 确保提示词足够详细，能够生成高质量的图像

请直接输出提示词，不要有任何解释或前缀。`

/**
 * 构建生成提示词的 prompt
 */
export function buildPrompt(
  description: string,
  format: "text" | "json" = "text"
): string {
  const formatInstruction =
    format === "json"
      ? `请输出 JSON 格式的结构化提示词，包含 subject、environment、lighting、style 等字段。`
      : `请输出自然语言格式的详细提示词。`

  return `${formatInstruction}

用户描述：${description}`
}
