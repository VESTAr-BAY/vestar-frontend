import { useNavigate } from 'react-router'
import { useCreateVoteDraft } from '../../hooks/host/useCreateVoteDraft'
import { useToast } from '../../providers/ToastProvider'
import { StepBasicInfo } from './steps/StepBasicInfo'
import { StepCandidates } from './steps/StepCandidates'
import { StepSchedule } from './steps/StepSchedule'

const STEP_LABELS = ['기본 정보', '후보 등록', '일정 & 설정']

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
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
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

export function VoteCreatePage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const {
    draft,
    step,
    isCurrentStepValid,
    submissionProgress,
    updateField,
    addCandidate,
    removeCandidate,
    updateCandidate,
    addSection,
    removeSection,
    updateSectionName,
    updateSectionField,
    addCandidateToSection,
    removeCandidateFromSection,
    updateSectionCandidate,
    clearSections,
    nextStep,
    prevStep,
    submit,
    isSubmitting,
  } = useCreateVoteDraft()

  const handleSubmit = async () => {
    if (!isCurrentStepValid) return

    try {
      const result = await submit()
      const successMessage =
        result.elections.length > 1
          ? `${result.elections.length}개의 투표가 같은 시리즈로 생성되었습니다.`
          : `투표가 생성되었습니다. election: ${result.electionAddress.slice(0, 6)}...${result.electionAddress.slice(-4)}`
      addToast({
        type: 'success',
        message: successMessage,
      })
      navigate('/host')
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : '투표 생성에 실패했습니다.',
      })
    }
  }

  return (
    <div className="relative mx-auto h-screen w-full max-w-[430px] overflow-hidden bg-[#F7F8FA] shadow-[0_0_60px_rgba(0,0,0,0.12)]">
      {/* Header */}
      <header className="fixed left-1/2 top-0 z-[100] flex h-[calc(4rem+var(--safe-top))] w-full max-w-[430px] -translate-x-1/2 items-end gap-3 bg-[#13141A] px-[calc(1.25rem+var(--safe-left))] pb-3 pt-[calc(var(--safe-top)+0.75rem)] pr-[calc(1.25rem+var(--safe-right))]">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => (step === 1 ? navigate('/host') : prevStep())}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-colors flex-shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1">
          <div className="text-[15px] font-semibold tracking-[-0.01em] text-white">
            {STEP_LABELS[step - 1]}
          </div>
        </div>

        <StepIndicator current={step} total={3} />
      </header>

      {/* Scrollable content */}
      <main className="h-screen overflow-y-auto px-[var(--safe-left)] pr-[var(--safe-right)] pt-[calc(4rem+var(--safe-top))] pb-[calc(var(--footer-h)+1.5rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {step === 1 && <StepBasicInfo draft={draft} onUpdate={updateField} />}
        {step === 2 && (
          <StepCandidates
            electionTitle={draft.electionTitle}
            candidates={draft.candidates}
            sections={draft.sections}
            onUpdateElectionTitle={(value) => updateField('electionTitle', value)}
            onAdd={addCandidate}
            onRemove={removeCandidate}
            onUpdate={updateCandidate}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onUpdateSectionName={updateSectionName}
            onAddCandidateToSection={addCandidateToSection}
            onRemoveCandidateFromSection={removeCandidateFromSection}
            onUpdateSectionCandidate={updateSectionCandidate}
            onClearSections={clearSections}
          />
        )}
        {step === 3 && (
          <StepSchedule
            draft={draft}
            onUpdate={updateField}
            onUpdateSectionField={updateSectionField}
          />
        )}
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 border-t border-[#E7E9ED] bg-white px-[calc(1.25rem+var(--safe-left))] py-4 pb-[calc(1rem+var(--safe-bottom))] pr-[calc(1.25rem+var(--safe-right))]">
        <button
          type="button"
          disabled={!isCurrentStepValid || isSubmitting}
          onClick={step === 3 ? handleSubmit : nextStep}
          className="w-full bg-[#7140FF] text-white rounded-2xl py-4 text-[15px] font-bold disabled:bg-[#E7E9ED] disabled:text-[#707070] disabled:cursor-default hover:enabled:opacity-85 transition-opacity active:enabled:scale-[0.99] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>
                {submissionProgress.currentTitle
                  ? submissionProgress.total > 1 && submissionProgress.current > 0
                    ? `${submissionProgress.current}/${submissionProgress.total} ${submissionProgress.currentTitle} 서명 요청 중`
                    : `${submissionProgress.currentTitle} 서명 요청 중`
                  : submissionProgress.total > 1
                    ? `${submissionProgress.current}/${submissionProgress.total} 지갑 서명 요청 중`
                    : '지갑 서명 요청 중'}
              </span>
            </>
          ) : step === 3 ? (
            draft.sections.length > 0 ? (
              `투표 만들기 (${draft.sections.length}건)`
            ) : (
              '투표 만들기 완료'
            )
          ) : (
            <>
              다음 단계
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
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
