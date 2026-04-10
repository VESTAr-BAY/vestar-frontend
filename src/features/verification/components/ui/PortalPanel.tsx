import type { ReactNode } from 'react'
import { cn } from './cn'

type PortalPanelProps = {
  children: ReactNode
  tone?: 'surface' | 'muted' | 'dark'
  className?: string
}

const TONE_CLASS = {
  surface: 'border-[#EEF0F4] bg-white',
  muted: 'border-[#EEF0F4] bg-[#F7F8FA]',
  dark: 'border-white/10 bg-[#13141A] text-white',
} as const

export function PortalPanel({ children, tone = 'surface', className }: PortalPanelProps) {
  return (
    <div className={cn('rounded-[24px] border p-4', TONE_CLASS[tone], className)}>{children}</div>
  )
}
