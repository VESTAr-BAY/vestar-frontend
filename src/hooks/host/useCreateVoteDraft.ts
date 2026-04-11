import { useCallback, useEffect, useRef, useState } from 'react'
import type { Address, Hash, Hex } from 'viem'
import {
  decodeEventLog,
  encodePacked,
  keccak256,
  parseUnits,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem'
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { preparePrivateElection } from '../../api/elections'
import type { PreparePrivateElectionResponse } from '../../api/types'
import { fetchVerifiedOrganizerByWallet } from '../../api/verifiedOrganizers'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { vestarFactory, vestarUtils } from '../../contracts/vestar/client'
import { vestarContractAddresses } from '../../contracts/vestar/generated'
import { vestarElectionFactoryAbi } from '../../contracts/vestar/generated/vestarElectionFactoryAbi'
import {
  type ElectionConfigInput,
  VESTAR_BALLOT_POLICY,
  VESTAR_PAYMENT_MODE,
  VESTAR_VISIBILITY_MODE,
} from '../../contracts/vestar/types'
import { useLanguage } from '../../providers/LanguageProvider'
import { useToast } from '../../providers/ToastProvider'
import type {
  CandidateDraft,
  CreateStep,
  ElectionSettingsDraft,
  SectionDraft,
  VoteCreateDraft,
} from '../../types/host'
import {
  buildCandidateManifest,
  type CandidateManifestCandidate,
} from '../../utils/candidateManifest'
import {
  getEffectiveResultRevealAt,
  normalizeElectionSettingsDraft,
} from '../../utils/hostElectionSettings'
import {
  createJsonArtifact,
  uploadFileToPinata,
  uploadJsonArtifactToPinata,
} from '../../utils/ipfs'
import { getWalletActionErrorMessage } from '../../utils/walletErrors'

type SubmitVoteResult = {
  txHash: Hash
  electionAddress: Address
  elections: Array<{
    txHash: Hash
    electionAddress: Address
    title: string
  }>
}

type FlattenedCandidate = {
  id: string
  candidateKey: string
  imageFile?: File | null
}

type SubmissionUnit = {
  title: string
  settings: ElectionSettingsDraft
  electionCoverImageFile?: File | null
  candidates: FlattenedCandidate[]
}

type PreparedSubmissionElection = {
  title: string
  normalizedSettings: ElectionSettingsDraft
  candidates: FlattenedCandidate[]
  candidateManifestURI: string
  candidateManifestHash: Hex
  titleHash: Hex
  initialCandidateHashes: Hex[]
  electionCoverImageUrl: string | null
  privatePrepare: PreparePrivateElectionResponse | null
}

type PreparedSubmissionArtifacts = {
  signature: string
  bannerImageUrl: string | null
  bannerUploadMissing: boolean
  candidateUploadsMissing: boolean
  elections: PreparedSubmissionElection[]
}

type SubmissionProgressState = {
  stage: 'preparing' | 'awaiting_signature'
  current: number
  total: number
  currentTitle: string | null
}

const PRIVATE_ELECTION_KEY_SCHEME_VERSION = 1
const SUBMISSION_PREFLIGHT_DEBOUNCE_MS = 700
const MAX_PREPARED_SUBMISSION_CACHE_ENTRIES = 3

let counter = 3

function makeId(): string {
  return String(counter++)
}

function makeBlankCandidate(): CandidateDraft {
  return {
    id: makeId(),
    name: '',
    image: '',
    imageFile: null,
  }
}

function buildDefaultSchedule() {
  const start = new Date()
  start.setSeconds(0, 0)

  const end = new Date(start)
  end.setHours(end.getHours() + 1)

  const reveal = new Date(end)
  reveal.setHours(reveal.getHours() + 1)

  const format = (value: Date) => {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    const hours = String(value.getHours()).padStart(2, '0')
    const minutes = String(value.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return {
    startDate: format(start),
    endDate: format(end),
    resultRevealAt: format(reveal),
  }
}

const defaultSchedule = buildDefaultSchedule()

function buildDefaultElectionSettings(): ElectionSettingsDraft {
  return {
    startDate: defaultSchedule.startDate,
    endDate: defaultSchedule.endDate,
    resultRevealAt: defaultSchedule.resultRevealAt,
    maxChoices: 1,
    visibilityMode: 'PRIVATE',
    ballotPolicy: 'ONE_PER_ELECTION',
    paymentMode: 'FREE',
    costPerBallotEth: '0',
    minKarmaTier: '0',
    resetIntervalValue: '24',
    resetIntervalUnit: 'HOUR',
    resultReveal: 'after_end',
  }
}

function pickElectionSettings(settings: ElectionSettingsDraft): ElectionSettingsDraft {
  return {
    startDate: settings.startDate,
    endDate: settings.endDate,
    resultRevealAt: settings.resultRevealAt,
    maxChoices: settings.maxChoices,
    visibilityMode: settings.visibilityMode,
    ballotPolicy: settings.ballotPolicy,
    paymentMode: settings.paymentMode,
    costPerBallotEth: settings.costPerBallotEth,
    minKarmaTier: settings.minKarmaTier,
    resetIntervalValue: settings.resetIntervalValue,
    resetIntervalUnit: settings.resetIntervalUnit,
    resultReveal: settings.resultReveal,
  }
}

const INITIAL_DRAFT: VoteCreateDraft = {
  title: '',
  electionTitle: '',
  group: '',
  bannerImage: '',
  bannerImageFile: null,
  electionCoverImage: '',
  electionCoverImageFile: null,
  category: '음악방송',
  sectionPolicyUnified: true,
  candidates: [makeBlankCandidate(), makeBlankCandidate()],
  sections: [],
  ...buildDefaultElectionSettings(),
}

function isStep1Valid(draft: VoteCreateDraft): boolean {
  return draft.title.trim().length > 0
}

function getStep1ValidationMessage(draft: VoteCreateDraft, lang: 'ko' | 'en'): string | null {
  if (draft.title.trim().length === 0) {
    return lang === 'ko'
      ? '시리즈명을 입력해야 합니다.'
      : 'Enter the series title to continue.'
  }

  return null
}

function hasDuplicateCandidateNames(draft: VoteCreateDraft) {
  if (draft.sections.length > 0) {
    return draft.sections.some((section) => {
      const normalized = section.candidates
        .map((candidate) => candidate.name.trim())
        .filter(Boolean)
      return new Set(normalized).size !== normalized.length
    })
  }

  const normalized = draft.candidates.map((candidate) => candidate.name.trim()).filter(Boolean)
  return new Set(normalized).size !== normalized.length
}

function getStep2ValidationMessage(draft: VoteCreateDraft, lang: 'ko' | 'en'): string | null {
  if (draft.sections.length > 0) {
    for (const section of draft.sections) {
      if (section.name.trim().length === 0) {
        return lang === 'ko'
          ? '모든 섹션에 섹션 이름을 입력해야 합니다.'
          : 'Each section needs a section name.'
      }

      if (section.candidates.length < 2) {
        return lang === 'ko'
          ? '각 섹션에는 후보를 최소 2명 이상 등록해야 합니다.'
          : 'Each section must have at least 2 candidates.'
      }

      for (const candidate of section.candidates) {
        if (candidate.name.trim().length === 0) {
          return lang === 'ko'
            ? '모든 후보 이름을 입력해야 합니다.'
            : 'Enter every candidate name to continue.'
        }
      }

      const normalized = section.candidates
        .map((candidate) => candidate.name.trim())
        .filter(Boolean)

      if (new Set(normalized).size !== normalized.length) {
        return lang === 'ko'
          ? '같은 섹션 안에서는 후보 이름이 중복될 수 없습니다.'
          : 'Candidate names must be unique within a section.'
      }
    }

    return null
  }

  if (draft.electionTitle.trim().length === 0) {
    return lang === 'ko'
      ? '투표 제목을 입력해야 합니다.'
      : 'Enter the vote title to continue.'
  }

  if (draft.candidates.length < 2) {
    return lang === 'ko'
      ? '후보를 최소 2명 이상 등록해야 합니다.'
      : 'Add at least 2 candidates.'
  }

  for (const candidate of draft.candidates) {
    if (candidate.name.trim().length === 0) {
      return lang === 'ko'
        ? '모든 후보 이름을 입력해야 합니다.'
        : 'Enter every candidate name to continue.'
    }
  }

  if (hasDuplicateCandidateNames(draft)) {
    return lang === 'ko'
      ? '같은 투표 안에서는 후보 이름이 중복될 수 없습니다.'
      : 'Candidate names must be unique within the same vote.'
  }

  return null
}

function isStep2Valid(draft: VoteCreateDraft): boolean {
  if (hasDuplicateCandidateNames(draft)) return false

  if (draft.sections.length > 0) {
    return draft.sections.every(
      (section) =>
        section.name.trim().length > 0 &&
        section.candidates.length >= 2 &&
        section.candidates.every((candidate) => candidate.name.trim().length > 0),
    )
  }

  if (draft.electionTitle.trim().length === 0) return false

  return (
    draft.candidates.length >= 2 &&
    draft.candidates.every((candidate) => candidate.name.trim().length > 0)
  )
}

function getSettingsValidationMessage(
  settings: ElectionSettingsDraft,
  candidateCount: number,
  lang: 'ko' | 'en',
  scopeLabel?: string,
) {
  const normalizedSettings = normalizeElectionSettingsDraft(settings)
  const effectiveResultRevealAt = getEffectiveResultRevealAt(normalizedSettings)
  const scopePrefix = scopeLabel ? `${scopeLabel}: ` : ''

  if (
    !normalizedSettings.startDate.trim() ||
    !normalizedSettings.endDate.trim() ||
    !effectiveResultRevealAt.trim()
  ) {
    return lang === 'ko'
      ? `${scopePrefix}시작, 종료, 결과 공개 시간을 모두 입력해야 합니다.`
      : `${scopePrefix}Fill in the start, end, and result reveal times.`
  }

  const startAt = Date.parse(normalizedSettings.startDate)
  const endAt = Date.parse(normalizedSettings.endDate)
  const resultRevealAt = Date.parse(effectiveResultRevealAt)

  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || !Number.isFinite(resultRevealAt)) {
    return lang === 'ko'
      ? `${scopePrefix}시간 형식이 올바르지 않습니다.`
      : `${scopePrefix}One or more date values are invalid.`
  }

  if (startAt >= endAt) {
    return lang === 'ko'
      ? `${scopePrefix}투표 시작 시간은 종료 시간보다 빨라야 합니다.`
      : `${scopePrefix}The start time must be earlier than the end time.`
  }

  if (resultRevealAt < endAt) {
    return lang === 'ko'
      ? `${scopePrefix}결과 공개 시간은 종료 시간보다 늦거나 같아야 합니다.`
      : `${scopePrefix}The result reveal time must be at or after the end time.`
  }

  if (normalizedSettings.ballotPolicy === 'ONE_PER_INTERVAL') {
    const interval = Number(normalizedSettings.resetIntervalValue)
    if (!Number.isFinite(interval) || interval <= 0) {
      return lang === 'ko'
        ? `${scopePrefix}투표권 갱신 주기를 올바르게 입력해야 합니다.`
        : `${scopePrefix}Enter a valid vote reset interval.`
    }
  }

  if (normalizedSettings.paymentMode === 'PAID') {
    const price = Number(normalizedSettings.costPerBallotEth)
    if (!Number.isFinite(price) || price <= 0) {
      return lang === 'ko'
        ? `${scopePrefix}유료 투표 금액을 올바르게 입력해야 합니다.`
        : `${scopePrefix}Enter a valid paid vote amount.`
    }
  }

  if (normalizedSettings.maxChoices < 1 || normalizedSettings.maxChoices > Math.max(candidateCount, 1)) {
    return lang === 'ko'
      ? `${scopePrefix}최대 선택 수가 후보 수보다 많을 수 없습니다.`
      : `${scopePrefix}Max selections cannot exceed the number of candidates.`
  }

  return null
}

function isStep3Valid(draft: VoteCreateDraft): boolean {
  const validateSettings = (settings: ElectionSettingsDraft, candidateCount: number) => {
    const normalizedSettings = normalizeElectionSettingsDraft(settings)
    const effectiveResultRevealAt = getEffectiveResultRevealAt(normalizedSettings)

    if (
      !normalizedSettings.startDate.trim() ||
      !normalizedSettings.endDate.trim() ||
      !effectiveResultRevealAt.trim()
    ) {
      return false
    }

    const startAt = Date.parse(normalizedSettings.startDate)
    const endAt = Date.parse(normalizedSettings.endDate)
    const resultRevealAt = Date.parse(effectiveResultRevealAt)

    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || !Number.isFinite(resultRevealAt)) {
      return false
    }

    if (startAt >= endAt) return false
    if (resultRevealAt < endAt) return false

    if (normalizedSettings.ballotPolicy === 'ONE_PER_INTERVAL') {
      const interval = Number(normalizedSettings.resetIntervalValue)
      if (!Number.isFinite(interval) || interval <= 0) return false
    }

    if (normalizedSettings.paymentMode === 'PAID') {
      const price = Number(normalizedSettings.costPerBallotEth)
      if (!Number.isFinite(price) || price <= 0) return false
    }

    return (
      normalizedSettings.maxChoices >= 1 &&
      normalizedSettings.maxChoices <= Math.max(candidateCount, 1)
    )
  }

  if (draft.sections.length > 0) {
    return draft.sections.every((section) => validateSettings(section, section.candidates.length))
  }

  return validateSettings(draft, draft.candidates.length)
}

function getStep3ValidationMessage(draft: VoteCreateDraft, lang: 'ko' | 'en'): string | null {
  if (draft.sections.length > 0) {
    for (const section of draft.sections) {
      const scopeLabel = lang === 'ko' ? `${section.name.trim() || '섹션'} 설정` : `${section.name.trim() || 'Section'} settings`
      const message = getSettingsValidationMessage(
        section,
        section.candidates.length,
        lang,
        scopeLabel,
      )
      if (message) return message
    }
    return null
  }

  return getSettingsValidationMessage(draft, draft.candidates.length, lang)
}

function validateStep(step: CreateStep, draft: VoteCreateDraft): boolean {
  if (step === 1) return isStep1Valid(draft)
  if (step === 2) return isStep2Valid(draft)
  return isStep3Valid(draft)
}

function getStepValidationMessage(
  step: CreateStep,
  draft: VoteCreateDraft,
  lang: 'ko' | 'en',
): string | null {
  if (step === 1) return getStep1ValidationMessage(draft, lang)
  if (step === 2) return getStep2ValidationMessage(draft, lang)
  return getStep3ValidationMessage(draft, lang)
}

async function uploadImageToIpfs(file: File): Promise<string | null> {
  try {
    const uploaded = await uploadFileToPinata(file)
    return uploaded?.uri ?? null
  } catch {
    return null
  }
}

function convertResetIntervalToSeconds(value: string, unit: VoteCreateDraft['resetIntervalUnit']) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error('유효한 투표권 갱신 주기를 입력하세요.')
  }

  return unit === 'DAY'
    ? numericValue * 86_400
    : unit === 'HOUR'
      ? numericValue * 3_600
      : numericValue * 60
}

