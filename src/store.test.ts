import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  blocksForDate,
  UnknownGoalError,
  openCount,
  plannedMinutes,
  shiftDate,
  todayISO,
  useApp,
} from './store'

beforeEach(() => {
  useApp.setState(useApp.getInitialState(), true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('store 기본', () => {
  it('초기 선택은 사이드프로젝트이고 날짜는 오늘이다', () => {
    const state = useApp.getState()

    expect(state.selectedGoalId).toBe('side-project')
    expect(state.currentDate).toBe(todayISO())
  })

  it('selectGoal은 존재하지 않는 goal id에 typed error를 던지고 상태를 보존한다', () => {
    const before = useApp.getState()
    let thrown: unknown

    try {
      before.selectGoal('missing-goal')
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(UnknownGoalError)
    if (!(thrown instanceof UnknownGoalError)) {
      throw new TypeError('Expected UnknownGoalError')
    }
    expect(thrown.goalId).toBe('missing-goal')
    expect(useApp.getState()).toBe(before)
  })

  it('addTask는 존재하지 않는 goal id에 typed error를 던지고 상태를 보존한다', () => {
    const before = useApp.getState()
    let thrown: unknown

    try {
      before.addTask('missing-goal', '고아 task')
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(UnknownGoalError)
    if (!(thrown instanceof UnknownGoalError)) {
      throw new TypeError('Expected UnknownGoalError')
    }
    expect(thrown.goalId).toBe('missing-goal')
    expect(useApp.getState()).toBe(before)
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

describe('스케줄링 액션', () => {
  it('scheduleTask는 시작 시간을 스냅하고 기본 60분 블록을 오늘에 추가한다', () => {
    const before = useApp.getState()

    before.scheduleTask('t-logo', 607)

    const state = useApp.getState()
    const task = state.tasks.find(({ id }) => id === 't-logo')
    const addedBlocks = state.blocks.slice(before.blocks.length)
    expect(task?.blockRefId).toMatch(/^[0-9a-f]{4}$/)
    expect(addedBlocks).toHaveLength(1)
    expect(addedBlocks[0]).toMatchObject({
      date: before.currentDate,
      startMin: 600,
      endMin: 660,
      taskId: 't-logo',
    })
  })

  it('scheduleTask를 두 번 호출해도 task의 blockRefId를 재사용하고 블록은 두 개 만든다', () => {
    useApp.getState().scheduleTask('t-logo', 607)
    const firstRefId = useApp
      .getState()
      .tasks.find(({ id }) => id === 't-logo')?.blockRefId

    useApp.getState().scheduleTask('t-logo', 720, 30)

    const state = useApp.getState()
    const task = state.tasks.find(({ id }) => id === 't-logo')
    const taskBlocks = state.blocks.filter(({ taskId }) => taskId === 't-logo')
    expect(task?.blockRefId).toBe(firstRefId)
    expect(taskBlocks).toHaveLength(2)
    expect(taskBlocks[1]).toMatchObject({ startMin: 720, endMin: 750 })
  })

  it('scheduleTask는 스냅한 시작에서 요청한 20분 길이를 그대로 유지한다', () => {
    useApp.getState().scheduleTask('t-logo', 607, 20)

    const block = useApp.getState().blocks.find(({ taskId }) => taskId === 't-logo')
    expect(block).toMatchObject({ startMin: 600, endMin: 620 })
  })

  it('scheduleTask는 음수 시작을 0으로 스냅하고 기본 60분을 적용한다', () => {
    useApp.getState().scheduleTask('t-logo', -8)

    const block = useApp.getState().blocks.find(({ taskId }) => taskId === 't-logo')
    expect(block).toMatchObject({ startMin: 0, endMin: 60 })
  })

  it('scheduleTask는 기존 task reference와 충돌하면 현재 state 기준으로 재시도한다', () => {
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('a1b20000-0000-4000-8000-000000000000')
      .mockReturnValueOnce('f9e80000-0000-4000-8000-000000000000')
      .mockReturnValueOnce('b10c0000-0000-4000-8000-000000000000')

    useApp.getState().scheduleTask('t-logo', 600)

    const task = useApp.getState().tasks.find(({ id }) => id === 't-logo')
    expect(task?.blockRefId).toBe('f9e8')
    expect(randomUUID).toHaveBeenCalledTimes(3)
  })

  it('store reset과 mock 복원 뒤에는 이전 scheduling test 상태가 남지 않는다', () => {
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('b7c60000-0000-4000-8000-000000000000')
      .mockReturnValueOnce('b10c0000-0000-4000-8000-000000000000')
    const before = useApp.getState()

    before.scheduleTask('t-logo', 600)

    const state = useApp.getState()
    const task = state.tasks.find(({ id }) => id === 't-logo')
    expect(before.tasks.find(({ id }) => id === 't-logo')?.blockRefId).toBeUndefined()
    expect(task?.blockRefId).toBe('b7c6')
    expect(state.blocks.filter(({ taskId }) => taskId === 't-logo')).toHaveLength(1)
    expect(randomUUID).toHaveBeenCalledTimes(2)
  })

  it('scheduleTask는 하루 끝에서도 최소 스냅 구간 안으로 클램프한다', () => {
    useApp.getState().scheduleTask('t-logo', 1438)

    const block = useApp.getState().blocks.find(({ taskId }) => taskId === 't-logo')
    expect(block).toMatchObject({ startMin: 1425, endMin: 1440 })
  })

  it('scheduleTask는 없는 task id에 대해 상태를 바꾸지 않는다', () => {
    const before = useApp.getState()

    before.scheduleTask('missing-task', 600)

    const after = useApp.getState()
    expect(after.tasks).toBe(before.tasks)
    expect(after.blocks).toBe(before.blocks)
  })

  it('createBlock은 goal이 있으면 새 task와 연결된 블록을 만들고 블록 id를 반환한다', () => {
    const before = useApp.getState()

    const blockId = before.createBlock(1020, 1080, '배포 체크리스트', 'side-project')

    const state = useApp.getState()
    const task = state.tasks.find(({ text }) => text === '배포 체크리스트')
    const block = state.blocks.find(({ id }) => id === blockId)
    expect(task).toMatchObject({
      goalId: 'side-project',
      text: '배포 체크리스트',
      done: false,
    })
    expect(task?.blockRefId).toMatch(/^[0-9a-f]{4}$/)
    expect(block).toMatchObject({
      date: before.currentDate,
      startMin: 1020,
      endMin: 1080,
      taskId: task?.id,
    })
  })

  it('createBlock은 존재하지 않는 goal id에 typed error를 던지고 상태를 보존한다', () => {
    const before = useApp.getState()
    let thrown: unknown

    try {
      before.createBlock(720, 780, '고아 block', 'missing-goal')
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(UnknownGoalError)
    if (!(thrown instanceof UnknownGoalError)) {
      throw new TypeError('Expected UnknownGoalError')
    }
    expect(thrown.goalId).toBe('missing-goal')
    expect(useApp.getState()).toBe(before)
  })

  it('createBlock은 goal이 없으면 task 없이 제목을 가진 free block만 만든다', () => {
    const before = useApp.getState()

    const blockId = before.createBlock(720, 780, '점심 약속')

    const state = useApp.getState()
    expect(state.tasks).toBe(before.tasks)
    expect(state.blocks.find(({ id }) => id === blockId)).toMatchObject({
      date: before.currentDate,
      startMin: 720,
      endMin: 780,
      title: '점심 약속',
    })
  })

  it('createBlock은 시작과 종료를 스냅하고 하루 범위로 클램프한다', () => {
    const blockId = useApp.getState().createBlock(1438, 1501, '마감')

    const block = useApp.getState().blocks.find(({ id }) => id === blockId)
    expect(block).toMatchObject({ startMin: 1425, endMin: 1440 })
  })

  it('moveBlock은 길이를 유지하며 스냅한 시작 시간으로 이동한다', () => {
    useApp.getState().moveBlock('b-landing', 604)

    const block = useApp.getState().blocks.find(({ id }) => id === 'b-landing')
    expect(block).toMatchObject({ startMin: 600, endMin: 690 })
  })

  it('moveBlock은 길이를 유지하며 하루 끝을 넘지 않도록 이동한다', () => {
    useApp.getState().moveBlock('b-landing', 1438)

    const block = useApp.getState().blocks.find(({ id }) => id === 'b-landing')
    expect(block).toMatchObject({ startMin: 1350, endMin: 1440 })
  })

  it('moveBlock은 non-grid 길이를 유지하는 가장 늦은 스냅 시작점으로 이동한다', () => {
    useApp.getState().moveBlock('b-run', 1438)

    const block = useApp.getState().blocks.find(({ id }) => id === 'b-run')
    expect(block).toMatchObject({ startMin: 1395, endMin: 1435 })
  })

  it('moveBlock은 없는 block이면 Zustand state와 blocks identity를 유지한다', () => {
    const before = useApp.getState()

    before.moveBlock('missing-block', 600)

    const after = useApp.getState()
    expect(after).toBe(before)
    expect(after.blocks).toBe(before.blocks)
  })

  it('resizeBlock은 종료를 스냅하고 최소 15분을 보장한다', () => {
    useApp.getState().resizeBlock('b-landing', 605)

    const block = useApp.getState().blocks.find(({ id }) => id === 'b-landing')
    expect(block).toMatchObject({ startMin: 600, endMin: 615 })
  })

  it('resizeBlock은 종료를 하루 끝으로 클램프한다', () => {
    useApp.getState().resizeBlock('b-landing', 1500)

    const block = useApp.getState().blocks.find(({ id }) => id === 'b-landing')
    expect(block).toMatchObject({ startMin: 600, endMin: 1440 })
  })

  it('resizeBlock은 없는 block이면 Zustand state와 blocks identity를 유지한다', () => {
    const before = useApp.getState()

    before.resizeBlock('missing-block', 600)

    const after = useApp.getState()
    expect(after).toBe(before)
    expect(after.blocks).toBe(before.blocks)
  })

  it('deleteBlock은 블록만 지우고 연결된 task는 남긴다', () => {
    useApp.getState().deleteBlock('b-landing')

    const state = useApp.getState()
    expect(state.blocks.some(({ id }) => id === 'b-landing')).toBe(false)
    expect(state.tasks.some(({ id }) => id === 't-landing')).toBe(true)
  })

  it('deleteBlock은 없는 block이면 Zustand state와 blocks identity를 유지한다', () => {
    const before = useApp.getState()

    before.deleteBlock('missing-block')

    const after = useApp.getState()
    expect(after).toBe(before)
    expect(after.blocks).toBe(before.blocks)
  })
})
