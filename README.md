# VESTAr Frontend

Frontend for VESTAr election creation, vote submission, and indexed read composition.

## English

### Overview

This app owns the browser-side write path and the presentation-side read path.

- Organizers upload candidate manifests and images to IPFS/Pinata.
- Organizers and voters sign write transactions from their own wallets.
- The backend is used for `PRIVATE` election preparation and indexed read APIs.
- The UI renders final screens by combining backend locator/projection data with IPFS manifest data.
- A sibling verification portal can be embedded into the production build under `/vote/verification`.

### Current Stack

| Layer | Current choice |
| --- | --- |
| App | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Data | TanStack Query + custom fetch helpers |
| Web3 | wagmi + viem |
| Tests | Vitest + Testing Library |
| Lint / format | Biome 2 |

### Read/Write Split

| Concern | Primary source | Frontend role |
| --- | --- | --- |
| Election creation tx | `VESTArElectionFactory` | Build config and ask wallet to sign |
| Ballot submission tx | `VESTArElection` | Build plaintext or encrypted payload and ask wallet to sign |
| Private election key material | `POST /private-elections/prepare` | Receive public key and commitment for `PRIVATE` elections |
| Election list / detail / tally / history | Backend indexer DB | Consume `/elections`, `/live-tally`, `/finalized-tally`, `/result-summaries`, `/vote-submissions/history` |
| Render metadata | IPFS manifest | Render titles, series names, cover images, candidate images |
| Final authority | On-chain contracts | Override or confirm selected state and counters when needed |

### Status Network Fee UX

The write path uses Status Network's `linea_estimateGas` as the fee source of truth.

- Every contract write is simulated first, then estimated through `linea_estimateGas` with `from`.
- The returned `gasLimit`, `baseFeePerGas`, and `priorityFeePerGas` are applied to the outgoing write request.
- When both fee fields are `0`, the frontend treats the transaction as gasless and proceeds without an extra warning.
- When either fee field is non-zero, the frontend shows a premium-fee prompt with three actions:
  - `Pay Fee`
  - `Recheck`
  - `Later`
- Recheck always re-estimates close to send time instead of trusting cached values.
- Paid vote submission may involve more than one network transaction when ERC-20 approval is still required, so the UI aggregates the estimated fee across the pending approval + vote flow.

### Architecture

```mermaid
flowchart LR
  subgraph Browser[vestar-frontend]
    Host[Host flows]
    Voter[Voter flows]
    Wallet[wagmi + viem wallet writes]
    Compose[Manifest + projection composer]
  end

  subgraph Backend[vestar-backend]
    Prepare[Private prepare API]
    ReadApi[Read APIs]
    Indexer[Indexer]
    DB[(PostgreSQL projections)]
    Sync[state-sync-worker]
    Reveal[key-reveal-worker]
  end

  subgraph Chain[Status Network]
    Factory[VESTArElectionFactory]
    Election[VESTArElection instances]
  end

  IPFS[(IPFS / Pinata Gateway)]

  Host --> Prepare
  Host --> ReadApi
  Voter --> ReadApi
  Host --> IPFS
  Voter --> IPFS
  Compose --> ReadApi
  Compose --> IPFS

  Wallet --> Factory
  Wallet --> Election

  Prepare --> DB
  ReadApi --> DB
  Indexer --> Factory
  Indexer --> Election
  Indexer --> DB
  Sync --> Election
  Reveal --> Election
```

### Sequence: Election Creation

