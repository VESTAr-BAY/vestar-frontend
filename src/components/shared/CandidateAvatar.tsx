import { resolveIpfsUrl } from '../../utils/ipfs'

interface CandidateAvatarProps {
  imageUrl?: string
  emoji: string
  emojiColor: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  ring?: boolean
}

const SIZE_MAP = {
  sm:  { box: 'w-9 h-9 text-sm',   radius: 'rounded-xl' },
  md:  { box: 'w-11 h-11 text-xl', radius: 'rounded-xl' },
  lg:  { box: 'w-16 h-16 text-2xl',radius: 'rounded-2xl' },
  xl:  { box: 'w-[72px] h-[72px] text-[36px]', radius: 'rounded-2xl' },
}

export function CandidateAvatar({
  imageUrl,
  emoji,
  emojiColor,
  size = 'md',
  className = '',
  ring = false,
}: CandidateAvatarProps) {
  const { box, radius } = SIZE_MAP[size]
  const ringClass = ring ? 'ring-2 ring-[#F59E0B]/40' : ''
  const base = `${box} ${radius} flex-shrink-0 ${ringClass} ${className}`

  if (imageUrl) {
    return (
      <img
        src={resolveIpfsUrl(imageUrl)}
        alt={emoji}
        className={`${base} object-cover`}
      />
    )
  }

  return (
    <div
      className={`${base} flex items-center justify-center`}
      style={{ backgroundColor: emojiColor }}
    >
      {emoji}
    </div>
  )
}
