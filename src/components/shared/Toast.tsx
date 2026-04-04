import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  message: string
  onRemove: (id: string) => void
}

const ICON: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
}

const ICON_COLORS: Record<ToastType, string> = {
  success: 'text-[#22C55E]',
  error: 'text-[#EF4444]',
  info: 'text-[#7140FF]',
}

export function Toast({ id, type, message, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 3000)
    return () => clearTimeout(timer)
  }, [id, onRemove])

  return (
    <div className="flex items-center gap-3 bg-white border border-[#E7E9ED] rounded-2xl px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.10)] animate-[slideUp_0.25s_ease-out]">
      <span className={`text-[15px] font-bold flex-shrink-0 ${ICON_COLORS[type]}`}>
        {ICON[type]}
      </span>
      <span className="text-[14px] font-medium text-[#090A0B] flex-1">{message}</span>
      <button
        type="button"
        aria-label="닫기"
        onClick={() => onRemove(id)}
        className="text-[#707070] hover:text-[#090A0B] transition-colors text-[18px] leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  )
}
