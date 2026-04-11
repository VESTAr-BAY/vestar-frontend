import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StepSchedule } from './StepSchedule'
import type { VoteCreateDraft } from '../../../types/host'

vi.mock('../../../providers/LanguageProvider', () => ({
  useLanguage: () => ({ lang: 'ko', t: (k: string) => k }),
}))

const BASE_DRAFT: VoteCreateDraft = {
  title: '테스트 시리즈',
  electionTitle: '테스트 투표',
  group: '',
  bannerImage: '',
  electionCoverImage: '',
  category: 'fan',
  candidates: [
    { id: 'c1', name: 'A', image: '' },
    { id: 'c2', name: 'B', image: '' },
  ],
  sections: [],
  startDate: '2026-05-01T10:00',
  endDate: '2026-05-07T10:00',
  resultRevealAt: '2026-05-08T10:00',
  maxChoices: 1,
  visibilityMode: 'OPEN',
  ballotPolicy: 'ONE_PER_ELECTION',
  paymentMode: 'FREE',
  costPerBallotEth: '0',
  minKarmaTier: '0',
  resetIntervalValue: '1',
  resetIntervalUnit: 'DAY',
  resultReveal: 'immediate',
  sectionPolicyUnified: true,
}

const noop = vi.fn()

// ── 1. 선택 방식(공개 방식) single-column layout ──────────────────────────────
describe('공개 방식 layout', () => {
  it('does not use a 2-column side-by-side grid for the visibility cards', () => {
    const { container } = render(
      <StepSchedule draft={BASE_DRAFT} onUpdate={noop} onUpdateSectionField={noop} />,
    )
    // grid-cols-2 is the problematic class that squishes descriptions on mobile
    const gridCols2 = container.querySelector('.grid-cols-2')
    expect(gridCols2).toBeNull()
  })

  it('renders both 공개 투표 and 비공개 투표 cards stacked (each as a full-width button)', () => {
    render(<StepSchedule draft={BASE_DRAFT} onUpdate={noop} onUpdateSectionField={noop} />)
    expect(screen.getByText('공개 투표')).toBeInTheDocument()
    expect(screen.getByText('비공개 투표')).toBeInTheDocument()
  })
})

// ── 2. 유료 투표 cost description ─────────────────────────────────────────────
describe('유료 투표 description', () => {
  it('includes cost information in the 유료 투표 card', () => {
    render(<StepSchedule draft={BASE_DRAFT} onUpdate={noop} onUpdateSectionField={noop} />)
    // The paid vote card description must mention the cost
    expect(screen.getByText(/100원/)).toBeInTheDocument()
  })
})

// ── 3. 날짜 입력 mobile UX ────────────────────────────────────────────────────
describe('date inputs mobile UX', () => {
  it('renders separate date and time inputs instead of a single datetime-local', () => {
    const { container } = render(
      <StepSchedule draft={BASE_DRAFT} onUpdate={noop} onUpdateSectionField={noop} />,
    )
    const datetimeLocalInputs = container.querySelectorAll('input[type="datetime-local"]')
    expect(datetimeLocalInputs).toHaveLength(0)

    const dateInputs = container.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBeGreaterThan(0)

    const timeInputs = container.querySelectorAll('input[type="time"]')
    expect(timeInputs.length).toBeGreaterThan(0)
  })
})

// ── 4. karma tier: uses karmaTier utility, no hardcoded duplicates ────────────
describe('karma tier options', () => {
  it('renders tier options derived from the shared karmaTier utility', () => {
    render(<StepSchedule draft={BASE_DRAFT} onUpdate={noop} onUpdateSectionField={noop} />)
    // The utility defines "Entry" for tier 1 — it must appear in the select
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    // Tier labels from karmaTier.ts
    expect(screen.getByText(/entry/i)).toBeInTheDocument()
    expect(screen.getByText(/legendary/i)).toBeInTheDocument()
  })
})

// ── 5. UNLIMITED_PAID: payment mode cards hidden ─────────────────────────────
describe('UNLIMITED_PAID payment section', () => {
  it('hides the FREE/PAID choice cards when UNLIMITED_PAID policy is active', () => {
    const draft: VoteCreateDraft = {
      ...BASE_DRAFT,
      ballotPolicy: 'UNLIMITED_PAID',
      paymentMode: 'PAID',
    }
    render(<StepSchedule draft={draft} onUpdate={noop} onUpdateSectionField={noop} />)
    // Should NOT show the choice cards for FREE and PAID independently
    expect(screen.queryByText('무료 투표')).toBeNull()
    expect(screen.queryByText('유료 투표')).toBeNull()
  })
})
