import { useMemo, useState } from 'react'
import { blocksForDate, useApp } from '../store'
import type { AppState } from '../store'
import type { Goal, GoalId, Task, TimeBlock } from '../types'
import { TaskRow } from './TaskRow'

interface GoalDocumentProps {
  readonly goal: Goal
  readonly tasks: readonly Task[]
  readonly earliestBlockByTaskId: ReadonlyMap<string, TimeBlock>
  readonly addTask: AppState['addTask']
}

function GoalDocument({
  goal,
  tasks,
  earliestBlockByTaskId,
  addTask,
}: GoalDocumentProps) {
  const [draft, setDraft] = useState('')

  return (
    <div className="doc">
      <h1>{goal.name}</h1>
      {goal.season === undefined ? null : <p className="season">{goal.season}</p>}
      <h2>Tasks</h2>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          goal={goal}
          todayBlock={earliestBlockByTaskId.get(task.id)}
        />
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
          const isComposing =
            event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229
          if (event.key !== 'Enter' || isComposing || taskText === '') {
            return
          }

          addTask(goal.id, taskText)
          setDraft('')
        }}
      />
    </div>
  )
}

export function Editor() {
  const goals = useApp((state) => state.goals)
  const tasks = useApp((state) => state.tasks)
  const blocks = useApp((state) => state.blocks)
  const currentDate = useApp((state) => state.currentDate)
  const selectedGoalId = useApp((state) => state.selectedGoalId)
  const addTask = useApp((state) => state.addTask)
  const goalById = useMemo(
    () => new Map<GoalId, Goal>(goals.map((goal) => [goal.id, goal])),
    [goals],
  )
  const selectedGoal = goalById.get(selectedGoalId)
  const selectedTasks = useMemo(
    () => tasks.filter(({ goalId }) => goalId === selectedGoalId),
    [selectedGoalId, tasks],
  )
  const sameDayBlocks = useMemo(
    () => blocksForDate({ blocks }, currentDate),
    [blocks, currentDate],
  )
  const earliestBlockByTaskId = useMemo(() => {
    const earliestBlocks = new Map<string, TimeBlock>()
    const sortedBlocks = sameDayBlocks.toSorted(
      (left, right) => left.startMin - right.startMin,
    )
    for (const block of sortedBlocks) {
      if (block.taskId !== undefined && !earliestBlocks.has(block.taskId)) {
        earliestBlocks.set(block.taskId, block)
      }
    }
    return earliestBlocks
  }, [sameDayBlocks])

  return (
    <main className="editor" aria-label="Task 편집기">
      {selectedGoal === undefined ? (
        <p className="editor-status" role="status">
          선택한 목표를 찾을 수 없습니다.
        </p>
      ) : (
        <GoalDocument
          key={selectedGoal.id}
          goal={selectedGoal}
          tasks={selectedTasks}
          earliestBlockByTaskId={earliestBlockByTaskId}
          addTask={addTask}
        />
      )}
    </main>
  )
}
