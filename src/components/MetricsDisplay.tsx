import type { TypingTestMetrics } from "../types"

interface MetricsDisplayProps {
  metrics: TypingTestMetrics
  showErrors?: boolean
  primaryColor?: string
  mutedColor?: string
}

// MonkeyType-inspired color scheme
const COLORS = {
  label: "#646669", // Subtle gray for labels
  value: "#E2B714", // Yellow accent for values
  separator: "#2c2e31", // Darker separator
  error: "#ca4754", // Red for errors
}

export function MetricsDisplay({
  metrics,
  showErrors = false,
  primaryColor = COLORS.value,
  mutedColor = COLORS.label,
}: MetricsDisplayProps) {
  const { wpm, accuracy, elapsedTime, errors } = metrics

  const formatWPM = wpm === 0 ? "0" : wpm.toFixed(0)
  const formatTime = elapsedTime === 0 ? "0.0" : elapsedTime.toFixed(1)

  return (
    <box style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
        <text fg={mutedColor}>wpm</text>
        <text fg={primaryColor}>{formatWPM}</text>
      </box>

      <text fg={COLORS.separator}>│</text>

      <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
        <text fg={mutedColor}>acc</text>
        <text fg={primaryColor}>{accuracy}%</text>
      </box>

      <text fg={COLORS.separator}>│</text>

      <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
        <text fg={mutedColor}>time</text>
        <text fg={primaryColor}>{formatTime}s</text>
      </box>

      {showErrors && (
        <>
          <text fg={COLORS.separator}>│</text>

          <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
            <text fg={mutedColor}>errors</text>
            <text fg={errors > 0 ? COLORS.error : primaryColor}>{errors}</text>
          </box>
        </>
      )}
    </box>
  )
}
