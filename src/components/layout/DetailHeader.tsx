import accountCircleIcon from '../../assets/account_circle.svg'
import keyboardArrowLeft from '../../assets/keyboard_arrow_left.svg'
import type { ScrollState } from '../../hooks/useScrollDirection'

interface DetailHeaderProps {
  scrollState: ScrollState
  title: string
  onBack: () => void
  onShare?: () => void
  onOpenPanel: () => void
  onOpenSearch: () => void
}

const STATE_CLASSES: Record<ScrollState, string> = {
  default: 'top-0 w-full max-w-[430px] h-14 bg-[#13141A] px-4',
  hidden: '-top-[66px] w-full max-w-[430px] h-14 bg-[#13141A] px-4',
  floating:
    'top-[10px] w-[calc(100%-32px)] max-w-[calc(430px-32px)] h-12 rounded-2xl bg-[#1C2033] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.25)] px-4',
}

export function DetailHeader({
  scrollState,
  title,
  onBack,
  onShare,
  onOpenPanel,
}: DetailHeaderProps) {
  return (
    <header
      className={`fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${STATE_CLASSES[scrollState]}`}
    >
      {/* Back button */}
      <button
        type="button"
        aria-label="뒤로가기"
        onClick={onBack}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-colors flex-shrink-0"
      >
        <img src={keyboardArrowLeft} alt="" className="w-6 h-6 brightness-0 invert" />
      </button>

      {/* Logo */}
      <span className="font-mono text-base font-medium tracking-[1.5px] text-white uppercase flex-shrink-0">
        VEST<span className="text-[#7140FF]">A</span>r
      </span>

      {/* Title */}
      <span className="flex-1 text-[13px] font-semibold text-white/60 truncate">{title}</span>

      {/* Share button (optional) */}
      {onShare && (
        <button
          type="button"
          aria-label="공유"
          onClick={onShare}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-colors flex-shrink-0 text-white"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
        </button>
      )}

      {/* Profile avatar */}
      <button
        type="button"
        aria-label="프로필"
        onClick={onOpenPanel}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:ring-1 hover:ring-[#7140FF] transition-all flex-shrink-0"
      >
        <img
          src={accountCircleIcon}
          alt=""
          className="w-8 h-8 rounded-full brightness-0 invert opacity-55"
        />
      </button>
    </header>
  )
}
