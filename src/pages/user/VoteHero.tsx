import { useEffect, useMemo, useState } from 'react'
import verifiedIcon from '../../assets/verified.svg'
import { useLanguage } from '../../providers/LanguageProvider'
import type { BadgeVariant, VoteDetailData } from '../../types/vote'
import {
  getBallotRefreshCountdownLabel,
  getVoteChoiceSummary,
  getVoteFrequencySummary,
} from '../../utils/ballotRefresh'
import { resolveIpfsUrl } from '../../utils/ipfs'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  live: 'bg-[rgba(34,197,94,0.12)] text-[#16a34a] border border-[rgba(34,197,94,0.2)]',
  hot: 'bg-[rgba(239,68,68,0.10)] text-[#dc2626] border border-[rgba(239,68,68,0.2)]',
  new: 'bg-[rgba(113,64,255,0.09)] text-[#7140FF] border border-[rgba(113,64,255,0.2)]',
  end: 'bg-black/5 text-[#707070]',
}

const BADGE_LABEL: Record<BadgeVariant, string> = {
  live: 'LIVE',
  hot: 'HOT',
  new: 'NEW',
  end: 'END',
}

interface VoteHeroProps {
  vote: VoteDetailData
}

export function VoteHero({ vote }: VoteHeroProps) {
  const { t, lang } = useLanguage()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const participantLabel = useMemo(() => {
    if (vote.badge === 'end') {
      return lang === 'ko'
        ? `${vote.participantCount.toLocaleString()}명 참여`
        : `${vote.participantCount.toLocaleString()} participants`
    }

    return lang === 'ko'
      ? `${vote.participantCount.toLocaleString()}명 참여 중`
      : `${vote.participantCount.toLocaleString()} participating`
  }, [lang, vote.badge, vote.participantCount])
  const voteFrequencyLabel = useMemo(
    () => getVoteFrequencySummary(vote.ballotPolicy, vote.resetIntervalSeconds, lang),
    [lang, vote.ballotPolicy, vote.resetIntervalSeconds],
  )
  const voteLimitLabel = useMemo(
    () => getVoteChoiceSummary(vote.maxChoices, lang),
    [lang, vote.maxChoices],
  )
  const refreshCountdownLabel = useMemo(
    () => getBallotRefreshCountdownLabel(vote, lang, nowMs),
    [lang, nowMs, vote],
  )

  useEffect(() => {
    if (vote.ballotPolicy !== 'ONE_PER_INTERVAL' || vote.badge !== 'live') {
      return
    }

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [vote.badge, vote.ballotPolicy])

  return (
    <div className="relative min-h-[360px] overflow-hidden bg-[#1C1D22] px-5 pb-7 pt-[calc(var(--header-h)+24px)] [margin-top:calc(var(--header-h)*-1)]">
      {vote.imageUrl ? (
        <img
          src={resolveIpfsUrl(vote.imageUrl)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#CFCFCF_0%,#6C6C6C_48%,#2F2F31_100%)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#090A0B]/82 via-[#090A0B]/44 to-[#090A0B]/18" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      <div className="relative flex min-h-[296px] flex-col justify-end">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`text-[10px] font-bold font-mono px-2 py-[3px] rounded-[10px] tracking-[0.4px] uppercase ${BADGE_STYLES[vote.badge]}`}
          >
            {vote.badge === 'end' ? t('badge_end') : BADGE_LABEL[vote.badge]}
          </span>
          {vote.deadlineLabel ? (
            <span
              className={`text-[12px] font-mono ${vote.urgent ? 'text-[#FCA5A5]' : 'text-white/74'}`}
            >
              {vote.deadlineLabel}
            </span>
          ) : null}
        </div>

        <div className="mb-2 flex items-center gap-1">
          <span className="text-[11px] text-white/76 font-mono">{vote.org}</span>
          {vote.verified ? (
            <img src={verifiedIcon} alt="verified" className="h-3 w-3 opacity-75 invert" />
          ) : null}
        </div>

        <h1 className="mb-4 text-[22px] font-bold leading-tight text-white">{vote.title}</h1>

        <div className="mb-3 flex flex-wrap items-center gap-0 text-[12px] text-white/74">
          <span className="font-mono font-semibold text-white">{participantLabel}</span>
          <span className="mx-2">·</span>
          <span>{voteFrequencyLabel}</span>
          <span className="mx-2">·</span>
          <span>{voteLimitLabel}</span>
        </div>

        {refreshCountdownLabel ? (
          <div className="text-[12px] font-medium text-white/82">{refreshCountdownLabel}</div>
        ) : null}
      </div>
    </div>
  )
}
