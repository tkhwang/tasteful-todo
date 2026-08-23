import { beforeEach, describe, expect, it } from 'vitest'
import {
  blocksForDate,
  openCount,
  plannedMinutes,
  shiftDate,
  todayISO,
  useApp,
} from './store'

beforeEach(() => {
  useApp.setState(useApp.getInitialState(), true)
})

describe('store 기본', () => {
  it('초기 선택은 사이드프로젝트이고 날짜는 오늘이다', () => {
    const state = useApp.getState()

    expect(state.selectedGoalId).toBe('side-project')
    expect(state.currentDate).toBe(todayISO())
  })

  it('selectGoal이 선택을 바꾼다', () => {
    useApp.getState().selectGoal('job')

    expect(useApp.getState().selectedGoalId).toBe('job')
  })

  it('toggleTask가 done을 뒤집는다', () => {
    useApp.getState().toggleTask('t-logo')

    const task = useApp.getState().tasks.find(({ id }) => id === 't-logo')
    expect(task).toBeDefined()
    if (task === undefined) {
      throw new TypeError('Expected the t-logo task to exist')
    }
    expect(task.done).toBe(true)
  })

  it('addTask는 해당 goal에 미완료 task를 추가하고 id를 반환한다', () => {
    const id = useApp.getState().addTask('job', '포트폴리오 정리')

    const task = useApp.getState().tasks.find((candidate) => candidate.id === id)
    expect(task).toBeDefined()
    if (task === undefined) {
      throw new TypeError('Expected the newly added task to exist')
    }
    expect(task).toMatchObject({
      goalId: 'job',
      text: '포트폴리오 정리',
      done: false,
    })
  })

  it('updateTaskText가 task 문구를 바꾼다', () => {
    useApp.getState().updateTaskText('t-logo', '로고 최종안 검토')

    const task = useApp.getState().tasks.find(({ id }) => id === 't-logo')
    expect(task?.text).toBe('로고 최종안 검토')
  })

  it('openCount는 goal별 미완료 task 수를 센다', () => {
    const state = useApp.getState()

    expect(openCount(state, 'side-project')).toBe(3)
    expect(openCount(state, 'inbox')).toBe(2)
  })

  it('오늘 블록과 계획 시간을 찾는다', () => {
    const state = useApp.getState()
    const date = todayISO()

    expect(blocksForDate(state, date).map(({ id }) => id)).toEqual([
      'b-run',
      'b-landing',
      'b-lunch',
      'b-essay',
      'b-resume',
    ])
    expect(plannedMinutes(state, date)).toBe(340)
  })

  it('shiftDate가 월 경계를 넘나든다', () => {
    expect(shiftDate('2026-08-31', 1)).toBe('2026-09-01')
    expect(shiftDate('2026-09-01', -1)).toBe('2026-08-31')
  })

  it('이전 날, 다음 날, 오늘로 이동한다', () => {
    const today = todayISO()

    useApp.setState({ currentDate: '2026-09-01' })
    useApp.getState().goPrevDay()
    expect(useApp.getState().currentDate).toBe('2026-08-31')

    useApp.getState().goNextDay()
    expect(useApp.getState().currentDate).toBe('2026-09-01')

    useApp.getState().goToday()
    expect(useApp.getState().currentDate).toBe(today)
  })
})