function buildCandidateManifestCandidates(
  candidates: FlattenedCandidate[],
  candidateImageUrls: Map<string, string>,
): CandidateManifestCandidate[] {
  return candidates.map((candidate, index) => ({
    candidateKey: candidate.candidateKey,
    displayName: candidate.candidateKey,
    groupLabel: null,
    displayOrder: index + 1,
    imageUrl: candidateImageUrls.get(candidate.id) ?? null,
  }))
}

function buildManifestUriFallback(rawJson: string): string {
  return `data:application/json;charset=utf-8,${encodeURIComponent(rawJson)}`
}

function buildCandidateManifestFileName(seriesTitle: string, electionTitle: string, order: number) {
  const parts = [seriesTitle.trim(), electionTitle.trim()]
    .filter(Boolean)
    .join('-')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return `vestar-candidate-manifest-${parts || `election-${order}`}.json`
}

function extractPublicKeyValue(publicKey: { value: string }): string {
  return publicKey.value
}

function buildCandidateHashes(candidates: FlattenedCandidate[]) {
  return candidates.map((candidate) => keccak256(toHex(candidate.candidateKey)))
}

function serializePreparationFile(file?: File | null) {
  if (!file) return null

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  }
}

function getUploadedFileKey(file?: File | null) {
  if (!file) return null
  return `${file.name}:${file.size}:${file.type}:${file.lastModified}`
}

