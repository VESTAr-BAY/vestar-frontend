import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../providers/LanguageProvider'

export function PwaUpdatePrompt() {
  const { t } = useLanguage()
  const [needRefresh, setNeedRefresh] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const hasReloadedRef = useRef(false)

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

    let intervalId: number | null = null
    const serviceWorkerScope = import.meta.env.BASE_URL
    const serviceWorkerUrl = `${serviceWorkerScope}sw.js`

    const handleControllerChange = () => {
      if (hasReloadedRef.current) return
      hasReloadedRef.current = true
      window.location.reload()
    }

    const watchInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) return

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          setNeedRefresh(true)
        }
      })
    }

    const registerServiceWorker = async () => {
      try {
        // sungje : PWA service worker는 배포 base(/vote/) 아래에서 등록되어야 standalone 진입과 내부 라우팅이 깨지지 않는다.
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
          scope: serviceWorkerScope,
        })

        if (registration.waiting && navigator.serviceWorker.controller) {
          setNeedRefresh(true)
        }

        watchInstallingWorker(registration.installing)
        registration.addEventListener('updatefound', () => {
          watchInstallingWorker(registration.installing)
        })

        await registration.update()
        intervalId = window.setInterval(() => {
          registration.update().catch(() => {})
        }, 60_000)
      } catch (error) {
        console.error('Failed to register service worker', error)
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    registerServiceWorker()

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  if (!needRefresh) return null

  const handleUpdate = async () => {
    if (isUpdating) return

    try {
      setIsUpdating(true)
      const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        return
      }

      await registration?.update()
      setIsUpdating(false)
    } catch (error) {
      console.error('Failed to update service worker', error)
      setIsUpdating(false)
    }
  }

  return (
    <div className="pointer-events-none fixed right-0 bottom-[calc(var(--footer-h)+1rem)] left-0 z-[550] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-[390px] overflow-hidden rounded-3xl border border-violet-500/40 bg-linear-to-r from-violet-700 via-violet-700 to-violet-600 text-white shadow-[0_18px_45px_rgba(76,29,149,0.35)]">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-[-0.01em]">{t('pwa_update_ready')}</p>
            <p className="mt-1 text-[12px] leading-5 text-violet-100">{t('pwa_update_desc')}</p>
          </div>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="shrink-0 rounded-full bg-violet-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-violet-950 disabled:cursor-wait disabled:bg-violet-800"
          >
            {isUpdating ? t('pwa_update_loading') : t('btn_update_version')}
          </button>
        </div>
      </div>
    </div>
  )
}
