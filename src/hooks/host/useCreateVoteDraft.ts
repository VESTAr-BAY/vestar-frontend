import { useCallback, useState } from 'react'
import { useSwitchChain, useWalletClient } from 'wagmi'
import { decodeEventLog, keccak256, parseUnits, toHex, zeroAddress, zeroHash } from 'viem'
import type { Address, Hash, Hex } from 'viem'
import { apiClient } from '../../config/api'
import { vestarFactory, vestarOrganizer, vestarUtils } from '../../contracts/vestar/client'
import { vestarStatusTestnetChain } from '../../contracts/vestar/chain'
import { vestarContractAddresses } from '../../contracts/vestar/generated'
import { vestarElectionFactoryAbi } from '../../contracts/vestar/generated/vestarElectionFactoryAbi'
import {
  VESTAR_BALLOT_POLICY,
  VESTAR_PAYMENT_MODE,
  VESTAR_VISIBILITY_MODE,
  type VestarBallotPolicy,
  type ElectionConfigInput,
} from '../../contracts/vestar/types'
import { uploadJsonToPinata } from '../../utils/ipfs'
import type { CandidateDraft, CreateStep, VoteCreateDraft } from '../../types/host'

type SubmitVoteResult = {
  txHash: Hash
  electionAddress: Address
  elections: Array<{
    txHash: Hash
    electionAddress: Address
    title: string
  }>
}

type CreateVoteDebugInfo = {
  walletAddress?: Address
  chainId?: number
  seriesPreimage?: string
  organizerVerified?: boolean
  organizerTier?: number
  canCreateElection?: boolean
  stage?: string
  errorMessage?: string
}

type FlattenedCandidate = {
  id: string
  candidateKey: string
  imageFile?: File | null
}

type ElectionDraftUnit = {
  title: string
  candidates: FlattenedCandidate[]
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
    }>
  }
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

const INITIAL_DRAFT: VoteCreateDraft = {
  title: '',
  group: '',
  bannerImage: '',
  bannerImageFile: null,
  category: '음악방송',
  visibility: 'PRIVATE',
  candidates: [makeBlankCandidate(), makeBlankCandidate()],
  sections: [],
  startDate: '',
  endDate: '',
  revealDate: '',
  maxChoices: 1,
  resultReveal: 'after_end',
  votePolicy: 'ONE_TIME',
  resetIntervalValue: 1,
  resetIntervalUnit: 'days',
  paymentType: 'FREE',
  costPerBallot: 0,
  minKarmaTier: 0,
}

function flattenCandidates(draft: VoteCreateDraft): FlattenedCandidate[] {
  if (draft.sections.length > 0) {
    return draft.sections.flatMap((section) =>
      section.candidates.map((candidate) => ({
        id: candidate.id,
        candidateKey: candidate.name.trim(),
        imageFile: candidate.imageFile ?? null,
      })),
    )
  }

  return draft.candidates.map((candidate) => ({
    id: candidate.id,
    candidateKey: candidate.name.trim(),
    imageFile: candidate.imageFile ?? null,
  }))
}

function hasUniqueCandidateKeys(candidates: FlattenedCandidate[]): boolean {
  const uniqueKeys = new Set(candidates.map((candidate) => candidate.candidateKey.toLowerCase()))
  return uniqueKeys.size === candidates.length
}

function getCandidateCount(draft: VoteCreateDraft): number {
  return flattenCandidates(draft).length
}

