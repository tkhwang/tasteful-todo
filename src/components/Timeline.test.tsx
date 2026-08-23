/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { minToY } from '../lib/time'
import { useApp } from '../store'
import Titlebar from './Titlebar'
import Timeline from './Timeline'

const TEST_TODAY = '2026-08-23'
const scrollToMock = vi.fn()
const appStyles = readFileSync(resolve('src/styles/app.css'), 'utf8')

beforeEach(() => {
  scrollToMock.mockReset()
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: scrollToMock,
  })
  useApp.setState(useApp.getInitialState(), true)
  useApp.setState({ currentDate: TEST_TODAY })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
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

  it('keeps a compact calendar event title as its only visible child', () => {
    render(<Timeline />)

    const event = screen.getByText('주간 리뷰 콜').closest('.block.cal')

    expect(event).toHaveStyle({ height: '24px' })
    expect(event?.querySelector('.n')).toHaveTextContent('주간 리뷰 콜')
    expect(event?.querySelector('.t')).not.toBeInTheDocument()
  })

  it('shows the total planned duration for the selected date', () => {
    render(<Timeline />)

    expect(screen.getByText('5h 40m 계획됨')).toBeInTheDocument()
  })

  it('removes current-date blocks after moving to the next day', () => {
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

  it('shows a now line only when the selected date is local today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 23, 10, 30))

    const { rerender } = render(<Timeline />)

    expect(screen.getByTestId('now-line')).toHaveStyle({ top: '504px' })

    act(() => useApp.setState({ currentDate: '2026-08-24' }))
    rerender(<Timeline />)

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
    vi.setSystemTime(new Date(2026, 7, 23, 10, 30))
    render(
      <>
        <Titlebar />
        <Timeline />
      </>,
    )

    expect(screen.getByText('8월 23일')).toBeInTheDocument()
    expect(screen.getByText('일요일')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '이전 날짜' }))
    expect(useApp.getState().currentDate).toBe('2026-08-22')
    expect(screen.getByText('8월 22일')).toBeInTheDocument()
    expect(screen.getByText('토요일')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '오늘로 이동' }))
    expect(useApp.getState().currentDate).toBe(TEST_TODAY)
    expect(screen.getByText('8월 23일')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 날짜' }))
    expect(useApp.getState().currentDate).toBe('2026-08-24')
    expect(screen.getByText('8월 24일')).toBeInTheDocument()
    expect(screen.getByText('월요일')).toBeInTheDocument()
  })
})
