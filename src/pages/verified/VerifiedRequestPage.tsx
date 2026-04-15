import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import {
  type ApiVerifiedOrganizer,
  fetchVerifiedOrganizerRequestStatus,
  requestVerifiedOrganizer,
} from '../../api/verifiedOrganizers'
import type { Lang } from '../../i18n'
import { useLanguage } from '../../providers/LanguageProvider'

const COPY: Record<
  Lang,
  {
    eyebrow: string
    title: string
    description: string
    connectedWallet: string
    connectWallet: string
    currentStatus: string
    rejectionReason: string
    retryHint: string
    email: string
    organizationName: string
    organizationPlaceholder: string
    loadingError: string
    submitSuccess: string
    submitError: string
    submitting: string
    alreadyApproved: string
    pending: string
    retry: string
    submit: string
  }
> = {
  en: {
    eyebrow: 'Verified Organizer',
    title: 'Request organizer verification',
    description:
      'Request verified organizer status for this organizer wallet. Once approved by an admin, the verification will be completed and reflected in the service.',
    connectedWallet: 'Connected wallet',
    connectWallet: 'Connect your wallet',
    currentStatus: 'Current request status',
    rejectionReason: 'Reason for rejection',
    retryHint: 'You can update the information and submit the verification request again.',
    email: 'Email',
    organizationName: 'Organization name',
    organizationPlaceholder: 'e.g. MAMA 2026',
    loadingError: 'Unable to load the request status.',
    submitSuccess: 'Your verified organizer request has been submitted.',
    submitError: 'Failed to submit the request.',
    submitting: 'Submitting...',
    alreadyApproved: 'Already approved',
    pending: 'Under review',
    retry: 'Try again',
    submit: 'Send verification request',
  },
  ko: {
    eyebrow: '주최사 인증',
    title: '주최사 인증 요청',
    description:
      'organizer 지갑 주소로 주최사 인증을 요청합니다. 관리자 승인 후 주최사 인증이 완료되고 서비스에 반영됩니다.',
    connectedWallet: '연결 지갑',
    connectWallet: '지갑을 연결하세요',
    currentStatus: '현재 요청 상태',
    rejectionReason: '반려 사유',
    retryHint: '정보를 수정한 뒤 다시 인증 요청을 보낼 수 있습니다.',
    email: '이메일',
    organizationName: '회사명',
    organizationPlaceholder: '예: MAMA 2026',
    loadingError: '요청 상태를 불러오지 못했습니다.',
    submitSuccess: 'verified organizer 요청이 접수되었습니다.',
    submitError: '요청 접수에 실패했습니다.',
    submitting: '요청 중...',
    alreadyApproved: '승인되었어요',
    pending: '심사 중',
    retry: '재시도하기',
    submit: '인증 요청 보내기',
  },
}

const STATUS_LABELS: Record<Lang, Record<ApiVerifiedOrganizer['status'], string>> = {
  en: {
    VERIFIED: 'Approved',
    REJECTED: 'Rejected',
    PENDING: 'Pending',
  },
  ko: {
    VERIFIED: '승인됨',
    REJECTED: '반려됨',
    PENDING: '심사 중',
  },
}

