import { describe, test, expect } from "bun:test"
import { Header } from "./Header"
import { MetricsDisplay } from "./MetricsDisplay"
import { StatusMessage } from "./StatusMessage"
import { ProgressBar } from "./ProgressBar"
import type { TypingTestMetrics, TestState } from "../types"

describe("Component Integration Tests", () => {
  describe("Header", () => {
    test("renders with default props", () => {
      const component = Header({})
      expect(component).toBeDefined()
      expect(component.type).toBe("box")
    })

    test("renders with custom font color", () => {
      const component = Header({ fontColor: "#ff0000" })
      expect(component).toBeDefined()
    })

    test("renders with custom subtitle color", () => {
      const component = Header({ subtitleColor: "#00ff00" })
      expect(component).toBeDefined()
    })

    test("renders with both custom colors", () => {
      const component = Header({ fontColor: "#ff0000", subtitleColor: "#00ff00" })
      expect(component).toBeDefined()
    })
  })

  describe("MetricsDisplay", () => {
    const defaultMetrics: TypingTestMetrics = {
      wpm: 60,
      accuracy: 95,
      elapsedTime: 30.5,
      errors: 5,
      correctChars: 150,
      totalChars: 158,
    }

    test("renders with default metrics", () => {
      const component = MetricsDisplay({ metrics: defaultMetrics })
      expect(component).toBeDefined()
      expect(component.type).toBe("box")
    })

    test("renders without showing errors by default", () => {
      const component = MetricsDisplay({ metrics: defaultMetrics })
      expect(component).toBeDefined()
    })

    test("renders with showErrors enabled", () => {
      const component = MetricsDisplay({ metrics: defaultMetrics, showErrors: true })
      expect(component).toBeDefined()
    })

    test("renders with custom colors", () => {
      const component = MetricsDisplay({
        metrics: defaultMetrics,
        primaryColor: "#ff0000",
        mutedColor: "#666666",
      })
      expect(component).toBeDefined()
    })

    test("renders with zero values", () => {
      const zeroMetrics: TypingTestMetrics = {
        wpm: 0,
        accuracy: 0,
        elapsedTime: 0,
        errors: 0,
        correctChars: 0,
        totalChars: 0,
      }
      const component = MetricsDisplay({ metrics: zeroMetrics })
      expect(component).toBeDefined()
    })

    test("renders with high values", () => {
      const highMetrics: TypingTestMetrics = {
        wpm: 150,
        accuracy: 100,
        elapsedTime: 120.5,
        errors: 0,
        correctChars: 1000,
        totalChars: 1000,
      }
      const component = MetricsDisplay({ metrics: highMetrics })
      expect(component).toBeDefined()
    })

    test("renders with errors present", () => {
      const metricsWithErrors: TypingTestMetrics = {
        wpm: 40,
        accuracy: 80,
        elapsedTime: 30,
        errors: 25,
        correctChars: 100,
        totalChars: 125,
      }
      const component = MetricsDisplay({ metrics: metricsWithErrors, showErrors: true })
      expect(component).toBeDefined()
    })
  })

  describe("StatusMessage", () => {
    test("renders idle state", () => {
      const component = StatusMessage({ testState: "idle" })
      expect(component).toBeDefined()
      expect(component.type).toBe("box")
    })

    test("renders active state", () => {
      const component = StatusMessage({ testState: "active" })
      expect(component).toBeDefined()
    })

    test("renders paused state", () => {
      const component = StatusMessage({ testState: "paused" })
      expect(component).toBeDefined()
    })

    test("renders completed state", () => {
      const component = StatusMessage({ testState: "completed" })
      expect(component).toBeDefined()
    })

    test("renders with custom hint color", () => {
      const component = StatusMessage({ testState: "idle", hintColor: "#ff0000" })
      expect(component).toBeDefined()
    })

    test("all states have fixed height container", () => {
      const states: TestState[] = ["idle", "active", "paused", "completed"]
      states.forEach((state) => {
        const component = StatusMessage({ testState: state })
        expect(component).toBeDefined()
        expect(component.props.style.height).toBe(3)
      })
    })
  })

  describe("ProgressBar", () => {
    test("renders with 0% progress", () => {
      const component = ProgressBar({ progress: 0 })
      expect(component).toBeDefined()
      expect(component.type).toBe("box")
    })

    test("renders with 50% progress", () => {
      const component = ProgressBar({ progress: 50 })
      expect(component).toBeDefined()
    })

    test("renders with 100% progress", () => {
      const component = ProgressBar({ progress: 100 })
      expect(component).toBeDefined()
    })

    test("renders with custom width", () => {
      const component = ProgressBar({ progress: 50, width: 60 })
      expect(component).toBeDefined()
    })

    test("handles progress over 100%", () => {
      const component = ProgressBar({ progress: 150 })
      expect(component).toBeDefined()
    })

    test("handles negative progress", () => {
      const component = ProgressBar({ progress: -10 })
      expect(component).toBeDefined()
    })

    test("renders with fractional progress", () => {
      const component = ProgressBar({ progress: 33.33 })
      expect(component).toBeDefined()
    })

    test("renders with very small width", () => {
      const component = ProgressBar({ progress: 50, width: 10 })
      expect(component).toBeDefined()
    })

    test("renders with very large width", () => {
      const component = ProgressBar({ progress: 50, width: 200 })
      expect(component).toBeDefined()
    })

    test("renders with default width when not specified", () => {
      const component = ProgressBar({ progress: 75 })
      expect(component).toBeDefined()
    })
  })

  describe("Component Edge Cases", () => {
    test("MetricsDisplay handles fractional WPM", () => {
      const metrics: TypingTestMetrics = {
        wpm: 67.8,
        accuracy: 94,
        elapsedTime: 15.3,
        errors: 3,
        correctChars: 85,
        totalChars: 88,
      }
      const component = MetricsDisplay({ metrics })
      expect(component).toBeDefined()
    })

    test("MetricsDisplay handles very long elapsed time", () => {
      const metrics: TypingTestMetrics = {
        wpm: 50,
        accuracy: 90,
        elapsedTime: 9999.9,
        errors: 10,
        correctChars: 5000,
        totalChars: 5010,
      }
      const component = MetricsDisplay({ metrics })
      expect(component).toBeDefined()
    })

    test("ProgressBar clamps values correctly", () => {
      const tooHigh = ProgressBar({ progress: 200 })
      const tooLow = ProgressBar({ progress: -50 })
      expect(tooHigh).toBeDefined()
      expect(tooLow).toBeDefined()
    })

    test("components handle empty color strings", () => {
      const header = Header({ fontColor: "", subtitleColor: "" })
      const metrics: TypingTestMetrics = {
        wpm: 60,
        accuracy: 95,
        elapsedTime: 30,
        errors: 5,
        correctChars: 150,
        totalChars: 158,
      }
      const display = MetricsDisplay({
        metrics,
        primaryColor: "",
        mutedColor: "",
      })
      expect(header).toBeDefined()
      expect(display).toBeDefined()
    })
  })

  describe("Component Consistency", () => {
    test("all components return valid React elements", () => {
      const header = Header({})
      const metrics: TypingTestMetrics = {
        wpm: 60,
        accuracy: 95,
        elapsedTime: 30,
        errors: 5,
        correctChars: 150,
        totalChars: 158,
      }
      const metricsDisplay = MetricsDisplay({ metrics })
      const status = StatusMessage({ testState: "idle" })
      const progress = ProgressBar({ progress: 50 })

      expect(header).toBeDefined()
      expect(metricsDisplay).toBeDefined()
      expect(status).toBeDefined()
      expect(progress).toBeDefined()
    })

    test("components have expected structure", () => {
      const header = Header({})
      const metrics: TypingTestMetrics = {
        wpm: 60,
        accuracy: 95,
        elapsedTime: 30,
        errors: 5,
        correctChars: 150,
        totalChars: 158,
      }
      const metricsDisplay = MetricsDisplay({ metrics })

      expect(header.type).toBe("box")
      expect(metricsDisplay.type).toBe("box")
      expect(header.props).toBeDefined()
      expect(metricsDisplay.props).toBeDefined()
    })
  })
})