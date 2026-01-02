import { useState } from "react"
import { useKeyboard } from "@opentui/react"
import type { Settings, TestMode, WordCount, QuoteLength } from "../context/SettingsContext"

interface CommandPaletteProps {
  isOpen: boolean
  settings: Settings
  onUpdateSettings: (updates: Partial<Settings>) => void
  onClose: () => void
}

const COLORS = {
  bg: "#232323",
  border: "#E2B714",
  title: "#E2B714",
  label: "#646669",
  option: "#d1d0c5",
  active: "#E2B714",
  hint: "#3c3e41",
}

const WORD_COUNTS: WordCount[] = [10, 25, 50, 100]
const QUOTE_LENGTHS: QuoteLength[] = ["short", "medium", "long"]

type Section = "mode" | "wordCount" | "quoteLength"
const SECTIONS: Section[] = ["mode", "wordCount", "quoteLength"]

export function CommandPalette({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}: CommandPaletteProps) {
  const [activeSection, setActiveSection] = useState<number>(0)

  useKeyboard((key) => {
    if (!isOpen) return

    if (key.name === "escape") {
      onClose()
      return
    }

    // Navigate sections with up/down
    if (key.name === "up") {
      setActiveSection((prev) => Math.max(0, prev - 1))
      return
    }
    if (key.name === "down") {
      setActiveSection((prev) => Math.min(SECTIONS.length - 1, prev + 1))
      return
    }

    // Navigate options with left/right
    const section = SECTIONS[activeSection]
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

  const renderOption = (value: string, isActive: boolean, isSectionActive: boolean) => (
    <text
      fg={isSectionActive && isActive ? COLORS.active : isActive ? COLORS.option : COLORS.label}
    >
      {isActive ? `[${value}]` : ` ${value} `}
    </text>
  )

  return (
    <box
      style={{
        flexDirection: "column",
        border: true,
        borderColor: COLORS.border,
        padding: 2,
        gap: 1,
        width: 50,
      }}
    >
      <text fg={COLORS.title}>⚙ Settings</text>

      {/* Mode */}
      <box style={{ flexDirection: "column", gap: 0 }}>
        <text fg={activeSection === 0 ? COLORS.active : COLORS.label}>
          {activeSection === 0 ? "▸ " : "  "}mode
        </text>
        <box style={{ flexDirection: "row", gap: 1, paddingLeft: 4 }}>
          {renderOption("words", settings.mode === "words", activeSection === 0)}
          {renderOption("quotes", settings.mode === "quotes", activeSection === 0)}
        </box>
      </box>

      {/* Word Count (only show if mode is words) */}
      {settings.mode === "words" && (
        <box style={{ flexDirection: "column", gap: 0 }}>
          <text fg={activeSection === 1 ? COLORS.active : COLORS.label}>
            {activeSection === 1 ? "▸ " : "  "}word count
          </text>
          <box style={{ flexDirection: "row", gap: 1, paddingLeft: 4 }}>
            {WORD_COUNTS.map((count) => (
              <text
                key={count}
                fg={
                  activeSection === 1 && settings.wordCount === count
                    ? COLORS.active
                    : settings.wordCount === count
                      ? COLORS.option
                      : COLORS.label
                }
              >
                {settings.wordCount === count ? `[${count}]` : ` ${count} `}
              </text>
            ))}
          </box>
        </box>
      )}

      {/* Quote Length (only show if mode is quotes) */}
      {settings.mode === "quotes" && (
        <box style={{ flexDirection: "column", gap: 0 }}>
          <text fg={activeSection === 2 ? COLORS.active : COLORS.label}>
            {activeSection === 2 ? "▸ " : "  "}quote length
          </text>
          <box style={{ flexDirection: "row", gap: 1, paddingLeft: 4 }}>
            {QUOTE_LENGTHS.map((len) => (
              <text
                key={len}
                fg={
                  activeSection === 2 && settings.quoteLength === len
                    ? COLORS.active
                    : settings.quoteLength === len
                      ? COLORS.option
                      : COLORS.label
                }
              >
                {settings.quoteLength === len ? `[${len}]` : ` ${len} `}
              </text>
            ))}
          </box>
        </box>
      )}

      <text fg={COLORS.hint}>↑↓ navigate · ←→ change · esc close</text>
    </box>
  )
}
