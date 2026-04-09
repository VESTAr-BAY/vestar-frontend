import { useCallback, useEffect, useState } from 'react'
import type { Address, Hash, Hex } from 'viem'
import { decodeEventLog, keccak256, parseUnits, toHex, zeroAddress, zeroHash } from 'viem'
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { fetchVerifiedOrganizerByWallet } from '../../api/verifiedOrganizers'
import { apiClient } from '../../config/api'
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
import type {
  CandidateDraft,
  CreateStep,
  ElectionSettingsDraft,
  SectionDraft,
  VoteCreateDraft,
} from '../../types/host'
import {
  getEffectiveResultRevealAt,
  normalizeElectionSettingsDraft,
} from '../../utils/hostElectionSettings'
import { uploadJsonToPinata } from '../../utils/ipfs'
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

type PreparePrivateElectionResponse = {
  seriesIdHash: Hex
  titleHash: Hex
  candidateManifestHash: Hex
  keySchemeVersion: number
  publicKey:
    | string
    | {
        format?: string
        algorithm?: string
        value: string
      }
  privateKeyCommitmentHash: Hex
  candidateManifestPreimage: {
    candidates: Array<{
      candidateKey: string
      displayOrder: number
      imageUrl?: string | null
    }>
  }
}

type FlattenedCandidate = {
  id: string
  candidateKey: string
  imageFile?: File | null
}

type SubmissionUnit = {
  title: string
  settings: ElectionSettingsDraft
  candidates: FlattenedCandidate[]
}

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

const INITIAL_DRAFT: VoteCreateDraft = {
  title: '',
  electionTitle: '',
  group: '',
  bannerImage: '',
  bannerImageFile: null,
  category: '음악방송',
  candidates: [makeBlankCandidate(), makeBlankCandidate()],
  sections: [],
  ...buildDefaultElectionSettings(),
}

