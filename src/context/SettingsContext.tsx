import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { homedir } from "os"
import { join } from "path"

export type TestMode = "words" | "quotes"
export type WordCount = 10 | 25 | 50 | 100
export type QuoteLength = "short" | "medium" | "long"

export interface Settings {
    mode: TestMode
    wordCount: WordCount
    quoteLength: QuoteLength
}

const DEFAULT_SETTINGS: Settings = {
    mode: "words",
    wordCount: 25,
    quoteLength: "medium",
}

const SETTINGS_DIR = join(homedir(), ".termtype")
const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json")

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

async function loadSettings(): Promise<Settings> {
    try {
        const file = Bun.file(SETTINGS_FILE)
        if (await file.exists()) {
            const data = await file.json() as Partial<Settings>
            return { ...DEFAULT_SETTINGS, ...data }
        }
    } catch {
        // Settings load failed, use defaults
    }
    return DEFAULT_SETTINGS
}

async function saveSettings(settings: Settings): Promise<void> {
    try {
        // Ensure directory exists
        const dir = Bun.file(SETTINGS_DIR)
        if (!(await dir.exists())) {
            await Bun.write(join(SETTINGS_DIR, ".keep"), "")
        }
        await Bun.write(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    } catch {
        // Settings save failed silently
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
