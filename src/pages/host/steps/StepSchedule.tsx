import type { ResultReveal, VoteCreateDraft } from '../../../types/host'
import { useMemo, useState, useEffect } from 'react'

interface StepScheduleProps {
  draft: VoteCreateDraft
  onUpdate: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
}

const RESULT_REVEAL_OPTIONS: Array<{ value: ResultReveal; label: string; desc: string }> = [
  { value: 'after_end', label: '종료 후 공개', desc: '투표 종료 시점에 결과를 공개합니다' },
  { value: 'immediate', label: '실시간 공개', desc: '투표 중에도 현재 순위를 볼 수 있습니다' },
]

export function StepSchedule({ draft, onUpdate }: StepScheduleProps) {
  // 현재 시간 (min attribute 용도)
  const nowStr = useMemo(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().slice(0, 16);
  }, []);

  const [isCustomChoices, setIsCustomChoices] = useState(draft.maxChoices !== 1 && draft.maxChoices !== 2);

  // 외부에서 maxChoices가 바뀌었을 때 (예: 후보 삭제로 인해 최대값이 줄어듦) 동기화
  useEffect(() => {
    if (draft.maxChoices !== 1 && draft.maxChoices !== 2) {
      setIsCustomChoices(true);
    }
  }, [draft.maxChoices]);

  const totalCandidateCount = draft.sections.length > 0
    ? draft.sections.reduce((count, section) => count + section.candidates.length, 0)
    : draft.candidates.length
  const maxAllowed = Math.max(1, totalCandidateCount - 1);

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
          min={nowStr}
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
          min={draft.startDate || nowStr}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
      </div>

      {/* Reveal date */}
      <div>
        <label className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          결과 공개 일시 <span className="text-[#7140FF]">*</span>
        </label>
        <input
          type="datetime-local"
          value={draft.revealDate}
          onChange={(e) => onUpdate('revealDate', e.target.value)}
          min={draft.endDate || draft.startDate || nowStr}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
      </div>

      {/* Max choices */}
      <div>
        <label className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          선택 가능 후보 수 <span className="text-[11px] text-[#707070] font-normal ml-1">(최대 {maxAllowed}명)</span>
        </label>
        <div className={`flex gap-2 ${isCustomChoices ? 'mb-3' : ''}`}>
          {[1, 2].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setIsCustomChoices(false);
                onUpdate('maxChoices', val);
              }}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-semibold border-2 transition-all ${
                !isCustomChoices && draft.maxChoices === val
                  ? 'bg-[#7140FF] text-white border-[#7140FF]'
                  : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF]/40'
              }`}
            >
              {val}명
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustomChoices(true)}
            className={`flex-1 py-2.5 rounded-xl text-[14px] font-semibold border-2 transition-all ${
              isCustomChoices
                ? 'bg-[#7140FF] text-white border-[#7140FF]'
                : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF]/40'
            }`}
          >
            직접 입력
          </button>
        </div>
        {isCustomChoices && (
          <input
            type="number"
            min="1"
            max={maxAllowed}
            value={draft.maxChoices === 0 ? '' : draft.maxChoices}
            onChange={(e) => {
              const rawValue = e.target.value;
              if (rawValue === '') {
                onUpdate('maxChoices', 0);
                return;
              }
              const val = parseInt(rawValue, 10);
              if (isNaN(val)) return;

              if (val > maxAllowed) {
                onUpdate('maxChoices', maxAllowed);
              } else {
                onUpdate('maxChoices', val);
              }
            }}
            onBlur={() => {
              if (draft.maxChoices < 1) {
                onUpdate('maxChoices', 1);
              }
            }}
            placeholder={`1명 ~ ${maxAllowed}명`}
            className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
          />
        )}
      </div>

      {/* Result reveal policy */}
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
