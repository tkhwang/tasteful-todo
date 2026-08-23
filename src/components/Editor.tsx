import { useMemo, useState } from 'react'
import { useApp } from '../store'
import { TaskRow } from './TaskRow'

export function Editor() {
  const goals = useApp((state) => state.goals)
  const tasks = useApp((state) => state.tasks)
  const selectedGoalId = useApp((state) => state.selectedGoalId)
  const addTask = useApp((state) => state.addTask)
  const selectedGoal = useMemo(
    () => goals.find(({ id }) => id === selectedGoalId),
    [goals, selectedGoalId],
  )
  const selectedTasks = useMemo(
    () => tasks.filter(({ goalId }) => goalId === selectedGoalId),
    [selectedGoalId, tasks],
  )
  const [draft, setDraft] = useState('')

  return (
    <main className="editor" aria-label="Task 편집기">
      {selectedGoal === undefined ? null : (
        <div className="doc">
          <h1>{selectedGoal.name}</h1>
          {selectedGoal.season === undefined ? null : (
            <p className="season">{selectedGoal.season}</p>
          )}
          <h2>Tasks</h2>
          {selectedTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
          <input
            type="text"
            className="add-task"
            placeholder="task 추가"
            aria-label="task 추가"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
            }}
            onKeyDown={(event) => {
              const taskText = draft.trim()
              if (event.key !== 'Enter' || event.nativeEvent.isComposing || taskText === '') {
                return
              }

              addTask(selectedGoal.id, taskText)
              setDraft('')
            }}
          />
        </div>
      )}
    </main>
  )
}