```mermaid
sequenceDiagram
  actor Organizer
  participant FE as vestar-frontend
  participant IPFS as IPFS / Pinata
  participant BE as backend prepare API
  participant DB as backend DB
  participant Factory as ElectionFactory
  participant Election as VESTArElection clone
  participant IDX as backend indexer

  Organizer->>FE: Fill series, election, candidates, schedule
  FE->>IPFS: Upload banner / candidate images
  IPFS-->>FE: image URIs
  FE->>FE: Build candidate manifest JSON<br/>compute candidateManifestHash
  FE->>IPFS: Upload candidate manifest
  IPFS-->>FE: candidateManifestURI

  alt PRIVATE election
    FE->>BE: POST /private-elections/prepare
    BE->>DB: create election_series + election_drafts + election_keys
    BE-->>FE: publicKey + privateKeyCommitmentHash
  else OPEN election
    FE->>FE: Skip private prepare
  end

  FE->>FE: Compute seriesId + titleHash locally
  FE->>Factory: createElection(config, initialCandidateHashes)
  Factory->>Election: clone + initialize(...)
  Factory-->>IDX: ElectionCreated event
  IDX->>Election: read config + state
  IDX->>DB: upsert onchain_elections<br/>link draft by commitment hash when matched
  FE->>BE: GET /elections or /elections/:id
  BE-->>FE: indexed locator + projection data
```

Implementation notes:

- `candidateManifestHash` comes from the frontend-generated JSON bytes, not from the backend.
- `/private-elections/prepare` is only used for `PRIVATE` elections.
- The current create flow computes `seriesId` and `titleHash` in the frontend before calling `createElection`.
- Manifest upload falls back to a `data:` URI when IPFS upload fails. Image upload failure degrades to image-less metadata instead of blocking creation.

### Sequence: Vote Detail Load And Ballot Submission

```mermaid
sequenceDiagram
  actor Voter
  participant FE as vestar-frontend
  participant API as backend read API
  participant DB as indexed DB
  participant IPFS as IPFS / Pinata
  participant Election as VESTArElection
  participant IDX as backend indexer

  Voter->>FE: Open vote detail
  FE->>API: GET /elections/:id
  API->>DB: read indexed election row + key/tally summary
  DB-->>API: candidateManifestUri/hash, state, payment, visibility, publicKey
  API-->>FE: indexed response
  FE->>IPFS: fetch manifest by URI
  IPFS-->>FE: candidate manifest JSON
  FE->>FE: combine backend projection + manifest<br/>optionally read on-chain state/result summary

  Voter->>FE: Select candidate keys

  alt OPEN election
    FE->>Election: submitOpenVote(candidateKeys)
    Election-->>IDX: OpenVoteSubmitted event
    IDX->>Election: decode tx input + verify candidateBatchHash
    IDX->>DB: upsert open_vote_submissions<br/>recompute live_tally + result_summaries
  else PRIVATE election
    FE->>FE: encrypt payload with publicKeyPem
    FE->>Election: submitEncryptedVote(encryptedBallot)
    Election-->>IDX: EncryptedVoteSubmitted event
    IDX->>Election: decode tx input + verify encryptedBallotHash
    IDX->>DB: upsert private_vote_submissions<br/>process decrypted_ballots + live_tally + result_summaries
  end

  FE->>API: refresh detail / tally / history
  API-->>FE: updated indexed projection
```

Implementation notes:

- The backend does not relay ballot transactions. Wallet writes go straight from browser to contract.
- `PRIVATE` ballots are encrypted in the browser with the public key returned by the backend prepare flow.
- After confirmation, the backend indexer becomes the main read source again by projecting the new submission into API-friendly tables.

### Repository Map

```text
vestar-frontend/
├─ src/
│  ├─ api/                         # backend read / prepare clients
│  ├─ contracts/vestar/            # viem actions, chain config, generated ABIs
│  ├─ hooks/host/                  # election creation / host dashboards
│  ├─ hooks/user/                  # vote detail / submit / result hooks
│  ├─ pages/host/                  # multi-step create and host pages
│  ├─ pages/vote/                  # list / detail / live tally / result pages
│  ├─ features/verification/       # verification portal UI helpers
│  └─ utils/                       # IPFS, manifest, optimistic cache, crypto helpers
├─ scripts/
│  ├─ build-with-verification-portal.mjs
│  └─ sync-vestar-contracts.mjs
└─ README.md
```

