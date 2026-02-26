import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { homedir } from "os"
import { join } from "path"
import { ensureDir } from "../utils/fs"
import { logError } from "../utils/logger"

export type TestMode = "words" | "quotes"
export type WordCount = 10 | 25 | 50 | 100
export type QuoteLength = "short" | "medium" | "long"

export interface Settings {
  mode: TestMode
  wordCount: WordCount
  quoteLength: QuoteLength
  fontColor: string
  backgroundColor: string
}

const DEFAULT_SETTINGS: Settings = {
  mode: "words",
  wordCount: 25,
  quoteLength: "medium",
  fontColor: "#d1d0c5",
  backgroundColor: "#232323",
}

const SETTINGS_DIR = join(homedir(), ".termtype")
const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json")
const VALID_WORD_COUNTS: WordCount[] = [10, 25, 50, 100]
const VALID_QUOTE_LENGTHS: QuoteLength[] = ["short", "medium", "long"]

interface SettingsContextValue {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

function validateSettings(data: unknown): Settings {
  if (!data || typeof data !== "object") {
    return DEFAULT_SETTINGS
  }

  const partial = data as Partial<Settings>
  const mode = partial.mode === "words" || partial.mode === "quotes" ? partial.mode : DEFAULT_SETTINGS.mode
  const wordCount = VALID_WORD_COUNTS.includes(partial.wordCount as WordCount)
    ? (partial.wordCount as WordCount)
    : DEFAULT_SETTINGS.wordCount
  const quoteLength = VALID_QUOTE_LENGTHS.includes(partial.quoteLength as QuoteLength)
    ? (partial.quoteLength as QuoteLength)
    : DEFAULT_SETTINGS.quoteLength
  const fontColor =
    typeof partial.fontColor === "string" && partial.fontColor.trim().length > 0
      ? partial.fontColor.trim()
      : DEFAULT_SETTINGS.fontColor
  const backgroundColor =
    typeof partial.backgroundColor === "string" && partial.backgroundColor.trim().length > 0
      ? partial.backgroundColor.trim()
      : DEFAULT_SETTINGS.backgroundColor

  return { mode, wordCount, quoteLength, fontColor, backgroundColor }
}

async function loadSettings(): Promise<Settings> {
  try {
    const file = Bun.file(SETTINGS_FILE)
    if (await file.exists()) {
      const data = await file.json()
      return validateSettings(data)
    }
  } catch (error) {
    logError("Failed to load settings", error)
  }
  return DEFAULT_SETTINGS
}

async function saveSettings(settings: Settings): Promise<void> {
  try {
    await ensureDir(SETTINGS_DIR)
    await Bun.write(SETTINGS_FILE, JSON.stringify(settings, null, 2))
  } catch (error) {
    logError("Failed to save settings", error)
  }
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    loadSettings().then((loaded) => {
      setSettings(loaded)
      setIsLoading(false)
    })
  }, [])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates }
      saveSettings(next)
      return next
    })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}
