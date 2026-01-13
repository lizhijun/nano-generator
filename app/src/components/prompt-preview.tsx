"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Loader2 } from "lucide-react"

interface PromptPreviewProps {
  output: string
  isLoading: boolean
  error: string | null
}

export function PromptPreview({ output, isLoading, error }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // 尝试格式化 JSON
  const formatOutput = (text: string) => {
    try {
      const parsed = JSON.parse(text)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return text
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-medium">生成结果</CardTitle>
        {output && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                复制
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-full min-h-[300px] rounded-md border bg-muted/50 p-4 overflow-auto">
          {error ? (
            <div className="text-destructive text-sm">{error}</div>
          ) : isLoading && !output ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>正在生成...</span>
            </div>
          ) : output ? (
            <pre className="text-sm whitespace-pre-wrap break-words font-mono">
              {formatOutput(output)}
              {isLoading && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              )}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm">
              输入描述并点击生成，结果将显示在这里
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
