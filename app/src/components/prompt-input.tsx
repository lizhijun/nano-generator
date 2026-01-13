"use client"

import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const EXAMPLE_PROMPTS = [
  "街拍时尚女孩，霓虹灯背景",
  "咖啡馆里看书的文艺青年",
  "赛博朋克风格城市夜景",
  "海边日落，金色阳光下的冲浪者",
  "时尚男士街拍，电影感光影",
]

export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">输入描述</label>
      <Textarea
        placeholder="描述你想要的图像，例如：街拍时尚女孩，霓虹灯背景，赛博朋克风格..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[120px] resize-none"
      />
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">快速示例：</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <Badge
              key={prompt}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => !disabled && onChange(prompt)}
            >
              {prompt}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
