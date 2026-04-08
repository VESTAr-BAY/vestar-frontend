import type { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 z-[200] transition-[background] duration-[280ms] ${
          open
            ? 'bg-[rgba(9,10,11,0.65)] pointer-events-auto'
            : 'bg-transparent pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[201] transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-[#E7E9ED]" />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-[17px] font-semibold text-[#090A0B]">{title}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F7F8FA] transition-colors text-[#707070]"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-8 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </>
  )
}
