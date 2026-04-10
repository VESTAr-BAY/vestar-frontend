import { useLanguage } from '../../../../providers/LanguageProvider'
import { PortalButton } from '../ui/PortalButton'
import { PortalPanel } from '../ui/PortalPanel'

type ValueCardProps = {
  label: string
  value: string
  actionHref?: string
  actionLabel?: string
}

export function ValueCard({ label, value, actionHref, actionLabel }: ValueCardProps) {
  const { lang } = useLanguage()

  return (
    <PortalPanel className="rounded-[22px]">
      <div className="text-[13px] font-medium text-[#707070]">{label}</div>
      <div className="mt-3 break-all font-mono text-[12px] leading-[1.75] text-[#090A0B]">
        {value}
      </div>
      {actionHref ? (
        <div className="mt-4 flex justify-start">
          <PortalButton href={actionHref} size="sm">
            {actionLabel ?? (lang === 'ko' ? '블록체인에서 보기' : 'View on blockchain')}
          </PortalButton>
        </div>
      ) : null}
    </PortalPanel>
  )
}
