import type { ReactNode } from 'react'
import { cn } from './cn'

type PortalButtonProps = {
  children: ReactNode
  href?: string
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  variant?: 'surface' | 'header'
  size?: 'sm' | 'md'
}

const BASE_CLASS =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border text-center font-semibold leading-none transition-colors duration-200'

const VARIANT_CLASS = {
  surface: 'border-[#D8DCEF] bg-white text-[#5C4FE5] hover:border-[#7140FF] hover:text-[#7140FF]',
  header: 'border-white/10 bg-white/[0.08] text-white/80 hover:bg-white/[0.14] hover:text-white',
} as const

const SIZE_CLASS = {
  sm: 'min-h-11 px-5 text-[14px]',
  md: 'min-h-12 px-5 text-[15px]',
} as const

const HEADER_SIZE_CLASS = 'min-h-9 px-3.5 text-[13px]'

export function PortalButton({
  children,
  href,
  onClick,
  disabled = false,
  fullWidth = false,
  variant = 'surface',
  size = 'md',
}: PortalButtonProps) {
  const sizeClass = variant === 'header' ? HEADER_SIZE_CLASS : SIZE_CLASS[size]

  const className = cn(
    BASE_CLASS,
    VARIANT_CLASS[variant],
    sizeClass,
    fullWidth ? 'w-full' : 'w-auto',
    disabled && 'cursor-not-allowed opacity-40',
  )

  if (href && !disabled) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}
