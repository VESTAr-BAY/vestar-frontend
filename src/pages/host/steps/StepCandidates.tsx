import type { CandidateDraft, SectionDraft, VoteCreateDraft } from '../../../types/host'

const MAX_CANDIDATES = 10

interface StepCandidatesProps {
  electionTitle: VoteCreateDraft['electionTitle']
  candidates: VoteCreateDraft['candidates']
  sections: VoteCreateDraft['sections']
  onUpdateElectionTitle: (value: VoteCreateDraft['electionTitle']) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (
    id: string,
    field: keyof Omit<CandidateDraft, 'id'>,
    value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
  ) => void
  onAddSection: () => void
  onRemoveSection: (sectionId: string) => void
  onUpdateSectionName: (sectionId: string, name: string) => void
  onAddCandidateToSection: (sectionId: string) => void
  onRemoveCandidateFromSection: (sectionId: string, candidateId: string) => void
  onUpdateSectionCandidate: (
    sectionId: string,
    candidateId: string,
    field: keyof Omit<CandidateDraft, 'id'>,
    value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
  ) => void
  onClearSections: () => void
  initialCandidates?: VoteCreateDraft['candidates']
}

function CandidateCard({
  candidate,
  index,
  canRemove,
  onRemove,
  onUpdate,
  isEditMode,
  initialCandidates
}: {
  candidate: CandidateDraft
  index: number
  canRemove: boolean
  onRemove: () => void
  onUpdate: (field: keyof Omit<CandidateDraft, 'id'>, value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>]) => void
  isEditMode: boolean
  initialCandidates?: VoteCreateDraft['candidates']
}) {
  const initialCandidate = initialCandidates?.find(c => c.id === candidate.id)
  const isCandidateChanged = initialCandidate && (
    initialCandidate.name !== candidate.name ||
    initialCandidate.image !== candidate.image
  )

  return (
    <div className="bg-white border border-[#E7E9ED] rounded-2xl p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-[#7140FF] font-mono">
            후보 {index + 1}
          </span>
          {isCandidateChanged && (
            <span className="text-[10px] font-bold text-[#7140FF] bg-[#7140FF]/10 px-1.5 py-0.5 rounded-md">
              수정됨
            </span>
          )}
        </div>
        {!isEditMode && canRemove && (
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
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Name */}
      <input
        type="text"
        value={candidate.name}
        onChange={(e) => onUpdate('name', e.target.value)}
        placeholder="아티스트 이름 *"
        maxLength={30}
        className="w-full bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl px-3 py-2.5 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:bg-white transition-all mb-3"
      />

      {/* Image Upload */}
      <div 
        onClick={() => document.getElementById(`file-upload-${candidate.id}`)?.click()}
        className="w-24 h-24 rounded-xl border-2 border-dashed border-[#E7E9ED] bg-[#F7F8FA] hover:border-[#7140FF]/50 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
      >
        {candidate.image ? (
          <img src={candidate.image} alt="후보 이미지" className="w-full h-full object-cover" />
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0C4CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-[10px] text-[#C0C4CC] font-medium">사진 업로드</span>
          </>
        )}
        <input 
          id={`file-upload-${candidate.id}`}
          type="file" 
          accept="image/*" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0]
              const url = URL.createObjectURL(file)
              onUpdate('image', url)
              onUpdate('imageFile', file)
            }
          }} 
          className="hidden" 
        />
      </div>
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
  isEditMode,
  initialCandidates
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
    value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
  ) => void
  isEditMode: boolean
  initialCandidates?: VoteCreateDraft['candidates']
}) {
  return (
    <div className="bg-[#F0EDFF]/40 border-2 border-[#7140FF]/20 rounded-2xl p-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold text-[#7140FF] font-mono uppercase tracking-wider">
          섹션 {sectionIndex + 1}
        </span>
        <div className="flex-1" />
        {!isEditMode && canRemove && (
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
            isEditMode={isEditMode}
            initialCandidates={initialCandidates}
          />
        ))}
      </div>

      {/* Add candidate to section */}
      {!isEditMode && section.candidates.length < MAX_CANDIDATES && (
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
  electionTitle,
  candidates,
  sections,
  onUpdateElectionTitle,
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
  initialCandidates
}: StepCandidatesProps) {
  const isEditMode = !!initialCandidates
  const useSections = sections.length > 0

  const handleToggleSections = () => {
    if (isEditMode) return // 수정 모드에서는 섹션 토글 불가
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
          disabled={isEditMode}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
            useSections ? 'bg-[#7140FF]' : 'bg-[#E7E9ED]'
          } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="섹션 구분 토글"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
              useSections ? 'left-[26px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {!useSections && (
        <div className="bg-white border border-[#E7E9ED] rounded-2xl px-4 py-4 mb-4">
          <label htmlFor="election-title" className="block text-[13px] font-semibold text-[#090A0B] mb-2">
            투표 이름 <span className="text-[#7140FF]">*</span>
          </label>
          <input
            id="election-title"
            type="text"
            value={electionTitle}
            onChange={(e) => onUpdateElectionTitle(e.target.value)}
            placeholder="예: 남자 그룹 인기상"
            maxLength={60}
            className="w-full bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:bg-white transition-all"
          />
        </div>
      )}

      {useSections ? (
        // ── Sections mode ──────────────────────────────────────────────────
        <>
          <div className="text-[12px] text-[#707070] mb-4">
            각 섹션 이름이 개별 투표 이름으로 사용됩니다.
          </div>
          <div className="text-[12px] text-[#707070] mb-4">
            {isEditMode 
              ? "수정 모드에서는 후보의 삭제 및 추가가 제한됩니다." 
              : "후보는 각 섹션에 최소 2명 이상 등록하세요."
            }
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
                isEditMode={isEditMode}
                initialCandidates={initialCandidates}
              />
            ))}
          </div>

          {/* Add section button */}
          {!isEditMode && (
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
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              섹션 추가
            </button>
          )}
        </>
      ) : (
        // ── Flat mode (existing UI) ────────────────────────────────────────
        <>
          <div className="text-[12px] text-[#707070] mb-4">
            {isEditMode 
              ? "수정 모드에서는 후보의 삭제 및 추가가 제한됩니다." 
              : `최소 2명, 최대 ${MAX_CANDIDATES}명까지 등록할 수 있습니다.`
            }
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
                isEditMode={isEditMode}
                initialCandidates={initialCandidates}
              />
            ))}
          </div>

          {!isEditMode && candidates.length < MAX_CANDIDATES && (
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
