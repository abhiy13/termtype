import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { TypingTest } from "./components/TypingTest"
import { SettingsProvider } from "./context/SettingsContext"

const renderer = await createCliRenderer()
const root = createRoot(renderer)

const renderFatal = (title: string, details?: string) => {
  root.render(
    <box
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <text fg="#ca4754">{title}</text>
      {details && <text fg="#646669">{details}</text>}
      <text fg="#646669">Press Ctrl+C to exit.</text>
    </box>
  )
}

process.on("uncaughtException", (error) => {
  renderFatal("Unexpected error", error instanceof Error ? error.message : String(error))
})

process.on("unhandledRejection", (reason) => {
  renderFatal("Unhandled rejection", reason instanceof Error ? reason.message : String(reason))
})

root.render(
  <SettingsProvider>
    <TypingTest />
  </SettingsProvider>
)
