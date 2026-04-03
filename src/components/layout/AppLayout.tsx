import { useState } from 'react'
import { Outlet } from 'react-router'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { FooterNav } from './FooterNav'
import { Header } from './Header'
import { ProfilePanel } from './ProfilePanel'
import { SearchOverlay } from './SearchOverlay'

export function AppLayout() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { scrollState, onScroll } = useScrollDirection()

  return (
    <div className="relative mx-auto h-screen w-full max-w-[430px] overflow-hidden bg-[#F7F8FA] shadow-[0_0_60px_rgba(0,0,0,0.12)]">
      <Header
        scrollState={scrollState}
        onOpenPanel={() => setPanelOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <main
        className="h-screen overflow-y-auto pt-14 pb-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={onScroll}
      >
        <Outlet />
      </main>

      <FooterNav scrollState={scrollState} />

      <ProfilePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  )
}
