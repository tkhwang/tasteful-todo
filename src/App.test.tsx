import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('app shell', () => {
  it('renders the titlebar and three workspace columns', () => {
    const { container } = render(<App />)

    expect(screen.getByText('goals/')).toBeInTheDocument()
    expect(screen.getByText('tasteful-todo')).toBeInTheDocument()
    expect(container.querySelector('.titlebar')).toHaveAttribute('data-tauri-drag-region')
    expect(container.querySelectorAll('.columns > *')).toHaveLength(3)
    expect(container.querySelector('.goals')).toBeInTheDocument()
    expect(container.querySelector('.editor')).toBeInTheDocument()
    expect(container.querySelector('.timeline')).toBeInTheDocument()
  })
})