### Environment

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend base URL for `/elections`, `/private-elections/prepare`, tally, and history APIs |
| `VITE_PINATA_JWT` or `PINATA_JWT` | Pinata upload token used by browser-side IPFS uploads |
| `VITE_PINATA_GATEWAY_URL` or `PINATA_GATEWAYS` | Gateway base URL list used to resolve `ipfs://` assets |

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the Vite dev server |
| `pnpm build` | Build the app and embed the verification portal when the sibling repo exists |
| `pnpm build:app` | Build only the frontend app |
| `pnpm preview` | Preview the production build |
| `pnpm sync:vestar-contracts` | Sync ABI and address artifacts from `../contracts/abi` |
| `pnpm check` | Run Biome checks |
| `pnpm check:fix` | Apply Biome fixes |
| `pnpm test` | Run unit tests |
| `pnpm test:coverage` | Run tests with coverage |

## 한국어

### 개요

이 앱은 브라우저 기준 쓰기 경로와 화면 렌더링용 읽기 경로를 담당한다.

- 주최자는 후보 manifest와 이미지를 IPFS/Pinata에 업로드한다.
- 주최자와 유권자는 각자 지갑으로 write 트랜잭션을 서명한다.
- 백엔드는 `PRIVATE` election 준비와 indexed read API를 담당한다.
- UI는 백엔드 locator/projection 데이터와 IPFS manifest 데이터를 합성해 최종 화면을 만든다.
- 형제 저장소가 존재하면 verification portal을 `/vote/verification` 경로로 함께 빌드한다.

### 현재 스택

| 계층 | 현재 선택 |
| --- | --- |
| 앱 | React 19 + TypeScript |
| 빌드 | Vite 8 |
| 스타일 | Tailwind CSS 4 |
| 라우팅 | React Router 7 |
| 데이터 | TanStack Query + 커스텀 fetch helper |
| Web3 | wagmi + viem |
| 테스트 | Vitest + Testing Library |
| 린트 / 포맷 | Biome 2 |

### 읽기/쓰기 분리

| 관심사 | 1차 소스 | 프론트 역할 |
| --- | --- | --- |
| election 생성 tx | `VESTArElectionFactory` | config 구성 후 지갑 서명 요청 |
| ballot 제출 tx | `VESTArElection` | 평문 또는 암호문 payload 구성 후 지갑 서명 요청 |
| private election 키 재료 | `POST /private-elections/prepare` | `PRIVATE` election용 공개키와 commitment 수신 |
| election 목록 / 상세 / tally / 히스토리 | 백엔드 indexer DB | `/elections`, `/live-tally`, `/finalized-tally`, `/result-summaries`, `/vote-submissions/history` 사용 |
| 렌더링 메타데이터 | IPFS manifest | 제목, 시리즈명, 커버 이미지, 후보 이미지 렌더링 |
| 최종 권위 | 온체인 컨트랙트 | 필요 시 상태와 카운터를 직접 확인 또는 보정 |

### Status Network 수수료 UX

현재 write 경로는 Status Network의 `linea_estimateGas`를 수수료 기준값으로 사용한다.

- 모든 contract write는 먼저 simulate한 뒤 `from`을 포함한 `linea_estimateGas`로 다시 추정한다.
- 반환된 `gasLimit`, `baseFeePerGas`, `priorityFeePerGas`를 실제 write request에 반영한다.
- 두 수수료 필드가 모두 `0`이면 프론트는 가스리스 상태로 보고 추가 경고 없이 진행한다.
- 둘 중 하나라도 `0`이 아니면 프런트는 premium 수수료 안내 모달을 띄우고 아래 세 가지 액션을 제공한다.
  - `수수료 내기`
  - `재확인하기`
  - `나중에 하기`
