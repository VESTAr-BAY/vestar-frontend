import { useLanguage } from '../../../../providers/LanguageProvider'
import type { VerificationReceipt } from '../../vestar'
import { PortalButton } from '../ui/PortalButton'
import { IpfsImage } from '../ui/IpfsImage'
import { PortalPanel } from '../ui/PortalPanel'
import { PortalPill } from '../ui/PortalPill'

type OpenReceiptCardProps = {
  order: number
  receipt: VerificationReceipt
}

export function OpenReceiptCard({ order, receipt }: OpenReceiptCardProps) {
  const { lang } = useLanguage()

  return (
    <PortalPanel>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F0EDFF] px-2 text-[10px] font-semibold text-[#7140FF]">
              {order}
            </span>
            <span className="truncate font-mono text-[13px] font-semibold text-[#090A0B]">
              {receipt.walletLabel}
            </span>
          </div>
          <div className="mt-2 text-[12px] leading-[1.5] text-[#707070]">{receipt.submittedAtLabel}</div>
        </div>
        <PortalPill tone="success" size="sm">
          {lang === 'ko' ? '제출 완료' : 'Submitted'}
        </PortalPill>
      </div>

      <PortalPanel tone="muted" className="mt-3 rounded-[20px] px-3 py-3">
        <div className="text-[12px] text-[#707070]">
          {lang === 'ko' ? '이 지갑이 고른 후보' : 'Candidate picked by this wallet'}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {receipt.selections.map((selection) => (
            <PortalPill key={`${receipt.id}-${selection.key}`} tone="neutral" size="sm">
              <span className="inline-flex items-center gap-1.5">
                {selection.imageUrl ? (
                  <IpfsImage
                    uri={selection.imageUrl}
                    alt=""
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <span>{selection.emoji}</span>
                )}
                <span>{selection.name}</span>
              </span>
            </PortalPill>
          ))}
        </div>
      </PortalPanel>

      <PortalPanel tone="muted" className="mt-3 rounded-[20px] px-3 py-3">
        <div className="text-[12px] text-[#707070]">
          {lang === 'ko' ? '트랜잭션 확인값' : 'Transaction hash'}
        </div>
        <div className="mt-1 break-all font-mono text-[11px] leading-[1.65] text-[#090A0B]">
          {receipt.transactionHash}
        </div>
      </PortalPanel>

      <div className="mt-3">
        <PortalButton href={receipt.walletExplorerUrl} fullWidth size="sm">
          {lang === 'ko' ? '블록체인에서 보기' : 'View on blockchain'}
        </PortalButton>
      </div>
    </PortalPanel>
  )
}
