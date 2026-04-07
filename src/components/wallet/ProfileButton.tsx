import { useState } from 'react'
import { useDisconnect } from 'wagmi'
import profileIcon from '../../assets/account_circle.svg'
import { useWalletRole } from '../../hooks/useWalletRole'

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function ProfileButton() {
  const { address, role } = useWalletRole()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)

  if (!address) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-[#e7e9ed] bg-white px-3 py-2 text-sm font-medium text-[#090a0b] transition-colors hover:bg-[#F8F5FF]"
      >
        <img src={profileIcon} alt="Profile" className="size-6" />
        <span>{truncateAddress(address)}</span>
        <span className="rounded-full bg-[#F8F5FF] px-2 py-0.5 text-xs font-semibold text-[#7140FD] capitalize">
          {role}
        </span>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <button
            type="button"
            aria-label="닫기"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-[#e7e9ed] bg-white py-1 shadow-lg">
            <div className="border-b border-[#e7e9ed] px-4 py-2">
              <p className="text-xs text-[#707070]">Connected as</p>
              <p className="text-sm font-medium text-[#090a0b]">{truncateAddress(address)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                disconnect()
                setOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-[#F8F5FF]"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  )
}
