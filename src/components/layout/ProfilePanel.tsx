import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { formatUnits } from 'viem'
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWalletClient,
} from 'wagmi'
import accountCircleIcon from '../../assets/account_circle.svg'
import file_download from '../../assets/file_download_done.svg'
import connectWalletIcon from '../../assets/account_connect_wallet.svg'
import disconnectWalletIcon from '../../assets/account_disconnect_wallet.svg'
import completeVoteIcon from '../../assets/complete_vote.svg'
import karmaIcon from '../../assets/karma.svg'
import languageIcon from '../../assets/language.svg'
import libraryAddIcon from '../../assets/library_add.svg'
import mockUsdtIcon from '../../assets/mock_usdt.svg'
import sttStakingIcon from '../../assets/stt_staking.svg'
import verifiedIcon from '../../assets/verified.svg'
import {
  getMockUsdtBalance,
  mintMockUsdt,
  waitForVestarTransactionReceipt,
} from '../../contracts/vestar/actions'
import { useMyKarma } from '../../hooks/user/useMyKarma'
import { useMyVotes } from '../../hooks/user/useMyVotes'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { useLanguage } from '../../providers/LanguageProvider'
import { useToast } from '../../providers/ToastProvider'
import { getWalletActionErrorMessage } from '../../utils/walletErrors'

interface ProfilePanelProps {
  open: boolean
  onClose: () => void
}

type MenuItem =
  | {
      kind: 'internal'
      labelKey: 'pp_my_votes' | 'pp_karma_history' | 'pp_stt_staking' | 'pp_verified_organizer'
      icon: string
      bg: string
      to: string
    }
  | {
      kind: 'external'
      labelKey: 'pp_my_votes' | 'pp_karma_history' | 'pp_stt_staking' | 'pp_verified_organizer'
      icon: string
      bg: string
      href: string
    }

const MENU_ITEMS: MenuItem[] = [
  {
    kind: 'internal',
    labelKey: 'pp_my_votes',
    icon: completeVoteIcon,
    bg: '#F0EDFF',
    to: '/mypage?tab=votes',
  },
  {
    kind: 'internal',
    labelKey: 'pp_karma_history',
    icon: karmaIcon,
    bg: '#E8FFF0',
    to: '/mypage?tab=karma',
  },
  {
    kind: 'internal',
    labelKey: 'pp_verified_organizer',
    icon: verifiedIcon,
    bg: '#EEF2FF',
    to: '/verified',
  },
  {
    kind: 'external',
    labelKey: 'pp_stt_staking',
    icon: sttStakingIcon,
    bg: '#FFF5E8',
    href: 'https://hub.status.network/stake',
  },
]

const MOCK_USDT_MINT_AMOUNT = 1_000n * 10n ** 6n

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatMockUsdtBalance(balance: bigint): string {
  const [whole, fraction = ''] = formatUnits(balance, 6).split('.')
  const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const trimmedFraction = fraction.replace(/0+$/, '').slice(0, 2)

  return trimmedFraction ? `${wholeWithCommas}.${trimmedFraction}` : wholeWithCommas
}

function ActionIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="w-6 h-6" />
}

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { connect, connectors, isPending: isConnectPending } = useConnect()
  const { switchChainAsync } = useSwitchChain()
  const { disconnect } = useDisconnect()
  const navigate = useNavigate()
  const { t, lang, toggleLang } = useLanguage()
  const { addToast } = useToast()
  const { tier } = useMyKarma()
  const { votes } = useMyVotes()
  const [isMintingMockUsdt, setIsMintingMockUsdt] = useState(false)
  const [mockUsdtBalance, setMockUsdtBalance] = useState('—')
  const verificationPortalPath = `${import.meta.env.BASE_URL}verification`

  useEffect(() => {
    let cancelled = false

    if (!isConnected || !address) {
      setMockUsdtBalance('—')
      return
    }

    getMockUsdtBalance(address)
      .then((balance) => {
        if (cancelled) return
        setMockUsdtBalance(formatMockUsdtBalance(balance))
      })
      .catch(() => {
        if (cancelled) return
        setMockUsdtBalance('—')
      })

    return () => {
      cancelled = true
    }
  }, [address, isConnected])

  const handleDisconnect = () => {
    disconnect()
    onClose()
  }

  const handleConnect = () => {
    // sungje : 프로필 패널 하단 버튼은 연결 상태에 따라 connect / disconnect 동작을 같은 자리에서 바꿔준다.
    const injectedConnector = connectors.find((connector) => connector.id === 'injected')
    const connector = injectedConnector ?? connectors[0]

    if (connector) {
      connect({ connector })
    }
  }

  const isDisconnectAction = isConnected

  const handleMintMockUsdt = async () => {
    if (!isConnected || !address) {
      addToast({
        type: 'error',
        message: lang === 'ko' ? '지갑을 먼저 연결해주세요.' : 'Connect your wallet first.',
      })
      return
    }

    if (!walletClient) {
      addToast({
        type: 'error',
        message:
          lang === 'ko'
            ? 'Status Network Testnet에 연결된 지갑이 필요합니다.'
            : 'A wallet connected to Status Network Testnet is required.',
      })
      return
    }

    setIsMintingMockUsdt(true)

    try {
      if (chainId !== vestarStatusTestnetChain.id) {
        await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
      }

      const hash = await mintMockUsdt(walletClient, address, MOCK_USDT_MINT_AMOUNT)
      await waitForVestarTransactionReceipt(hash)
      const balance = await getMockUsdtBalance(address)
      setMockUsdtBalance(formatMockUsdtBalance(balance))

      addToast({
        type: 'success',
        message: lang === 'ko' ? '1,000 MockUSDT가 지급되었습니다.' : '1,000 MockUSDT minted.',
      })
    } catch (error) {
      console.error('[ProfilePanel] failed to mint MockUSDT:', error)
      addToast({
        type: 'error',
        message: getWalletActionErrorMessage(error, {
          lang,
          defaultMessage:
            lang === 'ko' ? 'MockUSDT 민트에 실패했습니다.' : 'Failed to mint MockUSDT.',
        }),
      })
    } finally {
      setIsMintingMockUsdt(false)
    }
  }

  return (
    <>
      {/*여기 부분에 나오는 KARMA HISTORY는 일단 없애기. 또한, MYPAGE에서 나오는 KARMA HISTORY도 없애기*/}
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
        <div className="bg-[#13141A] px-5 pt-[calc(var(--safe-top)+1.5rem)] pb-5 flex-shrink-0">
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
        <div className="grid grid-cols-3 gap-[1px] bg-[#E7E9ED] border-b border-[#E7E9ED] flex-shrink-0">
          <div className="bg-white px-4 py-[14px]">
            <div className="text-[11px] text-[#707070] mb-1">{t('pp_tier_stat')}</div>
            <div
              className="text-[15px] font-bold font-mono"
              style={{ color: isConnected ? tier.color : '#707070' }}
            >
              {isConnected ? tier.label : '—'}
            </div>
          </div>
          <div className="bg-white px-4 py-[14px]">
            <div className="text-[11px] text-[#707070] mb-1">{t('pp_votes_stat')}</div>
            <div className="text-[17px] font-bold text-[#090A0B] font-mono">
              {isConnected ? votes.length : 0}
            </div>
          </div>
          <div className="bg-white px-4 py-[14px]">
            <div className="text-[11px] text-[#707070] mb-1">{t('pp_mock_usdt_stat')}</div>
            <div className="text-[15px] font-bold text-[#090A0B] font-mono truncate">
              {mockUsdtBalance}
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
                    <ActionIcon src={item.icon} alt="" />
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

            <button
              type="button"
              onClick={handleMintMockUsdt}
              disabled={!isConnected || isMintingMockUsdt}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-default"
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 bg-[#FFF5E8]">
                <ActionIcon src={mockUsdtIcon} alt="" />
              </span>
              <span className="text-[14px] font-medium text-[#090A0B]">
                {isMintingMockUsdt ? t('pp_mint_mock_usdt_loading') : t('pp_mint_mock_usdt')}
              </span>
              <span className="ml-auto text-[#707070]">
                {isMintingMockUsdt ? (
                  <span className="block w-4 h-4 rounded-full border-2 border-[#D1D5DB] border-t-[#7140FF] animate-spin" />
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
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/host')
                onClose()
              }}
              disabled={!isConnected}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-default"
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 bg-[#F0EDFF]">
                <ActionIcon src={libraryAddIcon} alt="" />
              </span>
              <span className="text-[14px] font-medium text-[#090A0B]">{t('pp_host_page')}</span>
              <span className="ml-auto text-[#707070]">
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
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(verificationPortalPath)
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer text-left"
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 bg-[#E8F0FF]">
                <ActionIcon src={file_download} alt="" />
              </span>
              <span className="text-[14px] font-medium text-[#090A0B]">
                {t('mp_verification_cta')}
              </span>
              <span className="ml-auto text-[#707070]">
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
              </span>
            </button>

            <div className="h-px bg-[#E7E9ED] my-2" />

            {/* Language toggle */}
            <div className="flex items-center gap-3 px-3 py-3">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 bg-[#E8F0FF]">
                <ActionIcon src={languageIcon} alt="" />
              </span>
              <span className="text-[14px] font-medium text-[#090A0B] flex-1">
                {t('pp_language')}
              </span>
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-px bg-[#F7F8FA] border border-[#E7E9ED] rounded-full px-[10px] py-[5px] hover:border-[#7140FF] transition-colors"
              >
                <span
                  className={`text-[11px] font-mono font-bold transition-colors ${lang === 'en' ? 'text-[#7140FF]' : 'text-[#C0C4CC]'}`}
                >
                  EN
                </span>
                <span className="text-[#C0C4CC] text-[9px] mx-[3px]">|</span>
                <span
                  className={`text-[11px] font-mono font-bold transition-colors ${lang === 'ko' ? 'text-[#7140FF]' : 'text-[#C0C4CC]'}`}
                >
                  KO
                </span>
              </button>
            </div>

            <div className="h-px bg-[#E7E9ED] my-2" />

            <button
              type="button"
              onClick={isConnected ? handleDisconnect : handleConnect}
              disabled={!isConnected && isConnectPending}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-default ${isDisconnectAction ? 'hover:bg-[rgba(220,38,38,0.12)]' : 'border border-[#E3D8FF] hover:bg-[#F7F2FF]'}`}
              style={{
                background: isDisconnectAction ? 'rgba(220,38,38,0.08)' : '#F8F5FF',
              }}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0"
                style={{
                  background: isDisconnectAction ? 'rgba(220,38,38,0.10)' : 'rgba(113,64,255,0.14)',
                }}
              >
                {/* sungje : 업로드한 connect / disconnect 전용 아이콘을 상태에 맞게 분기해서 사용한다. */}
                <img
                  src={isDisconnectAction ? disconnectWalletIcon : connectWalletIcon}
                  alt=""
                  className="w-[18px] h-[18px]"
                />
              </span>
              <span
                className="text-[14px] font-medium"
                style={{ color: isDisconnectAction ? '#dc2626' : '#7140FF' }}
              >
                {isDisconnectAction
                  ? t('pp_disconnect')
                  : isConnectPending
                    ? t('pp_connect_wallet_loading')
                    : t('pp_connect_wallet')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