function getElectionUnits(draft: VoteCreateDraft): ElectionDraftUnit[] {
  if (draft.sections.length > 0) {
    return draft.sections.map((section) => ({
      title: section.name.trim(),
      candidates: section.candidates.map((candidate) => ({
        id: candidate.id,
        candidateKey: candidate.name.trim(),
        imageFile: candidate.imageFile ?? null,
      })),
    }))
  }

  return [
    {
      title: draft.title.trim(),
      candidates: flattenCandidates(draft),
    },
  ]
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
    seriesPreimage: draft.sections.length > 0 ? draft.title.trim() : (draft.group || draft.title).trim(),
    category: draft.category,
    visibility: draft.visibility,
    resultReveal: draft.resultReveal,
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

function getResetIntervalSeconds(draft: VoteCreateDraft): number {
  if (draft.votePolicy !== 'PERIODIC') return 0

  if (draft.resetIntervalUnit === 'days') return draft.resetIntervalValue * 24 * 60 * 60
  if (draft.resetIntervalUnit === 'hours') return draft.resetIntervalValue * 60 * 60
  return draft.resetIntervalValue * 60
}

function getBallotPolicy(draft: VoteCreateDraft): VestarBallotPolicy {
  if (draft.votePolicy === 'PERIODIC') return VESTAR_BALLOT_POLICY.ONE_PER_INTERVAL
  if (draft.votePolicy === 'UNLIMITED') return VESTAR_BALLOT_POLICY.UNLIMITED_PAID
  return VESTAR_BALLOT_POLICY.ONE_PER_ELECTION
}

function getVisibilityFromResultReveal(resultReveal: VoteCreateDraft['resultReveal']) {
  return resultReveal === 'immediate' ? 'OPEN' : 'PRIVATE'
}

function getResultRevealAt(draft: VoteCreateDraft, endAt: number): number {
  if (draft.resultReveal === 'immediate') return endAt
  return Math.floor(new Date(draft.revealDate).getTime() / 1000)
}

function extractPublicKeyValue(publicKey: PreparePrivateElectionResponse['publicKey']): string {
  return typeof publicKey === 'string' ? publicKey : publicKey.value
}

function isStep1Valid(draft: VoteCreateDraft): boolean {
  return draft.title.trim().length > 0
}

function isStep2Valid(draft: VoteCreateDraft): boolean {
  const candidates = flattenCandidates(draft)

  if (draft.sections.length > 0) {
    const sectionsValid = draft.sections.every(
      (section) =>
        section.name.trim().length > 0 &&
        section.candidates.length >= 2 &&
        section.candidates.every((candidate) => candidate.name.trim().length > 0),
    )

    return sectionsValid && hasUniqueCandidateKeys(candidates)
  }

  return (
    draft.candidates.length >= 2 &&
    draft.candidates.every((candidate) => candidate.name.trim().length > 0) &&
    hasUniqueCandidateKeys(candidates)
  )
}

function isStep3Valid(draft: VoteCreateDraft): boolean {
  if (!draft.startDate || !draft.endDate || !draft.revealDate) return false

  const startAt = new Date(draft.startDate)
  const endAt = new Date(draft.endDate)
  const revealAt = new Date(draft.revealDate)

  return endAt > startAt && revealAt >= endAt && draft.maxChoices >= 1 && draft.maxChoices < getCandidateCount(draft)
}

function isStep4Valid(draft: VoteCreateDraft): boolean {
  if (!Number.isInteger(draft.minKarmaTier) || draft.minKarmaTier < 0 || draft.minKarmaTier > 255) {
    return false
  }

  if (draft.paymentType === 'PAID' && (draft.costPerBallot <= 0 || draft.costPerBallot > 100)) {
    return false
  }

  if (draft.votePolicy === 'PERIODIC' && draft.resetIntervalValue <= 0) {
    return false
  }

  return true
}

function validateStep(step: CreateStep, draft: VoteCreateDraft): boolean {
  if (step === 1) return isStep1Valid(draft)
  if (step === 2) return isStep2Valid(draft)
  if (step === 3) return isStep3Valid(draft)
  return isStep4Valid(draft)
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<{ url: string }>('/uploads/candidate-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data.url
}

async function parseElectionAddress(txHash: Hash): Promise<Address> {
  const receipt = await vestarUtils.waitForReceipt(txHash)

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== vestarContractAddresses.electionFactory.toLowerCase()) {
      continue
    }

    try {
      const parsed = decodeEventLog({
        abi: vestarElectionFactoryAbi,
        data: log.data,
        topics: log.topics,
      })

      if (parsed.eventName === 'ElectionCreated') {
        return parsed.args.electionAddress as Address
      }
    } catch {
      continue
    }
  }

  throw new Error('ElectionCreated 이벤트에서 electionAddress를 찾지 못했습니다.')
}

export interface UseCreateVoteDraftResult {
  draft: VoteCreateDraft
  step: CreateStep
  isCurrentStepValid: boolean
  debugInfo: CreateVoteDebugInfo | null
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
  // DEBUG: create preflight/result snapshot. Remove after create flow is stable.
  const [debugInfo, setDebugInfo] = useState<CreateVoteDebugInfo | null>(null)
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()

  const isCurrentStepValid = validateStep(step, draft)

