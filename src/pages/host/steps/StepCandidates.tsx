import type { CandidateDraft, SectionDraft, VoteCreateDraft } from '../../../types/host'

const CANDIDATE_EMOJIS = ['🎵', '👑', '💗', '🌌', '❄️', '🍀', '🔥', '⭐', '🌙', '🎀', '💎', '🦋']
const MAX_CANDIDATES = 10

interface StepCandidatesProps {
  candidates: VoteCreateDraft['candidates']
  sections: VoteCreateDraft['sections']
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, field: keyof Omit<CandidateDraft, 'id'>, value: string) => void
  onAddSection: () => void
  onRemoveSection: (sectionId: string) => void
  onUpdateSectionName: (sectionId: string, name: string) => void
  onAddCandidateToSection: (sectionId: string) => void
  onRemoveCandidateFromSection: (sectionId: string, candidateId: string) => void
  onUpdateSectionCandidate: (
    sectionId: string,
    candidateId: string,
    field: keyof Omit<CandidateDraft, 'id'>,
    value: string,
  ) => void
  onClearSections: () => void
}

function CandidateCard({
  candidate,
  index,
  canRemove,
  onRemove,
  onUpdate,
}: {
  candidate: CandidateDraft
  index: number
  canRemove: boolean
  onRemove: () => void
  onUpdate: (field: keyof Omit<CandidateDraft, 'id'>, value: string) => void
}) {
  return (
    <div className="bg-white border border-[#E7E9ED] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-[#7140FF] font-mono">후보 {index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#707070] hover:bg-[#FEF2F2] hover:text-[#dc2626] transition-colors"
            aria-label="후보 삭제"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 [scrollbar-width:none]">
        {CANDIDATE_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onUpdate('emoji', emoji)}
            className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center text-base transition-all ${
              candidate.emoji === emoji
                ? 'bg-[#F0EDFF] border-2 border-[#7140FF]'
                : 'bg-[#F7F8FA] border border-[#E7E9ED] hover:border-[#7140FF]/40'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={candidate.name}
        onChange={(e) => onUpdate('name', e.target.value)}
        placeholder="아티스트 이름 *"
        maxLength={30}
        className="w-full bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl px-3 py-2.5 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:bg-white transition-all mb-2"
      />

      <input
        type="text"
        value={candidate.group}
        onChange={(e) => onUpdate('group', e.target.value)}
        placeholder="소속사 / 그룹 (선택)"
        maxLength={30}
        className="w-full bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl px-3 py-2.5 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:bg-white transition-all"
      />
    </div>
  )
}

function SectionCard({
  section,
  sectionIndex,
  canRemove,
  onRemoveSection,
  onUpdateSectionName,
  onAddCandidate,
  onRemoveCandidate,
  onUpdateCandidate,
}: {
  section: SectionDraft
  sectionIndex: number
  canRemove: boolean
  onRemoveSection: () => void
  onUpdateSectionName: (name: string) => void
  onAddCandidate: () => void
  onRemoveCandidate: (candidateId: string) => void
  onUpdateCandidate: (
    candidateId: string,
    field: keyof Omit<CandidateDraft, 'id'>,
    value: string,
  ) => void
}) {
  return (
    <div className="bg-[#F0EDFF]/40 border-2 border-[#7140FF]/20 rounded-2xl p-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold text-[#7140FF] font-mono uppercase tracking-wider">
          섹션 {sectionIndex + 1}
        </span>
        <div className="flex-1" />
        {canRemove && (
          <button
            type="button"
            onClick={onRemoveSection}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#707070] hover:bg-[#FEF2F2] hover:text-[#dc2626] transition-colors"
            aria-label="섹션 삭제"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Section name */}
      <input
        type="text"
        value={section.name}
        onChange={(e) => onUpdateSectionName(e.target.value)}
        placeholder="섹션 이름 * (예: 남자 그룹)"
        maxLength={30}
        className="w-full bg-white border border-[#E7E9ED] rounded-xl px-3 py-2.5 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:bg-white transition-all mb-3"
      />

      {/* Price badge */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[11px] bg-[#FFF5E8] text-[#d97706] px-2 py-1 rounded-full font-medium">
          ₩100 / 투표
        </span>
      </div>

      {/* Candidates */}
      <div className="flex flex-col gap-3">
        {section.candidates.map((candidate, idx) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            index={idx}
            canRemove={section.candidates.length > 2}
            onRemove={() => onRemoveCandidate(candidate.id)}
            onUpdate={(field, value) => onUpdateCandidate(candidate.id, field, value)}
          />
        ))}
      </div>

      {/* Add candidate to section */}
      {section.candidates.length < MAX_CANDIDATES && (
        <button
          type="button"
          onClick={onAddCandidate}
          className="mt-3 w-full py-2.5 border-2 border-dashed border-[#7140FF]/30 rounded-xl text-[13px] font-semibold text-[#7140FF] hover:border-[#7140FF] hover:bg-[#F0EDFF] transition-all flex items-center justify-center gap-2"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          후보 추가
        </button>
      )}
    </div>
  )
}

export function StepCandidates({
  candidates,
  sections,
  onAdd,
  onRemove,
  onUpdate,
  onAddSection,
  onRemoveSection,
  onUpdateSectionName,
  onAddCandidateToSection,
  onRemoveCandidateFromSection,
  onUpdateSectionCandidate,
  onClearSections,
}: StepCandidatesProps) {
  const useSections = sections.length > 0

  const handleToggleSections = () => {
    if (useSections) {
      onClearSections()
    } else {
      onAddSection()
    }
  }

  return (
    <div className="px-5 py-6">
      {/* Sections toggle */}
      <div className="flex items-center justify-between bg-white border border-[#E7E9ED] rounded-2xl px-4 py-3 mb-4">
        <div>
          <div className="text-[14px] font-semibold text-[#090A0B]">섹션 구분 사용</div>
          <div className="text-[12px] text-[#707070] mt-0.5">
            부문별 투표 (예: MAMA 남자 그룹 / 여자 그룹)
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleSections}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
            useSections ? 'bg-[#7140FF]' : 'bg-[#E7E9ED]'
          }`}
          aria-label="섹션 구분 토글"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
              useSections ? 'left-[26px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {useSections ? (
        // ── Sections mode ──────────────────────────────────────────────────
        <>
          <div className="text-[12px] text-[#707070] mb-4">
            섹션마다 ₩100이 부과됩니다. 후보는 각 섹션에 최소 2명 이상 등록하세요.
          </div>

          <div className="flex flex-col gap-5">
            {sections.map((section, idx) => (
              <SectionCard
                key={section.id}
                section={section}
                sectionIndex={idx}
                canRemove={sections.length > 1}
                onRemoveSection={() => onRemoveSection(section.id)}
                onUpdateSectionName={(name) => onUpdateSectionName(section.id, name)}
                onAddCandidate={() => onAddCandidateToSection(section.id)}
                onRemoveCandidate={(cid) => onRemoveCandidateFromSection(section.id, cid)}
                onUpdateCandidate={(cid, field, value) =>
                  onUpdateSectionCandidate(section.id, cid, field, value)
                }
              />
            ))}
          </div>

          {/* Add section button */}
          <button
            type="button"
            onClick={onAddSection}
            className="mt-5 w-full py-3.5 border-2 border-dashed border-[#E7E9ED] rounded-2xl text-[14px] font-semibold text-[#7140FF] hover:border-[#7140FF] hover:bg-[#F0EDFF] transition-all flex items-center justify-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            섹션 추가
          </button>
        </>
      ) : (
        // ── Flat mode (existing UI) ────────────────────────────────────────
        <>
          <div className="text-[12px] text-[#707070] mb-4">
            최소 2명, 최대 {MAX_CANDIDATES}명까지 등록할 수 있습니다.
          </div>

          <div className="flex flex-col gap-4">
            {candidates.map((candidate, idx) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                index={idx}
                canRemove={candidates.length > 2}
                onRemove={() => onRemove(candidate.id)}
                onUpdate={(field, value) => onUpdate(candidate.id, field, value)}
              />
            ))}
          </div>

          {candidates.length < MAX_CANDIDATES && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 w-full py-3.5 border-2 border-dashed border-[#E7E9ED] rounded-2xl text-[14px] font-semibold text-[#7140FF] hover:border-[#7140FF] hover:bg-[#F0EDFF] transition-all flex items-center justify-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              후보 추가
            </button>
          )}
        </>
      )}
    </div>
  )
}
