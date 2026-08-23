import { useShallow } from 'zustand/react/shallow'
import { openCount, useApp } from '../store'

export function GoalList() {
  const goals = useApp((state) => state.goals)
  const selectedGoalId = useApp((state) => state.selectedGoalId)
  const selectGoal = useApp((state) => state.selectGoal)
  const openCounts = useApp(
    useShallow((state) => state.goals.map((goal) => openCount(state, goal.id))),
  )
  const orderedGoals = [
    ...goals.filter((goal) => goal.isInbox === true),
    ...goals.filter((goal) => goal.isInbox !== true),
  ]

  return (
    <aside className="goals" aria-label="목표 목록">
      <p className="col-label">Goals</p>
      {orderedGoals.map((goal) => {
        const count = openCounts[goals.indexOf(goal)] ?? 0
        const isSelected = goal.id === selectedGoalId

        return (
          <button
            type="button"
            className={`goal${isSelected ? ' selected' : ''}`}
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
            <span className="count">{count}</span>
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
