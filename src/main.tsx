import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './providers/LanguageProvider'
import { ToastProvider } from './providers/ToastProvider'
import { WalletProvider } from './providers/WalletProvider'

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
