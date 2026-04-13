import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LanguageProvider } from '../../providers/LanguageProvider'
import { FooterNav } from './FooterNav'

function renderFooter(scrollState: 'default' | 'hidden' | 'floating' = 'default') {
  const { container } = render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/vote']}>
        <FooterNav scrollState={scrollState} />
      </MemoryRouter>
    </LanguageProvider>,
  )
  return container.firstElementChild as HTMLElement
}

describe('FooterNav — safe-area bottom padding', () => {
  /**
   * Regression: iPhone showed a visible dark gap below the nav items because
   * pb-[var(--safe-bottom)] pushed the content up inside a taller footer.
   * After the fix, neither the default nor hidden state should carry that
   * extra bottom padding — the home indicator floats over the footer naturally.
   */
  it('default state does NOT add safe-bottom padding to the nav', () => {
    const nav = renderFooter('default')
    expect(nav.className).not.toContain('pb-[var(--safe-bottom)]')
  })

  it('hidden state does NOT add safe-bottom padding to the nav', () => {
    const nav = renderFooter('hidden')
    expect(nav.className).not.toContain('pb-[var(--safe-bottom)]')
  })

  it('floating state renders without bottom-safe padding (already uses fixed offset)', () => {
    const nav = renderFooter('floating')
    expect(nav.className).not.toContain('pb-[var(--safe-bottom)]')
  })
})

describe('FooterNav — renders nav items', () => {
  it('renders home and mypage buttons', () => {
    const { getAllByRole } = render(
      <LanguageProvider>
        <MemoryRouter initialEntries={['/vote']}>
          <FooterNav scrollState="default" />
        </MemoryRouter>
      </LanguageProvider>,
    )
    const buttons = getAllByRole('button')
    expect(buttons).toHaveLength(2)
  })
})
