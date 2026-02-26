type RGB = { r: number; g: number; b: number }

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeHex(hex: string): string | null {
  const value = hex.trim().toLowerCase()
  if (!value.startsWith("#")) return null
  if (value.length === 4) {
    const r = value[1]
    const g = value[2]
    const b = value[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  if (value.length === 7) return value
  return null
}

function parseHexColor(hex: string): RGB | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const r = Number.parseInt(normalized.slice(1, 3), 16)
  const g = Number.parseInt(normalized.slice(3, 5), 16)
  const b = Number.parseInt(normalized.slice(5, 7), 16)
  return { r, g, b }
}

function relativeLuminance({ r, g, b }: RGB): number {
  const toLinear = (channel: number) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const rL = toLinear(r)
  const gL = toLinear(g)
  const bL = toLinear(b)
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL
}

function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getReadableTextColor(
  backgroundColor: string,
  light = "#f5f5f5",
  dark = "#1a1a1a"
): string {
  const bg = parseHexColor(backgroundColor)
  if (!bg) return light
  const lightRgb = parseHexColor(light)
  const darkRgb = parseHexColor(dark)
  if (!lightRgb || !darkRgb) return light
  return contrastRatio(bg, lightRgb) >= contrastRatio(bg, darkRgb) ? light : dark
}

export function ensureReadableColor(
  preferredColor: string,
  backgroundColor: string,
  minimumContrast = 3.5
): string {
  const fg = parseHexColor(preferredColor)
  const bg = parseHexColor(backgroundColor)
  if (!fg || !bg) return preferredColor
  return contrastRatio(fg, bg) >= minimumContrast
    ? preferredColor
    : getReadableTextColor(backgroundColor)
}

export function blendColors(foreground: string, background: string, ratio = 0.6): string {
  const fg = parseHexColor(foreground)
  const bg = parseHexColor(background)
  if (!fg || !bg) return foreground
  const weight = Math.min(1, Math.max(0, ratio))
  const r = clamp(Math.round(fg.r * weight + bg.r * (1 - weight)))
  const g = clamp(Math.round(fg.g * weight + bg.g * (1 - weight)))
  const b = clamp(Math.round(fg.b * weight + bg.b * (1 - weight)))
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`
}

export function getMutedColor(foreground: string, background: string, ratio = 0.5): string {
  const fg = parseHexColor(foreground)
  const bg = parseHexColor(background)
  if (!fg || !bg) return foreground
  return blendColors(foreground, background, ratio)
}
