import { fmtRange } from '../lib/time'
import { blocksForDate, useApp } from '../store'
import type { Task } from '../types'

interface TaskRowProps {
  readonly task: Task
}

export function TaskRow({ task }: TaskRowProps) {
  const goal = useApp((state) => state.goals.find(({ id }) => id === task.goalId))
  const todayBlock = useApp((state) =>
    blocksForDate(state, state.currentDate).find(({ taskId }) => taskId === task.id),
  )
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
        {todayBlock !== undefined && goal !== undefined ? (
          <span className={`sched-chip chip-${goal.colorKey}`}>
            오늘 {fmtRange(todayBlock.startMin, todayBlock.endMin)}
          </span>
        ) : null}
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
}
