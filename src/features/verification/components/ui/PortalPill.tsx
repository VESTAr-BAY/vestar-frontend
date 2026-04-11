import type { ReactNode } from 'react'
import { cn } from './cn'

type PortalPillProps = {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'success' | 'dark'
  size?: 'sm' | 'md'
}

const BASE_CLASS =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-center font-semibold leading-none'

const TONE_CLASS = {
  neutral: 'border border-[#EEF0F4] bg-[#F7F8FA] text-[#707070]',
  accent: 'border border-transparent bg-[#F0EDFF] text-[#5C4FE5]',
  success: 'border border-transparent bg-[#E8FFF0] text-[#16A34A]',
  dark: 'border border-transparent bg-white/10 text-white/75',
} as const

const SIZE_CLASS = {
  sm: 'min-h-8 px-3.5 text-[12px]',
  md: 'min-h-9 px-4 text-[13px]',
} as const

export function PortalPill({ children, tone = 'neutral', size = 'md' }: PortalPillProps) {
  return <span className={cn(BASE_CLASS, TONE_CLASS[tone], SIZE_CLASS[size])}>{children}</span>
}
