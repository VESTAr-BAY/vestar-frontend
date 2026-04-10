export type KarmaTierDisplay = {
  id: number
  label: string
  color: string
}

const KARMA_TIER_DISPLAY: Record<number, Omit<KarmaTierDisplay, 'id'>> = {
  0: { label: '—', color: '#707070' },
  1: { label: 'Entry', color: '#7140FF' },
  2: { label: 'Newbie', color: '#7140FF' },
  3: { label: 'Basic', color: '#7140FF' },
  4: { label: 'Active', color: '#7140FF' },
  5: { label: 'Regular', color: '#7140FF' },
  6: { label: 'Power', color: '#7140FF' },
  7: { label: 'Pro', color: '#7140FF' },
  8: { label: 'High-Throughput', color: '#7140FF' },
  9: { label: 'S-Tier', color: '#7140FF' },
  10: { label: 'Legendary', color: '#7140FF' },
}

export function getKarmaTierDisplay(tierId: number): KarmaTierDisplay {
  const normalizedTierId = Number.isFinite(tierId) ? Math.max(0, Math.trunc(tierId)) : 0
  const display = KARMA_TIER_DISPLAY[normalizedTierId] ?? KARMA_TIER_DISPLAY[0]

  return {
    id: normalizedTierId,
    label: display.label,
    color: display.color,
  }
}
