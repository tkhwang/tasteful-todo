/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface Rgb {
  readonly red: number
  readonly green: number
  readonly blue: number
}

interface Oklab {
  readonly lightness: number
  readonly a: number
  readonly b: number
}

const stylesheet = readFileSync(resolve('src/styles/tokens.css'), 'utf8')
const rootBlocks = stylesheet.match(/:root\s*\{[^}]*\}/g)
if (rootBlocks === null || rootBlocks[0] === undefined || rootBlocks[1] === undefined) {
  throw new TypeError('Expected light and dark :root token blocks')
}
const lightTokens = rootBlocks[0]
const darkTokens = rootBlocks[1]

function token(block: string, name: string): string {
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6});`))
  const value = match?.[1]
  if (value === undefined) {
    throw new TypeError(`Expected --${name} in token block`)
  }
  return value.toUpperCase()
}

function tokenReference(block: string, name: string): string {
  const match = block.match(new RegExp(`--${name}:\\s*var\\(--([a-z0-9-]+)\\);`))
  const value = match?.[1]
  if (value === undefined) {
    throw new TypeError(`Expected --${name} token reference`)
  }
  return value
}

function rgb(hex: string): Rgb {
  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    throw new TypeError(`Expected six-digit hex color, received ${hex}`)
  }
  return {
    red: Number.parseInt(hex.slice(1, 3), 16) / 255,
    green: Number.parseInt(hex.slice(3, 5), 16) / 255,
    blue: Number.parseInt(hex.slice(5, 7), 16) / 255,
  }
}

function channelLuminance(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

function luminance(color: Rgb): number {
  return (
    0.2126 * channelLuminance(color.red) +
    0.7152 * channelLuminance(color.green) +
    0.0722 * channelLuminance(color.blue)
  )
}

function contrast(foreground: Rgb, background: Rgb): number {
  const foregroundLuminance = luminance(foreground)
  const backgroundLuminance = luminance(background)
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  )
}

function composite(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  return {
    red: foreground.red * alpha + background.red * (1 - alpha),
    green: foreground.green * alpha + background.green * (1 - alpha),
    blue: foreground.blue * alpha + background.blue * (1 - alpha),
  }
}

function toOklab(color: Rgb): Oklab {
  const red = channelLuminance(color.red)
  const green = channelLuminance(color.green)
  const blue = channelLuminance(color.blue)
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)
  return {
    lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function fromLinear(channel: number): number {
  const clamped = Math.min(1, Math.max(0, channel))
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * clamped ** (1 / 2.4) - 0.055
}

function fromOklab(color: Oklab): Rgb {
  const lRoot = color.lightness + 0.3963377774 * color.a + 0.2158037573 * color.b
  const mRoot = color.lightness - 0.1055613458 * color.a - 0.0638541728 * color.b
  const sRoot = color.lightness - 0.0894841775 * color.a - 1.291485548 * color.b
  const l = lRoot ** 3
  const m = mRoot ** 3
  const s = sRoot ** 3
  return {
    red: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    green: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    blue: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  }
}

function mixOklab(foreground: Rgb, background: Rgb, foregroundWeight: number): Rgb {
  const foregroundLab = toOklab(foreground)
  const backgroundLab = toOklab(background)
  return fromOklab({
    lightness:
      foregroundLab.lightness * foregroundWeight +
      backgroundLab.lightness * (1 - foregroundWeight),
    a: foregroundLab.a * foregroundWeight + backgroundLab.a * (1 - foregroundWeight),
    b: foregroundLab.b * foregroundWeight + backgroundLab.b * (1 - foregroundWeight),
  })
}

const baseTokens = {
  light: {
    ground: '#F4F3EF',
    panel: '#FDFDFB',
    'panel-2': '#F8F7F2',
    ink: '#22211C',
    muted: '#8B8779',
    faint: '#B4B0A2',
    line: '#E5E3DA',
    accent: '#2E6B4C',
    now: '#C25B4A',
    'g-pine': '#2E6B4C',
    'g-blue': '#3F5E8C',
    'g-amber': '#A9761F',
    'g-plum': '#7A4A6D',
  },
  dark: {
    ground: '#171815',
    panel: '#212320',
    'panel-2': '#1C1E1B',
    ink: '#E9E7DD',
    muted: '#92907F',
    faint: '#6A6857',
    line: '#33352E',
    accent: '#83BB9C',
    now: '#D98070',
    'g-pine': '#6FAE8C',
    'g-blue': '#7C9CC9',
    'g-amber': '#C99A4B',
    'g-plum': '#B385A6',
  },
} as const

const themes = [
  { name: 'light', block: lightTokens },
  { name: 'dark', block: darkTokens },
] as const

const chipRecipes = [
  { name: 'pine', backgroundToken: 'g-pine', alpha: 0.13 },
  { name: 'blue', backgroundToken: 'g-blue', alpha: 0.13 },
  { name: 'amber', backgroundToken: 'g-amber', alpha: 0.13 },
  { name: 'plum', backgroundToken: 'g-plum', alpha: 0.13 },
  { name: 'neutral', backgroundToken: 'ink', alpha: 0.08 },
] as const

describe('Editor semantic color tokens', () => {
  it('기존 light/dark spec token hex를 그대로 보존한다', () => {
    for (const theme of themes) {
      for (const [name, value] of Object.entries(baseTokens[theme.name])) {
        expect(token(theme.block, name)).toBe(value)
      }
    }
  })

  it.each(themes)('$name timeline metadata는 WCAG-safe secondary text를 공유하고 크기로 위계를 만든다', ({ block }) => {
    expect(tokenReference(block, 'timeline-metadata')).toBe('text-secondary')
    expect(tokenReference(block, 'timeline-axis')).toBe('text-secondary')

    const panel = rgb(token(block, 'panel'))
    expect(contrast(rgb(token(block, 'text-secondary')), panel)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(themes)('$name normal text와 control 경계 대비를 충족한다', ({ block }) => {
    const panel = rgb(token(block, 'panel'))

    expect(contrast(rgb(token(block, 'text-secondary')), panel)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(rgb(token(block, 'text-placeholder')), panel)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(rgb(token(block, 'control-border')), panel)).toBeGreaterThanOrEqual(3)
  })

  it.each(themes)('$name timeline block text는 실제 합성 배경에서 4.5:1 이상이다', ({ block }) => {
    const panel = rgb(token(block, 'panel'))
    const panel2 = rgb(token(block, 'panel-2'))
    const ink = rgb(token(block, 'ink'))
    const mineForeground = rgb(token(block, 'block-mine-fg'))
    const freeForeground = rgb(token(block, 'block-free-fg'))
    const calendarForeground = rgb(token(block, 'block-calendar-fg'))
    const pastForeground = rgb(token(block, 'block-past-fg'))

    for (const goalToken of ['g-pine', 'g-blue', 'g-amber', 'g-plum'] as const) {
      const goal = rgb(token(block, goalToken))
      expect(contrast(mineForeground, mixOklab(goal, panel, 0.16))).toBeGreaterThanOrEqual(4.5)
      expect(contrast(pastForeground, mixOklab(goal, panel, 0.08))).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrast(freeForeground, mixOklab(ink, panel, 0.07))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(calendarForeground, panel2)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(calendarForeground, composite(ink, panel2, 0.06))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(themes)('$name goal chip text 대비를 충족한다', ({ block }) => {
    const panel = rgb(token(block, 'panel'))
    for (const recipe of chipRecipes) {
      const chipBackground = composite(
        rgb(token(block, recipe.backgroundToken)),
        panel,
        recipe.alpha,
      )
      const chipForeground = rgb(token(block, `chip-${recipe.name}-fg`))

      expect(contrast(chipForeground, chipBackground)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
