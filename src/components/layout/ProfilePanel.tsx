import { useNavigate } from 'react-router'
import { useAccount, useDisconnect } from 'wagmi'
import accountCircleIcon from '../../assets/account_circle.svg'
import verifiedIcon from '../../assets/verified.svg'

interface ProfilePanelProps {
  open: boolean
  onClose: () => void
}

type MenuItem =
  | { kind: 'internal'; label: string; icon: string; bg: string; to: string }
  | { kind: 'external'; label: string; icon: string; bg: string; href: string }

const MENU_ITEMS: MenuItem[] = [
  { kind: 'internal', label: '내 투표 내역', icon: '🗳️', bg: '#F0EDFF', to: '/mypage?tab=votes' },
  { kind: 'internal', label: 'Karma 내역', icon: '⚡', bg: '#E8FFF0', to: '/mypage?tab=karma' },
  {
    kind: 'external',
    label: 'STT 스테이킹',
    icon: '🪙',
    bg: '#FFF5E8',
    href: 'https://hub.status.network/stake',
  },
]

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()

  const karma = isConnected ? 2480 : 0
  const votes = isConnected ? 14 : 0
  const rank = isConnected ? 127 : null

  const handleDisconnect = () => {
    disconnect()
    onClose()
  }

  return (
    <>
      <button
        type="button"
        aria-label="닫기"
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
              aria-label="닫기"
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
                  {isConnected && address ? truncateAddress(address) : '지갑 미연결'}
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

        {/* Stats grid — 3 columns */}
        <div className="grid grid-cols-3 gap-[1px] bg-[#E7E9ED] border-b border-[#E7E9ED] flex-shrink-0">
          <div className="bg-white px-3 py-[14px]">
            <div className="text-[11px] text-[#707070] mb-1">Karma</div>
            <div className="text-[17px] font-bold text-[#7140FF] font-mono">
              {karma.toLocaleString()}
            </div>
          </div>
          <div className="bg-white px-3 py-[14px]">
            <div className="text-[11px] text-[#707070] mb-1">투표 수</div>
            <div className="text-[17px] font-bold text-[#090A0B] font-mono">{votes}</div>
          </div>
          <div className="bg-white px-3 py-[14px]">
            <div className="text-[11px] text-[#707070] mb-1">랭킹</div>
            <div className="text-[17px] font-bold text-[#7140FF] font-mono">
              {rank !== null ? `#${rank}` : '—'}
            </div>
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
                  <span className="text-[14px] font-medium text-[#090A0B]">{item.label}</span>
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
                    key={item.label}
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
                  key={item.label}
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

            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[rgba(220,38,38,0.06)] transition-colors cursor-pointer text-left"
              style={{ background: 'rgba(220,38,38,0.08)' }}
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 bg-[rgba(220,38,38,0.10)]">
                🔌
              </span>
              <span className="text-[14px] font-medium text-[#dc2626]">지갑 연결 해제</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
