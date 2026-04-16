import { describe, expect, it } from 'vitest'
import { buildPrivateCandidates } from './receipts'
import type { CandidateManifest, VerificationReceipt } from './types'

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => 'ko',
  },
  configurable: true,
})

const candidateManifest: CandidateManifest = {
  schema: 'vestar.candidate-manifest',
  version: 1,
  candidates: [
    { candidateKey: 'alpha', displayName: 'Alpha', displayOrder: 1, groupLabel: null, imageUrl: null },
    { candidateKey: 'beta', displayName: 'Beta', displayOrder: 2, groupLabel: null, imageUrl: null },
    { candidateKey: 'gamma', displayName: 'Gamma', displayOrder: 3, groupLabel: null, imageUrl: null },
  ],
}

const makeReceipt = (id: string, candidateKey: string): VerificationReceipt => ({
  id,
  transactionHash: '0x1',
  transactionExplorerUrl: '',
  walletAddress: '0x0000000000000000000000000000000000000001',
  walletLabel: '0x0000...0001',
  walletExplorerUrl: '',
  submittedAtLabel: '',
  encryptedBallot: null,
  selections: [{ key: candidateKey, name: candidateKey, emoji: '🔐' }],
})

describe('verification receipts tally ranking', () => {
  it('uses competition ranking for tied candidates', () => {
    const candidates = buildPrivateCandidates(
      [
        makeReceipt('r1', 'alpha'),
        makeReceipt('r2', 'beta'),
        makeReceipt('r3', 'gamma'),
        makeReceipt('r4', 'beta'),
        makeReceipt('r5', 'gamma'),
      ],
      candidateManifest,
    )

    expect(candidates.map((candidate) => [candidate.key, candidate.rank])).toEqual([
      ['beta', 1],
      ['gamma', 1],
      ['alpha', 3],
    ])
  })
})
