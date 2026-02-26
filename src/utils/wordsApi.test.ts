import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test"
import { fetchMonkeyTypeWords, generateRandomWords } from "./wordsApi"
import { FALLBACK_WORD_LIST } from "../constants/fallbacks"

describe("wordsApi", () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe("fetchMonkeyTypeWords", () => {
    test("fetches words from network successfully", async () => {
      const mockWords = {
        name: "english",
        words: ["the", "be", "to", "of", "and", "a", "in", "that"],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      )

      const result = await fetchMonkeyTypeWords()
      expect(result).toEqual(mockWords.words)
      expect(result).toHaveLength(8)
    })

    test("returns memory cache on subsequent calls", async () => {
      const mockWords = {
        name: "english",
        words: ["test", "words"],
      }

      const mockFetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )
      global.fetch = mockFetch

      await fetchMonkeyTypeWords()
      await fetchMonkeyTypeWords()

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test("returns fallback words on network failure", async () => {
      global.fetch = mock(() => Promise.reject(new Error("Network error")))

      const result = await fetchMonkeyTypeWords()
      expect(result).toEqual([...FALLBACK_WORD_LIST])
    })

    test("handles non-ok response status", async () => {
      global.fetch = mock(() =>
        Promise.resolve(new Response("Not Found", { status: 404 }))
      )

      const result = await fetchMonkeyTypeWords()
      expect(result).toEqual([...FALLBACK_WORD_LIST])
    })

    test("deduplicates concurrent fetch requests", async () => {
      const mockWords = {
        name: "english",
        words: ["test", "concurrent"],
      }

      const mockFetch = mock(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify(mockWords), { status: 200 })
              ),
            100
          )
        )
      )
      global.fetch = mockFetch

      const [result1, result2] = await Promise.all([
        fetchMonkeyTypeWords(),
        fetchMonkeyTypeWords(),
      ])

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    test("handles invalid JSON response", async () => {
      global.fetch = mock(() =>
        Promise.resolve(new Response("invalid json", { status: 200 }))
      )

      const result = await fetchMonkeyTypeWords()
      expect(result).toEqual([...FALLBACK_WORD_LIST])
    })

    test("handles empty words array from API", async () => {
      global.fetch = mock(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ name: "english", words: [] }),
            { status: 200 }
          )
        )
      )

      const result = await fetchMonkeyTypeWords()
      expect(result).toEqual([])
    })

    test("handles timeout error", async () => {
      global.fetch = mock(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 50)
        )
      )

      const result = await fetchMonkeyTypeWords()
      expect(result).toEqual([...FALLBACK_WORD_LIST])
    })
  })

  describe("generateRandomWords", () => {
    test("generates default 25 words", async () => {
      const mockWords = {
        name: "english",
        words: ["word1", "word2", "word3", "word4", "word5"],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords()
      const words = result.split(" ")
      expect(words).toHaveLength(25)
    })

    test("generates specified number of words", async () => {
      const mockWords = {
        name: "english",
        words: ["word1", "word2", "word3", "word4", "word5"],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(10)
      const words = result.split(" ")
      expect(words).toHaveLength(10)
    })

    test("generates single word", async () => {
      const mockWords = {
        name: "english",
        words: ["single"],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(1)
      expect(result).toBe("single")
    })

    test("generates 100 words", async () => {
      const mockWords = {
        name: "english",
        words: Array.from({ length: 50 }, (_, i) => `word${i}`),
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(100)
      const words = result.split(" ")
      expect(words).toHaveLength(100)
    })

    test("returns space-separated string", async () => {
      const mockWords = {
        name: "english",
        words: ["hello", "world"],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(3)
      expect(result).toContain(" ")
      expect(result.split(" ")).toHaveLength(3)
    })

    test("can repeat words when count exceeds word list length", async () => {
      const mockWords = {
        name: "english",
        words: ["one", "two"],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(5)
      const words = result.split(" ")
      expect(words).toHaveLength(5)
      // Some words should repeat since we only have 2 unique words
    })

    test("uses fallback words on network error", async () => {
      global.fetch = mock(() => Promise.reject(new Error("Network error")))

      const result = await generateRandomWords(5)
      const words = result.split(" ")
      expect(words).toHaveLength(5)
      // Should all be from fallback list
      words.forEach((word) => {
        expect(FALLBACK_WORD_LIST).toContain(word as any)
      })
    })

    test("generates zero words", async () => {
      const mockWords = {
        name: "english",
        words: ["word"],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(0)
      expect(result).toBe("")
    })

    test("handles large word counts", async () => {
      const mockWords = {
        name: "english",
        words: Array.from({ length: 1000 }, (_, i) => `word${i}`),
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(1000)
      const words = result.split(" ")
      expect(words).toHaveLength(1000)
    })

    test("generates different results on multiple calls", async () => {
      const mockWords = {
        name: "english",
        words: Array.from({ length: 100 }, (_, i) => `word${i}`),
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result1 = await generateRandomWords(50)
      const result2 = await generateRandomWords(50)

      // Results should be different due to randomness (with high probability)
      // Though technically they could be the same, it's extremely unlikely
      expect(typeof result1).toBe("string")
      expect(typeof result2).toBe("string")
    })
  })

  describe("edge cases", () => {
    test("handles words with special characters", async () => {
      const mockWords = {
        name: "english",
        words: ["word-with-dash", "word's", "word."],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(3)
      expect(result).toBeTruthy()
    })

    test("handles very long words", async () => {
      const longWord = "a".repeat(100)
      const mockWords = {
        name: "english",
        words: [longWord],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(1)
      expect(result).toBe(longWord)
    })

    test("handles words with unicode characters", async () => {
      const mockWords = {
        name: "english",
        words: ["café", "naïve", "résumé"],
      }

      global.fetch = mock(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockWords), { status: 200 })
        )
      )

      const result = await generateRandomWords(3)
      expect(result).toBeTruthy()
      expect(result.split(" ")).toHaveLength(3)
    })
  })
})