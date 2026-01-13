"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FormatSelectorProps {
  value: "text" | "json"
  onChange: (value: "text" | "json") => void
  disabled?: boolean
}

export function FormatSelector({
  value,
  onChange,
  disabled,
}: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">输出格式</label>
      <Tabs
        value={value}
        onValueChange={(v) => onChange(v as "text" | "json")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" disabled={disabled}>
            文本格式
          </TabsTrigger>
          <TabsTrigger value="json" disabled={disabled}>
            JSON 格式
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        {value === "text"
          ? "输出自然语言格式的详细提示词"
          : "输出结构化的 JSON 格式提示词"}
      </p>
    </div>
  )
}