- `재확인하기`는 캐시된 값을 믿지 않고 전송 직전 기준으로 다시 추정한다.
- 유료 투표는 ERC-20 approve가 아직 필요할 때 `approve + vote` 두 트랜잭션이 이어질 수 있으므로, UI는 이 흐름의 예상 수수료를 합산해서 보여준다.

### 아키텍처

```mermaid
flowchart LR
  subgraph Browser[vestar-frontend]
    Host[호스트 플로우]
    Voter[유저 플로우]
    Wallet[wagmi + viem 지갑 쓰기]
    Compose[manifest + projection 합성]
  end

  subgraph Backend[vestar-backend]
    Prepare[private prepare API]
    ReadApi[read API]
    Indexer[indexer]
    DB[(PostgreSQL projection)]
    Sync[state-sync-worker]
    Reveal[key-reveal-worker]
  end

  subgraph Chain[Status Network]
    Factory[VESTArElectionFactory]
    Election[VESTArElection 인스턴스]
  end

  IPFS[(IPFS / Pinata Gateway)]

  Host --> Prepare
  Host --> ReadApi
  Voter --> ReadApi
  Host --> IPFS
  Voter --> IPFS
  Compose --> ReadApi
  Compose --> IPFS

  Wallet --> Factory
  Wallet --> Election

  Prepare --> DB
  ReadApi --> DB
  Indexer --> Factory
  Indexer --> Election
  Indexer --> DB
  Sync --> Election
  Reveal --> Election
```

### 시퀀스: 투표 생성

```mermaid
sequenceDiagram
  actor Organizer as 주최자
  participant FE as vestar-frontend
  participant IPFS as IPFS / Pinata
  participant BE as backend prepare API
  participant DB as backend DB
  participant Factory as ElectionFactory
  participant Election as VESTArElection clone
  participant IDX as backend indexer

  Organizer->>FE: 시리즈, election, 후보, 일정 입력
  FE->>IPFS: 배너 / 후보 이미지 업로드
  IPFS-->>FE: image URI 반환
  FE->>FE: candidate manifest JSON 생성<br/>candidateManifestHash 계산
  FE->>IPFS: candidate manifest 업로드
  IPFS-->>FE: candidateManifestURI 반환

  alt PRIVATE election
    FE->>BE: POST /private-elections/prepare
    BE->>DB: election_series + election_drafts + election_keys 생성
    BE-->>FE: publicKey + privateKeyCommitmentHash 반환
  else OPEN election
    FE->>FE: private prepare 생략
  end

  FE->>FE: seriesId + titleHash 로컬 계산
  FE->>Factory: createElection(config, initialCandidateHashes)
  Factory->>Election: clone + initialize(...)
  Factory-->>IDX: ElectionCreated 이벤트
  IDX->>Election: config + state 조회
  IDX->>DB: onchain_elections upsert<br/>commitment hash 기준 draft 매핑
  FE->>BE: GET /elections 또는 /elections/:id
  BE-->>FE: indexed locator + projection 데이터 반환
```

구현 메모:

- `candidateManifestHash`는 백엔드가 아니라 프론트가 만든 JSON bytes 기준으로 계산한다.
- `/private-elections/prepare`는 `PRIVATE` election에서만 사용한다.
- 현재 생성 플로우는 `seriesId`와 `titleHash`를 프론트에서 계산한 뒤 `createElection`에 넣는다.
- manifest 업로드가 실패하면 `data:` URI로 폴백한다. 이미지 업로드가 실패하면 생성 자체를 막지 않고 이미지 없는 메타데이터로 진행한다.

### 시퀀스: 상세 조회와 투표 제출

