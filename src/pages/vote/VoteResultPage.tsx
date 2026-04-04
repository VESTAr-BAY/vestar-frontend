import { useContext, useEffect } from 'react'
import { useParams } from 'react-router'
import { VoteDetailHeaderContext } from '../../components/layout/VoteDetailLayout'
import { useVoteResult } from '../../hooks/user/useVoteResult'
import { VoteResultRankings } from '../user/VoteResultRankings'
import { VoteResultWinner } from '../user/VoteResultWinner'

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

export function VoteResultPage() {
  const { id = '1' } = useParams()
  const { result, isLoading } = useVoteResult(id)
  const { setConfig } = useContext(VoteDetailHeaderContext)

  useEffect(() => {
    if (!result) return
    setConfig({
      title: `${result.title} — 결과`,
      onShare: () => {
        if (navigator.share) {
          navigator.share({ title: result.title, url: window.location.href }).catch(() => {})
        }
      },
    })
  }, [result, setConfig])

  if (isLoading || !result) return <LoadingSkeleton />

  const winner = result.rankedCandidates.find((c) => c.rank === 1)
  if (!winner) return <LoadingSkeleton />

  return (
    <>
      <VoteResultWinner result={result} winner={winner} />
      <VoteResultRankings rankedCandidates={result.rankedCandidates} />
    </>
  )
}
