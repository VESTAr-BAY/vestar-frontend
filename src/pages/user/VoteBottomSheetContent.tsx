import karmaIcon from '../../assets/karma.svg'
import type { SubmitState } from '../../hooks/user/useVoteSubmit'
import { useLanguage } from '../../providers/LanguageProvider'

interface VoteBottomSheetContentProps {
  state: SubmitState
  txHash: string | null
  karmaEarned: number
  selectedCandidateLabels: string[]
  isPrivateVote: boolean
  showManualWalletOpen?: boolean
  onOpenWallet?: () => void
  onClose: () => void
}

function LoadingPhase({
  title,
  label,
  selectedCandidateLabels,
  isPrivateVote,
  showManualWalletOpen,
  onOpenWallet,
  t,
}: {
  title: string
  label: string
  selectedCandidateLabels: string[]
  isPrivateVote: boolean
  showManualWalletOpen?: boolean
  onOpenWallet?: () => void
  t: (key: Parameters<ReturnType<typeof useLanguage>['t']>[0]) => string
}) {
  return (
    <div className="flex flex-col items-center py-10 gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
      <div className="text-center">
        <div className="text-[16px] font-bold text-[#090A0B] mb-1">{title}</div>
        <div className="text-[14px] text-[#707070]">{label}</div>
      </div>

      {selectedCandidateLabels.length > 0 && (
        <div className="w-full rounded-2xl bg-[#F7F8FA] border border-[#E7E9ED] px-4 py-3">
          <div className="text-[11px] text-[#707070] font-mono uppercase tracking-[1px] mb-2">
            {t('bs_selected_candidates')}
          </div>
          <div className="text-[14px] text-[#090A0B] font-medium leading-relaxed break-words">
            {selectedCandidateLabels.join(', ')}
          </div>
        </div>
      )}

      {isPrivateVote && (
        <div className="w-full rounded-2xl bg-[#FEF5E7] border border-[#FDE68A] px-4 py-3 text-[12px] leading-relaxed text-[#92400E]">
          {t('bs_private_vote_note')}
        </div>
      )}

      {showManualWalletOpen && onOpenWallet ? (
        <div className="w-full rounded-2xl border border-[rgba(113,64,255,0.16)] bg-[#F7F4FF] px-4 py-3">
          <div className="text-[13px] font-semibold text-[#5B21B6]">{t('bs_open_wallet_hint')}</div>
          <div className="mt-1 text-[12px] leading-relaxed text-[#7140FF]">
            {t('bs_open_wallet_sub')}
          </div>
          <button
            type="button"
            onClick={onOpenWallet}
            className="mt-3 w-full rounded-2xl border border-[rgba(113,64,255,0.18)] bg-white px-4 py-3 text-[14px] font-semibold text-[#7140FF] transition-colors hover:bg-[#F7F4FF]"
          >
            {t('bs_open_wallet')}
          </button>
        </div>
      ) : null}
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
        <img src={karmaIcon} alt="" className="w-6 h-6 flex-shrink-0" />
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
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[11px] font-mono text-white/50 flex-shrink-0">
            AD
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
  selectedCandidateLabels,
  isPrivateVote,
  showManualWalletOpen,
  onOpenWallet,
  onClose,
}: VoteBottomSheetContentProps) {
  const { t } = useLanguage()

  if (state === 'success')
    return <SuccessPhase txHash={txHash} karmaEarned={karmaEarned} onClose={onClose} t={t} />

  return (
    <LoadingPhase
      title={state === 'awaiting_signature' ? t('bs_confirm_wallet') : t('bs_processing')}
      label={state === 'awaiting_signature' ? t('bs_confirm_wallet_sub') : t('bs_processing_sub')}
      selectedCandidateLabels={selectedCandidateLabels}
      isPrivateVote={isPrivateVote}
      showManualWalletOpen={state === 'awaiting_signature' ? showManualWalletOpen : false}
      onOpenWallet={onOpenWallet}
      t={t}
    />
  )
}
