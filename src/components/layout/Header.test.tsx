import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { LanguageProvider } from '../../providers/LanguageProvider'
import { WalletProvider } from '../../providers/WalletProvider'
import { Header } from './Header'

function renderHeader(pathname: string) {
  return render(
    <LanguageProvider>
      <WalletProvider>
        <MemoryRouter initialEntries={[pathname]}>
          <Routes>
            <Route
              path="*"
              element={
                <Header scrollState="default" onOpenPanel={() => {}} onOpenSearch={() => {}} />
              }
            />
          </Routes>
        </MemoryRouter>
      </WalletProvider>
    </LanguageProvider>,
  )
}

describe('Header — back button visibility', () => {
  it('hides back button on /vote (home page)', () => {
    renderHeader('/vote')
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('hides back button on /mypage', () => {
    renderHeader('/mypage')
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('shows back button on a vote detail page', () => {
    renderHeader('/vote/abc123')
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
  })

  it('shows back button on a host route', () => {
    renderHeader('/host/manage/xyz')
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
  })

  /**
   * PWA first-open regression test.
   *
   * In production the Vite base is '/vote/', so the PWA start_url is '/vote/'.
   * `redirectInitialEntryToVote()` converts that to '/vote/vote'.
   * WITHOUT `basename` in createBrowserRouter, React Router sees pathname '/vote/vote'
   * which is NOT in isHomeLike → back button is displayed (bug).
   *
   * The Header component is only responsible for the isHomeLike logic; the Router
   * is responsible for supplying the correct stripped pathname. This test confirms
   * the Header's contract: given the *correct* '/vote' pathname it must NOT show
   * the back button.  The router basename fix is what ensures '/vote/vote' → '/vote'.
   */
  it('does NOT show back button when router correctly resolves PWA start URL to /vote', () => {
    // After the basename fix, React Router strips '/vote/' prefix so the Header
    // always receives '/vote', not '/vote/vote'.
    renderHeader('/vote')
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })
})

describe('Header — logo visibility', () => {
  it('shows VESTAr logo on home page /vote', () => {
    const { container } = renderHeader('/vote')
    // Logo is a <span> containing "VEST<span>A</span>r" — check for the purple "A" span
    const purpleA = container.querySelector('.text-\\[\\#7140FF\\]')
    expect(purpleA).toBeInTheDocument()
    expect(purpleA?.textContent).toBe('A')
  })

  it('hides VESTAr logo on detail pages', () => {
    const { container } = renderHeader('/vote/abc123')
    const purpleA = container.querySelector('.text-\\[\\#7140FF\\]')
    expect(purpleA).not.toBeInTheDocument()
  })
})
