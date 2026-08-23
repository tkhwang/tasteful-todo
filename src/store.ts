import { create } from 'zustand'
import { shiftDate, todayISO } from './lib/date'
import { mockBlocks, mockCalendarEvents, mockGoals, mockTasks } from './mock/data'
import type { CalendarEvent, Goal, GoalId, Task, TimeBlock } from './types'

export { shiftDate, todayISO } from './lib/date'

export interface AppState {
  readonly goals: readonly Goal[]
  readonly tasks: readonly Task[]
  readonly blocks: readonly TimeBlock[]
  readonly calendarEvents: readonly CalendarEvent[]
  readonly selectedGoalId: GoalId
  readonly currentDate: string
  readonly selectGoal: (id: GoalId) => void
  readonly toggleTask: (taskId: string) => void
  readonly addTask: (goalId: GoalId, text: string) => string
  readonly updateTaskText: (taskId: string, text: string) => void
  readonly goPrevDay: () => void
  readonly goNextDay: () => void
  readonly goToday: () => void
}

export const useApp = create<AppState>((set) => ({
  goals: mockGoals,
  tasks: mockTasks,
  blocks: mockBlocks,
  calendarEvents: mockCalendarEvents,
  selectedGoalId: 'side-project',
  currentDate: todayISO(),
  selectGoal: (id) => {
    set({ selectedGoalId: id })
  },
  toggleTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    }))
  },
  addTask: (goalId, text) => {
    const id = crypto.randomUUID()
    set((state) => ({ tasks: [...state.tasks, { id, goalId, text, done: false }] }))
    return id
  },
  updateTaskText: (taskId, text) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, text } : task)),
    }))
  },
  goPrevDay: () => {
    set((state) => ({ currentDate: shiftDate(state.currentDate, -1) }))
  },
  goNextDay: () => {
    set((state) => ({ currentDate: shiftDate(state.currentDate, 1) }))
  },
  goToday: () => {
    set({ currentDate: todayISO() })
  },
}))

export function openCount(state: AppState, goalId: GoalId): number {
  return state.tasks.filter((task) => task.goalId === goalId && !task.done).length
}

export function blocksForDate(state: AppState, date: string): readonly TimeBlock[] {
  return state.blocks.filter((block) => block.date === date)
}

export function plannedMinutes(state: AppState, date: string): number {
  return blocksForDate(state, date).reduce(
    (minutes, block) => minutes + (block.endMin - block.startMin),
    0,
  )
}
