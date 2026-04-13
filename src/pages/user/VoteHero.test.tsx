import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VoteHero } from './VoteHero'
import type { VoteDetailData } from '../../types/vote'

vi.mock('../../providers/LanguageProvider', () => ({
  useLanguage: () => ({
    lang: 'ko',
    t: (key: string) => ({ badge_end: '종료' })[key] ?? key,
  }),
}))

vi.mock('../../utils/ipfs', () => ({
  resolveIpfsUrl: (url: string) => url,
}))

const baseVote: VoteDetailData = {
  id: 'vote-1',
  title: 'Test Vote',
  org: 'Test Org',
  host: 'Test Host',
  emoji: '🗳️',
  verified: false,
  badge: 'live',
  deadlineLabel: '3 days left',
  urgent: false,
  startDate: '2026-04-01',
  endDate: '2026-04-10',
  endDateISO: '2026-04-10T00:00:00.000Z',
  resultReveal: '2026-04-11',
  minKarmaTier: 0,
  maxChoices: 1,
  participantCount: 1000,
  goalVotes: 5000,
  voteFrequency: 'Daily',
  voteLimit: '1 per day',
  resultPublic: true,
  candidates: [],
}

describe('VoteHero – notch-aware offsets', () => {
  it('pulls hero up by var(--header-h), not a hardcoded 56 px', () => {
    const { container } = render(<VoteHero vote={baseVote} />)
    const root = container.firstElementChild as HTMLElement
    // Must use the CSS variable, not the fixed -mt-14 class
    expect(root.className).not.toContain('-mt-14')
    expect(root.className).toMatch(/var\(--header-h\)/)
  })

  it('top padding inside the hero references var(--header-h)', () => {
    const { container } = render(<VoteHero vote={baseVote} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.className).not.toContain('pt-[calc(56px')
    expect(root.className).toMatch(/var\(--header-h\)/)
  })

  it('uses the active participation copy for live votes', () => {
    const { container } = render(<VoteHero vote={baseVote} />)
    expect(container.textContent).toContain('1,000 명 참여 중')
  })
})
