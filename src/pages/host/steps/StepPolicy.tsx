import type { VoteCreateDraft, VotePolicy, IntervalUnit } from '../../../types/host'

interface StepPolicyProps {
  draft: VoteCreateDraft
  onUpdate: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
}

const VOTE_POLICY_OPTIONS: Array<{ value: VotePolicy; label: string; desc: string }> = [
  { value: 'ONE_TIME', label: '1회 투표', desc: '선거 기간 동안 단 한 번만 투표할 수 있습니다' },
  { value: 'PERIODIC', label: '일정 주기마다 투표', desc: '설정된 주기마다 투표권이 다시 부여됩니다' },
  { value: 'UNLIMITED', label: '무제한 투표', desc: '유료로 제한 없이 반복해서 투표할 수 있습니다' },
]

export function StepPolicy({ draft, onUpdate }: StepPolicyProps) {
  const isUnlimited = draft.votePolicy === 'UNLIMITED';

  return (
    <div className="px-5 py-6 flex flex-col gap-6">
      {/* Vote Policy */}
      <div>
        <label className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          투표 방식
        </label>
        <div className="flex flex-col gap-2">
          {VOTE_POLICY_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate('votePolicy', value)}
              className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                draft.votePolicy === value
                  ? 'bg-[#F0EDFF] border-[#7140FF]'
                  : 'bg-white border-[#E7E9ED] hover:border-[#7140FF]/40'
              }`}
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  draft.votePolicy === value
                    ? 'border-[#7140FF] bg-[#7140FF]'
                    : 'border-[#E7E9ED]'
                }`}
              >
                {draft.votePolicy === value && (
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

      

      {/* Payment Type */}
      <div>
        <label className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          투표 비용
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isUnlimited}
            onClick={() => onUpdate('paymentType', 'FREE')}
            className={`flex-1 py-3 rounded-xl text-[14px] font-semibold border-2 transition-all ${
              draft.paymentType === 'FREE' && !isUnlimited
                ? 'bg-[#7140FF] text-white border-[#7140FF]'
                : isUnlimited
                  ? 'bg-[#E7E9ED] text-[#A0A4A8] border-[#E7E9ED] cursor-not-allowed'
                  : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF]/40'
            }`}
          >
            무료
          </button>
          <button
            type="button"
            onClick={() => onUpdate('paymentType', 'PAID')}
            className={`flex-1 py-3 rounded-xl text-[14px] font-semibold border-2 transition-all ${
              draft.paymentType === 'PAID' || isUnlimited
                ? 'bg-[#7140FF] text-white border-[#7140FF]'
                : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF]/40'
            }`}
          >
            유료
          </button>
        </div>

        {/* Cost input */}
        {(draft.paymentType === 'PAID' || isUnlimited) && (
          <div className="mt-3 flex items-center relative">
            <input
              type="number"
              min="1"
              max="100"
              value={draft.costPerBallot || ''}
              disabled={isUnlimited}
              onChange={(e) => onUpdate('costPerBallot', Number(e.target.value))}
              placeholder="0초과 100이하의 값 입력"
              className={`w-full bg-white border border-[#E7E9ED] rounded-xl pl-4 pr-10 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all ${isUnlimited ? 'bg-[#F7F8FA] text-[#707070] cursor-not-allowed' : ''}`}
            />
            <span className="absolute right-4 text-[14px] text-[#707070] font-medium pointer-events-none">원</span>
          </div>
        )}
      </div>
      
      {/* Period setting */}
      {draft.votePolicy === 'PERIODIC' && (
        <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E7E9ED]">
          <label className="block text-[13px] font-semibold text-[#090A0B] mb-3">
            투표권 갱신 주기
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={draft.resetIntervalValue || ''}
              onChange={(e) => onUpdate('resetIntervalValue', Number(e.target.value))}
              className="flex-1 bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all text-center"
            />
            <select
              value={draft.resetIntervalUnit}
              onChange={(e) => onUpdate('resetIntervalUnit', e.target.value as IntervalUnit)}
              className="w-24 bg-white border border-[#E7E9ED] rounded-xl px-2 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all cursor-pointer"
            >
              <option value="days">일</option>
              <option value="hours">시간</option>
              <option value="minutes">분</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E7E9ED]">
        <label className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          최소 카르마 티어
        </label>
        <input
          type="number"
          min="0"
          max="255"
          value={draft.minKarmaTier}
          onChange={(e) => onUpdate('minKarmaTier', Number(e.target.value))}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
      </div>
    </div>
  )
}
