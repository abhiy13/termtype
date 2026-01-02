export type TestState = "idle" | "active" | "paused" | "completed"

export interface TypingTestMetrics {
  wpm: number
  accuracy: number
  elapsedTime: number
  errors: number
  correctChars: number
  totalChars: number
}

export interface TypingTestState {
  userInput: string
  cursorPosition: number
  startTime: number | null
  endTime: number | null
  testState: TestState
  pausedAt: number | null
}
