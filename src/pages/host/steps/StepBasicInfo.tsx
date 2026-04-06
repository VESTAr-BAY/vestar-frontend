import type { VoteCreateDraft } from '../../../types/host'

const EMOJI_OPTIONS = ['🎤', '🏆', '💜', '🎧', '🌟', '🎵', '🎶', '💿', '🎪', '🌸', '🔥', '⚡']
const CATEGORIES = ['음악방송', '시상식', '팬투표', '콘셉트', '기타']

interface StepBasicInfoProps {
  draft: VoteCreateDraft
  onUpdate: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
  initialDraft?: VoteCreateDraft | null
}

export function StepBasicInfo({ draft, onUpdate, initialDraft }: StepBasicInfoProps) {
  const isTitleChanged = initialDraft && initialDraft.title !== draft.title
  const isOrgChanged = initialDraft && initialDraft.org !== draft.org
  const isEmojiChanged = initialDraft && initialDraft.emoji !== draft.emoji
  const isCategoryChanged = initialDraft && initialDraft.category !== draft.category

  return (
    <div className="px-5 py-6 flex flex-col gap-6">
      {/* Title */}
      <div>
        <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#090A0B] mb-2">
          <span>투표 제목 <span className="text-[#7140FF]">*</span></span>
          {isTitleChanged && <span className="text-[10px] font-bold text-[#7140FF] bg-[#7140FF]/10 px-1.5 py-0.5 rounded-md">수정됨</span>}
        </label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="예: 이번 주 1위는 누구?"
          maxLength={60}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
        <div className="text-right text-[11px] text-[#707070] mt-1">{draft.title.length}/60</div>
      </div>

      {/* Org */}
      <div>
        <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#090A0B] mb-2">
          <span>주최 <span className="text-[#7140FF]">*</span></span>
          {isOrgChanged && <span className="text-[10px] font-bold text-[#7140FF] bg-[#7140FF]/10 px-1.5 py-0.5 rounded-md">수정됨</span>}
        </label>
        <input
          type="text"
          value={draft.org}
          onChange={(e) => onUpdate('org', e.target.value)}
          placeholder="예: Show! Music Core"
          maxLength={40}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
      </div>

      {/* Emoji */}
      <div>
        <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#090A0B] mb-2">
          <span>아이콘</span>
          {isEmojiChanged && <span className="text-[10px] font-bold text-[#7140FF] bg-[#7140FF]/10 px-1.5 py-0.5 rounded-md">수정됨</span>}
        </label>
        <div className="grid grid-cols-6 gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onUpdate('emoji', emoji)}
              className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                draft.emoji === emoji
                  ? 'bg-[#F0EDFF] border-2 border-[#7140FF]'
                  : 'bg-white border border-[#E7E9ED] hover:border-[#7140FF]/40'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#090A0B] mb-2">
          <span>카테고리</span>
          {isCategoryChanged && <span className="text-[10px] font-bold text-[#7140FF] bg-[#7140FF]/10 px-1.5 py-0.5 rounded-md">수정됨</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onUpdate('category', cat)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all ${
                draft.category === cat
                  ? 'bg-[#7140FF] text-white border-[#7140FF]'
                  : 'bg-white text-[#707070] border-[#E7E9ED] hover:border-[#7140FF] hover:text-[#7140FF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
