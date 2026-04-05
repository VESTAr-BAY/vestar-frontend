import { useEffect, useRef, useState } from 'react'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 280)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) {
      setValue('')
    }
  }, [open])

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-[300] h-14 bg-[#13141A] flex items-center gap-[10px] px-4 transition-transform duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <button
        type="button"
        aria-label="뒤로"
        onClick={onClose}
        className="flex items-center justify-center w-8 h-8 text-white/60 hover:text-white transition-colors flex-shrink-0"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="투표 검색..."
        className="flex-1 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] rounded-[10px] px-[14px] py-[10px] text-[15px] text-white placeholder:text-white/30 outline-none"
      />

      {value.length > 0 && (
        <button
          type="button"
          aria-label="지우기"
          onClick={() => setValue('')}
          className="flex items-center justify-center w-7 h-7 text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
        </button>
      )}
    </div>
  )
}