function buildSubmissionPlan(draft: VoteCreateDraft): {
  allCandidates: FlattenedCandidate[]
  elections: SubmissionUnit[]
} {
  const getSectionSettings = (section: SectionDraft): ElectionSettingsDraft =>
    draft.sectionPolicyUnified && draft.sections.length > 0 ? draft.sections[0] : section

  const allCandidates =
    draft.sections.length > 0
      ? draft.sections.flatMap((section) =>
          section.candidates.map((candidate) => ({
            id: candidate.id,
            candidateKey: candidate.name.trim(),
            imageFile: candidate.imageFile ?? null,
          })),
        )
      : draft.candidates.map((candidate) => ({
          id: candidate.id,
          candidateKey: candidate.name.trim(),
          imageFile: candidate.imageFile ?? null,
        }))

  const elections =
    draft.sections.length > 0
      ? draft.sections.map((section) => ({
          title: section.name.trim(),
          settings: getSectionSettings(section),
          electionCoverImageFile: section.electionCoverImageFile ?? null,
          candidates: section.candidates.map((candidate) => ({
            id: candidate.id,
            candidateKey: candidate.name.trim(),
            imageFile: candidate.imageFile ?? null,
          })),
        }))
      : [
          {
            title: draft.electionTitle.trim(),
            settings: draft,
            electionCoverImageFile: draft.electionCoverImageFile ?? null,
            candidates: draft.candidates.map((candidate) => ({
              id: candidate.id,
              candidateKey: candidate.name.trim(),
              imageFile: candidate.imageFile ?? null,
            })),
          },
        ]

  return { allCandidates, elections }
}

