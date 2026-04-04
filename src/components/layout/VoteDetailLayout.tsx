import { createContext, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { ProfilePanel } from './ProfilePanel'
import { SearchOverlay } from './SearchOverlay'
import { DetailHeader } from './DetailHeader'

export interface VoteDetailHeaderConfig {
  title: string
  onShare?: () => void
}

export const VoteDetailHeaderContext = createContext<{
  setConfig: (config: VoteDetailHeaderConfig) => void
}>({ setConfig: () => {} })

export function VoteDetailLayout() {
  const [headerConfig, setHeaderConfig] = useState<VoteDetailHeaderConfig>({ title: '' })
  const [panelOpen, setPanelOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { scrollState, onScroll } = useScrollDirection()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <VoteDetailHeaderContext value={{ setConfig: setHeaderConfig }}>
      <div className="relative mx-auto h-screen w-full max-w-[430px] overflow-hidden bg-[#F7F8FA] shadow-[0_0_60px_rgba(0,0,0,0.12)]">
        <DetailHeader
          scrollState={scrollState}
          title={headerConfig.title}
          onBack={handleBack}
          onShare={headerConfig.onShare}
          onOpenPanel={() => setPanelOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main
          className="h-screen overflow-y-auto pt-14 pb-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={onScroll}
        >
          <Outlet />
        </main>

        <ProfilePanel open={panelOpen} onClose={() => setPanelOpen(false)} />

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </VoteDetailHeaderContext>
  )
}
