import { useState, useCallback, useEffect } from "react"
import { useKeyboard } from "@opentui/react"
import type { TypingTestState } from "../types"
import { calculateMetrics } from "../utils/metrics"

interface KeyboardEvent {
  name: string
  sequence?: string
  ctrl: boolean
  alt?: boolean
  option?: boolean
  meta?: boolean
}

interface UseTypingTestReturn extends TypingTestState {
  metrics: ReturnType<typeof calculateMetrics>
  reset: () => void
  restart: () => void
  togglePause: () => void
  userResetCount: number
}

function findPreviousWordBoundary(text: string, fromPos: number): number {
  if (fromPos === 0) return 0
  let pos = fromPos - 1
  while (pos > 0 && text[pos] !== " ") {
    pos--
  }
  return pos === 0 && text[0] !== " " ? 0 : pos + 1
}

function findNextWordBoundary(text: string, fromPos: number): number {
  if (fromPos >= text.length) return text.length
  let pos = fromPos
  while (pos < text.length && text[pos] !== " ") {
    pos++
  }
  while (pos < text.length && text[pos] === " ") {
    pos++
  }
  return pos
}

export function useTypingTest(
  quote: string,
  currentTime: number,
  inputEnabled = true
): UseTypingTestReturn {
  const [userInput, setUserInput] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [testState, setTestState] = useState<"idle" | "active" | "paused" | "completed">("idle")
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [totalPausedDuration, setTotalPausedDuration] = useState(0)
  const [userResetCount, setUserResetCount] = useState(0)

  const metrics = calculateMetrics(
    userInput,
    quote,
    startTime,
    endTime,
    currentTime,
    totalPausedDuration
  )

  const reset = useCallback(() => {
    setUserInput("")
    setCursorPosition(0)
    setStartTime(null)
    setEndTime(null)
    setTestState("idle")
    setPausedAt(null)
    setTotalPausedDuration(0)
  }, [])

  useEffect(() => {
    reset()
  }, [quote, reset])

  const restart = useCallback(() => {
    reset()
  }, [reset])

  const togglePause = useCallback(() => {
    if (testState === "active") {
      setPausedAt(Date.now())
      setTestState("paused")
    } else if (testState === "paused" && pausedAt) {
      const pausedDuration = Date.now() - pausedAt
      setTotalPausedDuration((prev: number) => prev + pausedDuration)
      setPausedAt(null)
      setTestState("active")
    }
  }, [testState, pausedAt])

  useKeyboard((key: KeyboardEvent) => {
    if (!inputEnabled) return
    if (key.name === "c" && key.ctrl) {
      return
    }

    if (key.name === "escape") {
      if (testState === "active" || testState === "paused") {
        togglePause()
      } else {
        setUserResetCount((prev) => prev + 1)
        reset()
      }
      return
    }

    if (testState !== "active") {
      // Don't capture special keys when idle - they're for mode switching or settings
      if (
        testState === "idle" &&
        (key.sequence === "1" || key.sequence === "2" || key.sequence === "?")
      ) {
        return
      }
      if (
        testState === "idle" &&
        key.sequence &&
        key.sequence.length === 1 &&
        key.name !== "escape"
      ) {
        const now = Date.now()
        setStartTime(now)
        setTestState("active")
        const char = key.sequence
        if (userInput.length < quote.length) {
          setUserInput(char)
          setCursorPosition(1)
          if (quote.length === 1 && char === quote[0]) {
            setEndTime(now)
            setTestState("completed")
          }
        }
      } else if (testState === "completed" && key.name !== "escape") {
        setUserResetCount((prev) => prev + 1)
        restart()
      }
      return
    }

    if (key.name === "backspace") {
      if (key.alt || key.option) {
        const wordBoundary = findPreviousWordBoundary(userInput, cursorPosition)
        setUserInput((prev: string) => prev.slice(0, wordBoundary) + prev.slice(cursorPosition))
        setCursorPosition(wordBoundary)
      } else if (cursorPosition > 0) {
        setUserInput(
          (prev: string) => prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition)
        )
        setCursorPosition((prev: number) => prev - 1)
      }
      return
    }

    if (key.name === "delete") {
      if (key.alt || key.option) {
        const wordBoundary = findNextWordBoundary(userInput, cursorPosition)
        setUserInput((prev: string) => prev.slice(0, cursorPosition) + prev.slice(wordBoundary))
      } else if (cursorPosition < userInput.length) {
        setUserInput(
          (prev: string) => prev.slice(0, cursorPosition) + prev.slice(cursorPosition + 1)
        )
      }
      return
    }

    if (key.name === "left") {
      if (key.alt || key.option) {
        const newCursor = findPreviousWordBoundary(userInput, cursorPosition)
        setCursorPosition(newCursor)
      } else if (cursorPosition > 0) {
        setCursorPosition((prev: number) => prev - 1)
      }
      return
    }

    if (key.name === "right") {
      if (key.alt || key.option) {
        const newCursor = findNextWordBoundary(userInput, cursorPosition)
        setCursorPosition(newCursor)
      } else if (cursorPosition < userInput.length) {
        setCursorPosition((prev: number) => prev + 1)
      }
      return
    }

    if (key.name === "home" || (key.meta && key.name === "left")) {
      setCursorPosition(0)
      return
    }

    if (key.name === "end" || (key.meta && key.name === "right")) {
      setCursorPosition(userInput.length)
      return
    }

    if (key.sequence && key.sequence.length === 1) {
      const char = key.sequence

      if (userInput.length + 1 === quote.length && char === quote[userInput.length]) {
        setUserInput(
          (prev: string) => prev.slice(0, cursorPosition) + char + prev.slice(cursorPosition)
        )
        setCursorPosition((prev: number) => prev + 1)
        setEndTime(Date.now())
        setTestState("completed")
        return
      }

      if (userInput.length < quote.length) {
        setUserInput(
          (prev: string) => prev.slice(0, cursorPosition) + char + prev.slice(cursorPosition)
        )
        setCursorPosition((prev: number) => prev + 1)
      }
    }
  })

  return {
    userInput,
    cursorPosition,
    startTime,
    endTime,
    testState,
    pausedAt,
    metrics,
    reset,
    restart,
    togglePause,
    userResetCount,
  }
}