function buildDraftPreparationSignature(draft: VoteCreateDraft): string {
  const normalizeSettingsForSignature = (settings: ElectionSettingsDraft) => {
    const normalizedSettings = normalizeElectionSettingsDraft(settings)

    return {
      startDate: normalizedSettings.startDate,
      endDate: normalizedSettings.endDate,
      resultRevealAt: getEffectiveResultRevealAt(normalizedSettings),
      resultReveal: normalizedSettings.resultReveal,
      visibilityMode: normalizedSettings.visibilityMode,
      ballotPolicy: normalizedSettings.ballotPolicy,
      paymentMode: normalizedSettings.paymentMode,
      costPerBallotEth: normalizedSettings.costPerBallotEth,
      minKarmaTier: normalizedSettings.minKarmaTier,
      maxChoices: normalizedSettings.maxChoices,
      resetIntervalValue: normalizedSettings.resetIntervalValue,
      resetIntervalUnit: normalizedSettings.resetIntervalUnit,
    }
  }

  return JSON.stringify({
    title: draft.title.trim(),
    category: draft.category,
    bannerImageFile: serializePreparationFile(draft.bannerImageFile),
    elections:
      draft.sections.length > 0
        ? draft.sections.map((section) => ({
            title: section.name.trim(),
            electionCoverImageFile: serializePreparationFile(section.electionCoverImageFile),
            settings: normalizeSettingsForSignature(section),
            candidates: section.candidates.map((candidate) => ({
              name: candidate.name.trim(),
              imageFile: serializePreparationFile(candidate.imageFile),
            })),
          }))
        : [
            {
              title: draft.electionTitle.trim(),
              electionCoverImageFile: serializePreparationFile(draft.electionCoverImageFile),
              settings: normalizeSettingsForSignature(draft),
              candidates: draft.candidates.map((candidate) => ({
                name: candidate.name.trim(),
                imageFile: serializePreparationFile(candidate.imageFile),
              })),
            },
          ],
  })
}

function buildManifestPayload(
  draft: VoteCreateDraft,
  electionTitle: string,
  candidates: FlattenedCandidate[],
  candidateImageUrls: Map<string, string>,
  bannerImageUrl: string | null,
  electionCoverImageUrl: string | null,
) {
  return buildCandidateManifest({
    seriesPreimage: draft.title,
    electionTitle,
    seriesCoverImageUrl: bannerImageUrl,
    category: draft.category,
    electionCoverImageUrl,
    candidates: buildCandidateManifestCandidates(candidates, candidateImageUrls),
  })
}

