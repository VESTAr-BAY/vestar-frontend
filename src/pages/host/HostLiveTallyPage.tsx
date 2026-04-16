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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-5 mt-10 rounded-3xl border border-[#E7E9ED] bg-white px-6 py-10 text-center">
      <div className="text-[16px] font-semibold text-[#090A0B]">{title}</div>
      <div className="mt-2 text-[13px] text-[#707070]">{description}</div>
    </div>
  )
}

export function HostLiveTallyPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { vote, rankedCandidates, totalSubmissions, isLoading } = useHostLiveTally(id)

  if (isLoading || !vote) {
    return <LoadingSkeleton />
  }

  return (
    <>
      <VoteHero vote={{ ...vote, participantCount: totalSubmissions }} />
      <VoteInfoSection vote={vote} />

      <div className="mx-5 mt-5 rounded-3xl border border-[#E7E9ED] bg-white px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#7140FF] font-mono">
          {t('hlt_eyebrow')}
        </div>
        <div className="mt-2 text-[15px] font-semibold text-[#090A0B]">{t('hlt_title')}</div>
        <div className="mt-1 text-[13px] text-[#707070]">{t('hlt_description')}</div>
      </div>

      {rankedCandidates.length > 0 ? (
        <VoteResultRankings rankedCandidates={rankedCandidates} />
      ) : (
        <EmptyState title={t('hlt_empty_title')} description={t('hlt_empty_description')} />
      )}

      <div className="px-5 pb-8">
        <button
          type="button"
          onClick={() => navigate(`/host/manage/${id}`)}
          className="w-full rounded-2xl border border-[#E7E9ED] bg-white py-4 text-[15px] font-bold text-[#090A0B] transition-colors hover:border-[#d9ddf3]"
        >
          {t('hlt_back_button')}
        </button>
      </div>
    </>
  )
}
