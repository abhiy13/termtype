const isDev = process.env.NODE_ENV !== "production"

export function logError(message: string, error?: unknown): void {
  if (!isDev) return
  if (error) {
    console.error(message, error)
  } else {
    console.error(message)
  }
}
