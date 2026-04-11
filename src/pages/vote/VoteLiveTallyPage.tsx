import { useNavigate, useParams } from 'react-router'
import { useVoteLiveTally } from '../../hooks/user/useVoteLiveTally'
import { VoteResultRankings } from '../user/VoteResultRankings'
import { VoteResultWinner } from '../user/VoteResultWinner'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mx-5 mt-10 rounded-3xl border border-[#E7E9ED] bg-white px-6 py-10 text-center">
      <div className="text-[16px] font-semibold text-[#090A0B]">
        아직 표시할 실시간 집계가 없습니다.
      </div>
      <div className="mt-2 text-[13px] text-[#707070]">
        집계 데이터가 반영되면 이 화면에서 실시간 순위를 볼 수 있습니다.
      </div>
    </div>
  )
}

export function VoteLiveTallyPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { result, isLoading } = useVoteLiveTally(id)

  if (isLoading) return <LoadingSkeleton />
  if (!result || result.rankedCandidates.length === 0) return <EmptyState />

  const winner = result.rankedCandidates.find((candidate) => candidate.rank === 1)
  if (!winner) return <EmptyState />

  return (
    <>
      <VoteResultWinner result={result} winner={winner} mode="live" />
      <VoteResultRankings rankedCandidates={result.rankedCandidates} mode="live" />

      <div className="px-5 pb-8">
        <button
          type="button"
          onClick={() => navigate(`/vote/${id}`)}
          className="w-full rounded-2xl border border-[#E7E9ED] bg-white py-4 text-[15px] font-bold text-[#090A0B] transition-colors hover:border-[#d9ddf3]"
        >
          상세 화면으로 돌아가기
        </button>
      </div>
    </>
  )
}