```mermaid
sequenceDiagram
  actor Voter as 유권자
  participant FE as vestar-frontend
  participant API as backend read API
  participant DB as indexed DB
  participant IPFS as IPFS / Pinata
  participant Election as VESTArElection
  participant IDX as backend indexer

  Voter->>FE: 투표 상세 진입
  FE->>API: GET /elections/:id
  API->>DB: indexed election row + key/tally summary 조회
  DB-->>API: candidateManifestUri/hash, state, payment, visibility, publicKey 반환
  API-->>FE: indexed 응답 반환
  FE->>IPFS: URI 기준 manifest 조회
  IPFS-->>FE: candidate manifest JSON 반환
  FE->>FE: backend projection + manifest 합성<br/>필요 시 on-chain state/result summary 추가 조회

  Voter->>FE: candidateKey 선택

  alt OPEN election
    FE->>Election: submitOpenVote(candidateKeys)
    Election-->>IDX: OpenVoteSubmitted 이벤트
    IDX->>Election: tx input decode + candidateBatchHash 검증
    IDX->>DB: open_vote_submissions upsert<br/>live_tally + result_summaries 재계산
  else PRIVATE election
    FE->>FE: publicKeyPem으로 payload 암호화
    FE->>Election: submitEncryptedVote(encryptedBallot)
    Election-->>IDX: EncryptedVoteSubmitted 이벤트
    IDX->>Election: tx input decode + encryptedBallotHash 검증
    IDX->>DB: private_vote_submissions upsert<br/>process decrypted_ballots + live_tally + result_summaries 처리
  end

  FE->>API: detail / tally / history 새로고침
  API-->>FE: 갱신된 indexed projection 반환
```

구현 메모:

- 백엔드는 ballot 트랜잭션을 중계하지 않는다. write 경로는 브라우저에서 컨트랙트로 직접 간다.
- `PRIVATE` ballot은 백엔드 prepare 응답의 공개키로 브라우저에서 암호화한다.
- 트랜잭션 확정 뒤에는 백엔드 indexer가 다시 주 읽기 소스가 되어 새 submission을 API 친화적 projection으로 반영한다.

### 저장소 맵

```text
vestar-frontend/
├─ src/
│  ├─ api/                         # backend read / prepare client
│  ├─ contracts/vestar/            # viem action, chain config, generated ABI
│  ├─ hooks/host/                  # election 생성 / host dashboard
│  ├─ hooks/user/                  # vote detail / submit / result hook
│  ├─ pages/host/                  # multi-step 생성 화면과 host 페이지
│  ├─ pages/vote/                  # list / detail / live tally / result 페이지
│  ├─ features/verification/       # verification portal UI helper
│  └─ utils/                       # IPFS, manifest, optimistic cache, crypto helper
├─ scripts/
│  ├─ build-with-verification-portal.mjs
│  └─ sync-vestar-contracts.mjs
└─ README.md
```

### 환경 변수

| 변수 | 용도 |
| --- | --- |
| `VITE_API_BASE_URL` | `/elections`, `/private-elections/prepare`, tally, history API용 백엔드 base URL |
| `VITE_PINATA_JWT` 또는 `PINATA_JWT` | 브라우저 IPFS 업로드에 쓰는 Pinata 업로드 토큰 |
| `VITE_PINATA_GATEWAY_URL` 또는 `PINATA_GATEWAYS` | `ipfs://` asset 조회에 쓰는 gateway base URL 목록 |

### 스크립트

| 명령 | 용도 |
| --- | --- |
| `pnpm dev` | Vite dev server 실행 |
| `pnpm build` | 앱 빌드 후 형제 portal 저장소가 있으면 함께 임베드 |
| `pnpm build:app` | 프론트 앱만 빌드 |
| `pnpm preview` | 프로덕션 빌드 미리보기 |
| `pnpm sync:vestar-contracts` | `../contracts/abi`에서 ABI와 주소 아티팩트 동기화 |
| `pnpm check` | Biome 검사 |
| `pnpm check:fix` | Biome 자동 수정 |
| `pnpm test` | 단위 테스트 실행 |
| `pnpm test:coverage` | 커버리지 포함 테스트 실행 |
