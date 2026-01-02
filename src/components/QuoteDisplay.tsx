interface QuoteDisplayProps {
  quote: string
  userInput: string
  cursorPosition: number
  cursorVisible: boolean
  isPaused?: boolean
}

// MonkeyType-inspired color scheme
const COLORS = {
  untyped: "#646669", // Subtle gray for untyped text
  correct: "#d1d0c5", // Off-white for correct characters
  error: "#ca4754", // Red for errors
  errorBg: "#572B2B", // Dark red background for errors
  cursor: "#E2B714", // MonkeyType yellow for cursor
  cursorBg: "#E2B714", // Yellow background for cursor block
  paused: "#3c3e41", // Dimmed when paused
}

export function QuoteDisplay({
  quote,
  userInput,
  cursorPosition,
  cursorVisible,
  isPaused = false,
}: QuoteDisplayProps) {
  return (
    <box style={{ flexDirection: "row", flexWrap: "wrap", gap: 0, justifyContent: "center" }}>
      {quote.split("").map((char, index) => {
        let color = isPaused ? COLORS.paused : COLORS.untyped
        let bgColor: string | undefined = undefined
        let isCursor = false

        if (!isPaused && index < userInput.length) {
          // Already typed characters
          if (userInput[index] === char) {
            color = COLORS.correct
          } else {
            color = COLORS.error
            bgColor = COLORS.errorBg
          }
        } else if (!isPaused && index === cursorPosition) {
          // Current cursor position
          isCursor = true
          if (cursorVisible) {
            color = "#232323"
            bgColor = COLORS.cursorBg
          } else {
            color = COLORS.cursor
          }
        }

        // Display non-breaking space for actual spaces
        const displayChar = char === " " ? "\u00A0" : char

        return (
          <text key={index} fg={color} bg={bgColor}>
            {displayChar}
          </text>
        )
      })}
    </box>
  )
}
