// MonkeyType quotes API service
// Fetches quotes from the MonkeyType GitHub repository with persistent caching

import { homedir } from "os"
import { join } from "path"

const QUOTES_URL =
  "https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/quotes/english.json"
const CACHE_DIR = join(homedir(), ".termtype")
const CACHE_FILE = join(CACHE_DIR, "quotes-cache.json")
const CACHE_EXPIRY_MS = 3 * 60 * 60 * 1000 // 3 hours in milliseconds

interface MonkeyTypeQuote {
  text: string
  source: string
  length: number
  id: number
}

interface QuotesResponse {
  language: string
  groups: number[][]
  quotes: MonkeyTypeQuote[]
}

interface CacheData {
  timestamp: number
  quotes: MonkeyTypeQuote[]
}

// In-memory cache for current session
let memoryCache: MonkeyTypeQuote[] | null = null
let fetchPromise: Promise<{ quotes: MonkeyTypeQuote[]; fromNetwork: boolean }> | null = null

async function ensureCacheDir(): Promise<void> {
  try {
    const dir = Bun.file(CACHE_DIR)
    if (!(await dir.exists())) {
      await Bun.write(join(CACHE_DIR, ".keep"), "")
    }
  } catch {
    // Ignore errors - we'll just fetch fresh
  }
}

async function readCache(): Promise<CacheData | null> {
  try {
    const file = Bun.file(CACHE_FILE)
    if (await file.exists()) {
      const data = (await file.json()) as CacheData
      return data
    }
  } catch {
    // Cache read failed, return null
  }
  return null
}

async function writeCache(quotes: MonkeyTypeQuote[]): Promise<void> {
  try {
    await ensureCacheDir()
    const cacheData: CacheData = {
      timestamp: Date.now(),
      quotes,
    }
    await Bun.write(CACHE_FILE, JSON.stringify(cacheData))
  } catch {
    // Cache write failed, continue without caching
  }
}

function isCacheValid(cache: CacheData): boolean {
  const age = Date.now() - cache.timestamp
  return age < CACHE_EXPIRY_MS
}

export async function fetchMonkeyTypeQuotes(): Promise<{
  quotes: MonkeyTypeQuote[]
  fromNetwork: boolean
}> {
  // Return memory cache if available
  if (memoryCache) {
    return { quotes: memoryCache, fromNetwork: false }
  }

  // Return existing fetch promise if one is in progress
  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = (async () => {
    // Try to read from disk cache first
    const diskCache = await readCache()
    if (diskCache && isCacheValid(diskCache)) {
      memoryCache = diskCache.quotes
      return { quotes: memoryCache, fromNetwork: false }
    }

    // Fetch from network
    try {
      const response = await fetch(QUOTES_URL)
      if (!response.ok) {
        throw new Error(`Failed to fetch quotes: ${response.status}`)
      }
      const data = (await response.json()) as QuotesResponse
      memoryCache = data.quotes

      // Save to disk cache
      await writeCache(memoryCache)

      return { quotes: memoryCache, fromNetwork: true }
    } catch (error) {
      console.error("Error fetching MonkeyType quotes:", error)

      // If we have an expired cache, use it as fallback
      if (diskCache) {
        memoryCache = diskCache.quotes
        return { quotes: memoryCache, fromNetwork: false }
      }

      return { quotes: [], fromNetwork: false }
    } finally {
      fetchPromise = null
    }
  })()

  return fetchPromise
}

export async function getRandomMonkeyTypeQuote(
  minLength = 30,
  maxLength = 150
): Promise<{ text: string | null; isLoading: boolean }> {
  const { quotes, fromNetwork } = await fetchMonkeyTypeQuotes()

  if (quotes.length === 0) {
    return { text: null, isLoading: false }
  }

  // Filter quotes by length for better typing experience
  const filteredQuotes = quotes.filter((q) => q.length >= minLength && q.length <= maxLength)

  if (filteredQuotes.length === 0) {
    // Fallback to any quote if no matches
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return { text: quotes[randomIndex]!.text, isLoading: fromNetwork }
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length)
  return { text: filteredQuotes[randomIndex]!.text, isLoading: fromNetwork }
}

// Force refresh cache from network
export async function refreshQuoteCache(): Promise<{ success: boolean }> {
  memoryCache = null
  try {
    const response = await fetch(QUOTES_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch quotes: ${response.status}`)
    }
    const data = (await response.json()) as QuotesResponse
    memoryCache = data.quotes
    await writeCache(memoryCache)
    return { success: true }
  } catch {
    return { success: false }
  }
}

// Clear all caches (useful for testing)
export function clearQuoteCache(): void {
  memoryCache = null
  fetchPromise = null
}
