"use client"

import { useState, useCallback } from "react"

interface GenerateState {
  isLoading: boolean
  output: string
  error: string | null
}

interface UseGenerateOptions {
  onStream?: (chunk: string) => void
}

export function useGenerate(options: UseGenerateOptions = {}) {
  const [state, setState] = useState<GenerateState>({
    isLoading: false,
    output: "",
    error: null,
  })

  const generate = useCallback(
    async (description: string, format: "text" | "json" = "text") => {
      setState({ isLoading: true, output: "", error: null })

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, format }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "生成失败")
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let fullOutput = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          fullOutput += chunk

          setState((prev) => ({
            ...prev,
            output: fullOutput,
          }))

          options.onStream?.(chunk)
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
        }))

        return fullOutput
      } catch (error) {
        const message = error instanceof Error ? error.message : "未知错误"
        setState({
          isLoading: false,
          output: "",
          error: message,
        })
        throw error
      }
    },
    [options]
  )

  const reset = useCallback(() => {
    setState({ isLoading: false, output: "", error: null })
  }, [])

  return {
    ...state,
    generate,
    reset,
  }
}
