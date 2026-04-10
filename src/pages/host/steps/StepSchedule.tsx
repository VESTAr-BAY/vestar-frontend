import { useEffect, useState } from 'react'
import type { ElectionSettingsDraft, SectionDraft, VoteCreateDraft } from '../../../types/host'
import { useLanguage } from '../../../providers/LanguageProvider'
import {
  FIXED_PAID_COST_PER_BALLOT,
  UNLIMITED_PAID_COST_PER_BALLOT,
} from '../../../utils/hostElectionSettings'
import { formatBallotCostLabel } from '../../../utils/paymentDisplay'

const INPUT_CLASS =
  'block min-w-0 w-full max-w-full appearance-none bg-white border border-[#E7E9ED] rounded-xl px-4 py-3 text-[14px] text-[#090A0B] outline-none focus:border-[#7140FF] focus:ring-2 focus:ring-[#7140FF]/10 transition-all'

const HELPER_TEXT_CLASS = 'mt-1 text-[12px] leading-5 text-[#7140FF]'

function getKarmaTierOptions(lang: 'en' | 'ko') {
  return [
    { value: '0', label: lang === 'ko' ? '누구나 참여 가능' : 'Anyone can join' },
    { value: '1', label: lang === 'ko' ? '티어 1 · entry' : 'Tier 1 · entry' },
    { value: '2', label: lang === 'ko' ? '티어 2 · newbie' : 'Tier 2 · newbie' },
    { value: '3', label: lang === 'ko' ? '티어 3 · basic' : 'Tier 3 · basic' },
    { value: '4', label: lang === 'ko' ? '티어 4 · active' : 'Tier 4 · active' },
    { value: '5', label: lang === 'ko' ? '티어 5 · regular' : 'Tier 5 · regular' },
    { value: '6', label: lang === 'ko' ? '티어 6 · power' : 'Tier 6 · power' },
    { value: '7', label: lang === 'ko' ? '티어 7 · pro' : 'Tier 7 · pro' },
    {
      value: '8',
      label: lang === 'ko' ? '티어 8 · high-throughput' : 'Tier 8 · high-throughput',
    },
    { value: '9', label: lang === 'ko' ? '티어 9 · s-tier' : 'Tier 9 · s-tier' },
    { value: '10', label: lang === 'ko' ? '티어 10 · legendary' : 'Tier 10 · legendary' },
  ] as const
}

interface StepScheduleProps {
  draft: VoteCreateDraft
  onUpdate: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
  onUpdateSectionField: <K extends keyof ElectionSettingsDraft>(
    sectionId: string,
    key: K,
    value: ElectionSettingsDraft[K],
  ) => void
}

function PolicyUnifyToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const { lang } = useLanguage()

  return (
    <div className="ml-auto flex items-center gap-2 pl-3">
      <span className="text-[12px] font-semibold text-[#707070]">
        {lang === 'ko' ? '정책 통일' : 'Unified policy'}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={lang === 'ko' ? '섹션 정책 통일' : 'Unify section policy'}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-[#7140FF]' : 'bg-[#D7DBE3]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

function ChoiceCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border-2 px-4 py-4 text-left transition-all ${
        selected ? 'border-[#7140FF] bg-[#F0EDFF]' : 'border-[#E7E9ED] bg-white'
      }`}
    >
      <div className="text-[14px] font-semibold text-[#090A0B]">{title}</div>
      <div className="mt-1 text-[12px] leading-5 text-[#707070]">{description}</div>
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#090A0B] mb-2">{label}</label>
      {children}
    </div>
  )
}

function SettingsEditor({
  settings,
  candidateCount,
  onUpdate,
  title,
  description,
}: {
  settings: ElectionSettingsDraft
  candidateCount: number
  onUpdate: <K extends keyof ElectionSettingsDraft>(key: K, value: ElectionSettingsDraft[K]) => void
  title?: string
  description?: string
}) {
  const { lang } = useLanguage()
  const karmaTierOptions = getKarmaTierOptions(lang)
  const isIntervalPolicy = settings.ballotPolicy === 'ONE_PER_INTERVAL'
  const isUnlimitedPaid = settings.ballotPolicy === 'UNLIMITED_PAID'
  const allowMultipleChoice = settings.maxChoices > 1 && !isUnlimitedPaid
  const isOpenVote = settings.visibilityMode === 'OPEN'
  const minKarmaTierValue = karmaTierOptions.some((option) => option.value === settings.minKarmaTier)
    ? settings.minKarmaTier
    : '0'
  const displayedCostPerBallot =
    settings.paymentMode === 'FREE'
      ? '0'
      : isUnlimitedPaid
        ? UNLIMITED_PAID_COST_PER_BALLOT
        : FIXED_PAID_COST_PER_BALLOT
  const displayedCostPerBallotLabel = formatBallotCostLabel(displayedCostPerBallot, lang)
  const copy = lang === 'ko'
    ? {
        visibilityLabel: '공개 방식',
        openTitle: '공개 투표',
        openDescription: '투표 중에도 현재 집계와 순위를 확인할 수 있습니다.',
        privateTitle: '비공개 투표',
        privateDescription: '암호화된 투표로 진행되고 종료 후 key reveal 이후 결과를 확인합니다.',
        startLabel: '시작 일시',
        endLabel: '종료 일시',
        openRevealNotice: '공개 투표는 종료되면 바로 닫히고, 결과 공개 기준 시각은 따로 입력하지 않습니다.',
        revealLabel: '결과 공개 시각',
        revealHelp: '비공개 투표는 result reveal 시각 이후 key reveal pending 단계로 이동합니다.',
        ballotPolicyLabel: '투표 정책',
        onePerElectionTitle: '선거당 1회',
        onePerElectionDescription: '선거 전체 기간 동안 한 번만 투표할 수 있습니다.',
        onePerIntervalTitle: '주기마다 1회',
        onePerIntervalDescription: '설정한 갱신 주기마다 다시 투표할 수 있습니다.',
        unlimitedPaidTitle: '유료 반복 투표',
        unlimitedPaidDescription: '결제를 전제로 반복 투표를 허용합니다.',
        intervalValueLabel: '갱신 주기 값',
        intervalUnitLabel: '단위',
        minuteOption: '분',
        hourOption: '시간',
        dayOption: '일',
        noIntervalHelp: '현재 정책에서는 투표권 갱신 주기 설정이 필요 없습니다.',
        maxChoicesLabel: '한 번에 선택할 인원',
        maxChoicesOptions: (value: number) => `${value}명`,
        minRequirementLabel: '참여 조건',
        minKarmaLabel: '최소 참여 카르마 티어',
        minKarmaHelp: 'Status Karma 기준으로 참여 가능한 최소 티어를 고를 수 있어요.',
        paymentLabel: '결제 설정',
        freeTitle: '무료 투표',
        freeDescription: '별도 결제 없이 참여할 수 있습니다.',
        paidTitle: '유료 투표',
        paidDescription: '투표 1회당 비용을 받고 참여를 허용합니다.',
        costLabel: '투표 1회당 비용',
        freeCostHelp: '무료 투표는 비용이 없습니다.',
        unlimitedPaidCostHelp: `유료 반복 투표는 컨트랙트 규칙상 ${displayedCostPerBallotLabel} 고정 비용으로 생성됩니다.`,
        fixedPaidCostHelp: '일반 유료 투표는 100으로 고정됩니다.',
      }
    : {
        visibilityLabel: 'Visibility',
        openTitle: 'Open Vote',
        openDescription: 'Live totals and rankings stay visible while voting is open.',
        privateTitle: 'Private Vote',
        privateDescription: 'Votes stay encrypted and become readable after key reveal.',
        startLabel: 'Start Time',
        endLabel: 'End Time',
        openRevealNotice: 'Open votes close at the end time, so no separate result reveal time is needed.',
        revealLabel: 'Result Reveal Time',
        revealHelp: 'Private votes move into key reveal pending after the result reveal time.',
        ballotPolicyLabel: 'Ballot Policy',
        onePerElectionTitle: 'One per Election',
        onePerElectionDescription: 'Each wallet can vote once during the full election period.',
        onePerIntervalTitle: 'One per Interval',
        onePerIntervalDescription: 'Voting rights reset on the interval you set below.',
        unlimitedPaidTitle: 'Unlimited Paid Voting',
        unlimitedPaidDescription: 'Repeat voting is allowed as long as the fee is paid each time.',
        intervalValueLabel: 'Interval Value',
        intervalUnitLabel: 'Unit',
        minuteOption: 'Minute',
        hourOption: 'Hour',
        dayOption: 'Day',
        noIntervalHelp: 'This policy does not require an interval reset setting.',
        maxChoicesLabel: 'Selections per Ballot',
        maxChoicesOptions: (value: number) => `${value} pick${value > 1 ? 's' : ''}`,
        minRequirementLabel: 'Eligibility',
        minKarmaLabel: 'Minimum Karma Tier',
        minKarmaHelp: 'Choose the minimum Status Karma tier required to join this vote.',
        paymentLabel: 'Payment',
        freeTitle: 'Free Vote',
        freeDescription: 'Anyone eligible can join without paying.',
        paidTitle: 'Paid Vote',
        paidDescription: 'Participants pay the fee shown below for each ballot.',
        costLabel: 'Cost per Ballot',
        freeCostHelp: 'Free votes do not charge a fee.',
        unlimitedPaidCostHelp: `Unlimited paid voting uses the fixed on-chain cost of ${displayedCostPerBallotLabel}.`,
        fixedPaidCostHelp: 'Standard paid votes are fixed at 100.',
      }
  const maxChoicesOptions = Array.from({ length: Math.max(candidateCount, 1) }, (_, index) => {
    const value = index + 1
    return { value, label: copy.maxChoicesOptions(value) }
  })
  const maxChoiceHelperText = isUnlimitedPaid
    ? lang === 'ko'
      ? '유료 반복 투표는 컨트랙트 규칙상 한 번에 1명만 선택할 수 있어요.'
      : 'Unlimited paid voting can only select one candidate per ballot by contract.'
    : allowMultipleChoice
      ? lang === 'ko'
        ? `한 번에 최대 ${settings.maxChoices}명까지 함께 선택할 수 있어요.`
        : `Voters can choose up to ${settings.maxChoices} candidates in one ballot.`
      : lang === 'ko'
        ? '한 번에 한 명만 선택하는 투표로 생성돼요.'
        : 'This vote is created as a single-choice ballot.'

  useEffect(() => {
    if (settings.maxChoices > candidateCount && candidateCount > 0) {
      onUpdate('maxChoices', candidateCount)
    }
  }, [candidateCount, onUpdate, settings.maxChoices])

  return (
    <div className="flex flex-col gap-6">
      {title ? (
        <div className="rounded-2xl border border-[#E7E9ED] bg-white px-4 py-4">
          <div className="text-[14px] font-semibold text-[#090A0B]">{title}</div>
          {description ? (
            <div className="mt-1 text-[12px] text-[#707070]">{description}</div>
          ) : null}
        </div>
      ) : null}

      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          {copy.visibilityLabel}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard
            selected={settings.visibilityMode === 'OPEN'}
            title={copy.openTitle}
            description={copy.openDescription}
            onClick={() => onUpdate('visibilityMode', 'OPEN')}
          />
          <ChoiceCard
            selected={settings.visibilityMode === 'PRIVATE'}
            title={copy.privateTitle}
            description={copy.privateDescription}
            onClick={() => onUpdate('visibilityMode', 'PRIVATE')}
          />
        </div>
      </div>

      <Field label={copy.startLabel}>
        <input
          type="datetime-local"
          value={settings.startDate}
          onChange={(event) => onUpdate('startDate', event.target.value)}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label={copy.endLabel}>
        <input
          type="datetime-local"
          value={settings.endDate}
          min={settings.startDate}
          onChange={(event) => onUpdate('endDate', event.target.value)}
          className={INPUT_CLASS}
        />
      </Field>

      {isOpenVote ? (
        <div className="rounded-2xl border border-dashed border-[#E7E9ED] bg-white px-4 py-4 text-[12px] text-[#707070]">
          {copy.openRevealNotice}
        </div>
      ) : (
        <Field label={copy.revealLabel}>
          <input
            type="datetime-local"
            value={settings.resultRevealAt}
            min={settings.endDate}
            onChange={(event) => onUpdate('resultRevealAt', event.target.value)}
            className={INPUT_CLASS}
          />
          <div className="mt-2 text-[12px] text-[#707070]">{copy.revealHelp}</div>
        </Field>
      )}

      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          {copy.ballotPolicyLabel}
        </span>
        <div className="grid gap-3">
          <ChoiceCard
            selected={settings.ballotPolicy === 'ONE_PER_ELECTION'}
            title={copy.onePerElectionTitle}
            description={copy.onePerElectionDescription}
            onClick={() => onUpdate('ballotPolicy', 'ONE_PER_ELECTION')}
          />
          <ChoiceCard
            selected={settings.ballotPolicy === 'ONE_PER_INTERVAL'}
            title={copy.onePerIntervalTitle}
            description={copy.onePerIntervalDescription}
            onClick={() => onUpdate('ballotPolicy', 'ONE_PER_INTERVAL')}
          />
          <ChoiceCard
            selected={settings.ballotPolicy === 'UNLIMITED_PAID'}
            title={copy.unlimitedPaidTitle}
            description={copy.unlimitedPaidDescription}
            onClick={() => {
              onUpdate('ballotPolicy', 'UNLIMITED_PAID')
            }}
          />
        </div>
      </div>

      {isIntervalPolicy ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Field label={copy.intervalValueLabel}>
            <input
              type="number"
              min="1"
              value={settings.resetIntervalValue}
              onChange={(event) => onUpdate('resetIntervalValue', event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={copy.intervalUnitLabel}>
            <select
              value={settings.resetIntervalUnit}
              onChange={(event) =>
                onUpdate(
                  'resetIntervalUnit',
                  event.target.value as ElectionSettingsDraft['resetIntervalUnit'],
                )
              }
              className={INPUT_CLASS}
            >
              <option value="MINUTE">{copy.minuteOption}</option>
              <option value="HOUR">{copy.hourOption}</option>
              <option value="DAY">{copy.dayOption}</option>
            </select>
          </Field>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E7E9ED] bg-white px-4 py-4 text-[12px] text-[#707070]">
          {copy.noIntervalHelp}
        </div>
      )}

      <div>
        <div className="mb-2">
          <span className="block text-[13px] font-semibold text-[#090A0B]">
            {copy.maxChoicesLabel}
          </span>
          <div className={HELPER_TEXT_CLASS}>{maxChoiceHelperText}</div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {maxChoicesOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={isUnlimitedPaid && value !== 1}
              onClick={() => onUpdate('maxChoices', value as ElectionSettingsDraft['maxChoices'])}
              className={`min-w-[84px] flex-1 py-2.5 rounded-xl text-[14px] font-semibold border-2 transition-all ${
                settings.maxChoices === value
                  ? 'bg-[#7140FF] text-white border-[#7140FF]'
                  : 'bg-white text-[#707070] border-[#E7E9ED]'
              } disabled:bg-[#F7F8FA] disabled:text-[#C0C4CC] disabled:border-[#E7E9ED]`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          {copy.minRequirementLabel}
        </span>
        <Field label={copy.minKarmaLabel}>
          <div className={HELPER_TEXT_CLASS}>
            {copy.minKarmaHelp}
          </div>
          <select
            value={minKarmaTierValue}
            onChange={(event) => onUpdate('minKarmaTier', event.target.value)}
            className={INPUT_CLASS}
          >
            {karmaTierOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">
          {copy.paymentLabel}
        </span>
        <div className="grid gap-3">
          <ChoiceCard
            selected={settings.paymentMode === 'FREE'}
            title={copy.freeTitle}
            description={copy.freeDescription}
            onClick={() => onUpdate('paymentMode', 'FREE')}
          />
          <ChoiceCard
            selected={settings.paymentMode === 'PAID'}
            title={copy.paidTitle}
            description={copy.paidDescription}
            onClick={() => onUpdate('paymentMode', 'PAID')}
          />
        </div>
        <div className="mt-4">
          <Field label={copy.costLabel}>
            <input
              type="text"
              value={displayedCostPerBallotLabel}
              disabled
              readOnly
              className={`${INPUT_CLASS} disabled:bg-[#F7F8FA] disabled:text-[#C0C4CC]`}
            />
            <div className="mt-2 text-[12px] text-[#707070]">
              {settings.paymentMode === 'FREE'
                ? copy.freeCostHelp
                : isUnlimitedPaid
                  ? copy.unlimitedPaidCostHelp
                  : copy.fixedPaidCostHelp}
            </div>
          </Field>
        </div>
      </div>
    </div>
  )
}

function SectionScheduleCard({
  section,
  index,
  onUpdate,
}: {
  section: SectionDraft
  index: number
  onUpdate: <K extends keyof ElectionSettingsDraft>(key: K, value: ElectionSettingsDraft[K]) => void
}) {
  const { lang } = useLanguage()
  return (
    <div className="rounded-[28px] border-2 border-[#7140FF]/20 bg-[#F0EDFF]/40 p-4">
      <SettingsEditor
        settings={section}
        candidateCount={section.candidates.length}
        onUpdate={onUpdate}
        title={
          lang === 'ko'
            ? `섹션 ${index + 1} · ${section.name || '이름 미입력'}`
            : `Section ${index + 1} · ${section.name || 'Untitled'}`
        }
        description={
          lang === 'ko'
            ? '이 섹션은 별도 투표로 생성되며, 아래 설정이 그대로 개별 election에 반영됩니다.'
            : 'This section is created as a separate election, and the settings below are applied as-is.'
        }
      />
    </div>
  )
}

export function StepSchedule({ draft, onUpdate, onUpdateSectionField }: StepScheduleProps) {
  const usesSections = draft.sections.length > 0
  const { lang } = useLanguage()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const isUnifiedPolicy = draft.sectionPolicyUnified
  const handleUpdateSingleField = <K extends keyof ElectionSettingsDraft>(
    key: K,
    value: ElectionSettingsDraft[K],
  ) => {
    onUpdate(key as keyof VoteCreateDraft, value as VoteCreateDraft[keyof VoteCreateDraft])
  }

  useEffect(() => {
    if (!usesSections) {
      setActiveSectionId(null)
      return
    }

    if (isUnifiedPolicy) {
      setActiveSectionId(draft.sections[0]?.id ?? null)
      return
    }

    // sungje : 섹션별 설정이 길어질 때 현재 편집 중인 섹션만 보이도록 탭 상태를 유지한다.
    if (!activeSectionId || !draft.sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(draft.sections[0]?.id ?? null)
    }
  }, [activeSectionId, draft.sections, isUnifiedPolicy, usesSections])

  if (usesSections) {
    const activeSection =
      draft.sections.find((section) => section.id === activeSectionId) ?? draft.sections[0]
    if (!activeSection) return null

    const activeSectionIndex = draft.sections.findIndex(
      (section) => section.id === activeSection.id,
    )

    return (
      <div className="px-5 py-6 flex flex-col gap-6">
        <div className="rounded-2xl border border-[#E7E9ED] bg-white px-4 py-4">
          <div className="text-[14px] font-semibold text-[#090A0B]">
            {lang === 'ko' ? '섹션별 투표 생성' : 'Create Votes by Section'}
          </div>
          <div className="mt-1 text-[12px] text-[#707070]">
            {lang === 'ko'
              ? isUnifiedPolicy
                ? '각 섹션은 독립된 election으로 생성되지만, 현재는 모든 섹션에 같은 정책이 적용됩니다.'
                : '각 섹션은 독립된 election으로 생성되고, 아래 정책도 섹션별로 각각 서명/제출됩니다.'
              : isUnifiedPolicy
                ? 'Each section becomes an independent election, but the same policy is currently applied to all sections.'
                : 'Each section becomes an independent election, and the settings below are signed and submitted separately.'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {draft.sections.map((section, index) => {
                const selected = section.id === activeSection.id
                const disabled = isUnifiedPolicy && index > 0

                return (
                  <button
                    key={section.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all ${
                      selected
                        ? 'border-[#7140FF] bg-[#7140FF] text-white'
                        : 'border-[#E7E9ED] bg-white text-[#707070]'
                    } disabled:border-[#E7E9ED] disabled:bg-[#F7F8FA] disabled:text-[#C0C4CC] disabled:cursor-not-allowed`}
                  >
                    {lang === 'ko' ? `섹션 ${index + 1}` : `Section ${index + 1}`}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="shrink-0">
            <PolicyUnifyToggle
              checked={isUnifiedPolicy}
              onChange={(checked) => onUpdate('sectionPolicyUnified', checked)}
            />
          </div>
        </div>

        <SectionScheduleCard
          key={activeSection.id}
          section={activeSection}
          index={activeSectionIndex}
          onUpdate={(key, value) => onUpdateSectionField(activeSection.id, key, value)}
        />
      </div>
    )
  }

  return (
    <div className="px-5 py-6">
      <SettingsEditor
        settings={draft}
        candidateCount={draft.candidates.length}
        onUpdate={handleUpdateSingleField}
        title={
          draft.electionTitle || (lang === 'ko' ? '투표 이름 미입력' : 'Untitled vote')
        }
        description={
          lang === 'ko'
            ? '단일 투표 모드에서는 아래 설정이 하나의 election에 그대로 반영됩니다.'
            : 'In single-vote mode, the settings below are applied to one election as-is.'
        }
      />
    </div>
  )
}
