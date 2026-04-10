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
const KARMA_TIER_OPTIONS = [
  { value: '0', label: '누구나 참여 가능' },
  { value: '1', label: '티어 1 · entry' },
  { value: '2', label: '티어 2 · newbie' },
  { value: '3', label: '티어 3 · basic' },
  { value: '4', label: '티어 4 · active' },
  { value: '5', label: '티어 5 · regular' },
  { value: '6', label: '티어 6 · power' },
  { value: '7', label: '티어 7 · pro' },
  { value: '8', label: '티어 8 · high-throughput' },
  { value: '9', label: '티어 9 · s-tier' },
  { value: '10', label: '티어 10 · legendary' },
] as const

interface StepScheduleProps {
  draft: VoteCreateDraft
  onUpdate: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
  onUpdateSectionField: <K extends keyof ElectionSettingsDraft>(
    sectionId: string,
    key: K,
    value: ElectionSettingsDraft[K],
  ) => void
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
  const isIntervalPolicy = settings.ballotPolicy === 'ONE_PER_INTERVAL'
  const isUnlimitedPaid = settings.ballotPolicy === 'UNLIMITED_PAID'
  const allowMultipleChoice = settings.maxChoices > 1 && !isUnlimitedPaid
  const isOpenVote = settings.visibilityMode === 'OPEN'
  const minKarmaTierValue = KARMA_TIER_OPTIONS.some((option) => option.value === settings.minKarmaTier)
    ? settings.minKarmaTier
    : '0'
  const displayedCostPerBallot =
    settings.paymentMode === 'FREE'
      ? '0'
      : isUnlimitedPaid
        ? UNLIMITED_PAID_COST_PER_BALLOT
        : FIXED_PAID_COST_PER_BALLOT
  const displayedCostPerBallotLabel = formatBallotCostLabel(displayedCostPerBallot, lang)
  const maxChoicesOptions = Array.from({ length: Math.max(candidateCount, 1) }, (_, index) => {
    const value = index + 1
    return { value, label: `${value}명` }
  })
  const maxChoiceHelperText = isUnlimitedPaid
    ? '유료 반복 투표는 컨트랙트 규칙상 한 번에 1명만 선택할 수 있어요.'
    : allowMultipleChoice
      ? `한 번에 최대 ${settings.maxChoices}명까지 함께 선택할 수 있어요.`
      : '한 번에 한 명만 선택하는 투표로 생성돼요.'

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
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">공개 방식</span>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard
            selected={settings.visibilityMode === 'OPEN'}
            title="공개 투표"
            description="투표 중에도 현재 집계와 순위를 확인할 수 있습니다."
            onClick={() => onUpdate('visibilityMode', 'OPEN')}
          />
          <ChoiceCard
            selected={settings.visibilityMode === 'PRIVATE'}
            title="비공개 투표"
            description="암호화된 투표로 진행되고 종료 후 key reveal 이후 결과를 확인합니다."
            onClick={() => onUpdate('visibilityMode', 'PRIVATE')}
          />
        </div>
      </div>