function isStep1Valid(draft: VoteCreateDraft): boolean {
  return draft.title.trim().length > 0
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

function validateStep(step: CreateStep, draft: VoteCreateDraft): boolean {
  if (step === 1) return isStep1Valid(draft)
  if (step === 2) return isStep2Valid(draft)
  return isStep3Valid(draft)
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<{ url: string }>('/uploads/candidate-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data.url
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

function buildCanonicalManifest(candidates: FlattenedCandidate[]) {
  return {
    candidates: candidates.map((candidate, index) => ({
      candidateKey: candidate.candidateKey,
      displayOrder: index + 1,
    })),
  }
}

function buildManifestMetadata(
  draft: VoteCreateDraft,
  electionTitle: string,
  candidates: FlattenedCandidate[],
  candidateImageUrls: Map<string, string>,
  bannerImageUrl: string | null,
) {
  return {
    title: electionTitle,
    seriesPreimage: draft.title.trim(),
    category: draft.category,
    coverImageUrl: bannerImageUrl,
    candidates: candidates.map((candidate, index) => ({
      candidateKey: candidate.candidateKey,
      displayOrder: index + 1,
      imageUrl: candidateImageUrls.get(candidate.id) ?? null,
    })),
    sections:
      draft.sections.length > 0
        ? draft.sections.map((section) => ({
            name: section.name.trim(),
            candidates: section.candidates.map((candidate) => candidate.name.trim()),
          }))
        : [],
  }
}

function buildManifestUriFallback(manifest: unknown): string {
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(manifest))}`
}

function extractPublicKeyValue(publicKey: PreparePrivateElectionResponse['publicKey']): string {
  return typeof publicKey === 'string' ? publicKey : publicKey.value
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
  submissionProgress: {
    current: number
    total: number
    currentTitle: string | null
  }
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
  const [submissionProgress, setSubmissionProgress] = useState({
    current: 0,
    total: 0,
    currentTitle: null as string | null,
  })
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const { lang } = useLanguage()

  const isCurrentStepValid = validateStep(step, draft)

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
      setDraft((prev) => normalizeElectionSettingsDraft({ ...prev, [key]: value }))
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

  const updateSectionField = useCallback(
    <K extends keyof ElectionSettingsDraft>(
      sectionId: string,
      key: K,
      value: ElectionSettingsDraft[K],
    ) => {
      setDraft((prev) => ({
        ...prev,
        sections: prev.sections.map((section) => {
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

  const submit = useCallback(async () => {
    if (!walletClient) {
      throw new Error('Status Network Testnet에 연결된 지갑이 필요합니다.')
    }

    if (!validateStep(3, draft)) {
      throw new Error('투표 입력값이 아직 완성되지 않았습니다.')
    }

    setIsSubmitting(true)

    try {
      if (chainId !== vestarStatusTestnetChain.id) {
        await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
      }

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

      const [bannerImageUrl, candidateImageEntries] = await Promise.all([
        draft.bannerImageFile
          ? uploadImage(draft.bannerImageFile)
          : Promise.resolve<string | null>(null),
        Promise.all(
          allCandidates.map(async (candidate) => [
            candidate.id,
            candidate.imageFile ? await uploadImage(candidate.imageFile) : null,
          ]),
        ),
      ])

      const candidateImageUrls = new Map<string, string>(
        candidateImageEntries.filter((entry): entry is [string, string] => entry[1] !== null),
      )

      const electionDrafts: SubmissionUnit[] =
        draft.sections.length > 0
          ? draft.sections.map((section) => ({
              title: section.name.trim(),
              settings: section,
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
                candidates: draft.candidates.map((candidate) => ({
                  id: candidate.id,
                  candidateKey: candidate.name.trim(),
                  imageFile: candidate.imageFile ?? null,
                })),
              },
            ]

      const elections: SubmitVoteResult['elections'] = []

      setSubmissionProgress({
        current: 0,
        total: electionDrafts.length,
        currentTitle: null,
      })

      for (const [index, electionDraft] of electionDrafts.entries()) {
        const normalizedSettings = normalizeElectionSettingsDraft(electionDraft.settings)

        setSubmissionProgress({
          current: index + 1,
          total: electionDrafts.length,
          currentTitle: electionDraft.title,
        })

        if (electionDraft.candidates.length < 2) {
          throw new Error('후보는 최소 2명 이상이어야 합니다.')
        }

        const normalizedKeys = electionDraft.candidates.map((candidate) => candidate.candidateKey)
        if (new Set(normalizedKeys).size !== normalizedKeys.length) {
          throw new Error('후보명은 같은 투표 안에서 중복될 수 없습니다.')
        }

        const canonicalManifest = buildCanonicalManifest(electionDraft.candidates)
        const manifestMetadata = buildManifestMetadata(
          draft,
          electionDraft.title,
          electionDraft.candidates,
          candidateImageUrls,
          bannerImageUrl,
        )

        let candidateManifestURI = buildManifestUriFallback(manifestMetadata)
        try {
          const uploadedManifestUri = await uploadJsonToPinata(manifestMetadata)
          if (uploadedManifestUri) candidateManifestURI = uploadedManifestUri
        } catch {
          candidateManifestURI = buildManifestUriFallback(manifestMetadata)
        }

        let seriesId: Hex
        let titleHash: Hex
        let candidateManifestHash: Hex
        let electionPublicKey: Hex
        let privateKeyCommitmentHash: Hex
        let keySchemeVersion: number
        let manifestForChain = canonicalManifest.candidates

        if (normalizedSettings.visibilityMode === 'PRIVATE') {
          const prepareResponse = await apiClient.post<PreparePrivateElectionResponse>(
            '/private-elections/prepare',
            {
              seriesPreimage: draft.title.trim(),
              seriesCoverImageUrl: bannerImageUrl,
              title: electionDraft.title,
              coverImageUrl: bannerImageUrl,
              candidateManifestPreimage: {
                candidates: canonicalManifest.candidates.map((candidate, candidateIndex) => ({
                  ...candidate,
                  imageUrl:
                    candidateImageUrls.get(electionDraft.candidates[candidateIndex].id) ?? null,
                })),
              },
            },
          )

          seriesId = prepareResponse.data.seriesIdHash
          titleHash = prepareResponse.data.titleHash
          candidateManifestHash = prepareResponse.data.candidateManifestHash
          electionPublicKey = toHex(extractPublicKeyValue(prepareResponse.data.publicKey))
          privateKeyCommitmentHash = prepareResponse.data.privateKeyCommitmentHash
          keySchemeVersion = Number(prepareResponse.data.keySchemeVersion)
          manifestForChain = prepareResponse.data.candidateManifestPreimage.candidates
        } else {
          seriesId = keccak256(toHex(draft.title.trim()))
          titleHash = keccak256(toHex(electionDraft.title))
          candidateManifestHash = keccak256(toHex(JSON.stringify(canonicalManifest)))
          electionPublicKey = '0x'
          privateKeyCommitmentHash = zeroHash
          keySchemeVersion = 0
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
          titleHash,
          candidateManifestHash,
          candidateManifestURI,
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
          keySchemeVersion,
        }

        const initialCandidateHashes = manifestForChain.map((candidate) =>
          keccak256(toHex(candidate.candidateKey)),
        )

        const txHash = await vestarFactory.createElection(
          walletClient,
          config,
          initialCandidateHashes,
        )
        const electionAddress = await parseElectionAddress(txHash)

        elections.push({
          txHash,
          electionAddress,
          title: electionDraft.title,
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
        current: 0,
        total: 0,
        currentTitle: null,
      })
    }
  }, [chainId, draft, lang, switchChainAsync, walletClient])

  return {
    draft,
    organizationName: draft.group,
    step,
    isCurrentStepValid,
    submissionProgress,
    updateField,
    addCandidate,
    removeCandidate,
    updateCandidate,
    addSection,
    removeSection,
    updateSectionName,
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
