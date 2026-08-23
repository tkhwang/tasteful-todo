import { useEffect, useMemo, useRef } from 'react'
import { useNow } from '../hooks/useNow'
import { todayISO } from '../lib/date'
import { fmtPlanned, fmtRange, fmtTime, minToY } from '../lib/time'
import { useApp } from '../store'
import type { Goal, Task } from '../types'
import TimeBlockView from './TimeBlockView'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function dateHeading(date: string): { readonly label: string; readonly weekday: string } {
  const localDate = new Date(`${date}T00:00:00`)
  return {
    label: `${localDate.getMonth() + 1}월 ${localDate.getDate()}일`,
    weekday: `${KOREAN_WEEKDAYS[localDate.getDay()]}요일`,
  }
}

export default function Timeline() {
  const date = useApp((state) => state.currentDate)
  const allBlocks = useApp((state) => state.blocks)
  const calendarEvents = useApp((state) => state.calendarEvents)
  const tasks = useApp((state) => state.tasks)
  const goals = useApp((state) => state.goals)
  const scrollRef = useRef<HTMLDivElement>(null)

  const blocks = useMemo(
    () => allBlocks.filter((block) => block.date === date),
    [allBlocks, date],
  )
  const events = useMemo(
    () => calendarEvents.filter((event) => event.date === date),
    [calendarEvents, date],
  )
  const taskById = useMemo(
    () => new Map<string, Task>(tasks.map((task) => [task.id, task])),
    [tasks],
  )
  const goalById = useMemo(
    () => new Map<string, Goal>(goals.map((goal) => [goal.id, goal])),
    [goals],
  )
  const planned = useMemo(
    () => blocks.reduce((total, block) => total + block.endMin - block.startMin, 0),
    [blocks],
  )
  const heading = useMemo(() => dateHeading(date), [date])

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: minToY(8 * 60) - 12 })
  }, [])

  return (
    <aside className="timeline" aria-label="타임라인">
      <div className="tl-head">
        <span className="tl-date display">
          {heading.label}
          <span className="dow">{heading.weekday}</span>
        </span>
        <span className="tl-cap mono">{fmtPlanned(planned)} 계획됨</span>
      </div>
      <div className="tl-scroll" ref={scrollRef}>
        <div className="grid" data-testid="tl-grid" style={{ height: minToY(1440) }}>
          {HOURS.map((hour) => (
            <div
              className="hour"
              data-testid="hour-marker"
              key={hour}
              style={{ top: minToY(hour * 60) }}
            >
              <span className="mono">{fmtTime(hour * 60)}</span>
            </div>
          ))}
          {events.map((event) => (
            <div
              className="block cal"
              key={event.id}
              style={{
                top: minToY(event.startMin),
                height: minToY(event.endMin - event.startMin),
              }}
              role="group"
              aria-label={`${event.title}, ${fmtRange(event.startMin, event.endMin)}`}
            >
              <span className="n">{event.title}</span>
            </div>
          ))}
          {blocks.map((block) => {
            const task = block.taskId === undefined ? undefined : taskById.get(block.taskId)
            const goal = task === undefined ? undefined : goalById.get(task.goalId)
            return <TimeBlockView block={block} goal={goal} key={block.id} task={task} />
          })}
          <NowLine date={date} />
        </div>
      </div>
    </aside>
  )
}

function NowLine({ date }: { readonly date: string }) {
  const now = useNow()
  if (date !== todayISO()) {
    return null
  }

  return (
    <div
      className="nowline"
      data-testid="now-line"
      style={{ top: minToY(now.getHours() * 60 + now.getMinutes()) }}
      aria-label="현재 시각"
    />
  )
}
