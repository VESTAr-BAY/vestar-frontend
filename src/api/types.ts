/**
 * API response types — mirrors vestar-backend DB schema.
 *
 * Key DB tables:
 *   election_series      → series_preimage, onchain_series_id, cover_image_url
 *   election_drafts      → title, cover_image_url, visibility_mode, sync_state
 *   election_candidates  → candidate_key (preimage), image_url, display_order
 *   onchain_elections    → onchain_election_id, onchain_election_address,
 *                          onchain_state, start_at, end_at, result_reveal_at,
 *                          payment_mode, ballot_policy, allow_multiple_choice,
 *                          max_selections_per_submission, cost_per_ballot
 */

// ── State / mode enums ────────────────────────────────────────────────────────

/** Mirrors onchain_elections.onchain_state */
export type ApiElectionState =
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'KEY_REVEAL_PENDING'
  | 'KEY_REVEALED'
  | 'FINALIZED'
  | 'CANCELLED'

/** Mirrors onchain_elections.visibility_mode */
export type ApiVisibilityMode = 'OPEN' | 'PRIVATE'

/** Mirrors onchain_elections.payment_mode */
export type ApiPaymentMode = 'FREE' | 'PAID'

/** Mirrors onchain_elections.ballot_policy */
export type ApiBallotPolicy =
  | 'ONE_PER_ELECTION'
  | 'ONE_PER_INTERVAL'
  | 'UNLIMITED_PAID'

// ── Core election ─────────────────────────────────────────────────────────────

/**
 * A single election row as returned by the list endpoint.
 * Joins: onchain_elections + election_drafts + election_series.
 */
export interface ApiElection {
  /** DB primary key — used as URL id */
  id: string

  /** On-chain bytes32 electionId */
  onchain_election_id: string

  /** Deployed contract address; null if not yet indexed */
  onchain_election_address: `0x${string}` | null

  /** Cached on-chain state from last indexer sync */
  onchain_state: ApiElectionState

  /** election_drafts.title */
  title: string

  /** election_drafts.cover_image_url — banner / hero image */
  cover_image_url: string | null

  /** election_series.series_preimage — human-readable org/series name */
  series_preimage: string

  organizer_wallet_address: string
  organizer_verified_snapshot: boolean

  /** ISO 8601 datetime strings */
  start_at: string
  end_at: string
  result_reveal_at: string

  visibility_mode: ApiVisibilityMode
  payment_mode: ApiPaymentMode
  ballot_policy: ApiBallotPolicy
  allow_multiple_choice: boolean
  max_selections_per_submission: number

  /** Numeric string (wei / token units) */
  cost_per_ballot: string

  /** Cached total submissions from live_tally or result_summaries */
  total_submissions?: number
}

// ── Candidate ─────────────────────────────────────────────────────────────────

/**
 * One row from election_candidates.
 * candidate_key is the preimage; the on-chain key is keccak256(toHex(candidate_key)).
 */
export interface ApiCandidate {
  /** Human-readable identifier — also used as on-chain key preimage */
  candidate_key: string
  image_url: string | null
  display_order: number
}

// ── Detail response ───────────────────────────────────────────────────────────

export interface ApiElectionDetail extends ApiElection {
  candidates: ApiCandidate[]
}

// ── List response ─────────────────────────────────────────────────────────────

export interface ApiElectionListResponse {
  elections: ApiElection[]
  total: number
  page: number
  page_size: number
}
