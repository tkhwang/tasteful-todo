import { memo } from 'react'
import { todayISO } from '../lib/date'
import { fmtRange } from '../lib/time'
import { useApp } from '../store'
import type { Goal, Task, TimeBlock } from '../types'

interface TaskRowProps {
  readonly task: Task
  readonly goal: Goal
  readonly todayBlock: TimeBlock | undefined
}

function scheduleDateLabel(date: string): string {
  if (date === todayISO()) {
    return '오늘'
  }

  const localDate = new Date(`${date}T00:00:00`)
  return `${localDate.getMonth() + 1}월 ${localDate.getDate()}일`
}

export const TaskRow = memo(function TaskRow({ task, goal, todayBlock }: TaskRowProps) {
  const toggleTask = useApp((state) => state.toggleTask)

  return (
    <div className={`task${task.done ? ' done' : ''}`}>
      <span className="handle" aria-hidden="true">
        ⠿
      </span>
      <input
        type="checkbox"
        className="checkbox"
        checked={task.done}
        aria-label={`${task.text} 완료`}
        onChange={() => {
          toggleTask(task.id)
        }}
      />
      <div className="task-body">
        <span className="task-text">{task.text}</span>
        {todayBlock === undefined ? null : (
          <span className={`sched-chip chip-${goal.colorKey}`}>
            {scheduleDateLabel(todayBlock.date)}{' '}
            {fmtRange(todayBlock.startMin, todayBlock.endMin)}
          </span>
        )}
        {task.blockRefId === undefined ? null : (
          <span className="blockid">^{task.blockRefId}</span>
        )}
        {task.note === undefined ? null : (
          <p className="subnote">
            <span className="md" aria-hidden="true">
              -
            </span>{' '}
            {task.note}
          </p>
        )}
      </div>
    </div>
  )
})
