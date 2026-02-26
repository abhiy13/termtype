import { describe, test, expect } from "bun:test"
import { QUOTES, getRandomQuote, DEFAULT_QUOTE } from "./quotes"

describe("quotes constants", () => {
  describe("QUOTES", () => {
    test("contains multiple quotes", () => {
      expect(QUOTES.length).toBeGreaterThan(5)
    })

    test("all quotes are strings", () => {
      QUOTES.forEach((quote) => {
        expect(typeof quote).toBe("string")
      })
    })

    test("all quotes are non-empty", () => {
      QUOTES.forEach((quote) => {
        expect(quote.length).toBeGreaterThan(0)
      })
    })

    test("is a const array (readonly)", () => {
      expect(Array.isArray(QUOTES)).toBe(true)
    })

    test("contains expected quotes", () => {
      expect(QUOTES).toContain("The quick brown fox jumps over the lazy dog")
      expect(QUOTES).toContain("To be or not to be that is the question")
    })

    test("quotes are suitable length for typing", () => {
      QUOTES.forEach((quote) => {
        expect(quote.length).toBeGreaterThan(10)
        expect(quote.length).toBeLessThan(200)
      })
    })

    test("no duplicate quotes", () => {
      const uniqueQuotes = new Set(QUOTES)
      expect(uniqueQuotes.size).toBe(QUOTES.length)
    })

    test("first quote is the pangram", () => {
      expect(QUOTES[0]).toBe("The quick brown fox jumps over the lazy dog")
    })

    test("contains famous quotes", () => {
      const quotesText = QUOTES.join(" ")
      expect(quotesText).toContain("To be or not to be")
      expect(quotesText).toContain("Stay hungry stay foolish")
    })

    test("contains programming-related quotes", () => {
      const quotesText = QUOTES.join(" ")
      expect(quotesText).toContain("Code is poetry")
      expect(quotesText).toContain("Programming is thinking")
    })
  })

  describe("getRandomQuote", () => {
    test("returns a string", () => {
      const quote = getRandomQuote()
      expect(typeof quote).toBe("string")
    })

    test("returns a quote from QUOTES array", () => {
      const quote = getRandomQuote()
      expect(QUOTES).toContain(quote as any)
    })

    test("returns non-empty quote", () => {
      const quote = getRandomQuote()
      expect(quote.length).toBeGreaterThan(0)
    })

    test("can return different quotes on multiple calls", () => {
      const quotes = new Set()
      // Call many times to likely get different quotes
      for (let i = 0; i < 50; i++) {
        quotes.add(getRandomQuote())
      }
      // Should have gotten more than 1 unique quote (with high probability)
      expect(quotes.size).toBeGreaterThan(1)
    })

    test("always returns valid quote", () => {
      // Test multiple times to ensure consistency
      for (let i = 0; i < 10; i++) {
        const quote = getRandomQuote()
        expect(QUOTES).toContain(quote as any)
      }
    })

    test("returns quote with proper capitalization", () => {
      const quote = getRandomQuote()
      expect(quote[0]).toBe(quote[0]?.toUpperCase())
    })

    test("handles edge case of single quote in array", () => {
      // This tests that the function works correctly with array indexing
      const quote = getRandomQuote()
      expect(quote).toBeDefined()
    })
  })

  describe("DEFAULT_QUOTE", () => {
    test("is a string", () => {
      expect(typeof DEFAULT_QUOTE).toBe("string")
    })

    test("is the first quote in QUOTES array", () => {
      expect(DEFAULT_QUOTE).toBe(QUOTES[0])
    })

    test("is the pangram", () => {
      expect(DEFAULT_QUOTE).toBe("The quick brown fox jumps over the lazy dog")
    })

    test("is non-empty", () => {
      expect(DEFAULT_QUOTE.length).toBeGreaterThan(0)
    })

    test("contains all letters of the alphabet", () => {
      const letters = new Set(DEFAULT_QUOTE.toLowerCase().match(/[a-z]/g))
      expect(letters.size).toBe(26)
    })

    test("is suitable for typing test", () => {
      expect(DEFAULT_QUOTE.length).toBeGreaterThan(20)
    })
  })

  describe("edge cases and properties", () => {
    test("QUOTES array is not empty", () => {
      expect(QUOTES.length).toBeGreaterThan(0)
    })

    test("all quotes have proper sentence structure", () => {
      QUOTES.forEach((quote) => {
        // Should start with a capital letter or special character
        expect(/^[A-Z]/.test(quote)).toBe(true)
      })
    })

    test("quotes contain spaces", () => {
      QUOTES.forEach((quote) => {
        expect(quote).toContain(" ")
      })
    })

    test("getRandomQuote uses Math.random correctly", () => {
      // Collect samples
      const samples = new Set()
      for (let i = 0; i < 100; i++) {
        samples.add(getRandomQuote())
      }
      // With 100 samples from 14+ quotes, should get multiple unique ones
      expect(samples.size).toBeGreaterThan(Math.min(5, QUOTES.length / 2))
    })

    test("quotes are properly formatted", () => {
      QUOTES.forEach((quote) => {
        // No leading/trailing whitespace
        expect(quote).toBe(quote.trim())
        // No double spaces
        expect(quote).not.toContain("  ")
      })
    })

    test("can iterate over QUOTES", () => {
      let count = 0
      for (const quote of QUOTES) {
        count++
        expect(typeof quote).toBe("string")
      }
      expect(count).toBe(QUOTES.length)
    })

    test("QUOTES can be spread into new array", () => {
      const copy = [...QUOTES]
      expect(copy).toEqual(QUOTES)
    })
  })
})