import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('app shell', () => {
  it('renders the titlebar and three workspace columns', () => {
    const { container } = render(<App />)

    expect(screen.getByText('goals/')).toBeInTheDocument()
    expect(screen.getByText('사이드프로젝트.md')).toBeInTheDocument()
    expect(container.querySelector('.titlebar')).toHaveAttribute('data-tauri-drag-region')
    expect(screen.getByText('goals/')).toHaveAttribute('data-tauri-drag-region')
    expect(screen.getByText('사이드프로젝트.md')).toHaveAttribute('data-tauri-drag-region')
    expect(container.querySelectorAll('.titlebar > [data-tauri-drag-region]')).toHaveLength(3)
    expect(container.querySelectorAll('.columns > *')).toHaveLength(3)
    expect(screen.getByRole('complementary', { name: '목표 목록' })).toBeInTheDocument()
    expect(container.querySelector('.editor')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: '타임라인' })).toBeInTheDocument()
  })
})
