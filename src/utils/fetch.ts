export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort()
    } else {
      options.signal.addEventListener("abort", () => controller.abort(), { once: true })
    }
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out")
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
