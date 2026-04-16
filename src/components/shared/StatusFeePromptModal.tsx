import { useLanguage } from '../../providers/LanguageProvider'
import { formatStatusFeeAmount } from '../../utils/statusFee'

interface StatusFeePromptModalProps {
  open: boolean
  title: string
  description: string
  estimatedFee: bigint
  note?: string
  busyAction?: 'recheck' | 'proceed' | null
  onProceed: () => void
  onRefresh: () => void
  onClose: () => void
}

export function StatusFeePromptModal({
  open,
  title,
  description,
  estimatedFee,
  note,
  busyAction = null,
  onProceed,
  onRefresh,
  onClose,
}: StatusFeePromptModalProps) {
  const { lang } = useLanguage()

  if (!open) {
    return null
  }

  const isBusy = busyAction !== null
  const copy =
    lang === 'ko'
      ? {
          eyebrow: 'Premium Fee',
          feeLabel: '예상 네트워크 수수료',
          proceed: busyAction === 'proceed' ? '전송 준비 중...' : '수수료 내기',
          refresh: busyAction === 'recheck' ? '재확인 중...' : '재확인하기',
          close: '나중에 하기',
        }
      : {
          eyebrow: 'Premium Fee',
          feeLabel: 'Estimated network fee',
          proceed: busyAction === 'proceed' ? 'Preparing...' : 'Pay Fee',
          refresh: busyAction === 'recheck' ? 'Rechecking...' : 'Recheck',
          close: 'Later',
        }

  return (
    <div className="fixed inset-0 z-[520] flex items-center justify-center px-5">
      <button
        type="button"
        aria-label={copy.close}
        onClick={onClose}
        disabled={isBusy}
        className="absolute inset-0 bg-[rgba(9,10,11,0.65)]"
      />

      <div className="relative z-[521] w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.30)]">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-[rgba(113,64,255,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7140FF]">
            {copy.eyebrow}
          </div>
        </div>

        <h2 className="text-center text-[20px] font-bold leading-tight text-[#090A0B]">{title}</h2>
        <p className="mt-3 text-center text-[14px] leading-relaxed text-[#5B6470]">{description}</p>

        <div className="mt-5 rounded-2xl border border-[#E9DDFC] bg-[rgba(113,64,255,0.05)] px-4 py-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7140FF]">
            {copy.feeLabel}
          </div>
          <div className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[#090A0B]">
            {formatStatusFeeAmount(estimatedFee)}
          </div>
          {note ? (
            <div className="mt-2 text-[12px] leading-relaxed text-[#707070]">{note}</div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={onProceed}
            disabled={isBusy}
            className="w-full rounded-2xl bg-[#F7F8FA] py-4 text-[15px] font-bold text-[#707070] disabled:bg-[#EEF1F5] disabled:text-[#A7AFBC]"
          >
            {copy.proceed}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isBusy}
            className="w-full rounded-2xl border border-[#D8DCE6] bg-white py-4 text-[15px] font-bold text-[#090A0B] disabled:text-[#9AA2AF]"
          >
            {copy.refresh}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="w-full rounded-2xl bg-[#7140FF] py-4 text-[15px] font-semibold text-white disabled:bg-[#D9CCFF] disabled:text-white/80"
          >
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  )
}
