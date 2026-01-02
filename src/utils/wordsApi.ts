// MonkeyType words API service
// Fetches random words from the MonkeyType GitHub repository

import { homedir } from "os"
import { join } from "path"

const WORDS_URL = "https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/english.json"
const CACHE_DIR = join(homedir(), ".termtype")
const WORDS_CACHE_FILE = join(CACHE_DIR, "words-cache.json")
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours for words (they don't change often)

interface WordsResponse {
    name: string
    noLazyMode?: boolean
    orderedByFrequency?: boolean
    words: string[]
}

interface WordsCacheData {
    timestamp: number
    words: string[]
}

let memoryWordsCache: string[] | null = null
let wordsFetchPromise: Promise<string[]> | null = null

async function readWordsCache(): Promise<WordsCacheData | null> {
    try {
        const file = Bun.file(WORDS_CACHE_FILE)
        if (await file.exists()) {
            const data = await file.json() as WordsCacheData
            return data
        }
    } catch {
        // Cache read failed
    }
    return null
}

async function writeWordsCache(words: string[]): Promise<void> {
    try {
        const cacheData: WordsCacheData = {
            timestamp: Date.now(),
            words,
        }
        await Bun.write(WORDS_CACHE_FILE, JSON.stringify(cacheData))
    } catch {
        // Cache write failed
    }
}

function isWordsCacheValid(cache: WordsCacheData): boolean {
    const age = Date.now() - cache.timestamp
    return age < CACHE_EXPIRY_MS
}

export async function fetchMonkeyTypeWords(): Promise<string[]> {
    if (memoryWordsCache) {
        return memoryWordsCache
    }

    if (wordsFetchPromise) {
        return wordsFetchPromise
    }

    wordsFetchPromise = (async () => {
        // Try disk cache first
        const diskCache = await readWordsCache()
        if (diskCache && isWordsCacheValid(diskCache)) {
            memoryWordsCache = diskCache.words
            return memoryWordsCache
        }

        // Fetch from network
        try {
            const response = await fetch(WORDS_URL)
            if (!response.ok) {
                throw new Error(`Failed to fetch words: ${response.status}`)
            }
            const data = await response.json() as WordsResponse
            memoryWordsCache = data.words
            await writeWordsCache(memoryWordsCache)
            return memoryWordsCache
        } catch (error) {
            console.error("Error fetching MonkeyType words:", error)

            // Use expired cache as fallback
            if (diskCache) {
                memoryWordsCache = diskCache.words
                return memoryWordsCache
            }

            // Fallback to basic word list
            return ["the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this"]
        } finally {
            wordsFetchPromise = null
        }
    })()

    return wordsFetchPromise
}

export async function generateRandomWords(wordCount = 25): Promise<string> {
    const words = await fetchMonkeyTypeWords()
    const selectedWords: string[] = []

    for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * words.length)
        selectedWords.push(words[randomIndex]!)
    }

    return selectedWords.join(" ")
}