function StatusBadge({ status, lang }: { status: ApiVerifiedOrganizer['status']; lang: Lang }) {
  const style =
    status === 'VERIFIED'
      ? 'bg-[#E8FFF0] text-[#16a34a]'
      : status === 'REJECTED'
        ? 'bg-[#FEF2F2] text-[#dc2626]'
        : 'bg-[#F0EDFF] text-[#7140FF]'

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style}`}>
      {STATUS_LABELS[lang][status]}
    </span>
  )
}

export function VerifiedRequestPage() {
  const { address, isConnected } = useAccount()
  const { lang } = useLanguage()
  const [contactEmail, setContactEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [requestInfo, setRequestInfo] = useState<ApiVerifiedOrganizer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const isRejected = requestInfo?.status === 'REJECTED'
  const isVerified = requestInfo?.status === 'VERIFIED'
  const isPending = requestInfo?.status === 'PENDING'
  const copy = COPY[lang]

  useEffect(() => {
    if (!isConnected || !address) {
      setRequestInfo(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setMessage(null)

    fetchVerifiedOrganizerRequestStatus(address)
      .then((result) => {
        if (cancelled) return
        setRequestInfo(result)
        setContactEmail(result?.contactEmail ?? '')
        setOrganizationName(result?.organizationName ?? '')
      })
      .catch((error) => {
        if (cancelled) return
        setMessage(error instanceof Error ? error.message : copy.loadingError)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [address, isConnected, copy.loadingError])

  const handleSubmit = async () => {
    if (!address) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await requestVerifiedOrganizer({
        walletAddress: address,
        contactEmail: contactEmail.trim() || null,
        organizationName,
      })
      if (result) {
        setRequestInfo(result)
      } else {
        const refreshed = await fetchVerifiedOrganizerRequestStatus(address)
        setRequestInfo(refreshed)
      }
      setMessage(copy.submitSuccess)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full bg-[#F7F8FA] px-5 py-6">
      <div className="rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,0.06)]">
        <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#7140FF]">
          {copy.eyebrow}
        </div>
        <h1 className="mt-2 text-[24px] font-semibold text-[#090A0B]">{copy.title}</h1>
        <p className="mt-2 text-[14px] leading-6 text-[#707070]">{copy.description}</p>

        <div className="mt-6 rounded-2xl border border-[#E7E9ED] bg-[#F7F8FA] p-4">
          <div className="text-[12px] font-semibold text-[#707070]">{copy.connectedWallet}</div>
          <div className="mt-1 break-all font-mono text-[13px] text-[#090A0B]">
            {isConnected && address ? address : copy.connectWallet}
          </div>
        </div>

        {requestInfo ? (
          <div className="mt-4 rounded-2xl border border-[#E7E9ED] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold text-[#707070]">{copy.currentStatus}</div>
                <div className="mt-1 text-[15px] font-semibold text-[#090A0B]">
                  {requestInfo.organizationName}
                </div>
              </div>
              <StatusBadge status={requestInfo.status} lang={lang} />
            </div>
            {requestInfo.rejectionReason ? (
              <div className="mt-3 rounded-xl bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#b91c1c]">
                {copy.rejectionReason}: {requestInfo.rejectionReason}
              </div>
            ) : null}
            {isRejected ? (
              <div className="mt-3 rounded-xl bg-[#FFF7ED] px-3 py-2 text-[12px] text-[#c2410c]">
                {copy.retryHint}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="verified-request-email"
              className="mb-2 block text-[13px] font-semibold text-[#090A0B]"
            >
              {copy.email}
            </label>
            <input
              id="verified-request-email"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="contact@company.com"
              className="w-full rounded-2xl border border-[#E7E9ED] bg-white px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF]"
            />
          </div>

          <div>
            <label
              htmlFor="verified-request-organization"
              className="mb-2 block text-[13px] font-semibold text-[#090A0B]"
            >
              {copy.organizationName}
            </label>
            <input
              id="verified-request-organization"
              type="text"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder={copy.organizationPlaceholder}
              className="w-full rounded-2xl border border-[#E7E9ED] bg-white px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF]"
            />
          </div>
        </div>

        {message ? <div className="mt-4 text-[13px] text-[#707070]">{message}</div> : null}

        <button
          type="button"
          disabled={
            !isConnected ||
            !address ||
            !contactEmail.trim() ||
            !organizationName.trim() ||
            isSubmitting ||
            isLoading ||
            isVerified ||
            isPending
          }
          onClick={handleSubmit}
          className="mt-6 w-full rounded-2xl bg-[#7140FF] px-4 py-3 text-[15px] font-bold text-white disabled:bg-[#E7E9ED] disabled:text-[#707070]"
        >
          {isSubmitting
            ? copy.submitting
            : isVerified
              ? copy.alreadyApproved
              : isPending
                ? copy.pending
                : isRejected
                  ? copy.retry
                  : copy.submit}
        </button>
      </div>
    </div>
  )
}
