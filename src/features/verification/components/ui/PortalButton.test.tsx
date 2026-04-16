import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PortalButton } from './PortalButton'

describe('PortalButton', () => {
  it('applies custom class names to the rendered button', () => {
    render(
      <PortalButton className="whitespace-normal leading-[1.2]">Show private key</PortalButton>,
    )

    expect(screen.getByRole('button', { name: 'Show private key' })).toHaveClass(
      'whitespace-normal',
      'leading-[1.2]',
    )
  })
})
