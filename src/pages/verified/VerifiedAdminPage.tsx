import { useEffect, useState } from 'react'
import {
  approveVerifiedOrganizer,
  fetchVerifiedOrganizerRequests,
  rejectVerifiedOrganizer,
  type ApiVerifiedOrganizer,
} from '../../api/verifiedOrganizers'

function StatusBadge({ status }: { status: ApiVerifiedOrganizer['status'] }) {
  const style =
    status === 'VERIFIED'
      ? 'bg-[#E8FFF0] text-[#16a34a]'
      : status === 'REJECTED'
        ? 'bg-[#FEF2F2] text-[#dc2626]'
        : 'bg-[#F0EDFF] text-[#7140FF]'

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style}`}>{status}</span>
  )
}

export function VerifiedAdminPage() {
  const [items, setItems] = useState<ApiVerifiedOrganizer[]>([])
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await fetchVerifiedOrganizerRequests('PENDING')
      setItems(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await approveVerifiedOrganizer(id)
      setMessage('승인 처리했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '승인에 실패했습니다.')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectVerifiedOrganizer(id, reasons[id])
      setMessage('반려 처리했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '반려에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-full bg-[#F7F8FA] px-5 py-6">
      <div className="rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,0.06)]">
        <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#7140FF]">
          Admin Review
        </div>
        <h1 className="mt-2 text-[24px] font-semibold text-[#090A0B]">verified organizer 승인</h1>
        <p className="mt-2 text-[14px] leading-6 text-[#707070]">
          pending 상태의 organizer 요청을 확인하고 승인 또는 반려할 수 있습니다.
        </p>

        {message ? <div className="mt-4 text-[13px] text-[#707070]">{message}</div> : null}

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-[14px] text-[#707070]">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E7E9ED] bg-[#F7F8FA] px-4 py-6 text-[14px] text-[#707070]">
              pending 요청이 없습니다.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#E7E9ED] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold text-[#090A0B]">
                      {item.organizationName}
                    </div>
                    <div className="mt-1 text-[12px] text-[#707070]">
                      {item.contactEmail ?? '이메일 미입력'}
                    </div>
                    <div className="mt-1 break-all font-mono text-[12px] text-[#707070]">
                      {item.walletAddress}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <textarea
                  value={reasons[item.id] ?? ''}
                  onChange={(event) =>
                    setReasons((prev) => ({ ...prev, [item.id]: event.target.value }))
                  }
                  placeholder="반려 사유를 입력할 수 있습니다."
                  className="mt-4 h-24 w-full rounded-2xl border border-[#E7E9ED] bg-[#F7F8FA] px-4 py-3 text-[13px] text-[#090A0B] outline-none focus:border-[#7140FF]"
                />

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleApprove(item.id)}
                    className="flex-1 rounded-2xl bg-[#16a34a] px-4 py-3 text-[14px] font-bold text-white"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReject(item.id)}
                    className="flex-1 rounded-2xl bg-[#090A0B] px-4 py-3 text-[14px] font-bold text-white"
                  >
                    반려
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
