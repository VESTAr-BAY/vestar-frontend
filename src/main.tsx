import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './providers/LanguageProvider'
import { ToastProvider } from './providers/ToastProvider'
import { WalletProvider } from './providers/WalletProvider'
import { resolveInitialEntryRedirectPath } from './utils/navigation'

const INITIAL_ROUTE_SESSION_KEY = 'vestar:initial-route-redirected:v1'

function redirectInitialEntryToVote() {
  if (typeof window === 'undefined') return

  try {
    const alreadyRedirected = window.sessionStorage.getItem(INITIAL_ROUTE_SESSION_KEY)
    if (alreadyRedirected) return

    window.sessionStorage.setItem(INITIAL_ROUTE_SESSION_KEY, '1')

    const basePath = import.meta.env.BASE_URL ?? '/'
    const currentPath = window.location.pathname
    const redirectPath = resolveInitialEntryRedirectPath(basePath, currentPath)

    if (redirectPath && currentPath !== redirectPath) {
      window.history.replaceState(null, '', redirectPath)
    }
  } catch {
    // If sessionStorage is unavailable, fall back to the current route without interrupting boot.
  }
}

redirectInitialEntryToVote()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <WalletProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </WalletProvider>
    </LanguageProvider>
  </StrictMode>,
)