async function prepareSubmissionArtifacts(
  draft: VoteCreateDraft,
): Promise<PreparedSubmissionArtifacts> {
  const { allCandidates, elections } = buildSubmissionPlan(draft)
  const uploadTasks = new Map<string, Promise<string | null>>()

  const ensureUploadedImage = (file?: File | null) => {
    if (!file) {
      return Promise.resolve<string | null>(null)
    }

    const fileKey = getUploadedFileKey(file)
    if (!fileKey) {
      return Promise.resolve<string | null>(null)
    }

    const existingTask = uploadTasks.get(fileKey)
    if (existingTask) {
      return existingTask
    }

    const nextTask = uploadImageToIpfs(file)
    uploadTasks.set(fileKey, nextTask)
    return nextTask
  }

  await Promise.all([
    ensureUploadedImage(draft.bannerImageFile),
    draft.sections.length === 0
      ? ensureUploadedImage(draft.electionCoverImageFile)
      : Promise.resolve(),
    ...elections.map((election) => ensureUploadedImage(election.electionCoverImageFile)),
    ...allCandidates.map((candidate) => ensureUploadedImage(candidate.imageFile)),
  ])

  const uploadedImageUrls = new Map<string, string | null>()
  await Promise.all(
    [...uploadTasks.entries()].map(async ([key, task]) => {
      uploadedImageUrls.set(key, await task)
    }),
  )

  const resolveUploadedImageUrl = (file?: File | null) => {
    const fileKey = getUploadedFileKey(file)
    if (!fileKey) return null
    return uploadedImageUrls.get(fileKey) ?? null
  }

  const bannerImageUrl = resolveUploadedImageUrl(draft.bannerImageFile)
  const rootElectionCoverImageUrl =
    draft.sections.length === 0 ? resolveUploadedImageUrl(draft.electionCoverImageFile) : null

  const candidateImageUrls = new Map<string, string>()
  allCandidates.forEach((candidate) => {
    const imageUrl = resolveUploadedImageUrl(candidate.imageFile)
    if (imageUrl) {
      candidateImageUrls.set(candidate.id, imageUrl)
    }
  })

  const requestedCandidateImageCount = allCandidates.filter(
    (candidate) => candidate.imageFile !== null,
  ).length

  const preparedElections = await Promise.all(
    elections.map(async (election, index) => {
      if (election.candidates.length < 2) {
        throw new Error('후보는 최소 2명 이상이어야 합니다.')
      }

      const normalizedKeys = election.candidates.map((candidate) => candidate.candidateKey)
      if (new Set(normalizedKeys).size !== normalizedKeys.length) {
        throw new Error('후보명은 같은 투표 안에서 중복될 수 없습니다.')
      }

      const normalizedSettings = normalizeElectionSettingsDraft(election.settings)
      const electionCoverImageUrl =
        draft.sections.length > 0
          ? resolveUploadedImageUrl(election.electionCoverImageFile)
          : rootElectionCoverImageUrl

      const manifest = buildManifestPayload(
        draft,
        election.title,
        election.candidates,
        candidateImageUrls,
        bannerImageUrl,
        electionCoverImageUrl,
      )
      const manifestFileName = buildCandidateManifestFileName(
        draft.title,
        election.title,
        index + 1,
      )
      const localManifestArtifact = createJsonArtifact(manifestFileName, manifest)

      let candidateManifestURI = buildManifestUriFallback(localManifestArtifact.rawJson)

      try {
        const uploadedManifestArtifact = await uploadJsonArtifactToPinata(
          manifestFileName,
          manifest,
        )
        candidateManifestURI = uploadedManifestArtifact.uri
      } catch {
        candidateManifestURI = buildManifestUriFallback(localManifestArtifact.rawJson)
      }

      const privatePrepare =
        normalizedSettings.visibilityMode === 'PRIVATE'
          ? await preparePrivateElection({
              seriesPreimage: draft.title.trim(),
              seriesCoverImageUrl: bannerImageUrl,
              title: election.title,
              coverImageUrl: electionCoverImageUrl,
            })
          : null

      return {
        title: election.title,
        normalizedSettings,
        candidates: election.candidates,
        candidateManifestURI,
        candidateManifestHash: localManifestArtifact.hash,
        titleHash: keccak256(toHex(election.title)),
        initialCandidateHashes: buildCandidateHashes(election.candidates),
        electionCoverImageUrl,
        privatePrepare,
      }
    }),
  )

  return {
    signature: buildDraftPreparationSignature(draft),
    bannerImageUrl,
    bannerUploadMissing: Boolean(draft.bannerImageFile && !bannerImageUrl),
    candidateUploadsMissing: requestedCandidateImageCount > candidateImageUrls.size,
    elections: preparedElections,
  }
}

function trimPreparedSubmissionCache(cache: Map<string, PreparedSubmissionArtifacts>) {
  while (cache.size > MAX_PREPARED_SUBMISSION_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (!oldestKey) return
    cache.delete(oldestKey)
  }
}

function shouldRefreshPreparedSubmission(prepared: PreparedSubmissionArtifacts) {
  if (prepared.bannerUploadMissing || prepared.candidateUploadsMissing) {
    return true
  }

  return prepared.elections.some((election) => election.candidateManifestURI.startsWith('data:'))
}

async function parseElectionAddress(txHash: Hash): Promise<Address> {
  const receipt = await vestarUtils.waitForReceipt(txHash)

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== vestarContractAddresses.electionFactory.toLowerCase())
      continue

    try {
      const parsed = decodeEventLog({
        abi: vestarElectionFactoryAbi,
        data: log.data,
        topics: log.topics,
      })

      if (parsed.eventName === 'ElectionCreated') {
        return parsed.args.electionAddress as Address
      }
    } catch {}
  }

  throw new Error('ElectionCreated 이벤트에서 electionAddress를 찾지 못했습니다.')
}

