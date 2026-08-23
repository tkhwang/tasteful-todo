import { afterEach, describe, expect, it, vi } from 'vitest'
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
    const y = [minToY(0), minToY(480)]

    // Then
    expect(y).toEqual([0, 384])
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
    [601, 690, [601, 690]],
    [10, 20, [10, 25]],
  ])('clamps %i–%i to a valid day range', (start, end, expected) => {
    // Given / When
    const range = clampRange(start, end)

    // Then
    expect(range).toEqual(expected)
  })

  it('returns a mutable tuple', () => {
    // Given / When
    const range: [number, number] = clampRange(10, 20)
    range[0] = 5

    // Then
    expect(range).toEqual([5, 25])
  })
})

describe('time formatting', () => {
  it.each([
    [480, '08:00'],
    [690, '11:30'],
    [1440, '24:00'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    // Given / When
    const formatted = fmtTime(minutes)

    // Then
    expect(formatted).toBe(expected)
  })

  it.each([
    [600, 690, '10:00–11:30'],
    [1425, 1440, '23:45–24:00'],
  ])('formats %i–%i with an en dash', (start, end, expected) => {
    // Given / When
    const formatted = fmtRange(start, end)

    // Then
    expect(formatted).toBe(expected)
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
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('derives one reference ID from each deterministic UUID', () => {
    // Given
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('abcd0000-0000-4000-8000-000000000000')
      .mockReturnValueOnce('ef010000-0000-4000-8000-000000000000')

    // When
    const firstId = newBlockRefId()
    const secondId = newBlockRefId()

    // Then
    expect([firstId, secondId]).toEqual(['abcd', 'ef01'])
    expect(randomUUID).toHaveBeenCalledTimes(2)
  })

  it('does not remember reference IDs between calls', () => {
    // Given
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('abcd0000-0000-4000-8000-000000000000')

    // When
    const ids = [newBlockRefId(), newBlockRefId()]

    // Then
    expect(ids).toEqual(['abcd', 'abcd'])
    expect(randomUUID).toHaveBeenCalledTimes(2)
  })

  it('returns exactly four lowercase alphanumeric characters', () => {
    // Given / When
    const id = newBlockRefId()

    // Then
    expect(id).toMatch(/^[a-z0-9]{4}$/)
  })
})
