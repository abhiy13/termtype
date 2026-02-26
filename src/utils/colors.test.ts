import { describe, test, expect } from "bun:test"
import {
  getReadableTextColor,
  ensureReadableColor,
  blendColors,
  getMutedColor,
} from "./colors"

describe("colors utilities", () => {
  describe("getReadableTextColor", () => {
    test("returns light color for dark background", () => {
      const result = getReadableTextColor("#000000")
      expect(result).toBe("#f5f5f5")
    })

    test("returns dark color for light background", () => {
      const result = getReadableTextColor("#ffffff")
      expect(result).toBe("#1a1a1a")
    })

    test("handles custom light and dark colors", () => {
      const result = getReadableTextColor("#808080", "#eeeeee", "#111111")
      expect(["#eeeeee", "#111111"]).toContain(result)
    })

    test("returns default light color for invalid hex", () => {
      const result = getReadableTextColor("invalid")
      expect(result).toBe("#f5f5f5")
    })

    test("handles 3-digit hex colors", () => {
      const result = getReadableTextColor("#000")
      expect(result).toBe("#f5f5f5")
    })
  })

  describe("ensureReadableColor", () => {
    test("returns preferred color when contrast is sufficient", () => {
      const result = ensureReadableColor("#ffffff", "#000000", 3.5)
      expect(result).toBe("#ffffff")
    })

    test("returns fallback color when contrast is insufficient", () => {
      const result = ensureReadableColor("#444444", "#333333", 4.5)
      expect(["#f5f5f5", "#1a1a1a"]).toContain(result)
    })

    test("handles invalid preferred color", () => {
      const result = ensureReadableColor("invalid", "#000000")
      expect(result).toBe("invalid")
    })

    test("handles invalid background color", () => {
      const result = ensureReadableColor("#ffffff", "invalid")
      expect(result).toBe("#ffffff")
    })

    test("uses custom minimum contrast threshold", () => {
      const result = ensureReadableColor("#d1d0c5", "#232323", 3.0)
      expect(result).toBeTruthy()
    })

    test("ensures high contrast with white text on black", () => {
      const result = ensureReadableColor("#ffffff", "#000000", 21)
      expect(result).toBe("#ffffff")
    })
  })

  describe("blendColors", () => {
    test("blends two colors with default ratio", () => {
      const result = blendColors("#ff0000", "#0000ff")
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    test("returns foreground color at ratio 1.0", () => {
      const result = blendColors("#ff0000", "#0000ff", 1.0)
      expect(result).toBe("#ff0000")
    })

    test("returns background color at ratio 0.0", () => {
      const result = blendColors("#ff0000", "#0000ff", 0.0)
      expect(result).toBe("#0000ff")
    })

    test("handles 3-digit hex colors", () => {
      const result = blendColors("#f00", "#00f", 0.5)
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    test("returns foreground for invalid background", () => {
      const result = blendColors("#ff0000", "invalid")
      expect(result).toBe("#ff0000")
    })

    test("blends white and black to gray", () => {
      const result = blendColors("#ffffff", "#000000", 0.5)
      expect(result).toBe("#7f7f7f")
    })

    test("clamps ratio values above 1", () => {
      const result = blendColors("#ff0000", "#0000ff", 1.5)
      expect(result).toBe("#ff0000")
    })

    test("clamps ratio values below 0", () => {
      const result = blendColors("#ff0000", "#0000ff", -0.5)
      expect(result).toBe("#0000ff")
    })
  })

  describe("getMutedColor", () => {
    test("returns blended color with default ratio", () => {
      const result = getMutedColor("#d1d0c5", "#232323")
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    test("applies custom mute ratio", () => {
      const result = getMutedColor("#d1d0c5", "#232323", 0.3)
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    test("returns foreground for invalid colors", () => {
      const result = getMutedColor("invalid", "#232323")
      expect(result).toBe("invalid")
    })

    test("produces darker result for higher background blend", () => {
      const light = getMutedColor("#ffffff", "#000000", 0.8)
      const dark = getMutedColor("#ffffff", "#000000", 0.2)
      expect(light).not.toBe(dark)
    })
  })

  describe("edge cases and boundary conditions", () => {
    test("handles empty string colors", () => {
      const result = ensureReadableColor("", "#000000")
      expect(result).toBe("")
    })

    test("handles colors with extra whitespace", () => {
      const result = blendColors("  #ffffff  ", "  #000000  ", 0.5)
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    })

    test("handles uppercase hex colors", () => {
      const result = blendColors("#FFFFFF", "#000000", 0.5)
      expect(result).toBe("#7f7f7f")
    })

    test("handles mixed case hex colors", () => {
      const result = blendColors("#FfFfFf", "#000000", 0.5)
      expect(result).toBe("#7f7f7f")
    })
  })
})