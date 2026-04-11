import type { ReactNode } from 'react'
import { PortalPanel } from '../ui/PortalPanel'

type ProofItemProps = {
  title: string
  description: string
  tone: 'success' | 'warning'
  children?: ReactNode
}

export function ProofItem({ title, description, tone, children }: ProofItemProps) {
  const iconTone =
    tone === 'success'
      ? 'bg-[rgba(34,197,94,0.12)] text-[#16a34a]'
      : 'bg-[rgba(245,158,11,0.12)] text-[#d97706]'

  return (
    <PortalPanel tone="muted" className="rounded-[20px] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-semibold ${iconTone}`}
        >
          {tone === 'success' ? '✓' : '!'}
        </div>
        <div>
          <div className="text-[14px] font-semibold text-[#090A0B]">{title}</div>
          <div className="mt-1 text-[13px] leading-[1.6] text-[#707070]">{description}</div>
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
    </PortalPanel>
  )
}
