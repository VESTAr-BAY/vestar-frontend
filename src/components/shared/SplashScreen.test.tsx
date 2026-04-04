import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SplashScreen } from './SplashScreen'

describe('SplashScreen', () => {
  it('renders the VESTAr brand name', () => {
    render(<SplashScreen onDone={vi.fn()} />)
    expect(screen.getByTestId('splash-brand')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<SplashScreen onDone={vi.fn()} />)
    expect(screen.getByText(/K-pop/i)).toBeInTheDocument()
  })

  it('calls onDone after animation completes', async () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<SplashScreen onDone={onDone} />)
    vi.advanceTimersByTime(2100)
    expect(onDone).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
