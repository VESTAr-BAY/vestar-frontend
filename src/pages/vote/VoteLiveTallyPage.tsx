import { useNavigate, useParams } from 'react-router'
import { useVoteLiveTally } from '../../hooks/user/useVoteLiveTally'
import { useLanguage } from '../../providers/LanguageProvider'
import { VoteResultRankings } from '../user/VoteResultRankings'
import { VoteResultWinner } from '../user/VoteResultWinner'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-5 mt-10 rounded-3xl border border-[#E7E9ED] bg-white px-6 py-10 text-center">
      <div className="text-[16px] font-semibold text-[#090A0B]">{title}</div>
      <div className="mt-2 text-[13px] text-[#707070]">{description}</div>
    </div>
  )
}

export function VoteLiveTallyPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { result, isLoading, totalSubmissions } = useVoteLiveTally(id)

  if (isLoading) return <LoadingSkeleton />
  if (!result || result.rankedCandidates.length === 0) {
    return <EmptyState title={t('vlt_empty_title')} description={t('vlt_empty_description')} />
  }

  const winner = result.rankedCandidates.find((candidate) => candidate.rank === 1)
  if (!winner) {
    return <EmptyState title={t('vlt_empty_title')} description={t('vlt_empty_description')} />
  }

  return (
    <>
      <VoteResultWinner
        result={result}
        winner={winner}
        mode="live"
        summaryCount={totalSubmissions}
        summaryKind="participants"
      />
      <VoteResultRankings rankedCandidates={result.rankedCandidates} mode="live" />

      <div className="px-5 pb-8">
        <button
          type="button"
          onClick={() => navigate(`/vote/${id}`)}
          className="w-full rounded-2xl border border-[#E7E9ED] bg-white py-4 text-[15px] font-bold text-[#090A0B] transition-colors hover:border-[#d9ddf3]"
        >
          {t('vlt_back_to_detail')}
        </button>
      </div>
    </>
  )
}
