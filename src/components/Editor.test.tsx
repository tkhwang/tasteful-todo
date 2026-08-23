import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
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

describe('Editor', () => {
  it('선택한 사이드프로젝트의 제목, season, task와 오늘 첫 일정을 표시한다', () => {
    render(<App />)

    const editor = screen.getByRole('main', { name: 'Task 편집기' })
    expect(within(editor).getByRole('heading', { level: 1 })).toHaveTextContent(
      '사이드프로젝트',
    )
    expect(editor).toHaveTextContent('2026 Q3 — tasteful-todo MVP를 출시한다.')
    expect(within(editor).getByText('랜딩페이지 초안')).toBeVisible()
    expect(within(editor).getByText('로고 시안 검토')).toBeVisible()
    expect(within(editor).getByText('도메인 구매')).toBeVisible()
    expect(within(editor).getByText('Tauri 프로젝트 셋업')).toBeVisible()
    expect(within(editor).getByText('오늘 10:00–11:30')).toBeVisible()
    expect(within(editor).getByText('^a1b2')).toBeVisible()
  })

  it('native checkbox로 task 완료 상태와 done 표현을 전환한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    const checkbox = screen.getByRole('checkbox', { name: '로고 시안 검토 완료' })
    const taskRow = checkbox.closest('.task')
    expect(taskRow).not.toBeNull()
    expect(checkbox).not.toBeChecked()
    expect(taskRow).not.toHaveClass('done')

    await user.click(checkbox)

    expect(useApp.getState().tasks.find(({ id }) => id === 't-logo')?.done).toBe(true)
    expect(checkbox).toBeChecked()
    expect(taskRow).toHaveClass('done')
  })

  it('trim한 task를 Enter로 추가하고 입력을 비운다', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByPlaceholderText('task 추가')

    await user.type(input, '  릴리즈 노트 작성  {Enter}')

    expect(screen.getByText('릴리즈 노트 작성')).toBeVisible()
    expect(input).toHaveValue('')
    expect(useApp.getState().tasks.at(-1)).toMatchObject({
      goalId: 'side-project',
      text: '릴리즈 노트 작성',
      done: false,
    })
  })

  it('공백만 입력하고 Enter를 누르면 task를 추가하지 않는다', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByPlaceholderText('task 추가')
    const taskCount = useApp.getState().tasks.length

    await user.type(input, '   {Enter}')

    expect(useApp.getState().tasks).toHaveLength(taskCount)
    expect(input).toHaveValue('   ')
  })

  it('goal 선택을 바꾸면 해당 goal의 문서와 task로 반응한다', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /이직 준비/ }))

    const editor = screen.getByRole('main', { name: 'Task 편집기' })
    expect(within(editor).getByRole('heading', { level: 1 })).toHaveTextContent('이직 준비')
    expect(within(editor).getByText('이력서 다듬기')).toBeVisible()
    expect(within(editor).queryByText('랜딩페이지 초안')).not.toBeInTheDocument()
  })

  it('완료 task는 처음부터 checked와 done 상태로 표시한다', () => {
    render(<App />)

    const checkbox = screen.getByRole('checkbox', { name: '도메인 구매 완료' })
    expect(checkbox).toBeChecked()
    expect(checkbox.closest('.task')).toHaveClass('done')
  })
})
