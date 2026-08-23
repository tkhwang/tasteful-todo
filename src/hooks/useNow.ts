import { useEffect, useState } from 'react'

export type Clock = {
  readonly now: () => Date
  readonly setTimeout: (callback: () => void, delay: number) => number
  readonly clearTimeout: (timerId: number) => void
}

const systemClock: Clock = {
  now: () => new Date(),
  setTimeout: (callback, delay) => window.setTimeout(callback, delay),
  clearTimeout: (timerId) => window.clearTimeout(timerId),
}

export function useNow(clock: Clock = systemClock): Date {
  const [now, setNow] = useState(() => clock.now())

  useEffect(() => {
    let timerId: number | undefined
    const scheduleNextMinute = (): void => {
      const current = clock.now()
      const delay = 60_000 - (current.getSeconds() * 1_000 + current.getMilliseconds())
      timerId = clock.setTimeout(() => {
        setNow(clock.now())
        scheduleNextMinute()
      }, delay)
    }

    scheduleNextMinute()
    return () => {
      if (timerId !== undefined) {
        clock.clearTimeout(timerId)
      }
    }
  }, [clock])

  return now
}
