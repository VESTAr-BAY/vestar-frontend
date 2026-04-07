import { useEffect, useState } from 'react'

export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

function calculate(endDateISO: string): CountdownResult {
  const diff = new Date(endDateISO).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isExpired: false,
  }
}

export function useCountdown(endDateISO: string): CountdownResult {
  const [result, setResult] = useState<CountdownResult>(() => calculate(endDateISO))

  useEffect(() => {
    if (result.isExpired) return
    const id = setInterval(() => {
      const next = calculate(endDateISO)
      setResult(next)
      if (next.isExpired) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [endDateISO, result.isExpired])

  return result
}
