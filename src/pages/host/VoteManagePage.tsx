import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { VoteDetailHeaderContext } from '../../components/layout/VoteDetailLayout'
import { BottomSheet } from '../../components/shared/BottomSheet'
import { useVoteManage } from '../../hooks/host/useVoteManage'
import { useToast } from '../../providers/ToastProvider'
import { VoteHero } from '../user/VoteHero'
import { VoteInfoSection } from '../user/VoteInfoSection'
import { VoteResultRankings } from '../user/VoteResultRankings'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

function toInputFormat(dateStr: string) {
  // 2025.04.03 11:00 -> 2025-04-03T11:00
  if (!dateStr) return ''
  return dateStr.replace(/\./g, '-').replace(' ', 'T')
}

function fromInputFormat(dateStr: string) {
  // 2025-04-03T11:00 -> 2025.04.03 11:00
  if (!dateStr) return ''
  return dateStr.replace(/-/g, '.').replace('T', ' ')
}

export function VoteManagePage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { vote, result, isLoading, isUpdating, updateEndDate } = useVoteManage(id)
  const { setConfig } = useContext(VoteDetailHeaderContext)
  const { addToast } = useToast()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [newEndDate, setNewEndDate] = useState('')

  useEffect(() => {
    if (!vote) return
    setConfig({
      title: `${vote.title} — 관리`,
      onShare: () => {
        if (navigator.share) {
          navigator.share({ title: vote.title, url: window.location.href }).catch(() => {})
        }
      },
    })
    setNewEndDate(toInputFormat(vote.endDate))
  }, [vote, setConfig])

  if (isLoading || !vote || !result) return <LoadingSkeleton />

  const handleUpdate = async () => {
    const formattedDate = fromInputFormat(newEndDate)
    const success = await updateEndDate(formattedDate)
    if (success) {
      addToast({ type: 'success', message: '종료 일시가 성공적으로 변경되었습니다.' })
      setSheetOpen(false)
    } else {
      addToast({ type: 'error', message: '종료 일시 변경에 실패했습니다.' })
    }
  }

  const handleImmediateEnd = async () => {
    const now = new Date()
    const formattedNow = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const success = await updateEndDate(formattedNow)
    if (success) {
      addToast({ type: 'success', message: '투표가 즉시 종료되었습니다.' })
      setSheetOpen(false)
    } else {
      addToast({ type: 'error', message: '즉시 종료에 실패했습니다.' })
    }
  }

  return (
    <>
      <VoteHero vote={vote} />
      <VoteInfoSection vote={vote} />

      <div className="h-2 bg-[#F7F8FA]" />

      {/* 현재 투표 현황 (결과 페이지의 순위 컴포넌트 재사용) */}
      <VoteResultRankings rankedCandidates={result.rankedCandidates} />

      <div className="px-5 py-6 bg-[#F7F8FA] flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate(`/host/edit/${id}`)}
          className="w-full bg-[#7140FF] text-white rounded-2xl py-4 text-[15px] font-bold hover:opacity-85 transition-opacity active:scale-[0.99] flex items-center justify-center gap-2"
        >
          투표 내용 수정하기
        </button>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full bg-[#dc2626] text-white rounded-2xl py-4 text-[15px] font-bold hover:opacity-85 transition-opacity active:scale-[0.99] flex items-center justify-center gap-2"
        >
          투표 조기 종료 / 일정 변경
        </button>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="종료 일시 변경">
        <div className="px-5 py-6 flex flex-col gap-6">
          <div>
            <label className="block text-[13px] font-semibold text-[#090A0B] mb-2">
              새로운 종료 일시 <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="datetime-local"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/10 transition-all"
            />
            <p className="text-[#dc2626] text-[12px] font-bold mt-3 text-center bg-[#dc2626]/10 py-2 rounded-lg">
              ⚠️ 이 변경은 되돌릴 수 없습니다!
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleUpdate}
              className="w-full bg-[#dc2626] text-white rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-85 transition-opacity active:enabled:scale-[0.99] flex items-center justify-center"
            >
              {isUpdating ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                '변경하기'
              )}
            </button>

            <button
              type="button"
              disabled={isUpdating}
              onClick={handleImmediateEnd}
              className="w-full bg-white text-[#dc2626] border border-[#dc2626]/30 rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:border-transparent disabled:cursor-default hover:enabled:bg-[#dc2626]/5 transition-colors active:enabled:scale-[0.99] flex items-center justify-center"
            >
              {isUpdating ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#dc2626]/30 border-t-[#dc2626] animate-spin" />
              ) : (
                '즉시 종료'
              )}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
