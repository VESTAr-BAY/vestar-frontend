import { SkeletonBox } from './SkeletonBox'

export function HotCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex-shrink-0 w-[200px] bg-white border border-[#E7E9ED] rounded-2xl overflow-hidden">
      <SkeletonBox className="h-[100px] rounded-none" />
      <div className="px-3 pt-3 pb-[14px] flex flex-col gap-2">
        <SkeletonBox className="h-2.5 w-1/2 rounded-full" />
        <SkeletonBox className="h-3.5 w-full rounded-full" />
        <SkeletonBox className="h-3.5 w-2/3 rounded-full" />
        <div className="flex items-center justify-between mt-1">
          <SkeletonBox className="h-2.5 w-1/3 rounded-full" />
          <SkeletonBox className="h-6 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
