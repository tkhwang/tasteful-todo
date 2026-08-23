export const PX_PER_HOUR = 48
export const SNAP_MIN = 15
export const DAY_MIN = 1440

const issuedBlockRefIds = new Set<string>()

export function minToY(minutes: number): number {
  return (minutes * PX_PER_HOUR) / 60
}

export function yToMin(y: number): number {
  return (y * 60) / PX_PER_HOUR
}

export function snap(minutes: number): number {
  const snapped = Math.round(minutes / SNAP_MIN) * SNAP_MIN
  return Math.min(DAY_MIN, Math.max(0, snapped))
}

export function clampRange(start: number, end: number): readonly [number, number] {
  const clampedStart = snap(start)
  const clampedEnd = snap(end)

  if (clampedEnd - clampedStart >= SNAP_MIN) {
    return [clampedStart, clampedEnd]
  }

  if (clampedEnd === DAY_MIN) {
    return [DAY_MIN - SNAP_MIN, DAY_MIN]
  }

  return [clampedStart, clampedStart + SNAP_MIN]
}

export function fmtTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
}

export function fmtRange(start: number, end: number): string {
  return `${fmtTime(start)}–${fmtTime(end)}`
}

export function fmtPlanned(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes}m`
  }

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

export function newBlockRefId(): string {
  let id: string

  do {
    id = crypto.randomUUID().replaceAll('-', '').slice(0, 4)
  } while (issuedBlockRefIds.has(id))

  issuedBlockRefIds.add(id)
  return id
}
