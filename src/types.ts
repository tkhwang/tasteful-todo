export type GoalId = string
export type ColorKey = 'pine' | 'blue' | 'amber' | 'plum' | 'neutral'

export interface Goal {
  readonly id: GoalId
  readonly name: string
  readonly colorKey: ColorKey
  readonly isInbox?: boolean
  readonly season?: string
}

export interface Task {
  readonly id: string
  readonly goalId: GoalId
  readonly text: string
  readonly done: boolean
  readonly blockRefId?: string
  readonly note?: string
}

export interface TimeBlock {
  readonly id: string
  readonly date: string
  readonly startMin: number
  readonly endMin: number
  readonly taskId?: string
  readonly title?: string
}

export interface CalendarEvent {
  readonly id: string
  readonly date: string
  readonly startMin: number
  readonly endMin: number
  readonly title: string
}
