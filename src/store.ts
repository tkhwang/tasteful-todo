import { create } from 'zustand'
import { shiftDate, todayISO } from './lib/date'
import { DAY_MIN, SNAP_MIN, clampRange, newBlockRefId, snap } from './lib/time'
import { mockBlocks, mockCalendarEvents, mockGoals, mockTasks } from './mock/data'
import type { CalendarEvent, Goal, GoalId, Task, TimeBlock } from './types'

export { shiftDate, todayISO } from './lib/date'

function uniqueBlockRefId(tasks: readonly Task[]): string {
  const usedBlockRefIds = new Set(
    tasks.flatMap(({ blockRefId }) => (blockRefId === undefined ? [] : [blockRefId])),
  )
  let blockRefId = newBlockRefId()
  while (usedBlockRefIds.has(blockRefId)) {
    blockRefId = newBlockRefId()
  }
  return blockRefId
}

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
  readonly scheduleTask: (taskId: string, startMin: number, durMin?: number) => void
  readonly createBlock: (
    startMin: number,
    endMin: number,
    title: string,
    goalId?: GoalId,
  ) => string
  readonly moveBlock: (blockId: string, newStartMin: number) => void
  readonly resizeBlock: (blockId: string, newEndMin: number) => void
  readonly deleteBlock: (blockId: string) => void
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
  scheduleTask: (taskId, startMin, durMin = 60) => {
    set((state) => {
      const task = state.tasks.find(({ id }) => id === taskId)
      if (task === undefined) {
        return state
      }

      const snappedStartMin = snap(startMin)
      const [blockStartMin, blockEndMin] = clampRange(
        snappedStartMin,
        snappedStartMin + durMin,
      )
      const blockRefId = task.blockRefId ?? uniqueBlockRefId(state.tasks)
      const block: TimeBlock = {
        id: crypto.randomUUID(),
        date: state.currentDate,
        startMin: blockStartMin,
        endMin: blockEndMin,
        taskId,
      }

      return {
        tasks: state.tasks.map((candidate) =>
          candidate.id === taskId ? { ...candidate, blockRefId } : candidate,
        ),
        blocks: [...state.blocks, block],
      }
    })
  },
  createBlock: (startMin, endMin, title, goalId) => {
    const blockId = crypto.randomUUID()
    const [blockStartMin, blockEndMin] = clampRange(snap(startMin), snap(endMin))

    set((state) => {
      if (goalId === undefined) {
        const block: TimeBlock = {
          id: blockId,
          date: state.currentDate,
          startMin: blockStartMin,
          endMin: blockEndMin,
          title,
        }
        return { blocks: [...state.blocks, block] }
      }

      const taskId = crypto.randomUUID()
      const task: Task = {
        id: taskId,
        goalId,
        text: title,
        done: false,
        blockRefId: uniqueBlockRefId(state.tasks),
      }
      const block: TimeBlock = {
        id: blockId,
        date: state.currentDate,
        startMin: blockStartMin,
        endMin: blockEndMin,
        taskId,
      }
      return { tasks: [...state.tasks, task], blocks: [...state.blocks, block] }
    })

    return blockId
  },
  moveBlock: (blockId, newStartMin) => {
    set((state) => {
      if (!state.blocks.some(({ id }) => id === blockId)) {
        return state
      }

      return {
        blocks: state.blocks.map((block) => {
          if (block.id !== blockId) {
            return block
          }

          const duration = block.endMin - block.startMin
          const latestStartMin = Math.floor((DAY_MIN - duration) / SNAP_MIN) * SNAP_MIN
          const candidateStart = Math.min(snap(newStartMin), latestStartMin)
          const [blockStartMin, blockEndMin] = clampRange(
            candidateStart,
            candidateStart + duration,
          )
          return { ...block, startMin: blockStartMin, endMin: blockEndMin }
        }),
      }
    })
  },
  resizeBlock: (blockId, newEndMin) => {
    set((state) => {
      if (!state.blocks.some(({ id }) => id === blockId)) {
        return state
      }

      return {
        blocks: state.blocks.map((block) => {
          if (block.id !== blockId) {
            return block
          }

          const [, blockEndMin] = clampRange(block.startMin, snap(newEndMin))
          return { ...block, endMin: Math.max(block.startMin + SNAP_MIN, blockEndMin) }
        }),
      }
    })
  },
  deleteBlock: (blockId) => {
    set((state) => {
      if (!state.blocks.some(({ id }) => id === blockId)) {
        return state
      }
      return { blocks: state.blocks.filter(({ id }) => id !== blockId) }
    })
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
