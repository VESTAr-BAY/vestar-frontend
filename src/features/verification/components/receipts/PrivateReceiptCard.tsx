import { useEffect, useState } from 'react'
import { useLanguage } from '../../../../providers/LanguageProvider'
import type { VerificationReceipt } from '../../vestar'
import { truncateMiddle } from '../../vestar/utils'
import { PortalButton } from '../ui/PortalButton'
import { PortalPanel } from '../ui/PortalPanel'
import { PortalPill } from '../ui/PortalPill'

type PrivateReceiptCardProps = {
  order: number
  receipt: VerificationReceipt
  canDecrypt: boolean
}

export function PrivateReceiptCard({ order, receipt, canDecrypt }: PrivateReceiptCardProps) {
  const { lang } = useLanguage()
  const [showDecrypted, setShowDecrypted] = useState(false)
  const [showFullEncryptedBallot, setShowFullEncryptedBallot] = useState(false)
  const truncatedEncryptedBallot = receipt.encryptedBallot
    ? truncateMiddle(receipt.encryptedBallot, 24, 18)
    : null
  const canExpandEncryptedBallot =
    receipt.encryptedBallot !== null && truncatedEncryptedBallot !== receipt.encryptedBallot

  useEffect(() => {
    if (!canDecrypt) {
      setShowDecrypted(false)
    }
  }, [canDecrypt])

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
        <div className="text-[12px] text-[#707070]">{lang === 'ko' ? '암호문' : 'Ciphertext'}</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="text-[13px] font-semibold text-[#090A0B]">
            {lang === 'ko' ? '체인에 남은 암호문' : 'Ciphertext stored on chain'}
          </div>
          {canExpandEncryptedBallot ? (
            <button
              type="button"
              onClick={() => setShowFullEncryptedBallot((current) => !current)}
              className="shrink-0 rounded-full border border-[#D8DCEF] px-2 py-1 text-[10px] font-semibold leading-none text-[#5C4FE5] transition-colors duration-200 hover:border-[#7140FF] hover:text-[#7140FF]"
            >
              {showFullEncryptedBallot
                ? lang === 'ko'
                  ? '접기'
                  : 'Collapse'
                : lang === 'ko'
                  ? '전체보기'
                  : 'Expand'}
            </button>
          ) : null}
        </div>
        <div className="mt-1 break-all font-mono text-[11px] leading-[1.65] text-[#090A0B]">
          {receipt.encryptedBallot
            ? showFullEncryptedBallot
              ? receipt.encryptedBallot
              : truncatedEncryptedBallot
            : lang === 'ko'
              ? '암호문을 불러오지 못했어요'
              : 'Failed to load the ciphertext'}
        </div>
      </PortalPanel>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <PortalButton
          disabled={!canDecrypt}
          onClick={() => {
            if (!canDecrypt) return
            setShowDecrypted((current) => !current)
          }}
          fullWidth
          size="sm"
        >
          {showDecrypted
            ? lang === 'ko'
              ? '되돌리기'
              : 'Hide decrypted'
            : canDecrypt
              ? lang === 'ko'
                ? '암호 풀기'
                : 'Decrypt'
              : lang === 'ko'
                ? '개인키 공개 전'
                : 'Before key reveal'}
        </PortalButton>
        <PortalButton href={receipt.walletExplorerUrl} fullWidth size="sm">
          {lang === 'ko' ? '블록체인에서 보기' : 'View on blockchain'}
        </PortalButton>
      </div>

      {showDecrypted ? (
        receipt.selections.length > 0 ? (
          <PortalPanel tone="muted" className="mt-3 rounded-[20px] bg-[#FFF8F3] px-3 py-3">
            <div className="text-[12px] text-[#707070]">
              {lang === 'ko' ? '암호문을 푼 뒤' : 'After decryption'}
            </div>
            <div className="mt-1 text-[13px] font-semibold text-[#090A0B]">
              {lang === 'ko' ? '이 표가 뽑은 후보' : 'Candidate chosen by this ballot'}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {receipt.selections.map((selection) => (
                <PortalPill key={`${receipt.id}-${selection.key}`} tone="neutral" size="sm">
                  {selection.emoji} {selection.name}
                </PortalPill>
              ))}
            </div>
          </PortalPanel>
        ) : (
          <PortalPanel tone="muted" className="mt-3 rounded-[20px] bg-[#FFF8F3] px-3 py-3">
            <div className="text-[12px] text-[#707070]">
              {lang === 'ko' ? '암호문을 푼 뒤' : 'After decryption'}
            </div>
            <div className="mt-1 text-[13px] font-semibold text-[#090A0B]">
              {lang === 'ko'
                ? '아직 자동으로 풀 수 있는 형식이 아니에요'
                : 'This format cannot be decrypted automatically yet'}
            </div>
            <div className="mt-2 text-[12px] leading-[1.65] text-[#707070]">
              {lang === 'ko'
                ? '공개된 키는 확인됐지만, 현재 포털이 이 암호문 포맷을 자동으로 해독하지 못하고 있어요.'
                : 'The revealed key is available, but the portal does not yet support automatic decoding for this ciphertext format.'}
            </div>
          </PortalPanel>
        )
      ) : null}

      <PortalPanel tone="muted" className="mt-3 rounded-[20px] px-3 py-3">
        <div className="text-[12px] text-[#707070]">
          {lang === 'ko' ? '트랜잭션 확인값' : 'Transaction hash'}
        </div>
        <div className="mt-1 break-all font-mono text-[11px] leading-[1.65] text-[#090A0B]">
          {receipt.transactionHash}
        </div>
      </PortalPanel>
    </PortalPanel>
  )
}
