import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test"
import {
  fetchMonkeyTypeQuotes,
  getRandomMonkeyTypeQuote,
  refreshQuoteCache,
  clearQuoteCache,
} from "./monkeyTypeApi"

describe("monkeyTypeApi", () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    clearQuoteCache()
  })

  afterEach(() => {
    global.fetch = originalFetch
    clearQuoteCache()
  })

  describe("fetchMonkeyTypeQuotes", () => {
    test("fetches quotes from network successfully", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [
          { text: "Test quote 1", source: "Author 1", length: 50, id: 1 },
          { text: "Test quote 2", source: "Author 2", length: 75, id: 2 },
        ],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      )

      const result = await fetchMonkeyTypeQuotes()
      expect(result.quotes).toHaveLength(2)
      expect(result.fromNetwork).toBe(true)
    })

    test("returns memory cache on subsequent calls", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [{ text: "Test quote", source: "Author", length: 50, id: 1 }],
      }

      const mockFetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )
      global.fetch = mockFetch

      const result1 = await fetchMonkeyTypeQuotes()
      const result2 = await fetchMonkeyTypeQuotes()

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result1.fromNetwork).toBe(true)
      expect(result2.fromNetwork).toBe(false)
    })

    test("returns empty array on network failure with no cache", async () => {
      global.fetch = mock(() => Promise.reject(new Error("Network error")))

      const result = await fetchMonkeyTypeQuotes()
      expect(result.quotes).toEqual([])
      expect(result.fromNetwork).toBe(false)
    })

    test("handles non-ok response status", async () => {
      global.fetch = mock(() =>
        Promise.resolve(new Response("Not Found", { status: 404 }))
      )

      const result = await fetchMonkeyTypeQuotes()
      expect(result.quotes).toEqual([])
    })

    test("deduplicates concurrent fetch requests", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [{ text: "Test", source: "Author", length: 50, id: 1 }],
      }

      const mockFetch = mock(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify(mockQuotes), { status: 200 })
              ),
            100
          )
        )
      )
      global.fetch = mockFetch

      const [result1, result2] = await Promise.all([
        fetchMonkeyTypeQuotes(),
        fetchMonkeyTypeQuotes(),
      ])

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result1.quotes).toEqual(result2.quotes)
    })

    test("handles invalid JSON response", async () => {
      global.fetch = mock(() =>
        Promise.resolve(new Response("invalid json", { status: 200 }))
      )

      const result = await fetchMonkeyTypeQuotes()
      expect(result.quotes).toEqual([])
    })
  })

  describe("getRandomMonkeyTypeQuote", () => {
    test("returns random quote within length range", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [
          { text: "Short quote of adequate length here", source: "Author", length: 50, id: 1 },
          { text: "Another quote that fits the range nicely", source: "Author", length: 60, id: 2 },
        ],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )

      const result = await getRandomMonkeyTypeQuote(30, 80)
      expect(result.text).toBeTruthy()
      expect(typeof result.text).toBe("string")
    })

    test("returns null when no quotes available", async () => {
      global.fetch = mock(() => Promise.reject(new Error("Network error")))

      const result = await getRandomMonkeyTypeQuote()
      expect(result.text).toBeNull()
      expect(result.isLoading).toBe(false)
    })

    test("falls back to any quote when no matches in range", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [
          { text: "Very long quote that exceeds the requested maximum length by far", source: "Author", length: 200, id: 1 },
        ],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )

      const result = await getRandomMonkeyTypeQuote(30, 50)
      expect(result.text).toBeTruthy()
    })

    test("filters quotes correctly by length", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [
          { text: "Short", source: "A", length: 20, id: 1 },
          { text: "Medium length quote here", source: "B", length: 50, id: 2 },
          { text: "Very long quote that goes on and on", source: "C", length: 200, id: 3 },
        ],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )

      const result = await getRandomMonkeyTypeQuote(40, 100)
      expect(result.text).toBe("Medium length quote here")
    })

    test("uses default length range when not specified", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [
          { text: "A quote of reasonable length for typing", source: "Author", length: 80, id: 1 },
        ],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )

      const result = await getRandomMonkeyTypeQuote()
      expect(result.text).toBeTruthy()
    })
  })

  describe("refreshQuoteCache", () => {
    test("successfully refreshes cache from network", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [{ text: "New quote", source: "Author", length: 50, id: 1 }],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )

      const result = await refreshQuoteCache()
      expect(result.success).toBe(true)
    })

    test("returns failure on network error", async () => {
      global.fetch = mock(() => Promise.reject(new Error("Network error")))

      const result = await refreshQuoteCache()
      expect(result.success).toBe(false)
    })

    test("clears memory cache before refresh", async () => {
      // First, populate cache
      const mockQuotes1 = {
        language: "english",
        groups: [],
        quotes: [{ text: "Old quote", source: "Author", length: 50, id: 1 }],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes1), { status: 200 })
        )
      )

      await fetchMonkeyTypeQuotes()

      // Now refresh with new data
      const mockQuotes2 = {
        language: "english",
        groups: [],
        quotes: [{ text: "New quote", source: "Author", length: 50, id: 2 }],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes2), { status: 200 })
        )
      )

      await refreshQuoteCache()

      const result = await fetchMonkeyTypeQuotes()
      expect(result.quotes[0]?.id).toBe(2)
    })

    test("handles non-ok response during refresh", async () => {
      global.fetch = mock(() =>
        Promise.resolve(new Response("Server Error", { status: 500 }))
      )

      const result = await refreshQuoteCache()
      expect(result.success).toBe(false)
    })
  })

  describe("clearQuoteCache", () => {
    test("clears memory cache", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [{ text: "Test", source: "Author", length: 50, id: 1 }],
      }

      const mockFetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )
      global.fetch = mockFetch

      await fetchMonkeyTypeQuotes()
      clearQuoteCache()
      await fetchMonkeyTypeQuotes()

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    test("does not throw when cache is already empty", () => {
      expect(() => clearQuoteCache()).not.toThrow()
    })

    test("allows fresh fetch after clear", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [{ text: "Fresh", source: "Author", length: 50, id: 1 }],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )

      clearQuoteCache()
      const result = await fetchMonkeyTypeQuotes()

      expect(result.fromNetwork).toBe(true)
    })
  })

  describe("edge cases", () => {
    test("handles empty quotes array from API", async () => {
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ language: "english", groups: [], quotes: [] }),
            { status: 200 }
          )
        )
      )

      const result = await fetchMonkeyTypeQuotes()
      expect(result.quotes).toEqual([])
    })

    test("handles quotes with minimum length", async () => {
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [{ text: "Hi", source: "Author", length: 2, id: 1 }],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )

      const result = await getRandomMonkeyTypeQuote(1, 10)
      expect(result.text).toBe("Hi")
    })

    test("handles quotes with very large length", async () => {
      const longText = "a".repeat(1000)
      const mockQuotes = {
        language: "english",
        groups: [],
        quotes: [{ text: longText, source: "Author", length: 1000, id: 1 }],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockQuotes), { status: 200 })
        )
      )

      const result = await getRandomMonkeyTypeQuote(500, 1500)
      expect(result.text).toBe(longText)
    })

    test("handles timeout in fetch", async () => {
      global.fetch = mock(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 50)
        )
      )

      const result = await fetchMonkeyTypeQuotes()
      expect(result.quotes).toEqual([])
    })
  })
})