import { useEffect, useRef } from 'react'
import { useLanguage } from '../../providers/LanguageProvider'

interface InfiniteScrollSentinelProps {
  onVisible: () => void
  isLoading: boolean
  hasMore: boolean
}

export function InfiniteScrollSentinel({
  onVisible,
  isLoading,
  hasMore,
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const el = ref.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          onVisible()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onVisible, isLoading, hasMore])

  return (
    <div ref={ref} className="flex items-center justify-center py-6">
      {isLoading && hasMore && (
        <div className="w-6 h-6 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
      )}
      {!hasMore && <p className="text-[12px] text-[#707070] font-mono">{t('is_all_caught_up')}</p>}
    </div>
  )
}
