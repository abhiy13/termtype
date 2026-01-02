export const QUOTES = [
  "The quick brown fox jumps over the lazy dog",
  "To be or not to be that is the question",
  "All that glitters is not gold",
  "A journey of a thousand miles begins with a single step",
  "The only thing we have to fear is fear itself",
  "In the middle of difficulty lies opportunity",
  "Stay hungry stay foolish",
  "The best way to predict the future is to create it",
  "Code is poetry written for machines to dance",
  "Simple things should be simple complex things should be possible",
  "Make it work make it right make it fast",
  "First solve the problem then write the code",
  "Programming is thinking not typing",
  "Good code is its own best documentation",
] as const

export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]!
}

export const DEFAULT_QUOTE = QUOTES[0]
