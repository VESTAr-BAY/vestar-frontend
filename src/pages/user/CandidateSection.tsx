import { CandidateAvatar } from '../../components/shared/CandidateAvatar'
import { useLanguage } from '../../providers/LanguageProvider'
import type { Candidate, VoteSection } from '../../types/vote'

interface CandidateSectionProps {
  candidates: Candidate[]
  maxChoices: number
  resultPublic: boolean
  isSelected: (id: string) => boolean
  onToggle: (id: string) => void
  isEnded: boolean
  /** IDs of candidates the current user voted for — shows "My Pick" badge */
  votedCandidateIds?: Set<string>
}

interface CandidateItemProps {
  candidate: Candidate
  selected: boolean
  onToggle: (id: string) => void
  isEnded: boolean
  resultPublic: boolean
  isMyChoice?: boolean
  myPickLabel: string
}

function CandidateItem({
  candidate,
  selected,
  onToggle,
  isEnded,
  resultPublic,
  isMyChoice = false,
  myPickLabel,
}: CandidateItemProps) {
  return (
    <button
      type="button"
      disabled={isEnded}
      onClick={() => onToggle(candidate.id)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 relative overflow-hidden transition-all duration-150 text-left ${
        isMyChoice
          ? 'bg-[rgba(34,197,94,0.06)] border-[rgba(34,197,94,0.45)]'
          : selected
            ? 'bg-[#F0EDFF] border-[#7140FF]'
            : 'bg-white border-[#E7E9ED] hover:border-[rgba(113,64,255,0.3)] hover:bg-[#F7F6FF]'
      } ${isEnded && !isMyChoice ? 'opacity-50 cursor-default' : isEnded ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
    >
      {/* Left accent bar */}
      {isMyChoice && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#16a34a] rounded-l-xl" />
      )}
      {!isMyChoice && selected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#7140FF] rounded-l-xl" />
      )}

      {/* Radio / check circle */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isMyChoice
            ? 'border-[#16a34a] bg-[#16a34a]'
            : selected
              ? 'border-[#7140FF] bg-[#7140FF]'
              : 'border-[#E7E9ED] bg-white'
        }`}
      >
        {(selected || isMyChoice) && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>

      {/* Avatar */}
      <CandidateAvatar
        imageUrl={candidate.imageUrl}
        emoji={candidate.emoji}
        emojiColor={candidate.emojiColor}
        size="md"
      />

      {/* Name + group */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-[#090A0B] truncate">{candidate.name}</div>
        <div className="text-[12px] text-[#707070] truncate">{candidate.group}</div>
      </div>

      {/* Right side: "My Pick" badge OR vote count */}
      <div className="flex-shrink-0 text-right">
        {isMyChoice ? (
          <span className="text-[11px] font-bold text-[#16a34a] bg-[rgba(34,197,94,0.12)] px-2 py-1 rounded-full">
            {myPickLabel}
          </span>
        ) : resultPublic && candidate.votes !== undefined ? (
          <span className="text-[13px] font-mono text-[#707070]">
            {candidate.votes.toLocaleString()}
          </span>
        ) : (
          <span className="text-[13px] font-mono text-[#E7E9ED]">—</span>
        )}
      </div>
    </button>
  )
}

export function CandidateSection({
  candidates,
  maxChoices,
  resultPublic,
  isSelected,
  onToggle,
  isEnded,
  votedCandidateIds,
}: CandidateSectionProps) {
  const { t, lang } = useLanguage()
  return (
    <div className="mx-5 mt-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[15px] font-semibold text-[#090A0B]">{t('cs_candidates')}</span>
        <span className="text-[11px] bg-[#F0EDFF] text-[#7140FF] px-2.5 py-1 rounded-full font-medium">
          {lang === 'ko' ? `${maxChoices}명 선택` : `Pick ${maxChoices}`}
        </span>
      </div>

      {/* Candidate list */}
      <div className="flex flex-col gap-2">
        {candidates.map((candidate) => (
          <CandidateItem
            key={candidate.id}
            candidate={candidate}
            selected={isSelected(candidate.id)}
            onToggle={onToggle}
            isEnded={isEnded}
            resultPublic={resultPublic}
            isMyChoice={votedCandidateIds?.has(candidate.id) ?? false}
            myPickLabel={t('cs_my_pick')}
          />
        ))}
      </div>

      {/* Result hidden message */}
      {!resultPublic && !votedCandidateIds && (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[#707070] bg-white border border-[#E7E9ED] rounded-xl px-3 py-2.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t('cs_results_hidden')}</span>
        </div>
      )}
    </div>
  )
}

// ── Grouped variant ──────────────────────────────────────────────────────────

interface GroupedCandidateSectionProps {
  sections: VoteSection[]
  resultPublic: boolean
  feeLabel?: string
  isSelected: (sectionId: string, candidateId: string) => boolean
  onToggle: (sectionId: string, candidateId: string) => void
  isEnded: boolean
  votedCandidateIds?: Set<string>
}

const SECTION_COLORS = ['#F0EDFF', '#E8FFF0', '#FFF5E8', '#E8F0FF', '#FEF9EC', '#F0FFF4']

export function GroupedCandidateSection({
  sections,
  resultPublic,
  feeLabel,
  isSelected,
  onToggle,
  isEnded,
  votedCandidateIds,
}: GroupedCandidateSectionProps) {
  const { t } = useLanguage()
  return (
    <div className="mx-5 mt-5 flex flex-col gap-6">
      {sections.map((section, idx) => {
        const accentBg = SECTION_COLORS[idx % SECTION_COLORS.length]
        return (
          <div key={section.id}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-[13px] font-bold px-3 py-1 rounded-full"
                  style={{ background: accentBg, color: '#090A0B' }}
                >
                  {section.name}
                </span>
              </div>
              <span className="text-[11px] bg-[#F0EDFF] text-[#7140FF] px-2.5 py-1 rounded-full font-medium">
                {feeLabel ?? (resultPublic ? '공개' : '비공개')}
              </span>
            </div>

            {/* Candidates */}
            <div className="flex flex-col gap-2">
              {section.candidates.map((candidate) => (
                <CandidateItem
                  key={candidate.id}
                  candidate={candidate}
                  selected={isSelected(section.id, candidate.id)}
                  onToggle={(candidateId) => onToggle(section.id, candidateId)}
                  isEnded={isEnded}
                  resultPublic={resultPublic}
                  isMyChoice={votedCandidateIds?.has(candidate.id) ?? false}
                  myPickLabel={t('cs_my_pick')}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
