import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SkeletonBox } from './SkeletonBox'

describe('SkeletonBox', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<SkeletonBox />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('renders with aria-hidden for screen readers', () => {
    const { container } = render(<SkeletonBox />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies additional className', () => {
    const { container } = render(<SkeletonBox className="w-32 h-4" />)
    expect(container.firstChild).toHaveClass('w-32', 'h-4')
  })
})
