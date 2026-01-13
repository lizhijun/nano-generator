"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PromptInput } from "@/components/prompt-input"
import { FormatSelector } from "@/components/format-selector"
import { PromptPreview } from "@/components/prompt-preview"
import { useGenerate } from "@/hooks/use-generate"
import { Sparkles, Loader2 } from "lucide-react"

export default function Home() {
  const [description, setDescription] = useState("")
  const [format, setFormat] = useState<"text" | "json">("text")
  const { isLoading, output, error, generate, reset } = useGenerate()

  const handleGenerate = async () => {
    if (!description.trim()) return
    try {
      await generate(description, format)
    } catch {
      // Error is handled in useGenerate hook
    }
  }

  const handleReset = () => {
    setDescription("")
    reset()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            NanoBananaPro 提示词生成器
          </h1>
          <p className="text-muted-foreground">
            输入简单描述，生成专业级图像提示词
          </p>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <Card>
            <CardHeader>
              <CardTitle>输入</CardTitle>
              <CardDescription>
                用简单的中文描述你想要生成的图像
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PromptInput
                value={description}
                onChange={setDescription}
                disabled={isLoading}
              />

              <FormatSelector
                value={format}
                onChange={setFormat}
                disabled={isLoading}
              />

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleGenerate}
                  disabled={!description.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      生成提示词
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Output */}
          <PromptPreview
            output={output}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            基于 496 条高质量提示词训练 · 支持本地 Ollama 运行
          </p>
        </footer>
      </div>
    </div>
  )
}
