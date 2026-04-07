import type { ResultReveal, VoteCreateDraft } from '../../../types/host'

interface StepScheduleProps {
  draft: VoteCreateDraft
  onUpdate: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
}

const MAX_CHOICES_OPTIONS: Array<{ value: 1 | 2 | 3; label: string }> = [
  { value: 1, label: '1명' },
  { value: 2, label: '2명' },
  { value: 3, label: '3명' },
]

const RESULT_REVEAL_OPTIONS: Array<{ value: ResultReveal; label: string; desc: string }> = [
  { value: 'after_end', label: '종료 후 공개', desc: '투표 종료 시점에 결과를 공개합니다' },
  { value: 'immediate', label: '실시간 공개', desc: '투표 중에도 현재 순위를 볼 수 있습니다' },
]

export function StepSchedule({ draft, onUpdate }: StepScheduleProps) {
  return (
    <div className="px-5 py-6 flex flex-col gap-6">
      {/* Start date */}
      <div>
        <label htmlFor="vote-start-date" className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          시작 일시 <span className="text-[#7140FF]">*</span>
        </label>
        <input
          id="vote-start-date"
          type="datetime-local"
          value={draft.startDate}
          onChange={(e) => onUpdate('startDate', e.target.value)}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
      </div>

      {/* End date */}
      <div>
        <label htmlFor="vote-end-date" className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          종료 일시 <span className="text-[#7140FF]">*</span>
        </label>
        <input
          id="vote-end-date"
          type="datetime-local"
          value={draft.endDate}
          onChange={(e) => onUpdate('endDate', e.target.value)}
          min={draft.startDate}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
      </div>

      {/* Max choices */}
      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          선택 가능 후보 수
        </span>
        <div className="flex gap-2">
          {MAX_CHOICES_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate('maxChoices', value)}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-semibold border-2 transition-all ${
                draft.maxChoices === value
                  ? 'bg-[#7140FF] text-white border-[#7140FF]'
                  : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF]/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result reveal */}
      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          결과 공개 방식
        </span>
        <div className="flex flex-col gap-2">
          {RESULT_REVEAL_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate('resultReveal', value)}
              className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                draft.resultReveal === value
                  ? 'bg-[#F0EDFF] border-[#7140FF]'
                  : 'bg-white border-[#E7E9ED] hover:border-[#7140FF]/40'
              }`}
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  draft.resultReveal === value
                    ? 'border-[#7140FF] bg-[#7140FF]'
                    : 'border-[#E7E9ED]'
                }`}
              >
                {draft.resultReveal === value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#090A0B]">{label}</div>
                <div className="text-[12px] text-[#707070] mt-0.5">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
