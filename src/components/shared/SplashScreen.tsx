import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 80)
    const t2 = setTimeout(() => setExiting(true), 1600)
    const t3 = setTimeout(onDone, 2000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[999] bg-[#090A0B] flex flex-col items-center justify-center transition-opacity duration-400 ${exiting ? 'opacity-0' : 'opacity-100'}`}
    >
      <div
        className={`flex flex-col items-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Logo mark */}
        <img
          src={`${import.meta.env.BASE_URL}pwa-icon.svg`}
          alt="VESTAr"
          className="w-16 h-16 mb-5 shadow-[0_0_40px_rgba(113,64,255,0.4)] rounded-2xl"
        />

        {/* Brand */}
        <div
          data-testid="splash-brand"
          className="text-[36px] font-bold text-white tracking-tight leading-none"
        >
          VEST<span className="text-[#7140FF]">A</span>r
        </div>
        <div className="text-[13px] text-white/40 mt-2 font-mono tracking-wider">
          K-pop Fan Voting
        </div>
      </div>

      {/* Loading dots */}
      <div
        className={`absolute bottom-16 flex gap-1.5 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
