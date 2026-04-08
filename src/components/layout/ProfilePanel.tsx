import { useNavigate } from 'react-router'
import { useAccount, useDisconnect } from 'wagmi'
import accountCircleIcon from '../../assets/account_circle.svg'
import verifiedIcon from '../../assets/verified.svg'
import { useLanguage } from '../../providers/LanguageProvider'

interface ProfilePanelProps {
  open: boolean
  onClose: () => void
}

type MenuItem =
  | { kind: 'internal'; labelKey: 'pp_my_votes' | 'pp_karma_history' | 'pp_stt_staking'; icon: string; bg: string; to: string }
  | { kind: 'external'; labelKey: 'pp_my_votes' | 'pp_karma_history' | 'pp_stt_staking'; icon: string; bg: string; href: string }

const MENU_ITEMS: MenuItem[] = [
  { kind: 'internal', labelKey: 'pp_my_votes',      icon: '🗳️', bg: '#F0EDFF', to: '/mypage?tab=votes' },
  { kind: 'internal', labelKey: 'pp_karma_history', icon: '⚡', bg: '#E8FFF0', to: '/mypage?tab=karma' },
  { kind: 'external', labelKey: 'pp_stt_staking',   icon: '🪙', bg: '#FFF5E8', href: 'https://hub.status.network/stake' },
]

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getKarmaTier(karma: number): { label: string; emoji: string; color: string } {
  if (karma >= 100000000) return { label: 'Legendary',      emoji: '👑', color: '#F59E0B' }
  if (karma >= 5000000)   return { label: 'S-Tier',         emoji: '💎', color: '#22d3ee' }
  if (karma >= 500000)    return { label: 'High-Throughput',emoji: '🚀', color: '#06b6d4' }
  if (karma >= 100000)    return { label: 'Pro User',       emoji: '💫', color: '#818cf8' }
  if (karma >= 20000)     return { label: 'Power User',     emoji: '🔥', color: '#f97316' }
  if (karma >= 5000)      return { label: 'Regular',        emoji: '⭐', color: '#eab308' }
  if (karma >= 500)       return { label: 'Active',         emoji: '🟣', color: '#7140FF' }
  if (karma >= 50)        return { label: 'Basic',          emoji: '🔵', color: '#3b82f6' }
  if (karma >= 2)         return { label: 'Newbie',         emoji: '🌱', color: '#22c55e' }
  if (karma >= 1)         return { label: 'Entry',          emoji: '⚡', color: '#9CA3AF' }
  return                         { label: '—',              emoji: '·',  color: '#707070' }
}

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()
  const { t, lang, toggleLang } = useLanguage()

  const karma = isConnected ? 2480 : 0
  const votes = isConnected ? 14 : 0
  const tier = getKarmaTier(karma)

  const handleDisconnect = () => {
    disconnect()
    onClose()
  }

  return (
    <>
      <button
        type="button"
        aria-label={t('btn_close')}
        className={`absolute inset-0 z-[200] transition-[background] duration-[280ms] ease-in-out ${open ? 'bg-[rgba(9,10,11,0.55)] pointer-events-auto' : 'bg-transparent pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 right-0 bottom-0 w-[82%] bg-white flex flex-col overflow-hidden z-[201] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-x-0 shadow-[-8px_0_40px_rgba(0,0,0,0.14)] pointer-events-auto' : 'translate-x-full pointer-events-none'}`}
      >
        {/* Panel header */}
        <div className="bg-[#13141A] px-5 pt-6 pb-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <span className="text-white/50 text-[12px] font-mono tracking-[1px] uppercase">
              My Profile
            </span>
            <button
              type="button"
              aria-label={t('btn_close')}
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-[52px] h-[52px] rounded-full bg-[rgba(113,64,255,0.16)] border-2 border-[#7140FF] flex items-center justify-center flex-shrink-0">
              <img
                src={accountCircleIcon}
                alt=""
                className="w-8 h-8 brightness-0 invert opacity-55"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-white text-[14px] font-mono truncate">
                  {isConnected && address ? truncateAddress(address) : t('pp_not_connected')}
                </span>
                {isConnected && (
                  <img
                    src={verifiedIcon}
                    alt="verified"
                    className="w-4 h-4 flex-shrink-0 brightness-0 invert opacity-70"
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#22C55E] animate-pulse flex-shrink-0" />
                <span className="text-white/40 text-[11px]">Status Network</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-[1px] bg-[#E7E9ED] border-b border-[#E7E9ED] flex-shrink-0">
          <div className="bg-white px-4 py-[14px]">
            <div className="text-[11px] text-[#707070] mb-1">{t('pp_tier_stat')}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[17px]">{isConnected ? tier.emoji : '⚡'}</span>
              <span className="text-[15px] font-bold font-mono" style={{ color: isConnected ? tier.color : '#707070' }}>
                {isConnected ? tier.label : '—'}
              </span>
            </div>
          </div>
          <div className="bg-white px-4 py-[14px]">
            <div className="text-[11px] text-[#707070] mb-1">{t('pp_votes_stat')}</div>
            <div className="text-[17px] font-bold text-[#090A0B] font-mono">{votes}</div>
          </div>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto py-3 px-4">
          <div className="flex flex-col gap-1">
            {MENU_ITEMS.map((item) => {
              const content = (
                <>
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0"
                    style={{ background: item.bg }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[14px] font-medium text-[#090A0B]">{t(item.labelKey)}</span>
                  <span className="ml-auto text-[#707070]">
                    {item.kind === 'external' ? (
                      <svg
                        aria-hidden="true"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    )}
                  </span>
                </>
              )

              if (item.kind === 'external') {
                return (
                  <a
                    key={item.labelKey}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F7F8FA] transition-colors text-left"
                  >
                    {content}
                  </a>
                )
              }

              return (
                <button
                  key={item.labelKey}
                  type="button"
                  onClick={() => {
                    navigate(item.to)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left"
                >
                  {content}
                </button>
              )
            })}

            <div className="h-px bg-[#E7E9ED] my-2" />

            {/* Language toggle */}
            <div className="flex items-center gap-3 px-3 py-3">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 bg-[#E8F0FF]">
                🌐
              </span>
              <span className="text-[14px] font-medium text-[#090A0B] flex-1">{t('pp_language')}</span>
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-px bg-[#F7F8FA] border border-[#E7E9ED] rounded-full px-[10px] py-[5px] hover:border-[#7140FF] transition-colors"
              >
                <span className={`text-[11px] font-mono font-bold transition-colors ${lang === 'en' ? 'text-[#7140FF]' : 'text-[#C0C4CC]'}`}>EN</span>
                <span className="text-[#C0C4CC] text-[9px] mx-[3px]">|</span>
                <span className={`text-[11px] font-mono font-bold transition-colors ${lang === 'ko' ? 'text-[#7140FF]' : 'text-[#C0C4CC]'}`}>KO</span>
              </button>
            </div>

            <div className="h-px bg-[#E7E9ED] my-2" />

            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[rgba(220,38,38,0.06)] transition-colors cursor-pointer text-left"
              style={{ background: 'rgba(220,38,38,0.08)' }}
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 bg-[rgba(220,38,38,0.10)]">
                🔌
              </span>
              <span className="text-[14px] font-medium text-[#dc2626]">{t('pp_disconnect')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
