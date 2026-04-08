import { useLanguage } from '../../providers/LanguageProvider'
import type { SubmitState } from '../../hooks/user/useVoteSubmit'

interface VoteBottomSheetContentProps {
  state: SubmitState
  txHash: string | null
  karmaEarned: number
  onClose: () => void
}

function LoadingPhase({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-10 gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
      <span className="text-[14px] text-[#707070]">{label}</span>
    </div>
  )
}

function SuccessPhase({
  txHash,
  karmaEarned,
  onClose,
  t,
}: {
  txHash: string | null
  karmaEarned: number
  onClose: () => void
  t: (key: Parameters<ReturnType<typeof useLanguage>['t']>[0]) => string
}) {
  return (
    <div>
      {/* Success icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.2)] flex items-center justify-center animate-pop-in">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22C55E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
      </div>

      <h3 className="text-[18px] font-bold text-[#090A0B] text-center mb-1">
        {t('bs_success_title')}
      </h3>
      <p className="text-[13px] text-[#707070] text-center mb-5">{t('bs_success_sub')}</p>

      {/* TX hash */}
      {txHash && (
        <div className="bg-[#F7F8FA] rounded-xl px-3 py-2.5 mb-4">
          <div className="text-[10px] text-[#707070] mb-1 font-mono uppercase tracking-wider">
            {t('bs_receipt')}
          </div>
          <div className="text-[12px] font-mono text-[#7140FF] break-all">{txHash}</div>
        </div>
      )}

      {/* Karma card */}
      <div className="bg-[#FEF9EC] border border-[#FDE68A] rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="text-[14px] font-bold text-[#92400E]">+{karmaEarned} Karma Points</div>
          <div className="text-[12px] text-[#B45309]">{t('bs_karma_reward')}</div>
        </div>
      </div>

      {/* Ad slot */}
      <div className="bg-[#13141A] rounded-xl p-4 mb-5">
        <div className="text-[9px] text-white/30 uppercase tracking-wider font-mono mb-2">
          Sponsored
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
            🎧
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">
              Samsung Galaxy Buds3 Pro
            </div>
            <div className="text-[11px] text-white/40 truncate">
              Premium wireless earbuds · Special price
            </div>
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="w-full bg-[#F7F8FA] text-[#090A0B] rounded-2xl py-4 text-[15px] font-semibold hover:bg-[#E7E9ED] transition-colors"
      >
        {t('btn_close')}
      </button>
    </div>
  )
}

export function VoteBottomSheetContent({
  state,
  txHash,
  karmaEarned,
  onClose,
}: VoteBottomSheetContentProps) {
  const { t } = useLanguage()

  if (state === 'success')
    return <SuccessPhase txHash={txHash} karmaEarned={karmaEarned} onClose={onClose} t={t} />
  return <LoadingPhase label={t('bs_processing')} />
}
