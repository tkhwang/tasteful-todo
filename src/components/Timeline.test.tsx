/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shiftDate } from '../lib/date'
import { minToY } from '../lib/time'
import { useApp } from '../store'
import type { TimeBlock } from '../types'
import TimeBlockView from './TimeBlockView'
import Titlebar from './Titlebar'
import Timeline from './Timeline'

const initialState = useApp.getInitialState()
function requireSeededDate(): string {
  const date = initialState.blocks[0]?.date ?? initialState.calendarEvents[0]?.date
  if (date === undefined) {
    throw new TypeError('Timeline fixture requires a seeded date')
  }
  return date
}

const seededDate = requireSeededDate()
const seededTask = initialState.tasks.find((task) => task.id === 't-landing')
const seededGoal = initialState.goals.find((goal) => goal.id === seededTask?.goalId)
if (seededTask === undefined || seededGoal === undefined) {
  throw new TypeError('Timeline fixture requires a resolvable scheduled task')
}

const scrollToMock = vi.fn()
const appStyles = readFileSync(resolve('src/styles/app.css'), 'utf8')
const originalScrollToDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollTo',
)

function resetStoreForSeededDate(): void {
  useApp.setState(initialState, true)
  useApp.setState({ currentDate: seededDate })
}

function seededLocalDate(hours: number, minutes: number, seconds = 0): Date {
  const [year, month, day] = seededDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) {
    throw new TypeError(`Invalid seeded date: ${seededDate}`)
  }
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

function headingFor(date: string): { readonly date: string; readonly weekday: string } {
  const localDate = new Date(`${date}T00:00:00`)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const
  return {
    date: `${localDate.getMonth() + 1}월 ${localDate.getDate()}일`,
    weekday: `${weekdays[localDate.getDay()]}요일`,
  }
}

beforeEach(() => {
  scrollToMock.mockReset()
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: scrollToMock,
  })
  resetStoreForSeededDate()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  if (originalScrollToDescriptor === undefined) {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  } else {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollToDescriptor)
  }
})

afterAll(() => {
  expect(Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')).toEqual(
    originalScrollToDescriptor,
  )
})

