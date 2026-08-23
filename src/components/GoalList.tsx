import { useMemo } from 'react'
import { useApp } from '../store'
import type { GoalId } from '../types'

function openCountSignature(
  goals: readonly { readonly id: GoalId }[],
  tasks: readonly { readonly goalId: GoalId; readonly done: boolean }[],
): string {
  const counts = new Map<GoalId, number>(goals.map(({ id }) => [id, 0] as const))
  for (const task of tasks) {
    if (task.done) {
      continue
    }

    const count = counts.get(task.goalId)
    if (count !== undefined) {
      counts.set(task.goalId, count + 1)
    }
  }
  return goals.map(({ id }) => counts.get(id) ?? 0).join(',')
}

export function GoalList() {
  const goals = useApp((state) => state.goals)
  const countSignature = useApp((state) => openCountSignature(state.goals, state.tasks))
  const selectedGoalId = useApp((state) => state.selectedGoalId)
  const selectGoal = useApp((state) => state.selectGoal)
  const orderedGoals = useMemo(
    () => [
      ...goals.filter((goal) => goal.isInbox === true),
      ...goals.filter((goal) => goal.isInbox !== true),
    ],
    [goals],
  )
  const openCounts = useMemo(() => {
    const counts = countSignature.split(',')
    return new Map<GoalId, number>(
      goals.map((goal, index) => [goal.id, Number(counts[index] ?? 0)] as const),
    )
  }, [countSignature, goals])

  return (
    <aside className="goals" aria-label="목표 목록">
      <p className="col-label">Goals</p>
      {orderedGoals.map((goal) => {
        const count = openCounts.get(goal.id) ?? 0
        const isSelected = goal.id === selectedGoalId

        return (
          <button
            type="button"
            className={`goal${isSelected ? ' selected' : ''}`}
            aria-label={`${goal.name}, 미완료 task ${count}개`}
            aria-pressed={isSelected}
            key={goal.id}
            onClick={() => {
              selectGoal(goal.id)
            }}
          >
            <span
              className={`dot ck-${goal.colorKey}${goal.isInbox === true ? ' round' : ''}`}
              aria-hidden="true"
            />
            <span className="goal-name">{goal.name}</span>
            <span className="count" aria-hidden="true">
              {count}
            </span>
          </button>
        )
      })}
      <button type="button" className="add-goal" disabled>
        <span className="plus" aria-hidden="true">
          ＋
        </span>
        새 목표
      </button>
    </aside>
  )
}
