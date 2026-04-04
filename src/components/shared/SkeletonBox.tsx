interface SkeletonBoxProps {
  className?: string
}

export function SkeletonBox({ className = '' }: SkeletonBoxProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[#E7E9ED] rounded-lg ${className}`}
    />
  )
}