describe('timeline', () => {
  it('renders a scheduled block at its exact time position and duration', () => {
    render(<Timeline />)

    const block = screen.getByText('랜딩페이지 초안').closest('.block')

    expect(block).toHaveStyle({ top: '480px', height: '72px' })
  })

  it('renders free blocks and read-only calendar events', () => {
    render(<Timeline />)

    expect(screen.getByText('점심').closest('.block')).toHaveClass('free')
    expect(screen.getByText('가족 저녁').closest('.block')).toHaveClass('cal')
  })

  it.each([
    ['pine', 'g-pine'],
    ['blue', 'g-blue'],
    ['amber', 'g-amber'],
    ['plum', 'g-plum'],
    ['neutral', 'faint'],
  ] as const)('keeps the %s block left border tied to its goal token', (colorKey, token) => {
    expect(appStyles).toMatch(
      new RegExp(
        `\\.block\\.mine\\.ck-block-${colorKey}\\s*\\{[^}]*border-left-color:\\s*var\\(--${token}\\)`,
        's',
      ),
    )
  })

  it('keeps completed block borders on the exact goal token instead of dimming the border', () => {
    const pastRule = appStyles.match(/\.block\.mine\.past\s*\{([^}]*)\}/s)?.[1]

    expect(pastRule).toBeDefined()
    expect(pastRule).not.toContain('border-left-color')
  })

  it('keeps a compact calendar event title as its only visible child', () => {
    render(<Timeline />)

    const event = screen.getByText('주간 리뷰 콜').closest('.block.cal')

    expect(event).toHaveStyle({ height: '24px' })
    expect(event?.querySelector('.n')).toHaveTextContent('주간 리뷰 콜')
    expect(event?.querySelector('.t')).not.toBeInTheDocument()
  })

  it.each([15, 30, 40])(
    'keeps a %d-minute task title visible without a visual time row',
    (duration) => {
      const block: TimeBlock = {
        id: `short-${duration}`,
        date: seededDate,
        startMin: 10 * 60,
        endMin: 10 * 60 + duration,
        taskId: seededTask.id,
      }

      render(<TimeBlockView block={block} goal={seededGoal} task={seededTask} />)

      const view = screen.getByText(seededTask.text).closest('.block')
      expect(view).toHaveClass('compact')
      expect(view).toHaveStyle({ height: `${minToY(duration)}px` })
      expect(view).toHaveAccessibleName(`${seededTask.text}, 10:00–10:${String(duration).padStart(2, '0')}`)
      expect(view?.querySelector('.t')).not.toBeInTheDocument()
      if (duration === 15) {
        expect(view).toHaveClass('ultra-compact')
      }
    },
  )

  it('renders the resize placeholder for a free block', () => {
    const block: TimeBlock = {
      id: 'free-short',
      date: seededDate,
      startMin: 12 * 60,
      endMin: 12 * 60 + 15,
      title: '짧은 메모',
    }

    const { container } = render(<TimeBlockView block={block} />)

    expect(container.querySelector('.resize')).toBeInTheDocument()
  })

  it('shows the total planned duration for the selected date', () => {
    render(<Timeline />)

    expect(screen.getByText('5h 40m 계획됨')).toBeInTheDocument()
  })

  it('removes seeded blocks after moving to the next day', () => {
    useApp.getState().goNextDay()

    render(<Timeline />)

    expect(screen.queryByText('랜딩페이지 초안')).not.toBeInTheDocument()
  })

  it('renders a 24-hour grid with the exact full-day height', () => {
    render(<Timeline />)

    expect(screen.getByTestId('tl-grid')).toHaveStyle({ height: `${minToY(1440)}px` })
    expect(screen.getAllByTestId('hour-marker')).toHaveLength(24)
    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(screen.getByText('23:00')).toBeInTheDocument()
  })

  it('initially scrolls the timeline to just before 08:00', () => {
    render(<Timeline />)

    expect(scrollToMock).toHaveBeenCalledOnce()
    expect(scrollToMock).toHaveBeenCalledWith({ top: minToY(8 * 60) - 12 })
  })

  it('advances the now line at the next minute boundary and clears its timer', () => {
    vi.useFakeTimers()
    vi.setSystemTime(seededLocalDate(10, 30, 45))
    resetStoreForSeededDate()

    const { unmount } = render(<Timeline />)
    expect(screen.getByTestId('now-line')).toHaveStyle({ top: '504px' })
    expect(vi.getTimerCount()).toBe(1)

    act(() => vi.advanceTimersByTime(15_000))
    expect(screen.getByTestId('now-line')).toHaveStyle({ top: '504.8px' })
    expect(vi.getTimerCount()).toBe(1)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('removes the now line when the local date rolls over at midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(seededLocalDate(23, 59, 45))
    resetStoreForSeededDate()

    render(<Timeline />)
    expect(screen.getByTestId('now-line')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(15_000))

    expect(screen.queryByTestId('now-line')).not.toBeInTheDocument()
  })
})

describe('titlebar date navigation', () => {
  it('shows the selected goal filename and keeps only noninteractive regions draggable', () => {
    const { container } = render(<Titlebar />)

    expect(screen.getByText('사이드프로젝트.md')).toBeInTheDocument()
    expect(container.querySelector('.titlebar')).toHaveAttribute('data-tauri-drag-region')
    expect(container.querySelector('.titlebar-right')).toHaveAttribute('data-tauri-drag-region')
    for (const button of screen.getAllByRole('button')) {
      expect(button).not.toHaveAttribute('data-tauri-drag-region')
    }
  })

  it('moves to the previous day, returns to today, and moves to the next day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(seededLocalDate(10, 30))
    resetStoreForSeededDate()
    render(
      <>
        <Titlebar />
        <Timeline />
      </>,
    )

    const previousDate = shiftDate(seededDate, -1)
    const nextDate = shiftDate(seededDate, 1)
    expect(screen.getByText(headingFor(seededDate).date)).toBeInTheDocument()
    expect(screen.getByText(headingFor(seededDate).weekday)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '이전 날짜' }))
    expect(useApp.getState().currentDate).toBe(previousDate)
    expect(screen.getByText(headingFor(previousDate).date)).toBeInTheDocument()
    expect(screen.getByText(headingFor(previousDate).weekday)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '오늘로 이동' }))
    expect(useApp.getState().currentDate).toBe(seededDate)
    expect(screen.getByText(headingFor(seededDate).date)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 날짜' }))
    expect(useApp.getState().currentDate).toBe(nextDate)
    expect(screen.getByText(headingFor(nextDate).date)).toBeInTheDocument()
    expect(screen.getByText(headingFor(nextDate).weekday)).toBeInTheDocument()
  })
})
