import { useKeyboard } from "@opentui/react"

export type TestMode = "quotes" | "words"

interface ModeSelectorProps {
  mode: TestMode
  disabled?: boolean
  onModeChange?: (mode: TestMode) => void
}

const COLORS = {
  active: "#E2B714",
  inactive: "#646669",
  separator: "#2c2e31",
  key: "#E2B714",
}

export function ModeSelector({ mode, disabled = false, onModeChange }: ModeSelectorProps) {
  const wordsColor = disabled ? "#3c3e41" : mode === "words" ? COLORS.active : COLORS.inactive
  const quotesColor = disabled ? "#3c3e41" : mode === "quotes" ? COLORS.active : COLORS.inactive

  // Handle 1/2 keys for mode switching
  useKeyboard((key) => {
    if (disabled || !onModeChange) return
    if (key.name === "1" || key.sequence === "1") {
      onModeChange("words")
    } else if (key.name === "2" || key.sequence === "2") {
      onModeChange("quotes")
    }
  })

  return (
    <box style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
      <text fg={COLORS.key}>[1]</text>
      <text fg={wordsColor}>words</text>
      <text fg={COLORS.separator}>│</text>
      <text fg={COLORS.key}>[2]</text>
      <text fg={quotesColor}>quotes</text>
    </box>
  )
}
