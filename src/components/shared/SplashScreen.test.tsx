import { render, screen } from '@testing-library/react'
import { SplashScreen } from './SplashScreen'

describe('SplashScreen', () => {
  it('shows the VESTAr brand text', () => {
    render(<SplashScreen onDone={() => {}} />)
    expect(screen.getByTestId('splash-brand')).toBeInTheDocument()
  })

  /**
   * The splash icon should use the PWA app icon (pwa-icon.svg),
   * not the old inline SVG checkmark.
   */
  it('renders the PWA app icon image', () => {
    render(<SplashScreen onDone={() => {}} />)
    const icon = screen.getByRole('img', { name: /vestar/i })
    expect(icon).toBeInTheDocument()
    expect(icon.getAttribute('src')).toMatch(/pwa-icon\.svg/)
  })

  it('does NOT render the old inline checkmark SVG', () => {
    const { container } = render(<SplashScreen onDone={() => {}} />)
    // The old icon was an SVG with a <polyline> checkmark element
    expect(container.querySelector('polyline')).not.toBeInTheDocument()
  })
})
