import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DetailHeader } from './DetailHeader'

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}))

const defaultProps = {
  title: 'Test Vote',
  onBack: vi.fn(),
  onOpenPanel: vi.fn(),
  onOpenSearch: vi.fn(),
}

describe('DetailHeader – iPhone notch adaptation', () => {
  it('default state: uses var(--header-h) height and var(--safe-top) padding-top', () => {
    const { container } = render(<DetailHeader scrollState="default" {...defaultProps} />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('h-[var(--header-h)]')
    expect(header?.className).toContain('pt-[var(--safe-top)]')
  })

  it('hidden state: offset uses var(--header-h) so notch height is included', () => {
    const { container } = render(<DetailHeader scrollState="hidden" {...defaultProps} />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('-top-[var(--header-h)]')
    expect(header?.className).toContain('h-[var(--header-h)]')
    expect(header?.className).toContain('pt-[var(--safe-top)]')
  })

  it('floating state: top position accounts for safe-area-inset-top', () => {
    const { container } = render(<DetailHeader scrollState="floating" {...defaultProps} />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('top-[calc(var(--safe-top)+10px)]')
  })
})