export interface UseCreateVoteDraftResult {
  draft: VoteCreateDraft
  organizationName: string
  step: CreateStep
  isCurrentStepValid: boolean
  currentStepValidationMessage: string | null
  submissionProgress: SubmissionProgressState
  updateField: <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => void
  addCandidate: () => void
  removeCandidate: (id: string) => void
  updateCandidate: (
    id: string,
    field: keyof Omit<CandidateDraft, 'id'>,
    value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
  ) => void
  addSection: () => void
  removeSection: (sectionId: string) => void
  updateSectionName: (sectionId: string, name: string) => void
  updateSectionCoverImage: (sectionId: string, image: string, imageFile: File | null) => void
  updateSectionField: <K extends keyof ElectionSettingsDraft>(
    sectionId: string,
    key: K,
    value: ElectionSettingsDraft[K],
  ) => void
  addCandidateToSection: (sectionId: string) => void
  removeCandidateFromSection: (sectionId: string, candidateId: string) => void
  updateSectionCandidate: (
    sectionId: string,
    candidateId: string,
    field: keyof Omit<CandidateDraft, 'id'>,
    value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
  ) => void
  clearSections: () => void
  nextStep: () => void
  prevStep: () => void
  submit: () => Promise<SubmitVoteResult>
  isSubmitting: boolean
}

