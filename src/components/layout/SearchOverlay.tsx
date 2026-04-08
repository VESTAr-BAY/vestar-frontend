import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { HOT_VOTES, VOTE_ITEMS } from '../../data/mockVotes'
import { useLanguage } from '../../providers/LanguageProvider'
import type { BadgeVariant } from '../../types/vote'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]',
  hot: 'bg-[rgba(239,68,68,0.10)] text-[#dc2626]',
  new: 'bg-[rgba(113,64,255,0.09)] text-[#7140FF]',
  end: 'bg-black/[0.06] text-[#707070]',
}

const BADGE_LABEL: Record<BadgeVariant, string> = {
  live: 'LIVE',
  hot: 'HOT',
  new: 'NEW',
  end: 'END',
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => inputRef.current?.focus(), 280)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) setValue('')
  }, [open])

  const results = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return VOTE_ITEMS.filter(
      (v) => v.name.toLowerCase().includes(q) || v.org.toLowerCase().includes(q),
    ).slice(0, 10)
  }, [value])

  const handleSelect = (id: string) => {
    onClose()
    navigate(`/vote/${id}`)
  }

  const handleSearch = () => {
    if (results.length > 0) {
      handleSelect(results[0].id)
    }
  }

  const hasQuery = value.trim().length > 0

  return (
    <div
      className={`absolute inset-0 z-[300] bg-white flex flex-col transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        open
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
      {/* ── Top search bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          {/* Back */}
          <button
            type="button"
            aria-label={t('btn_back')}
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.05] hover:bg-black/[0.09] transition-colors flex-shrink-0"
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
              strokeLinejoin="round"
              className="text-[#13141A]"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>

          {/* Input wrapper */}
          <div className="flex-1 flex items-center bg-[#F7F8FA] border border-black/[0.08] rounded-2xl px-4 gap-2">
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#13141A]/30 flex-shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('search_placeholder')}
              className="flex-1 bg-transparent py-[10px] text-[15px] text-[#090A0B] placeholder:text-[#13141A]/30 outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {value.length > 0 && (
              <button
                type="button"
                aria-label={t('search_clear')}
                onClick={() => setValue('')}
                className="flex-shrink-0 text-[#13141A]/30 hover:text-[#13141A]/60 transition-colors"
              >
                <svg
                  aria-hidden="true"
                  width="15"
                  height="15"
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
            {/* 검색 / Go button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={!hasQuery}
              className="flex-shrink-0 bg-[#7140FF] disabled:bg-[#E7E9ED] text-white disabled:text-[#707070] text-[12px] font-semibold rounded-xl px-3 py-[5px] transition-colors"
            >
              {lang === 'ko' ? '검색' : 'Go'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!hasQuery ? (
          <TrendingSection onSelect={handleSelect} trendingLabel={t('search_trending')} />
        ) : results.length > 0 ? (
          <div>
            <div className="px-5 pt-3 pb-2 text-[11px] font-mono text-[#13141A]/30 uppercase tracking-wider">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 border-b border-black/[0.05] hover:bg-black/[0.03] active:bg-black/[0.05] transition-colors text-left"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: item.emojiColor }}
                >
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#090A0B] truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-[#707070] font-mono truncate">{item.org}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={`text-[9px] font-bold font-mono px-2 py-[3px] rounded-[8px] tracking-[0.4px] uppercase ${BADGE_STYLES[item.badge]}`}
                  >
                    {BADGE_LABEL[item.badge]}
                  </span>
                  <span className="text-[11px] text-[#707070] font-mono">{item.count}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="text-5xl mb-4">🔍</div>
            <div className="text-[16px] font-bold text-[#090A0B] mb-2">
              {t('search_no_results')}
            </div>
            <div className="text-[13px] text-[#707070]">{t('search_no_results_sub')}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Trending section ──────────────────────────────────────────────────────────

function TrendingSection({
  onSelect,
  trendingLabel,
}: {
  onSelect: (id: string) => void
  trendingLabel: string
}) {
  return (
    <div>
      <div className="px-5 pt-4 pb-3">
        <span className="text-[13px] font-bold text-[#090A0B]">{trendingLabel}</span>
      </div>

      {HOT_VOTES.map((vote, idx) => (
        <button
          key={vote.id}
          type="button"
          onClick={() => onSelect(vote.id)}
          className="w-full flex items-center gap-4 px-5 py-4 border-b border-black/[0.05] hover:bg-black/[0.03] active:bg-black/[0.05] transition-colors text-left"
        >
          <span className="text-[17px] font-bold font-mono text-[#13141A]/20 w-5 text-center flex-shrink-0">
            {idx + 1}
          </span>

          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: vote.gradient }}
          >
            {vote.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-[#090A0B] truncate leading-snug">
              {vote.name}
            </div>
            <div className="text-[11px] text-[#707070] font-mono truncate">{vote.org}</div>
          </div>

          <span
            className={`text-[9px] font-bold font-mono px-2 py-[3px] rounded-[8px] tracking-[0.4px] uppercase flex-shrink-0 ${BADGE_STYLES[vote.badge]}`}
          >
            {BADGE_LABEL[vote.badge]}
          </span>
        </button>
      ))}
    </div>
  )
}