  const updateField = useCallback(
    <K extends keyof VoteCreateDraft>(key: K, value: VoteCreateDraft[K]) => {
      setDraft((prev) => {
        const nextDraft = { ...prev, [key]: value } as VoteCreateDraft
        const candidateCount = getCandidateCount(nextDraft)
        const maxAllowed = Math.max(1, candidateCount - 1)

        if (key === 'votePolicy' && value === 'UNLIMITED') {
          nextDraft.paymentType = 'PAID'
          nextDraft.costPerBallot = 100
          nextDraft.maxChoices = 1
        }

        if (key === 'resultReveal') {
          nextDraft.visibility = getVisibilityFromResultReveal(value as VoteCreateDraft['resultReveal'])
        }

        if (key === 'paymentType' && value === 'FREE' && nextDraft.votePolicy !== 'UNLIMITED') {
          nextDraft.costPerBallot = 0
        }

        if (key === 'maxChoices' && typeof value === 'number' && value > maxAllowed) {
          nextDraft.maxChoices = maxAllowed
        }

        return nextDraft
      })
    },
    [],
  )

  const addCandidate = useCallback(() => {
    setDraft((prev) => ({ ...prev, candidates: [...prev.candidates, makeBlankCandidate()] }))
  }, [])

  const removeCandidate = useCallback((id: string) => {
    setDraft((prev) => {
      const candidates = prev.candidates.filter((candidate) => candidate.id !== id)
      const maxAllowed = Math.max(1, candidates.length - 1)

      return {
        ...prev,
        candidates,
        maxChoices: Math.min(prev.maxChoices, maxAllowed),
      }
    })
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
    setDraft((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: makeId(),
          name: '',
          candidates: [makeBlankCandidate(), makeBlankCandidate()],
        },
      ],
    }))
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setDraft((prev) => ({ ...prev, sections: prev.sections.filter((section) => section.id !== sectionId) }))
  }, [])

  const updateSectionName = useCallback((sectionId: string, name: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (section.id === sectionId ? { ...section, name } : section)),
    }))
  }, [])

  const addCandidateToSection = useCallback((sectionId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId
          ? { ...section, candidates: [...section.candidates, makeBlankCandidate()] }
          : section,
      ),
    }))
  }, [])

  const removeCandidateFromSection = useCallback((sectionId: string, candidateId: string) => {
    setDraft((prev) => {
      const sections = prev.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              candidates: section.candidates.filter((candidate) => candidate.id !== candidateId),
            }
          : section,
      )
      const maxAllowed = Math.max(1, getCandidateCount({ ...prev, sections }) - 1)

      return {
        ...prev,
        sections,
        maxChoices: Math.min(prev.maxChoices, maxAllowed),
      }
    })
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
    setDraft((prev) => {
      const maxAllowed = Math.max(1, prev.candidates.length - 1)
      return { ...prev, sections: [], maxChoices: Math.min(prev.maxChoices, maxAllowed) }
    })
  }, [])

  const nextStep = useCallback(() => {
    setStep((prev) => (validateStep(prev, draft) ? (Math.min(prev + 1, 4) as CreateStep) : prev))
  }, [draft])

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1) as CreateStep)
  }, [])

  const submit = useCallback(async () => {
    if (!walletClient) {
      throw new Error('Status Network Testnet에 연결된 지갑이 필요합니다.')
    }

    const startAt = Math.floor(new Date(draft.startDate).getTime() / 1000)
    const endAt = Math.floor(new Date(draft.endDate).getTime() / 1000)
    const resultRevealAt = getResultRevealAt(draft, endAt)
    const seriesPreimage =
      draft.sections.length > 0 ? draft.title.trim() : (draft.group || draft.title).trim()
    const electionUnits = getElectionUnits(draft)

    setIsSubmitting(true)

    try {
      // DEBUG: capture organizer eligibility before simulate/write. Remove after create flow is stable.
      const [organizerVerified, organizerTier] = await Promise.all([
        vestarOrganizer.isVerified(walletClient.account.address),
        vestarOrganizer.getKarmaTier(walletClient.account.address),
      ])
      const canCreateElection = await vestarOrganizer.canCreateElection(
        walletClient.account.address,
        organizerTier,
      )

      setDebugInfo({
        walletAddress: walletClient.account.address,
        chainId: walletClient.chain?.id,
        seriesPreimage,
        organizerVerified,
        organizerTier,
        canCreateElection,
        stage: 'preflight_checked',
      })

      if (walletClient.chain?.id !== vestarStatusTestnetChain.id) {
        if (switchChainAsync) {
          await switchChainAsync({ chainId: vestarStatusTestnetChain.id })
        }
        throw new Error('Status Network Testnet으로 네트워크를 전환한 뒤 다시 시도해 주세요.')
      }

      const allCandidates = electionUnits.flatMap((unit) => unit.candidates)
      const [bannerImageUrl, candidateImageEntries] = await Promise.all([
        draft.bannerImageFile ? uploadImage(draft.bannerImageFile) : Promise.resolve<string | null>(null),
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

      const elections: SubmitVoteResult['elections'] = []

      for (const unit of electionUnits) {
        const canonicalManifest = buildCanonicalManifest(unit.candidates)
        const manifestMetadata = buildManifestMetadata(
          draft,
          unit.title,
          unit.candidates,
          candidateImageUrls,
          bannerImageUrl,
        )
        let candidateManifestURI = buildManifestUriFallback(manifestMetadata)

        try {
          const uploadedManifestUri = await uploadJsonToPinata(manifestMetadata)
          if (uploadedManifestUri) {
            candidateManifestURI = uploadedManifestUri
          }
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

        if (draft.visibility === 'PRIVATE') {
          const prepareResponse = await apiClient.post<PreparePrivateElectionResponse>(
            '/private-elections/prepare',
            {
              seriesPreimage,
              groupKey: seriesPreimage,
              seriesCoverImageUrl: bannerImageUrl,
              title: unit.title,
              coverImageUrl: bannerImageUrl,
              candidateManifestPreimage: {
                candidates: canonicalManifest.candidates.map((candidate, index) => ({
                  ...candidate,
                  imageUrl: candidateImageUrls.get(unit.candidates[index].id) ?? null,
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
          seriesId = keccak256(toHex(seriesPreimage))
          titleHash = keccak256(toHex(unit.title))
          candidateManifestHash = keccak256(toHex(JSON.stringify(canonicalManifest)))
          electionPublicKey = '0x'
          privateKeyCommitmentHash = zeroHash
          keySchemeVersion = 0
        }

        const costPerBallot =
          draft.paymentType === 'PAID' ? parseUnits(String(draft.costPerBallot), 6) : 0n

        const config: ElectionConfigInput = {
          seriesId,
          visibilityMode:
            draft.visibility === 'PRIVATE' ? VESTAR_VISIBILITY_MODE.PRIVATE : VESTAR_VISIBILITY_MODE.OPEN,
          titleHash,
          candidateManifestHash,
          candidateManifestURI,
          startAt,
          endAt,
          resultRevealAt,
          minKarmaTier: draft.minKarmaTier,
          ballotPolicy: getBallotPolicy(draft),
          resetInterval: getResetIntervalSeconds(draft),
          paymentMode:
            draft.paymentType === 'PAID' ? VESTAR_PAYMENT_MODE.PAID : VESTAR_PAYMENT_MODE.FREE,
          costPerBallot,
          allowMultipleChoice: draft.maxChoices > 1,
          maxSelectionsPerSubmission: draft.maxChoices,
          timezoneWindowOffset: -new Date().getTimezoneOffset() * 60,
          paymentToken:
            draft.paymentType === 'PAID' ? vestarContractAddresses.mockUsdt : zeroAddress,
          electionPublicKey,
          privateKeyCommitmentHash,
          keySchemeVersion,
        }

        const initialCandidateHashes = manifestForChain.map((candidate) =>
          keccak256(toHex(candidate.candidateKey)),
        )

        setDebugInfo((prev) => ({
          ...prev,
          walletAddress: walletClient.account.address,
          chainId: walletClient.chain?.id,
          stage: `submitting_${unit.title}`,
        }))

        const txHash = await vestarFactory.createElection(walletClient, config, initialCandidateHashes)
        const electionAddress = await parseElectionAddress(txHash)

        elections.push({
          txHash,
          electionAddress,
          title: unit.title,
        })
      }

      const lastElection = elections[elections.length - 1]

      setDebugInfo((prev) => ({
        ...prev,
        walletAddress: walletClient.account.address,
        chainId: walletClient.chain?.id,
        stage: 'submitted',
      }))

      return {
        txHash: lastElection.txHash,
        electionAddress: lastElection.electionAddress,
        elections,
      }
    } catch (error) {
      setDebugInfo((prev) => ({
        ...prev,
        walletAddress: walletClient.account.address,
        chainId: walletClient.chain?.id,
        seriesPreimage,
        stage: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
      }))
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [draft, switchChainAsync, walletClient])

  return {
    draft,
    step,
    isCurrentStepValid,
    debugInfo,
    updateField,
    addCandidate,
    removeCandidate,
    updateCandidate,
    addSection,
    removeSection,
    updateSectionName,
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
