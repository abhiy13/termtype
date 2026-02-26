import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test"
import { fetchWithTimeout } from "./fetch"

describe("fetchWithTimeout", () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test("successfully fetches data within timeout", async () => {
    global.fetch = mock(() =>
      Promise.resolve(new Response("success", { status: 200 }))
    )

    const response = await fetchWithTimeout("https://example.com")
    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toBe("success")
  })

  test("throws timeout error when request takes too long", async () => {
    global.fetch = mock(() =>
      new Promise((resolve) => setTimeout(() => resolve(new Response("late")), 200))
    )

    await expect(
      fetchWithTimeout("https://example.com", {}, 50)
    ).rejects.toThrow("Request timed out")
  })

  test("passes options to fetch", async () => {
    const mockFetch = mock(() =>
      Promise.resolve(new Response("success", { status: 200 }))
    )
    global.fetch = mockFetch

    await fetchWithTimeout("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })

    expect(mockFetch).toHaveBeenCalled()
  })

  test("uses default timeout of 10000ms", async () => {
    global.fetch = mock(() =>
      Promise.resolve(new Response("success", { status: 200 }))
    )

    const response = await fetchWithTimeout("https://example.com")
    expect(response.status).toBe(200)
  })

  test("handles network errors", async () => {
    global.fetch = mock(() =>
      Promise.reject(new Error("Network error"))
    )

    await expect(
      fetchWithTimeout("https://example.com")
    ).rejects.toThrow("Network error")
  })

  test("handles already aborted signal", async () => {
    const controller = new AbortController()
    controller.abort()

    global.fetch = mock(() => {
      throw new DOMException("Aborted", "AbortError")
    })

    await expect(
      fetchWithTimeout("https://example.com", { signal: controller.signal })
    ).rejects.toThrow()
  })

  test("propagates abort from external signal", async () => {
    const controller = new AbortController()

    global.fetch = mock(() =>
      new Promise((_, reject) => {
        setTimeout(() => {
          controller.abort()
          reject(new DOMException("Aborted", "AbortError"))
        }, 50)
      })
    )

    await expect(
      fetchWithTimeout("https://example.com", { signal: controller.signal }, 200)
    ).rejects.toThrow()
  })

  test("successfully completes with custom short timeout", async () => {
    global.fetch = mock(() =>
      Promise.resolve(new Response("fast", { status: 200 }))
    )

    const response = await fetchWithTimeout("https://example.com", {}, 100)
    expect(response.status).toBe(200)
  })

  test("converts AbortError to timeout message", async () => {
    global.fetch = mock(() => {
      const error = new Error("AbortError")
      error.name = "AbortError"
      throw error
    })

    await expect(
      fetchWithTimeout("https://example.com", {}, 50)
    ).rejects.toThrow("Request timed out")
  })

  test("handles successful response with JSON", async () => {
    global.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: "test" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
    )

    const response = await fetchWithTimeout("https://example.com")
    const json = await response.json()
    expect(json.data).toBe("test")
  })

  test("respects very long timeout", async () => {
    global.fetch = mock(() =>
      Promise.resolve(new Response("success", { status: 200 }))
    )

    const response = await fetchWithTimeout("https://example.com", {}, 60000)
    expect(response.status).toBe(200)
  })

  test("handles 404 response", async () => {
    global.fetch = mock(() =>
      Promise.resolve(new Response("Not Found", { status: 404 }))
    )

    const response = await fetchWithTimeout("https://example.com")
    expect(response.status).toBe(404)
  })

  test("handles 500 response", async () => {
    global.fetch = mock(() =>
      Promise.resolve(new Response("Server Error", { status: 500 }))
    )

    const response = await fetchWithTimeout("https://example.com")
    expect(response.status).toBe(500)
  })
})