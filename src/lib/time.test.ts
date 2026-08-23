import { describe, expect, it } from 'vitest'
import {
  DAY_MIN,
  PX_PER_HOUR,
  SNAP_MIN,
  clampRange,
  fmtPlanned,
  fmtRange,
  fmtTime,
  minToY,
  newBlockRefId,
  snap,
  yToMin,
} from './time'

describe('time constants', () => {
  it('uses the timeline scale, snap interval, and day length from the UI contract', () => {
    // Given / When
    const constants = [PX_PER_HOUR, SNAP_MIN, DAY_MIN]

    // Then
    expect(constants).toEqual([48, 15, 1440])
  })
})

describe('timeline coordinate conversion', () => {
  it('converts minutes to vertical pixels', () => {
    // Given / When
    const y = minToY(480)

    // Then
    expect(y).toBe(384)
  })

  it('converts vertical pixels to minutes', () => {
    // Given / When
    const minutes = [yToMin(384), yToMin(400)]

    // Then
    expect(minutes).toEqual([480, 500])
  })
})

describe('time snapping', () => {
  it.each([
    [97, 90],
    [98, 105],
    [600, 600],
    [-5, 0],
    [1500, 1440],
  ])('snaps %i minutes to %i minutes within the day', (minutes, expected) => {
    // Given / When
    const snapped = snap(minutes)

    // Then
    expect(snapped).toBe(expected)
  })
})

describe('time range clamping', () => {
  it.each([
    [600, 690, [600, 690]],
    [600, 605, [600, 615]],
    [-30, 30, [0, 30]],
    [1435, 1500, [1425, 1440]],
  ])('clamps %i–%i to a valid snapped range', (start, end, expected) => {
    // Given / When
    const range = clampRange(start, end)

    // Then
    expect(range).toEqual(expected)
  })
})

describe('time formatting', () => {
  it.each([
    [480, '08:00'],
    [690, '11:30'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    // Given / When
    const formatted = fmtTime(minutes)

    // Then
    expect(formatted).toBe(expected)
  })

  it('formats a range with an en dash', () => {
    // Given / When
    const formatted = fmtRange(480, 690)

    // Then
    expect(formatted).toBe('08:00–11:30')
  })

  it.each([
    [220, '3h 40m'],
    [45, '45m'],
    [120, '2h'],
    [0, '0m'],
  ])('formats %i planned minutes as %s', (minutes, expected) => {
    // Given / When
    const formatted = fmtPlanned(minutes)

    // Then
    expect(formatted).toBe(expected)
  })
})

describe('block reference IDs', () => {
  it('returns practically unique four-character lowercase alphanumeric IDs', () => {
    // Given
    const sampleSize = 1_000

    // When
    const ids = Array.from({ length: sampleSize }, () => newBlockRefId())

    // Then
    expect(ids.every((id) => /^[a-z0-9]{4}$/.test(id))).toBe(true)
    expect(new Set(ids)).toHaveLength(sampleSize)
  })
})
