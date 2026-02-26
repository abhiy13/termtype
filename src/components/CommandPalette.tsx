import { useState, useEffect, useMemo } from "react"
import { useKeyboard } from "@opentui/react"
import type { SelectOption } from "@opentui/core"
import type { Settings, TestMode, WordCount, QuoteLength } from "../context/SettingsContext"
import { ensureReadableColor, getMutedColor, blendColors } from "../utils/colors"

interface CommandPaletteProps {
  isOpen: boolean
  settings: Settings
  onUpdateSettings: (updates: Partial<Settings>) => void
  onClose: () => void
}

const COLORS = {
  border: "#E2B714",
  active: "#E2B714",
  hint: "#3c3e41",
  description: "#646669",
}

const WORD_COUNTS: WordCount[] = [10, 25, 50, 100]
const QUOTE_LENGTHS: QuoteLength[] = ["short", "medium", "long"]

type Section = "mode" | "wordCount" | "quoteLength" | "theme"

export function CommandPalette({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}: CommandPaletteProps) {
  const [activeSection, setActiveSection] = useState<number>(0)
  const sections: Section[] =
    settings.mode === "words"
      ? ["mode", "wordCount", "theme"]
      : ["mode", "quoteLength", "theme"]
  const themeIndex = sections.indexOf("theme")
  const [themeField, setThemeField] = useState<"font" | "background">("font")
  const [focusMode, setFocusMode] = useState<"list" | "theme">("list")
  const [fontInput, setFontInput] = useState(settings.fontColor)
  const [backgroundInput, setBackgroundInput] = useState(settings.backgroundColor)
  const isThemeActive = activeSection === themeIndex

  useEffect(() => {
    setFontInput(settings.fontColor)
    setBackgroundInput(settings.backgroundColor)
  }, [settings.fontColor, settings.backgroundColor])

  useEffect(() => {
    setFocusMode(isThemeActive ? "theme" : "list")
  }, [isThemeActive])

  useEffect(() => {
    if (activeSection >= sections.length) {
      setActiveSection(sections.length - 1)
    }
  }, [activeSection, sections.length])

  useKeyboard((key) => {
    if (!isOpen) return

    if (key.name === "escape") {
      onClose()
      return
    }

    if (key.name === "tab" && isThemeActive) {
      setFocusMode((prev) => (prev === "list" ? "theme" : "list"))
      return
    }

    const section = sections[activeSection]
    if (section === "theme" && focusMode === "theme") {
      if (key.name === "up" || key.name === "down") {
        setThemeField((prev) => (prev === "font" ? "background" : "font"))
      }
      return
    }

    if (key.name === "left" || key.name === "right") {
      const direction = key.name === "left" ? -1 : 1

      if (section === "mode") {
        const modes: TestMode[] = ["words", "quotes"]
        const currentIdx = modes.indexOf(settings.mode)
        const nextIdx = (currentIdx + direction + modes.length) % modes.length
        onUpdateSettings({ mode: modes[nextIdx] })
      } else if (section === "wordCount") {
        const currentIdx = WORD_COUNTS.indexOf(settings.wordCount)
        const nextIdx = (currentIdx + direction + WORD_COUNTS.length) % WORD_COUNTS.length
        onUpdateSettings({ wordCount: WORD_COUNTS[nextIdx] })
      } else if (section === "quoteLength") {
        const currentIdx = QUOTE_LENGTHS.indexOf(settings.quoteLength)
        const nextIdx = (currentIdx + direction + QUOTE_LENGTHS.length) % QUOTE_LENGTHS.length
        onUpdateSettings({ quoteLength: QUOTE_LENGTHS[nextIdx] })
      }
    }
  })

  if (!isOpen) return null

  const options = useMemo<SelectOption[]>(() => {
    const modeText = settings.mode === "words" ? "words" : "quotes"
    if (settings.mode === "words") {
      return [
        { name: "mode", description: modeText, value: "mode" },
        { name: "word count", description: String(settings.wordCount), value: "wordCount" },
        { name: "theme", description: "font + background", value: "theme" },
      ]
    }
    return [
      { name: "mode", description: modeText, value: "mode" },
      { name: "quote length", description: settings.quoteLength, value: "quoteLength" },
      { name: "theme", description: "font + background", value: "theme" },
    ]
  }, [settings.mode, settings.wordCount, settings.quoteLength])

  const paletteBg = settings.backgroundColor
  const paletteText = ensureReadableColor(settings.fontColor, paletteBg)
  const paletteMuted = getMutedColor(paletteText, paletteBg, 0.5)
  const selectedBg = blendColors(paletteText, paletteBg, 0.2)

  return (
    <box
      style={{
        flexDirection: "column",
        border: true,
        borderColor: COLORS.border,
        padding: 2,
        gap: 2,
        width: 56,
        backgroundColor: paletteBg,
      }}
    >
      <text fg={COLORS.active}>⚙ Settings</text>
      <select
        focused={focusMode === "list"}
        options={options}
        selectedIndex={activeSection}
        onChange={(index) => {
          if (index !== null && index >= 0) {
            setActiveSection(index)
          }
        }}
        showDescription={true}
        itemSpacing={1}
        style={{ height: 6 }}
        backgroundColor={paletteBg}
        textColor={paletteText}
        focusedBackgroundColor="#2c2e31"
        focusedTextColor={paletteText}
        selectedBackgroundColor={selectedBg}
        selectedTextColor={COLORS.active}
        descriptionColor={paletteMuted}
        selectedDescriptionColor={COLORS.active}
        wrapSelection={true}
        showScrollIndicator={false}
      />

      {isThemeActive && (
        <box style={{ flexDirection: "column", gap: 1 }}>
          <box style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
            <text fg={themeField === "font" ? COLORS.active : paletteText}>font</text>
            <input
              focused={focusMode === "theme" && themeField === "font"}
              value={fontInput}
              placeholder="#d1d0c5"
              onChange={(value) => setFontInput(value)}
              onSubmit={(value) => {
                const next = value.trim()
                if (next.length > 0) {
                  onUpdateSettings({ fontColor: next })
                }
              }}
              backgroundColor={paletteBg}
              textColor={paletteText}
              focusedBackgroundColor="#2c2e31"
              focusedTextColor={paletteText}
              placeholderColor={paletteMuted}
              cursorColor={COLORS.active}
            />
          </box>
          <box style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
            <text fg={themeField === "background" ? COLORS.active : paletteText}>bg</text>
            <input
              focused={focusMode === "theme" && themeField === "background"}
              value={backgroundInput}
              placeholder="#232323"
              onChange={(value) => setBackgroundInput(value)}
              onSubmit={(value) => {
                const next = value.trim()
                if (next.length > 0) {
                  onUpdateSettings({ backgroundColor: next })
                }
              }}
              backgroundColor={paletteBg}
              textColor={paletteText}
              focusedBackgroundColor="#2c2e31"
              focusedTextColor={paletteText}
              placeholderColor={paletteMuted}
              cursorColor={COLORS.active}
            />
          </box>
          <text fg={paletteMuted}>type a color (hex or name) · enter to apply</text>
        </box>
      )}

      <text fg={paletteMuted}>
        {isThemeActive
          ? "tab to switch list/inputs · ↑↓ field · esc close"
          : "↑↓ navigate · ←→ change · esc close"}
      </text>
    </box>
  )
}
