import { useNavigate, useParams } from 'react-router'
import { useHostLiveTally } from '../../hooks/host/useHostLiveTally'
import { useLanguage } from '../../providers/LanguageProvider'
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

function getHostLiveTallyCopy(lang: 'en' | 'ko') {
  return lang === 'ko'
    ? {
        eyebrow: '호스트 실시간 집계',
        title: '주최자 전용 실시간 집계 화면',
        description: '비공개 투표도 진행 중 누적 집계를 확인할 수 있습니다.',
        emptyTitle: '아직 집계 데이터가 없습니다.',
        emptyDescription: '투표가 쌓이면 주최자 전용 실시간 집계가 여기에 표시됩니다.',
        backButton: '관리 화면으로 돌아가기',
      }
    : {
        eyebrow: 'Host Live Tally',
        title: 'Organizer live tally',
        description: 'You can monitor running totals here, even for private votes.',
        emptyTitle: 'No tally data yet.',
        emptyDescription: 'Organizer live tallies will appear here once votes start coming in.',
        backButton: 'Back to Management',
      }
}

function EmptyState({ copy }: { copy: ReturnType<typeof getHostLiveTallyCopy> }) {
  return (
    <div className="mx-5 mt-10 rounded-3xl border border-[#E7E9ED] bg-white px-6 py-10 text-center">
      <div className="text-[16px] font-semibold text-[#090A0B]">{copy.emptyTitle}</div>
      <div className="mt-2 text-[13px] text-[#707070]">{copy.emptyDescription}</div>
    </div>
  )
}

export function HostLiveTallyPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { vote, rankedCandidates, totalSubmissions, isLoading } = useHostLiveTally(id)
  const copy = getHostLiveTallyCopy(lang)

  if (isLoading || !vote) {
    return <LoadingSkeleton />
  }

  return (
    <>
      <VoteHero vote={{ ...vote, participantCount: totalSubmissions }} />
      <VoteInfoSection vote={vote} />

      <div className="mx-5 mt-5 rounded-3xl border border-[#E7E9ED] bg-white px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono">
          {copy.eyebrow}
        </div>
        <div className="mt-2 text-[15px] font-semibold text-[#090A0B]">{copy.title}</div>
        <div className="mt-1 text-[13px] text-[#707070]">{copy.description}</div>
      </div>

      {rankedCandidates.length > 0 ? (
        <VoteResultRankings rankedCandidates={rankedCandidates} />
      ) : (
        <EmptyState copy={copy} />
      )}

      <div className="px-5 pb-8">
        <button
          type="button"
          onClick={() => navigate(`/host/manage/${id}`)}
          className="w-full rounded-2xl border border-[#E7E9ED] bg-white py-4 text-[15px] font-bold text-[#090A0B] transition-colors hover:border-[#d9ddf3]"
        >
          {copy.backButton}
        </button>
      </div>
    </>
  )
}
