import { NextRequest } from "next/server"
import { generateStream, SYSTEM_PROMPT, buildPrompt } from "@/lib/ollama"

// 默认模型，可以切换为微调后的模型
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:latest"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, format = "text", model = DEFAULT_MODEL } = body

    if (!description || typeof description !== "string") {
      return Response.json(
        { error: "请输入描述" },
        { status: 400 }
      )
    }

    const prompt = buildPrompt(description.trim(), format)

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generateStream({
            model,
            prompt,
            system: SYSTEM_PROMPT,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              num_predict: 2048,
            },
          })) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "服务器错误" },
      { status: 500 }
    )
  }
}
