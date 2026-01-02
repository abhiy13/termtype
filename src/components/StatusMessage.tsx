import type { TestState } from "../types"

interface StatusMessageProps {
  testState: TestState
}

// MonkeyType-inspired color scheme
const COLORS = {
  hint: "#646669", // Subtle gray for hints
  success: "#7ec850", // Softer green for success
  warning: "#E2B714", // Yellow for warnings/pause
}

export function StatusMessage({ testState }: StatusMessageProps) {
  // Always render a fixed-height container to prevent layout shifts
  return (
    <box
      style={{ flexDirection: "column", height: 3, alignItems: "center", justifyContent: "center" }}
    >
      {testState === "idle" && <text fg={COLORS.hint}>start typing to begin the test</text>}

      {testState === "completed" && (
        <>
          <text fg={COLORS.success}>✓ Test Complete</text>
          <text fg={COLORS.hint}>press any key to restart</text>
        </>
      )}

      {testState === "paused" && (
        <>
          <text fg={COLORS.warning}>⏸ PAUSED</text>
          <text fg={COLORS.hint}>press esc to resume</text>
        </>
      )}

      {testState === "active" && <text fg="#232323"> </text>}
    </box>
  )
}