      <Field label="시작 일시">
        <input
          type="datetime-local"
          value={settings.startDate}
          onChange={(event) => onUpdate('startDate', event.target.value)}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="종료 일시">
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
          공개 투표는 종료되면 바로 닫히고, 결과 공개 기준 시각은 따로 입력하지 않습니다.
        </div>
      ) : (
        <Field label="결과 공개 시각">
          <input
            type="datetime-local"
            value={settings.resultRevealAt}
            min={settings.endDate}
            onChange={(event) => onUpdate('resultRevealAt', event.target.value)}
            className={INPUT_CLASS}
          />
          <div className="mt-2 text-[12px] text-[#707070]">
            비공개 투표는 result reveal 시각 이후 key reveal pending 단계로 이동합니다.
          </div>
        </Field>
      )}

      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">투표 정책</span>
        <div className="grid gap-3">
          <ChoiceCard
            selected={settings.ballotPolicy === 'ONE_PER_ELECTION'}
            title="선거당 1회"
            description="선거 전체 기간 동안 한 번만 투표할 수 있습니다."
            onClick={() => onUpdate('ballotPolicy', 'ONE_PER_ELECTION')}
          />
          <ChoiceCard
            selected={settings.ballotPolicy === 'ONE_PER_INTERVAL'}
            title="주기마다 1회"
            description="설정한 갱신 주기마다 다시 투표할 수 있습니다."
            onClick={() => onUpdate('ballotPolicy', 'ONE_PER_INTERVAL')}
          />
          <ChoiceCard
            selected={settings.ballotPolicy === 'UNLIMITED_PAID'}
            title="유료 반복 투표"
            description="결제를 전제로 반복 투표를 허용합니다."
            onClick={() => {
              onUpdate('ballotPolicy', 'UNLIMITED_PAID')
            }}
          />
        </div>
      </div>

      {isIntervalPolicy ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Field label="갱신 주기 값">
            <input
              type="number"
              min="1"
              value={settings.resetIntervalValue}
              onChange={(event) => onUpdate('resetIntervalValue', event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="단위">
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
              <option value="MINUTE">분</option>
              <option value="HOUR">시간</option>
              <option value="DAY">일</option>
            </select>
          </Field>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E7E9ED] bg-white px-4 py-4 text-[12px] text-[#707070]">
          현재 정책에서는 투표권 갱신 주기 설정이 필요 없습니다.
        </div>
      )}

      <div>
        <div className="mb-2">
          <span className="block text-[13px] font-semibold text-[#090A0B]">한 번에 선택할 인원</span>
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
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">참여 조건</span>
        <Field label="최소 참여 카르마 티어">
          <div className={HELPER_TEXT_CLASS}>
            Status Karma 기준으로 참여 가능한 최소 티어를 고를 수 있어요.
          </div>
          <select
            value={minKarmaTierValue}
            onChange={(event) => onUpdate('minKarmaTier', event.target.value)}
            className={INPUT_CLASS}
          >
            {KARMA_TIER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <span className="block text-[13px] font-semibold text-[#090A0B] mb-2">결제 설정</span>
        <div className="grid gap-3">
          <ChoiceCard
            selected={settings.paymentMode === 'FREE'}
            title="무료 투표"
            description="별도 결제 없이 참여할 수 있습니다."
            onClick={() => onUpdate('paymentMode', 'FREE')}
          />
          <ChoiceCard
            selected={settings.paymentMode === 'PAID'}
            title="유료 투표"
            description="투표 1회당 비용을 받고 참여를 허용합니다."
            onClick={() => onUpdate('paymentMode', 'PAID')}
          />
        </div>
        <div className="mt-4">
          <Field label="투표 1회당 비용">
            <input
              type="text"
              value={displayedCostPerBallotLabel}
              disabled
              readOnly
              className={`${INPUT_CLASS} disabled:bg-[#F7F8FA] disabled:text-[#C0C4CC]`}
            />
            <div className="mt-2 text-[12px] text-[#707070]">
              {settings.paymentMode === 'FREE'
                ? '무료 투표는 비용이 없습니다.'
                : isUnlimitedPaid
                  ? `유료 반복 투표는 컨트랙트 규칙상 ${displayedCostPerBallotLabel} 고정 비용으로 생성됩니다.`
                  : '일반 유료 투표는 100으로 고정됩니다.'}
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
  return (
    <div className="rounded-[28px] border-2 border-[#7140FF]/20 bg-[#F0EDFF]/40 p-4">
      <SettingsEditor
        settings={section}
        candidateCount={section.candidates.length}
        onUpdate={onUpdate}
        title={`섹션 ${index + 1} · ${section.name || '이름 미입력'}`}
        description="이 섹션은 별도 투표로 생성되며, 아래 설정이 그대로 개별 election에 반영됩니다."
      />
    </div>
  )
}

export function StepSchedule({ draft, onUpdate, onUpdateSectionField }: StepScheduleProps) {
  const usesSections = draft.sections.length > 0
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
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

    // sungje : 섹션별 설정이 길어질 때 현재 편집 중인 섹션만 보이도록 탭 상태를 유지한다.
    if (!activeSectionId || !draft.sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(draft.sections[0]?.id ?? null)
    }
  }, [activeSectionId, draft.sections, usesSections])

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
          <div className="text-[14px] font-semibold text-[#090A0B]">섹션별 투표 생성</div>
          <div className="mt-1 text-[12px] text-[#707070]">
            각 섹션은 독립된 election으로 생성되고, 아래 정책도 섹션별로 각각 서명/제출됩니다.
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {draft.sections.map((section, index) => {
            const selected = section.id === activeSection.id

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all ${
                  selected
                    ? 'border-[#7140FF] bg-[#7140FF] text-white'
                    : 'border-[#E7E9ED] bg-white text-[#707070]'
                }`}
              >
                {`섹션 ${index + 1}`}
              </button>
            )
          })}
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
        title={draft.electionTitle || '투표 이름 미입력'}
        description="단일 투표 모드에서는 아래 설정이 하나의 election에 그대로 반영됩니다."
      />
    </div>
  )
}
