import { Profiler } from 'react'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { GoalList } from './GoalList'
import { useApp } from '../store'

beforeEach(() => {
  act(() => {
    useApp.setState(useApp.getInitialState(), true)
  })
})

afterEach(() => {
  cleanup()
  act(() => {
    useApp.setState(useApp.getInitialState(), true)
  })
})

describe('GoalList', () => {
  it('Inbox를 goal 순서와 무관하게 첫 번째에 고정하고 open-count badge를 표시한다', () => {
    const initialState = useApp.getInitialState()
    const inbox = initialState.goals.find((goal) => goal.isInbox === true)
    if (inbox === undefined) {
      throw new TypeError('Expected the Inbox goal to exist')
    }
    useApp.setState({ goals: [...initialState.goals.filter((goal) => goal !== inbox), inbox] })

    render(<App />)

    const goalList = screen.getByRole('complementary', { name: '목표 목록' })
    const goalButtons = within(goalList)
      .getAllByRole('button')
      .filter((button) => !button.hasAttribute('disabled'))
    expect(goalButtons[0]).toHaveAccessibleName(/Inbox/)
    expect(within(screen.getByRole('button', { name: /사이드프로젝트/ })).getByText('3')).toBeVisible()
  })

  it('goal button을 클릭하면 선택 상태와 semantic pressed state를 함께 바꾼다', async () => {
    const user = userEvent.setup()
    render(<App />)

    const sideProject = screen.getByRole('button', { name: /사이드프로젝트/ })
    const job = screen.getByRole('button', { name: /이직 준비/ })
    expect(sideProject).toHaveClass('selected')
    expect(sideProject).toHaveAttribute('aria-pressed', 'true')
    expect(job).toHaveAttribute('aria-pressed', 'false')

    await user.click(job)

    expect(useApp.getState().selectedGoalId).toBe('job')
    expect(job).toHaveClass('selected')
    expect(job).toHaveAttribute('aria-pressed', 'true')
    expect(sideProject).not.toHaveClass('selected')
    expect(sideProject).toHaveAttribute('aria-pressed', 'false')
  })

  it('task 완료 상태가 바뀌면 open-count badge와 accessible label을 갱신한다', () => {
    render(<App />)
    const sideProject = screen.getByRole('button', {
      name: '사이드프로젝트, 미완료 task 3개',
    })

    act(() => {
      useApp.getState().toggleTask('t-logo')
    })

    expect(within(sideProject).getByText('2')).toBeVisible()
    expect(sideProject).toHaveAccessibleName('사이드프로젝트, 미완료 task 2개')
  })

  it('task text만 수정하면 GoalList를 다시 렌더하지 않는다', () => {
    let updateCount = 0
    render(
      <Profiler
        id="goal-list"
        onRender={(_id, phase) => {
          if (phase === 'update') {
            updateCount += 1
          }
        }}
      >
        <GoalList />
      </Profiler>,
    )

    act(() => {
      useApp.getState().updateTaskText('t-logo', '로고 최종안 검토')
    })

    expect(updateCount).toBe(0)
  })

  it('새 목표 action은 M2까지 접근 가능하지만 비활성화되어 있다', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: '새 목표' })).toBeDisabled()
  })
})
