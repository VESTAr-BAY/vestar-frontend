import { createContext, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import type { ScrollState } from '../../hooks/useScrollDirection'
import { ProfilePanel } from './ProfilePanel'
import { SearchOverlay } from './SearchOverlay'
import { DetailHeader } from './DetailHeader'

export interface VoteDetailHeaderConfig {
  title: string
  onShare?: () => void
}

export const VoteDetailHeaderContext = createContext<{
  setConfig: (config: VoteDetailHeaderConfig) => void
  scrollState: ScrollState
}>({ setConfig: () => {}, scrollState: 'default' })

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
    <VoteDetailHeaderContext value={{ setConfig: setHeaderConfig, scrollState }}>
      <div className="relative mx-auto h-screen w-full max-w-[430px] overflow-hidden bg-[#ffffff] shadow-[0_0_60px_rgba(0,0,0,0.12)]">
        {/*main페이지의 header의 색상과 형태를 그대로 공유하여 format을 일관성 있게 UI꾸리기*/}
        <DetailHeader
          scrollState={scrollState}
          title={headerConfig.title}
          onBack={handleBack}
          onShare={headerConfig.onShare}
          onOpenPanel={() => setPanelOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main
          className="h-screen overflow-y-auto pt-14 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
