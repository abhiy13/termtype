import { useState, useEffect, useCallback, useRef } from "react"
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
import { FALLBACK_WORDS_TEXT } from "../constants/fallbacks"
import { ensureReadableColor, getMutedColor } from "../utils/colors"
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
  const requestIdRef = useRef(0)
  const isDev = process.env.NODE_ENV !== "production"
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  // Initial timer value - will be updated when test is active
  const [isActive, setIsActive] = useState(false)
  const currentTime = useTimer(isActive)

  const { userInput, cursorPosition, testState, metrics, userResetCount } = useTypingTest(
    text,
    currentTime,
    !paletteOpen
  )
  const cursorVisible = useCursorBlink(testState === "active")

  // Get quote length range based on setting
  const getQuoteLengthRange = useCallback(() => {
    switch (settings.quoteLength) {
      case "short":
        return { min: 30, max: 80 }
      case "medium":
        return { min: 60, max: 140 }
      case "long":
        return { min: 120, max: 250 }
      default:
        return { min: 40, max: 120 }
    }
  }, [settings.quoteLength])

  // Fetch new text based on settings
  const fetchNewText = useCallback(async () => {
    if (settingsLoading) return
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoading(true)
    try {
      if (settings.mode === "quotes") {
        const { min, max } = getQuoteLengthRange()
        const result = await getRandomMonkeyTypeQuote(min, max)
        if (result.text) {
          if (requestId === requestIdRef.current) {
            setText(result.text)
          }
        } else {
          if (requestId === requestIdRef.current) {
            setText(getRandomQuote())
          }
        }
      } else {
        const words = await generateRandomWords(settings.wordCount)
        if (requestId === requestIdRef.current) {
          setText(words)
        }
      }
    } catch {
      if (requestId === requestIdRef.current) {
        if (settings.mode === "quotes") {
          setText(getRandomQuote())
        } else {
          setText(FALLBACK_WORDS_TEXT)
        }
      }
    }
    if (requestId === requestIdRef.current) {
      setIsLoading(false)
    }
  }, [settings.mode, settings.wordCount, settings.quoteLength, settingsLoading, getQuoteLengthRange])

  // Fetch text on mount or settings change
  useEffect(() => {
    if (!settingsLoading) {
      fetchNewText()
    }
  }, [settingsLoading, settings.mode, settings.wordCount, settings.quoteLength, fetchNewText])

  // Sync timer active state with test state
  useEffect(() => {
    setIsActive(testState === "active")
  }, [testState])

  // Calculate progress percentage
  const progress =
    text.length > 0 ? Math.min(100, Math.round((userInput.length / text.length) * 100)) : 0

  // Get new text when user explicitly restarts
  useEffect(() => {
    if (!settingsLoading) {
      fetchNewText()
    }
  }, [userResetCount, settingsLoading, fetchNewText])

  // Handle ? key for command palette
  useKeyboard((key) => {
    if (testState === "idle" && key.sequence === "?" && !paletteOpen) {
      setPaletteOpen(true)
    }
  })

  useKeyboard((key) => {
    if (!isDev) return
    if (key.ctrl && key.name === "g") {
      setShowDiagnostics((prev) => !prev)
    }
  })

  const closePalette = () => setPaletteOpen(false)

  // Settings display text
  const settingsText =
    settings.mode === "words" ? `${settings.wordCount} words` : `${settings.quoteLength} quotes`
  const backgroundColor = settings.backgroundColor
  const primaryColor = ensureReadableColor(settings.fontColor, backgroundColor)
  const mutedColor = getMutedColor(primaryColor, backgroundColor, 0.55)

  // When palette is open, show settings screen instead of main UI
  if (paletteOpen) {
    return (
      <box
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor,
        }}
      >
        <box
          style={{
            padding: 1,
            border: true,
            borderColor: "#111214",
            backgroundColor,
          }}
        >
          <CommandPalette
            isOpen={true}
            settings={settings}
            onUpdateSettings={updateSettings}
            onClose={closePalette}
          />
        </box>
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
        backgroundColor,
      }}
    >
      <Header fontColor={primaryColor} subtitleColor={mutedColor} />

      <box style={{ flexDirection: "row", gap: 1 }}>
        <text fg={mutedColor}>{settingsText}</text>
        <text fg={mutedColor}>(? settings)</text>
      </box>

      <MetricsDisplay
        metrics={metrics}
        showErrors={testState === "active"}
        primaryColor={primaryColor}
        mutedColor={mutedColor}
      />

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
            correctColor={primaryColor}
            untypedColor={mutedColor}
            pausedColor={mutedColor}
            cursorTextColor={backgroundColor}
            cursorBgColor={primaryColor}
          />
        )}
      </box>

      <StatusMessage testState={testState} hintColor={mutedColor} />

      {isDev && showDiagnostics && (
        <box style={{ flexDirection: "column", gap: 0, alignItems: "center" }}>
          <text fg="#3c3e41">
            {`state=${testState} loading=${isLoading || settingsLoading} input=${userInput.length}/${
              text.length
            } req=${requestIdRef.current}`}
          </text>
          <text fg="#3c3e41">dev diagnostics (ctrl+g to toggle)</text>
        </box>
      )}

      <box style={{ height: 1 }}>
        {testState === "idle" && (
          <text fg={mutedColor}>? settings · esc restart</text>
        )}
        {testState === "active" && (
          <text fg={mutedColor}>esc pause · ctrl+c exit</text>
        )}
        {testState === "paused" && (
          <text fg={mutedColor}>esc resume · ctrl+c exit</text>
        )}
      </box>
    </box>
  )
}
