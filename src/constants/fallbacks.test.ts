import { describe, test, expect } from "bun:test"
import { FALLBACK_WORD_LIST, FALLBACK_WORDS_TEXT } from "./fallbacks"

describe("fallbacks constants", () => {
  describe("FALLBACK_WORD_LIST", () => {
    test("contains expected number of words", () => {
      expect(FALLBACK_WORD_LIST.length).toBe(20)
    })

    test("all words are strings", () => {
      FALLBACK_WORD_LIST.forEach((word) => {
        expect(typeof word).toBe("string")
      })
    })

    test("all words are non-empty", () => {
      FALLBACK_WORD_LIST.forEach((word) => {
        expect(word.length).toBeGreaterThan(0)
      })
    })

    test("contains common English words", () => {
      expect(FALLBACK_WORD_LIST).toContain("the")
      expect(FALLBACK_WORD_LIST).toContain("be")
      expect(FALLBACK_WORD_LIST).toContain("to")
      expect(FALLBACK_WORD_LIST).toContain("of")
      expect(FALLBACK_WORD_LIST).toContain("and")
    })

    test("is a const array (readonly)", () => {
      expect(Array.isArray(FALLBACK_WORD_LIST)).toBe(true)
    })

    test("all words are lowercase", () => {
      FALLBACK_WORD_LIST.forEach((word) => {
        expect(word).toBe(word.toLowerCase())
      })
    })

    test("contains no duplicate words", () => {
      const uniqueWords = new Set(FALLBACK_WORD_LIST)
      expect(uniqueWords.size).toBe(FALLBACK_WORD_LIST.length)
    })

    test("words are relatively short for typing", () => {
      FALLBACK_WORD_LIST.forEach((word) => {
        expect(word.length).toBeLessThanOrEqual(10)
      })
    })

    test("first word is 'the'", () => {
      expect(FALLBACK_WORD_LIST[0]).toBe("the")
    })

    test("last word is 'this'", () => {
      expect(FALLBACK_WORD_LIST[FALLBACK_WORD_LIST.length - 1]).toBe("this")
    })
  })

  describe("FALLBACK_WORDS_TEXT", () => {
    test("is a space-separated string of words", () => {
      expect(typeof FALLBACK_WORDS_TEXT).toBe("string")
      expect(FALLBACK_WORDS_TEXT).toContain(" ")
    })

    test("contains all words from FALLBACK_WORD_LIST", () => {
      FALLBACK_WORD_LIST.forEach((word) => {
        expect(FALLBACK_WORDS_TEXT).toContain(word)
      })
    })

    test("is exactly FALLBACK_WORD_LIST joined with spaces", () => {
      const expected = FALLBACK_WORD_LIST.join(" ")
      expect(FALLBACK_WORDS_TEXT).toBe(expected)
    })

    test("has correct number of words when split", () => {
      const words = FALLBACK_WORDS_TEXT.split(" ")
      expect(words.length).toBe(FALLBACK_WORD_LIST.length)
    })

    test("starts with 'the'", () => {
      expect(FALLBACK_WORDS_TEXT.startsWith("the")).toBe(true)
    })

    test("ends with 'this'", () => {
      expect(FALLBACK_WORDS_TEXT.endsWith("this")).toBe(true)
    })

    test("has no leading or trailing spaces", () => {
      expect(FALLBACK_WORDS_TEXT).toBe(FALLBACK_WORDS_TEXT.trim())
    })

    test("has no double spaces", () => {
      expect(FALLBACK_WORDS_TEXT).not.toContain("  ")
    })

    test("is suitable for typing test", () => {
      expect(FALLBACK_WORDS_TEXT.length).toBeGreaterThan(30)
      expect(FALLBACK_WORDS_TEXT.length).toBeLessThan(200)
    })
  })

  describe("edge cases", () => {
    test("FALLBACK_WORD_LIST can be spread into new array", () => {
      const copy = [...FALLBACK_WORD_LIST]
      expect(copy).toEqual(FALLBACK_WORD_LIST)
    })

    test("FALLBACK_WORDS_TEXT can be split and rejoined", () => {
      const split = FALLBACK_WORDS_TEXT.split(" ")
      const rejoined = split.join(" ")
      expect(rejoined).toBe(FALLBACK_WORDS_TEXT)
    })

    test("word list order is preserved in text", () => {
      const words = FALLBACK_WORDS_TEXT.split(" ")
      words.forEach((word, index) => {
        expect(word).toBe(FALLBACK_WORD_LIST[index])
      })
    })

    test("no special characters in words", () => {
      FALLBACK_WORD_LIST.forEach((word) => {
        expect(/^[a-z]+$/.test(word)).toBe(true)
      })
    })

    test("can be used as typing test source", () => {
      // Verify it meets minimum requirements for a typing test
      expect(FALLBACK_WORDS_TEXT.length).toBeGreaterThan(0)
      expect(FALLBACK_WORDS_TEXT.split(" ").length).toBeGreaterThan(5)
    })
  })
})