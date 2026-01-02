import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { TypingTest } from "./components/TypingTest"
import { SettingsProvider } from "./context/SettingsContext"

const renderer = await createCliRenderer()
const root = createRoot(renderer)

root.render(
  <SettingsProvider>
    <TypingTest />
  </SettingsProvider>
)
