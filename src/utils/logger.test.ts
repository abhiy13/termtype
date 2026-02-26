import { describe, test, expect, mock, beforeEach, afterEach, spyOn } from "bun:test"
import { logError } from "./logger"

describe("logger utilities", () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = originalNodeEnv
  })

  describe("logError in development", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development"
    })

    test("logs message without error object", () => {
      logError("Test error message")
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test error message")
    })

    test("logs message with error object", () => {
      const error = new Error("Test error")
      logError("Test message", error)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test message", error)
    })

    test("logs message with string error", () => {
      logError("Test message", "string error")
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test message", "string error")
    })

    test("logs message with unknown error type", () => {
      logError("Test message", { custom: "error" })
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test message", { custom: "error" })
    })

    test("logs multiple times", () => {
      logError("First error")
      logError("Second error")
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
    })

    test("logs empty message", () => {
      logError("")
      expect(consoleErrorSpy).toHaveBeenCalledWith("")
    })

    test("logs with null error", () => {
      logError("Test message", null)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test message", null)
    })

    test("logs with undefined error", () => {
      logError("Test message", undefined)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test message")
    })
  })

  describe("logError in production", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production"
    })

    test("does not log in production", () => {
      logError("Test error message")
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    test("does not log with error object in production", () => {
      const error = new Error("Test error")
      logError("Test message", error)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    test("does not log multiple times in production", () => {
      logError("First error")
      logError("Second error")
      logError("Third error")
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe("logError with NODE_ENV unset", () => {
    beforeEach(() => {
      delete process.env.NODE_ENV
    })

    test("logs when NODE_ENV is undefined (defaults to dev)", () => {
      logError("Test message")
      expect(consoleErrorSpy).toHaveBeenCalledWith("Test message")
    })
  })

  describe("edge cases", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development"
    })

    test("handles very long error messages", () => {
      const longMessage = "a".repeat(10000)
      logError(longMessage)
      expect(consoleErrorSpy).toHaveBeenCalledWith(longMessage)
    })

    test("handles error with circular reference", () => {
      const circularError: any = { message: "test" }
      circularError.self = circularError
      logError("Circular error", circularError)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Circular error", circularError)
    })

    test("handles error with stack trace", () => {
      const error = new Error("Test error")
      error.stack = "Error: Test error\n    at test.ts:1:1"
      logError("Stack trace error", error)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Stack trace error", error)
    })

    test("handles numeric error", () => {
      logError("Numeric error", 404)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Numeric error", 404)
    })

    test("handles boolean error", () => {
      logError("Boolean error", false)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Boolean error", false)
    })
  })
})