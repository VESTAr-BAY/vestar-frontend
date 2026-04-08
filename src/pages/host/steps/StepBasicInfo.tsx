import type { VoteCreateDraft } from '../../../types/host'
import { useRef } from 'react'

const CATEGORIES = ['음악방송', '시상식', '팬투표', '콘셉트', '기타']

interface StepBasicInfoProps {
  draft: VoteCreateDraft
  onUpdate: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
  initialDraft?: VoteCreateDraft | null
}

export function StepBasicInfo({ draft, onUpdate, initialDraft }: StepBasicInfoProps) {
  const isBannerChanged = initialDraft && initialDraft.bannerImage !== draft.bannerImage

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      onUpdate('bannerImage', url)
      onUpdate('bannerImageFile', file)
    }
  }

  return (
    <div className="px-5 py-6 flex flex-col gap-6">
      {/* Title */}
      <div>
        <label htmlFor="vote-title" className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          투표 제목 <span className="text-[#7140FF]">*</span>
        </label>
        <input
          id="vote-title"
          type="text"
          value={draft.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="예: 이번 주 1위는 누구?"
          maxLength={60}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
        <div className="text-right text-[11px] text-[#707070] mt-1">{draft.title.length}/60</div>
      </div>

      {/* Group */}
      <div>
        <label htmlFor="vote-org" className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          주최 <span className="text-[#7140FF]">*</span>
        </label>
        <input
          id="vote-org"
          type="text"
          value={draft.group}
          onChange={(e) => onUpdate('group', e.target.value)}
          placeholder="예: MAMA 2026 (선택사항)"
          maxLength={40}
          className="w-full bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] placeholder:text-[#C0C4CC] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all"
        />
      </div>

      {/* Banner Image */}
      <div>
        <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#090A0B] mb-2">
          <span>배너 이미지</span>
          {isBannerChanged && <span className="text-[10px] font-bold text-[#7140FF] bg-[#7140FF]/10 px-1.5 py-0.5 rounded-md">수정됨</span>}
        </label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[21/9] rounded-xl border-2 border-dashed border-[#E7E9ED] bg-[#F7F8FA] hover:border-[#7140FF]/50 transition-colors flex items-center justify-center cursor-pointer overflow-hidden relative"
        >
          {draft.bannerImage ? (
            <img src={draft.bannerImage} alt="배너 이미지" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#C0C4CC]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-[13px] font-medium">이미지 업로드</span>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">카테고리</span>
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
