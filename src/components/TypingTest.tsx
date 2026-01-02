import { useState, useEffect, useCallback } from "react"
import { useKeyboard } from "@opentui/react"
import { useTimer } from "../hooks/useTimer"
import { useCursorBlink } from "../hooks/useCursorBlink"
import { useTypingTest } from "../hooks/useTypingTest"
import { QuoteDisplay } from "./QuoteDisplay"
import { MetricsDisplay } from "./MetricsDisplay"
import { StatusMessage } from "./StatusMessage"
import { ProgressBar } from "./ProgressBar"
import { Header } from "./Header"
import { CommandPalette } from "./CommandPalette"
import { useSettings } from "../context/SettingsContext"
import { getRandomQuote } from "../constants/quotes"
import { getRandomMonkeyTypeQuote } from "../utils/monkeyTypeApi"
import { generateRandomWords } from "../utils/wordsApi"

export function TypingTest() {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings()

  // Quote/text state with loading indicator
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Command palette state
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Initial timer value - will be updated when test is active
  const [isActive, setIsActive] = useState(false)
  const currentTime = useTimer(isActive)

  const { userInput, cursorPosition, testState, metrics } = useTypingTest(text, currentTime)
  const cursorVisible = useCursorBlink(testState === "active")

  // Get quote length range based on setting
  const getQuoteLengthRange = () => {
    switch (settings.quoteLength) {
      case "short": return { min: 30, max: 80 }
      case "medium": return { min: 60, max: 140 }
      case "long": return { min: 120, max: 250 }
      default: return { min: 40, max: 120 }
    }
  }

  // Fetch new text based on settings
  const fetchNewText = useCallback(async () => {
    if (settingsLoading) return
    setIsLoading(true)
    try {
      if (settings.mode === "quotes") {
        const { min, max } = getQuoteLengthRange()
        const result = await getRandomMonkeyTypeQuote(min, max)
        if (result.text) {
          setText(result.text)
        } else {
          setText(getRandomQuote())
        }
      } else {
        const words = await generateRandomWords(settings.wordCount)
        setText(words)
      }
    } catch {
      if (settings.mode === "quotes") {
        setText(getRandomQuote())
      } else {
        setText("the be to of and a in that have it for not on with as you do at")
      }
    }
    setIsLoading(false)
  }, [settings.mode, settings.wordCount, settings.quoteLength, settingsLoading])

  // Fetch initial text on mount or when settings change
  useEffect(() => {
    if (!settingsLoading) {
      fetchNewText()
    }
  }, [settingsLoading])

  // Refetch when settings change (only when idle)
  useEffect(() => {
    if (testState === "idle" && !settingsLoading) {
      fetchNewText()
    }
  }, [settings.mode, settings.wordCount, settings.quoteLength])

  // Sync timer active state with test state
  useEffect(() => {
    setIsActive(testState === "active")
  }, [testState])

  // Calculate progress percentage
  const progress = text.length > 0 ? Math.round((userInput.length / text.length) * 100) : 0

  // Get new text when test restarts
  useEffect(() => {
    if (testState === "idle" && userInput === "" && !isLoading && text !== "" && !settingsLoading) {
      fetchNewText()
    }
  }, [testState, userInput])

  // Handle ? key for command palette
  useKeyboard((key) => {
    if (testState === "idle" && key.sequence === "?" && !paletteOpen) {
      setPaletteOpen(true)
    }
  })

  const closePalette = () => setPaletteOpen(false)

  // Settings display text
  const settingsText = settings.mode === "words"
    ? `${settings.wordCount} words`
    : `${settings.quoteLength} quotes`

  // When palette is open, show settings screen instead of main UI
  if (paletteOpen) {
    return (
      <box
        style={{
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <CommandPalette
          isOpen={true}
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={closePalette}
        />
      </box>
    )
  }

  return (
    <box
      style={{
        flexDirection: "column",
        gap: 2,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <Header />

      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg="#646669">{settingsText}</text>
        <text fg="#3c3e41">(? settings)</text>
      </box>

      <MetricsDisplay metrics={metrics} showErrors={testState === "active"} />

      <ProgressBar progress={progress} width={50} />

      <box
        style={{
          border: true,
          borderColor: "#2c2e31",
          padding: 2,
          width: "80%",
          height: 7,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isLoading || settingsLoading ? (
          <text fg="#646669">loading...</text>
        ) : (
          <QuoteDisplay
            quote={text}
            userInput={userInput}
            cursorPosition={cursorPosition}
            cursorVisible={cursorVisible}
            isPaused={testState === "paused"}
          />
        )}
      </box>

      <StatusMessage testState={testState} />

      <box style={{ height: 1 }}>
        {testState === "idle" && (
          <text fg="#3c3e41">? settings · esc restart</text>
        )}
        {testState === "active" && (
          <text fg="#3c3e41">esc pause · ctrl+c exit</text>
        )}
        {testState === "paused" && (
          <text fg="#3c3e41">esc resume · ctrl+c exit</text>
        )}
      </box>
    </box>
  )
}
