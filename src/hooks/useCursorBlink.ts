import { useEffect, useState } from "react"

export function useCursorBlink(active = true, intervalMs = 530): boolean {
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    if (!active) {
      // Keep cursor visible (static) when not active
      setCursorVisible(true)
      return
    }

    // Start with cursor visible
    setCursorVisible(true)

    const interval = setInterval(() => {
      setCursorVisible((prev: boolean) => !prev)
    }, intervalMs)

    return () => {
      clearInterval(interval)
    }
  }, [active, intervalMs])

  return cursorVisible
}
