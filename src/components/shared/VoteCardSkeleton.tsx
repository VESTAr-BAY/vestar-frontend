import { SkeletonBox } from './SkeletonBox'

export function VoteCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-white border border-[#E7E9ED] rounded-2xl p-4 flex items-center gap-[14px]">
      <SkeletonBox className="w-[52px] h-[52px] rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <SkeletonBox className="h-2.5 w-1/3 rounded-full" />
        <SkeletonBox className="h-4 w-4/5 rounded-full" />
        <SkeletonBox className="h-2.5 w-1/4 rounded-full" />
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <SkeletonBox className="h-4 w-12 rounded-full" />
        <SkeletonBox className="h-2.5 w-8 rounded-full" />
        <SkeletonBox className="h-3.5 w-3.5 rounded" />
      </div>
    </div>
  )
}