export function useCreateVoteDraft(): UseCreateVoteDraftResult {
  const [draft, setDraft] = useState<VoteCreateDraft>(INITIAL_DRAFT)
  const [step, setStep] = useState<CreateStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionProgress, setSubmissionProgress] = useState<SubmissionProgressState>({
    stage: 'preparing',
    current: 0,
    total: 0,
    currentTitle: null,
  })
  const preparedSubmissionCacheRef = useRef<Map<string, PreparedSubmissionArtifacts>>(new Map())
  const preparedSubmissionPromiseRef = useRef<Map<string, Promise<PreparedSubmissionArtifacts>>>(
    new Map(),
  )
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const { lang } = useLanguage()
  const { addToast } = useToast()

  const isCurrentStepValid = validateStep(step, draft)
  const currentStepValidationMessage = getStepValidationMessage(step, draft, lang)
  const currentPreparationSignature =
    step === 3 && validateStep(3, draft) ? buildDraftPreparationSignature(draft) : null

  useEffect(() => {
    let cancelled = false

    if (!isConnected || !address) {
      setDraft((prev) => ({ ...prev, group: '' }))
      return
    }

    fetchVerifiedOrganizerByWallet(address)
      .then((organizer) => {
        if (cancelled) return
        setDraft((prev) => ({ ...prev, group: organizer?.organizationName ?? '' }))
      })
      .catch(() => {
        if (cancelled) return
        setDraft((prev) => ({ ...prev, group: '' }))
      })

    return () => {
      cancelled = true
    }
  }, [address, isConnected])

  const updateField = useCallback(
    <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => {
      setDraft((prev) => {
        if (key === 'sectionPolicyUnified') {
          const nextUnified = value as VoteCreateDraft['sectionPolicyUnified']

          if (nextUnified && prev.sections.length > 0) {
            const baseSettings = pickElectionSettings(prev.sections[0])
            return normalizeElectionSettingsDraft({
              ...prev,
              sectionPolicyUnified: true,
              sections: prev.sections.map((section) => ({
                ...section,
                ...baseSettings,
              })),
            })
          }

          return normalizeElectionSettingsDraft({ ...prev, [key]: value })
        }

        return normalizeElectionSettingsDraft({ ...prev, [key]: value })
      })
    },
    [],
  )

  const addCandidate = useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      candidates: [...prev.candidates, makeBlankCandidate()],
    }))
  }, [])

  const removeCandidate = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((candidate) => candidate.id !== id),
    }))
  }, [])

  const updateCandidate = useCallback(
    (
      id: string,
      field: keyof Omit<CandidateDraft, 'id'>,
      value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
    ) => {
      setDraft((prev) => ({
        ...prev,
        candidates: prev.candidates.map((candidate) =>
          candidate.id === id ? { ...candidate, [field]: value } : candidate,
        ),
      }))
    },
    [],
  )

  const addSection = useCallback(() => {
    setDraft((prev) => {
      const defaultCandidates =
        prev.sections.length === 0
          ? prev.candidates.map((candidate) => ({ ...candidate, id: makeId() }))
          : [makeBlankCandidate(), makeBlankCandidate()]

      const newSection: SectionDraft = {
        id: makeId(),
        name: '',
        electionCoverImage: '',
        electionCoverImageFile: null,
        candidates: defaultCandidates,
        startDate: prev.startDate,
        endDate: prev.endDate,
        resultRevealAt: prev.resultRevealAt,
        maxChoices: prev.maxChoices,
        visibilityMode: prev.visibilityMode,
        ballotPolicy: prev.ballotPolicy,
        paymentMode: prev.paymentMode,
        costPerBallotEth: prev.costPerBallotEth,
        minKarmaTier: prev.minKarmaTier,
        resetIntervalValue: prev.resetIntervalValue,
        resetIntervalUnit: prev.resetIntervalUnit,
        resultReveal: prev.resultReveal,
      }

      // sungje : 새 섹션도 단일 생성과 같은 규칙으로 정규화해서 공개투표/유료투표 값이 바로 맞도록 유지한다.
      return {
        ...prev,
        sections: [...prev.sections, normalizeElectionSettingsDraft(newSection)],
        electionTitle: '',
      }
    })
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }))
  }, [])

  const updateSectionName = useCallback((sectionId: string, name: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, name } : section,
      ),
    }))
  }, [])

  const updateSectionCoverImage = useCallback(
    (sectionId: string, image: string, imageFile: File | null) => {
      setDraft((prev) => ({
        ...prev,
        sections: prev.sections.map((section) =>
          section.id === sectionId
            ? { ...section, electionCoverImage: image, electionCoverImageFile: imageFile }
            : section,
        ),
      }))
    },
    [],
  )

  const updateSectionField = useCallback(
    <K extends keyof ElectionSettingsDraft>(
      sectionId: string,
      key: K,
      value: ElectionSettingsDraft[K],
    ) => {
      setDraft((prev) => ({
        ...prev,
        sections: prev.sections.map((section) => {
          if (prev.sectionPolicyUnified) {
            const sourceSection = prev.sections[0]
            const nextSettings = normalizeElectionSettingsDraft({
              ...pickElectionSettings(sourceSection ?? section),
              [key]: value,
            })
            return { ...section, ...pickElectionSettings(nextSettings) }
          }

          if (section.id !== sectionId) return section
          return normalizeElectionSettingsDraft({ ...section, [key]: value })
        }),
      }))
    },
    [],
  )

  const addCandidateToSection = useCallback((sectionId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              candidates: [...section.candidates, makeBlankCandidate()],
            }
          : section,
      ),
    }))
  }, [])

  const removeCandidateFromSection = useCallback((sectionId: string, candidateId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              candidates: section.candidates.filter((candidate) => candidate.id !== candidateId),
            }
          : section,
      ),
    }))
  }, [])

  const updateSectionCandidate = useCallback(
    (
      sectionId: string,
      candidateId: string,
      field: keyof Omit<CandidateDraft, 'id'>,
      value: CandidateDraft[keyof Omit<CandidateDraft, 'id'>],
    ) => {
      setDraft((prev) => ({
        ...prev,
        sections: prev.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                candidates: section.candidates.map((candidate) =>
                  candidate.id === candidateId ? { ...candidate, [field]: value } : candidate,
                ),
              }
            : section,
        ),
      }))
    },
    [],
  )

  const clearSections = useCallback(() => {
    setDraft((prev) => ({ ...prev, sections: [] }))
  }, [])

  const nextStep = useCallback(() => {
    setStep((prev) => {
      if (!validateStep(prev, draft)) return prev
      return Math.min(prev + 1, 3) as CreateStep
    })
  }, [draft])

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1) as CreateStep)
  }, [])

  const ensurePreparedSubmission = useCallback(
    async (signature: string, sourceDraft: VoteCreateDraft) => {
      const cached = preparedSubmissionCacheRef.current.get(signature)
      if (cached) {
        return cached
      }

      const existingPromise = preparedSubmissionPromiseRef.current.get(signature)
      if (existingPromise) {
        return existingPromise
      }

      const nextPromise = prepareSubmissionArtifacts(sourceDraft)
        .then((prepared) => {
          preparedSubmissionCacheRef.current.set(signature, prepared)
          trimPreparedSubmissionCache(preparedSubmissionCacheRef.current)
          return prepared
        })
        .finally(() => {
          preparedSubmissionPromiseRef.current.delete(signature)
        })

      preparedSubmissionPromiseRef.current.set(signature, nextPromise)
      return nextPromise
    },
    [],
  )

  useEffect(() => {
    if (!currentPreparationSignature) return

    const timeoutId = window.setTimeout(() => {
      void ensurePreparedSubmission(currentPreparationSignature, draft).catch(() => {})
    }, SUBMISSION_PREFLIGHT_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentPreparationSignature, draft, ensurePreparedSubmission])

  const submit = useCallback(async () => {
    if (!walletClient) {
      throw new Error('Status Network Testnet에 연결된 지갑이 필요합니다.')
    }

    if (!address) {
      throw new Error('지갑 주소를 확인할 수 없습니다.')
    }

    if (!validateStep(3, draft)) {
      throw new Error('투표 입력값이 아직 완성되지 않았습니다.')
    }

    setIsSubmitting(true)

    try {
      const organizerAddress = address

      if (chainId !== vestarStatusTestnetChain.id) {
        await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
      }

      const draftPreparationSignature = buildDraftPreparationSignature(draft)
      let preparedSubmission = await ensurePreparedSubmission(draftPreparationSignature, draft)

      if (shouldRefreshPreparedSubmission(preparedSubmission)) {
        preparedSubmissionCacheRef.current.delete(draftPreparationSignature)
        preparedSubmission = await ensurePreparedSubmission(draftPreparationSignature, draft)
      }

      const { bannerUploadMissing, candidateUploadsMissing } = preparedSubmission

      if (bannerUploadMissing || candidateUploadsMissing) {
        addToast({
          type: 'info',
          message:
            lang === 'ko'
              ? '일부 이미지 업로드에 실패해 이미지 없이 생성됩니다.'
              : 'Some image uploads failed. The vote will be created without those images.',
        })
      }

      const elections: SubmitVoteResult['elections'] = []

      setSubmissionProgress({
        stage: 'preparing',
        current: 0,
        total: preparedSubmission.elections.length,
        currentTitle: null,
      })

      for (const [index, preparedElection] of preparedSubmission.elections.entries()) {
        setSubmissionProgress({
          stage: 'awaiting_signature',
          current: index + 1,
          total: preparedSubmission.elections.length,
          currentTitle: preparedElection.title,
        })

        // sungje : manifest hash는 백엔드 prepare 응답이 아니라 프론트가 실제로 업로드한 json bytes 기준으로 고정한다.
        const seriesId = keccak256(
          encodePacked(['address', 'string'], [organizerAddress, draft.title.trim()]),
        )
        const { normalizedSettings } = preparedElection

        let electionPublicKey: Hex
        let privateKeyCommitmentHash: Hex

        if (normalizedSettings.visibilityMode === 'PRIVATE') {
          const prepareResponse = preparedElection.privatePrepare
          if (!prepareResponse) {
            throw new Error('비공개 투표 준비 정보가 누락되었습니다.')
          }
          electionPublicKey = toHex(extractPublicKeyValue(prepareResponse.publicKey))
          privateKeyCommitmentHash = prepareResponse.privateKeyCommitmentHash
        } else {
          electionPublicKey = '0x'
          privateKeyCommitmentHash = zeroHash
        }

        const normalizedAllowMultipleChoice =
          normalizedSettings.ballotPolicy === 'UNLIMITED_PAID'
            ? false
            : normalizedSettings.maxChoices > 1
        const normalizedMaxSelectionsPerSubmission = normalizedAllowMultipleChoice
          ? Math.max(2, normalizedSettings.maxChoices)
          : 1
        const effectiveResultRevealAt = getEffectiveResultRevealAt(normalizedSettings)

        const config: ElectionConfigInput = {
          seriesId,
          visibilityMode:
            normalizedSettings.visibilityMode === 'PRIVATE'
              ? VESTAR_VISIBILITY_MODE.PRIVATE
              : VESTAR_VISIBILITY_MODE.OPEN,
          titleHash: preparedElection.titleHash,
          candidateManifestHash: preparedElection.candidateManifestHash,
          candidateManifestURI: preparedElection.candidateManifestURI,
          startAt: Math.floor(Date.parse(normalizedSettings.startDate) / 1000),
          endAt: Math.floor(Date.parse(normalizedSettings.endDate) / 1000),
          // sungje : 공개 투표는 화면에서 결과 공개 시각을 숨기지만 컨트랙트 검증상 종료 시각 이상 값이 필요해서 endAt으로 맞춘다.
          resultRevealAt: Math.floor(Date.parse(effectiveResultRevealAt) / 1000),
          minKarmaTier: Number(normalizedSettings.minKarmaTier),
          ballotPolicy:
            normalizedSettings.ballotPolicy === 'ONE_PER_ELECTION'
              ? VESTAR_BALLOT_POLICY.ONE_PER_ELECTION
              : normalizedSettings.ballotPolicy === 'ONE_PER_INTERVAL'
                ? VESTAR_BALLOT_POLICY.ONE_PER_INTERVAL
                : VESTAR_BALLOT_POLICY.UNLIMITED_PAID,
          resetInterval:
            normalizedSettings.ballotPolicy === 'ONE_PER_INTERVAL'
              ? convertResetIntervalToSeconds(
                  normalizedSettings.resetIntervalValue,
                  normalizedSettings.resetIntervalUnit,
                )
              : 0,
          paymentMode:
            normalizedSettings.paymentMode === 'PAID'
              ? VESTAR_PAYMENT_MODE.PAID
              : VESTAR_PAYMENT_MODE.FREE,
          costPerBallot:
            normalizedSettings.paymentMode === 'PAID'
              ? parseUnits(normalizedSettings.costPerBallotEth || '0', 6)
              : 0n,
          allowMultipleChoice: normalizedAllowMultipleChoice,
          maxSelectionsPerSubmission: normalizedMaxSelectionsPerSubmission,
          timezoneWindowOffset: -new Date().getTimezoneOffset() * 60,
          paymentToken:
            normalizedSettings.paymentMode === 'PAID'
              ? vestarContractAddresses.mockUsdt
              : zeroAddress,
          electionPublicKey,
          privateKeyCommitmentHash,
          keySchemeVersion:
            normalizedSettings.visibilityMode === 'PRIVATE'
              ? PRIVATE_ELECTION_KEY_SCHEME_VERSION
              : 0,
        }

        const txHash = await vestarFactory.createElection(
          walletClient,
          config,
          preparedElection.initialCandidateHashes,
        )
        const electionAddress = await parseElectionAddress(txHash)

        elections.push({
          txHash,
          electionAddress,
          title: preparedElection.title,
        })
      }

      const lastElection = elections[elections.length - 1]

      return {
        txHash: lastElection.txHash,
        electionAddress: lastElection.electionAddress,
        elections,
      }
    } catch (error) {
      throw new Error(
        getWalletActionErrorMessage(error, {
          lang,
          defaultMessage:
            lang === 'ko' ? '투표 생성에 실패했습니다.' : 'Failed to create the vote.',
        }),
      )
    } finally {
      setIsSubmitting(false)
      setSubmissionProgress({
        stage: 'preparing',
        current: 0,
        total: 0,
        currentTitle: null,
      })
    }
  }, [
    address,
    addToast,
    chainId,
    draft,
    ensurePreparedSubmission,
    lang,
    switchChainAsync,
    walletClient,
  ])

  return {
    draft,
    organizationName: draft.group,
    step,
    isCurrentStepValid,
    currentStepValidationMessage,
    submissionProgress,
    updateField,
    addCandidate,
    removeCandidate,
    updateCandidate,
    addSection,
    removeSection,
    updateSectionName,
    updateSectionCoverImage,
    updateSectionField,
    addCandidateToSection,
    removeCandidateFromSection,
    updateSectionCandidate,
    clearSections,
    nextStep,
    prevStep,
    submit,
    isSubmitting,
  }
}
