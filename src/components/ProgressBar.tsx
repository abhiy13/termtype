interface ProgressBarProps {
  progress: number // 0 to 100
  width?: number
}

export function ProgressBar({ progress, width = 40 }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const filledWidth = Math.round((clampedProgress / 100) * width)
  const emptyWidth = width - filledWidth

  // Use block characters for smooth fill
  const filled = "━".repeat(filledWidth)
  const empty = "─".repeat(emptyWidth)

  return (
    <box style={{ flexDirection: "row", gap: 1, alignItems: "center" }}>
      <text fg="#323437">[</text>
      <text fg="#E2B714">{filled}</text>
      <text fg="#2c2e31">{empty}</text>
      <text fg="#323437">]</text>
      <text fg="#646669">{clampedProgress.toFixed(0).padStart(3)}%</text>
    </box>
  )
}
