import { render, screen, waitFor } from '@/test/test-utils'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
  })

  it('renders title bar with window control buttons', () => {
    render(<App />)
    const windowButtons = screen
      .getAllByRole('button')
      .filter(
        button => button.getAttribute('aria-label')?.includes('window') ?? false
      )
    expect(windowButtons.length).toBeGreaterThan(0)
  })

  it('renders game library when data loads', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Game Library')).toBeInTheDocument()
    })
  })
})
