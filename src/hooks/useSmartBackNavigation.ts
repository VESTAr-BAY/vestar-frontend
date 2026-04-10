import { useCallback } from 'react'
import { useNavigate } from 'react-router'

function canUseHistoryBack() {
  if (typeof window === 'undefined') return false

  const historyState = window.history.state as { idx?: number } | null
  return typeof historyState?.idx === 'number' && historyState.idx > 0
}

export function useSmartBackNavigation(fallbackPath: string) {
  const navigate = useNavigate()

  return useCallback(() => {
    if (canUseHistoryBack()) {
      navigate(-1)
      return
    }

    navigate(fallbackPath, { replace: true })
  }, [fallbackPath, navigate])
}
