import { useNavigate, useParams } from 'react-router'
import { useEditVoteDraft } from '../../hooks/host/useEditVoteDraft'
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation'
import { useLanguage } from '../../providers/LanguageProvider'
import { useToast } from '../../providers/ToastProvider'
import { StepBasicInfo } from './steps/StepBasicInfo'
import { StepCandidates } from './steps/StepCandidates'

function getVoteEditCopy(lang: 'en' | 'ko') {
  return lang === 'ko'
    ? {
        stepLabels: ['기본 정보', '후보 수정'],
        updatedToast: '투표 내용이 성공적으로 수정되었습니다.',
        backButton: '뒤로가기',
        submitButton: '수정 완료',
        nextStep: '다음 단계',
      }
    : {
        stepLabels: ['Basic Info', 'Edit Candidates'],
        updatedToast: 'Vote updated successfully.',
        backButton: 'Go back',
        submitButton: 'Save Changes',
        nextStep: 'Next Step',
      }
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
              n < current
                ? 'bg-[#7140FF] text-white'
                : n === current
                  ? 'bg-white text-[#7140FF] ring-2 ring-[#7140FF]'
                  : 'bg-white/20 text-white/40'
            }`}
          >
            {n < current ? (
              <svg
                aria-hidden="true"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              n
            )}
          </div>
          {n < total && (
            <div
              className={`w-6 h-0.5 rounded-full ${n < current ? 'bg-[#7140FF]' : 'bg-white/20'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#F7F8FA]">
      <div className="w-8 h-8 rounded-full border-2 border-[#E7E9ED] border-t-[#7140FF] animate-spin" />
    </div>
  )
}

export function VoteEditPage() {
  const { id = '1' } = useParams()
  const navigate = useNavigate()
  const navigateBack = useSmartBackNavigation(`/host/manage/${id}`)
  const { lang } = useLanguage()
  const { addToast } = useToast()
  const {
    isLoading,
    initialDraft,
    draft,
    step,
    isCurrentStepValid,
    hasChanges,
    updateField,
    addCandidate,
    removeCandidate,
    updateCandidate,
    addSection,
    removeSection,
    updateSectionName,
    updateSectionCoverImage,
    addCandidateToSection,
    removeCandidateFromSection,
    updateSectionCandidate,
    clearSections,
    nextStep,
    prevStep,
    submit,
    isSubmitting,
  } = useEditVoteDraft(id)
  const copy = getVoteEditCopy(lang)

  const handleSubmit = async () => {
    if (!isCurrentStepValid || !hasChanges) return
    await submit()
    addToast({ type: 'success', message: copy.updatedToast })
    navigate(`/host/manage/${id}`)
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="relative mx-auto h-screen w-full max-w-[430px] overflow-hidden bg-[#F7F8FA] shadow-[0_0_60px_rgba(0,0,0,0.12)]">
      {/* Header */}
      <header className="fixed left-1/2 -translate-x-1/2 z-[100] w-full max-w-[430px] h-14 bg-[#13141A] flex items-center px-4 gap-3">
        <button
          type="button"
          aria-label={copy.backButton}
          onClick={() => (step === 1 ? navigateBack() : prevStep())}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-colors flex-shrink-0"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="text-[11px] text-white/40 font-mono">{copy.stepLabels[step - 1]}</div>
        </div>

        <StepIndicator current={step} total={2} />
      </header>

      {/* Scrollable content */}
      <main className="h-screen overflow-y-auto pt-14 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {step === 1 && (
          <StepBasicInfo draft={draft} onUpdate={updateField} initialDraft={initialDraft} />
        )}
        {step === 2 && (
          <StepCandidates
            electionTitle={draft.electionTitle}
            electionCoverImage={draft.electionCoverImage}
            candidates={draft.candidates}
            sections={draft.sections}
            onUpdateElectionTitle={(value) => updateField('electionTitle', value)}
            onUpdateElectionCoverImage={(value) => updateField('electionCoverImage', value)}
            onUpdateElectionCoverImageFile={(value) => updateField('electionCoverImageFile', value)}
            onAdd={addCandidate}
            onRemove={removeCandidate}
            onUpdate={updateCandidate}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onUpdateSectionName={updateSectionName}
            onUpdateSectionCoverImage={updateSectionCoverImage}
            onAddCandidateToSection={addCandidateToSection}
            onRemoveCandidateFromSection={removeCandidateFromSection}
            onUpdateSectionCandidate={updateSectionCandidate}
            onClearSections={clearSections}
            initialCandidates={initialDraft?.candidates}
            initialElectionCoverImage={initialDraft?.electionCoverImage}
          />
        )}
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#E7E9ED] px-5 py-4 z-[100]">
        <button
          type="button"
          disabled={!isCurrentStepValid || isSubmitting || (step === 2 && !hasChanges)}
          onClick={step === 2 ? handleSubmit : nextStep}
          className="w-full bg-[#7140FF] text-white rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-85 transition-opacity active:enabled:scale-[0.99] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : step === 2 ? (
            copy.submitButton
          ) : (
            <>
              {copy.nextStep}
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
