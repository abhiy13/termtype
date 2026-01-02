import type { TypingTestMetrics } from "../types"

/**
 * Calculate WPM (Words Per Minute)
 * Standard: 5 characters = 1 word
 * Uses CORRECT characters only for accurate WPM (like MonkeyType)
 */
export function calculateWPM(correctChars: number, elapsedTimeInSeconds: number): number {
  if (elapsedTimeInSeconds === 0) return 0
  const wordsTyped = correctChars / 5
  const minutes = elapsedTimeInSeconds / 60
  return Math.round(wordsTyped / minutes)
}

/**
 * Calculate Raw WPM (all typed characters, including errors)
 */
export function calculateRawWPM(totalChars: number, elapsedTimeInSeconds: number): number {
  if (elapsedTimeInSeconds === 0) return 0
  const wordsTyped = totalChars / 5
  const minutes = elapsedTimeInSeconds / 60
  return Math.round(wordsTyped / minutes)
}

/**
 * Calculate accuracy (MonkeyType style)
 * Formula: (correct characters / typed characters) * 100
 */
export function calculateAccuracy(correctChars: number, totalTyped: number): number {
  if (totalTyped === 0) return 100
  return Math.round((correctChars / totalTyped) * 100)
}

/**
 * Count errors (mismatched characters)
 */
export function calculateErrors(userInput: string, quote: string): number {
  let count = 0
  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] !== quote[i]) {
      count++
    }
  }
  return count
}

/**
 * Calculate elapsed time in seconds
 */
export function calculateElapsedTime(startTime: number | null, endTime: number | null, currentTime: number, pausedDuration = 0): number {
  if (!startTime) return 0
  const end = endTime || currentTime
  return Math.max(0, (end - startTime - pausedDuration) / 1000)
}

/**
 * Calculate all typing metrics
 */
export function calculateMetrics(userInput: string, quote: string, startTime: number | null, endTime: number | null, currentTime: number, pausedDuration = 0): TypingTestMetrics {
  const elapsedTime = calculateElapsedTime(startTime, endTime, currentTime, pausedDuration)
  const errors = calculateErrors(userInput, quote)
  const correctChars = Math.max(0, userInput.length - errors)
  const totalChars = userInput.length

  // WPM based on correct characters only (MonkeyType style)
  const wpm = calculateWPM(correctChars, elapsedTime)

  // Accuracy: correct / total typed
  const accuracy = calculateAccuracy(correctChars, totalChars)

  return {
    wpm,
    accuracy,
    elapsedTime,
    errors,
    correctChars,
    totalChars,
  }
}
