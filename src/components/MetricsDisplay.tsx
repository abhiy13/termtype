import type { TypingTestMetrics } from "../types"

interface MetricsDisplayProps {
  metrics: TypingTestMetrics
  showErrors?: boolean
}

// MonkeyType-inspired color scheme
const COLORS = {
  label: "#646669",      // Subtle gray for labels
  value: "#E2B714",      // Yellow accent for values
  separator: "#2c2e31",  // Darker separator
  error: "#ca4754",      // Red for errors
}

export function MetricsDisplay({ metrics, showErrors = false }: MetricsDisplayProps) {
  const { wpm, accuracy, elapsedTime, errors } = metrics

  const formatWPM = wpm === 0 ? "0" : wpm.toFixed(0)
  const formatTime = elapsedTime === 0 ? "0.0" : elapsedTime.toFixed(1)

  return (
    <box style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
        <text fg={COLORS.label}>wpm</text>
        <text fg={COLORS.value}>{formatWPM}</text>
      </box>

      <text fg={COLORS.separator}>│</text>

      <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
        <text fg={COLORS.label}>acc</text>
        <text fg={COLORS.value}>{accuracy}%</text>
      </box>

      <text fg={COLORS.separator}>│</text>

      <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
        <text fg={COLORS.label}>time</text>
        <text fg={COLORS.value}>{formatTime}s</text>
      </box>

      {showErrors && (
        <>
          <text fg={COLORS.separator}>│</text>

          <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
            <text fg={COLORS.label}>errors</text>
            <text fg={errors > 0 ? COLORS.error : COLORS.value}>{errors}</text>
          </box>
        </>
      )}
    </box>
  )
}
