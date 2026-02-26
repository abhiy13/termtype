import { describe, test, expect } from "bun:test"
import {
  calculateWPM,
  calculateRawWPM,
  calculateAccuracy,
  calculateErrors,
  calculateElapsedTime,
  calculateMetrics,
} from "./metrics"

describe("metrics utilities", () => {
  describe("calculateWPM", () => {
    test("calculates WPM correctly for correct characters", () => {
      const result = calculateWPM(25, 30) // 25 chars in 30 seconds
      expect(result).toBe(10) // (25/5) / 0.5 = 10
    })

    test("returns 0 when elapsed time is 0", () => {
      const result = calculateWPM(100, 0)
      expect(result).toBe(0)
    })

    test("handles zero correct characters", () => {
      const result = calculateWPM(0, 60)
      expect(result).toBe(0)
    })

    test("calculates high WPM correctly", () => {
      const result = calculateWPM(500, 60) // 500 chars in 60 seconds
      expect(result).toBe(100) // (500/5) / 1 = 100
    })

    test("rounds WPM to nearest integer", () => {
      const result = calculateWPM(27, 30) // Should give ~10.8, rounds to 11
      expect(result).toBe(11)
    })

    test("handles fractional seconds", () => {
      const result = calculateWPM(25, 15.5)
      expect(Number.isInteger(result)).toBe(true)
    })
  })

  describe("calculateRawWPM", () => {
    test("calculates raw WPM including errors", () => {
      const result = calculateRawWPM(30, 30) // 30 chars (including errors) in 30s
      expect(result).toBe(12)
    })

    test("returns 0 when elapsed time is 0", () => {
      const result = calculateRawWPM(100, 0)
      expect(result).toBe(0)
    })

    test("handles zero total characters", () => {
      const result = calculateRawWPM(0, 60)
      expect(result).toBe(0)
    })

    test("calculates higher raw WPM than WPM when errors present", () => {
      const rawWPM = calculateRawWPM(100, 60)
      const wpm = calculateWPM(80, 60)
      expect(rawWPM).toBeGreaterThan(wpm)
    })
  })

  describe("calculateAccuracy", () => {
    test("returns 100% for all correct characters", () => {
      const result = calculateAccuracy(50, 50)
      expect(result).toBe(100)
    })

    test("returns 100% when no characters typed", () => {
      const result = calculateAccuracy(0, 0)
      expect(result).toBe(100)
    })

    test("calculates partial accuracy correctly", () => {
      const result = calculateAccuracy(80, 100)
      expect(result).toBe(80)
    })

    test("handles 0 correct characters", () => {
      const result = calculateAccuracy(0, 50)
      expect(result).toBe(0)
    })

    test("rounds accuracy to nearest integer", () => {
      const result = calculateAccuracy(33, 100) // 33%
      expect(result).toBe(33)
    })

    test("handles low accuracy", () => {
      const result = calculateAccuracy(1, 100)
      expect(result).toBe(1)
    })
  })

  describe("calculateErrors", () => {
    test("returns 0 for matching input and quote", () => {
      const result = calculateErrors("hello", "hello")
      expect(result).toBe(0)
    })

    test("counts single error", () => {
      const result = calculateErrors("hxllo", "hello")
      expect(result).toBe(1)
    })

    test("counts multiple errors", () => {
      const result = calculateErrors("hxllx", "hello")
      expect(result).toBe(2)
    })

    test("handles empty input", () => {
      const result = calculateErrors("", "hello")
      expect(result).toBe(0)
    })

    test("handles input shorter than quote", () => {
      const result = calculateErrors("hel", "hello")
      expect(result).toBe(0)
    })

    test("counts all characters as errors when completely wrong", () => {
      const result = calculateErrors("xxxxx", "hello")
      expect(result).toBe(5)
    })

    test("handles spaces as characters", () => {
      const result = calculateErrors("hello world", "hello_world")
      expect(result).toBe(1)
    })
  })

  describe("calculateElapsedTime", () => {
    test("returns 0 when start time is null", () => {
      const result = calculateElapsedTime(null, null, Date.now())
      expect(result).toBe(0)
    })

    test("calculates elapsed time from start to current", () => {
      const start = 1000
      const current = 6000
      const result = calculateElapsedTime(start, null, current)
      expect(result).toBe(5)
    })

    test("uses end time when provided", () => {
      const start = 1000
      const end = 4000
      const current = 10000
      const result = calculateElapsedTime(start, end, current)
      expect(result).toBe(3)
    })

    test("subtracts paused duration", () => {
      const start = 1000
      const current = 6000
      const pausedDuration = 2000
      const result = calculateElapsedTime(start, null, current, pausedDuration)
      expect(result).toBe(3)
    })

    test("returns 0 when paused duration exceeds elapsed time", () => {
      const start = 1000
      const current = 3000
      const pausedDuration = 5000
      const result = calculateElapsedTime(start, null, current, pausedDuration)
      expect(result).toBe(0)
    })

    test("handles fractional seconds correctly", () => {
      const start = 1000
      const current = 1500
      const result = calculateElapsedTime(start, null, current)
      expect(result).toBe(0.5)
    })
  })

  describe("calculateMetrics", () => {
    test("returns zero metrics for no input", () => {
      const result = calculateMetrics("", "hello world", null, null, Date.now())
      expect(result.wpm).toBe(0)
      expect(result.accuracy).toBe(100)
      expect(result.errors).toBe(0)
      expect(result.elapsedTime).toBe(0)
      expect(result.correctChars).toBe(0)
      expect(result.totalChars).toBe(0)
    })

    test("calculates all metrics for perfect typing", () => {
      const start = 1000
      const end = 31000
      const result = calculateMetrics("hello world", "hello world", start, end, end)
      expect(result.wpm).toBeGreaterThan(0)
      expect(result.accuracy).toBe(100)
      expect(result.errors).toBe(0)
      expect(result.correctChars).toBe(11)
      expect(result.totalChars).toBe(11)
      expect(result.elapsedTime).toBe(30)
    })

    test("calculates metrics with errors", () => {
      const start = 1000
      const current = 31000
      const result = calculateMetrics("hxllo", "hello", start, null, current)
      expect(result.errors).toBe(1)
      expect(result.correctChars).toBe(4)
      expect(result.totalChars).toBe(5)
      expect(result.accuracy).toBe(80)
    })

    test("handles in-progress typing", () => {
      const start = 1000
      const current = 6000
      const result = calculateMetrics("hello", "hello world", start, null, current)
      expect(result.elapsedTime).toBe(5)
      expect(result.wpm).toBeGreaterThan(0)
      expect(result.totalChars).toBe(5)
    })

    test("accounts for paused duration", () => {
      const start = 1000
      const current = 11000
      const pausedDuration = 5000
      const result = calculateMetrics("hello", "hello", start, null, current, pausedDuration)
      expect(result.elapsedTime).toBe(5)
    })

    test("ensures correct chars is never negative", () => {
      // Edge case where errors somehow exceed input length
      const result = calculateMetrics("", "hello", 1000, null, 2000)
      expect(result.correctChars).toBeGreaterThanOrEqual(0)
    })
  })

  describe("edge cases and boundary conditions", () => {
    test("handles very fast typing speeds", () => {
      const result = calculateWPM(1000, 1) // 1000 chars in 1 second
      expect(result).toBeGreaterThan(1000)
    })

    test("handles very slow typing speeds", () => {
      const result = calculateWPM(5, 300) // 5 chars in 5 minutes
      expect(result).toBe(1)
    })

    test("handles single character input", () => {
      const result = calculateMetrics("a", "a", 1000, 2000, 2000)
      expect(result.accuracy).toBe(100)
      expect(result.totalChars).toBe(1)
    })

    test("handles very long input", () => {
      const longInput = "a".repeat(1000)
      const result = calculateMetrics(longInput, longInput, 1000, 61000, 61000)
      expect(result.accuracy).toBe(100)
      expect(result.wpm).toBeGreaterThan(0)
    })

    test("handles all errors in input", () => {
      const result = calculateMetrics("xxxxx", "hello", 1000, 2000, 2000)
      expect(result.errors).toBe(5)
      expect(result.accuracy).toBe(0)
      expect(result.correctChars).toBe(0)
    })

    test("calculates metrics at exactly 1 minute", () => {
      const result = calculateMetrics("hello", "hello", 1000, 61000, 61000)
      expect(result.elapsedTime).toBe(60)
    })
  })
})