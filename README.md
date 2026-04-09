# VESTAr

**On-chain K-pop Fan Voting Platform**
Built on Status Network · BUIDL Hackathon 2025

---

## Overview

VESTAr는 기존 문자투표 시스템을 Web3로 계승한 **K-pop 팬 투표 인프라**다.

조작 의혹, 해외 팬 배제, 불투명한 집계 — 기존 문자투표의 고질적 문제를 Status Network의 온체인 기록으로 해결한다.

```
기존 문자투표              VESTAr
──────────────────────────────────────────────
조작 가능 (블랙박스)   →   온체인 기록 = 누구나 검증
한국 번호만 가능       →   지갑만 있으면 글로벌 참여
통신사 수익 독점       →   주최자에게 ₩50 환원
결과 신뢰 불가         →   스마트컨트랙트 자동 집계
```

---

## Tech Stack

### Frontend

| Layer                | Library / Tool                         |
| -------------------- | -------------------------------------- |
| Framework            | React 19 + TypeScript + React Compiler |
| Bundler              | Vite 8                                 |
| Styling              | Tailwind CSS                           |
| Routing              | react-router-dom v6                    |
| State                | Zustand                                |
| Web3                 | wagmi + viem                           |
| Wallet UI            | RainbowKit                             |
| Data fetching        | @tanstack/react-query                  |
| Linting / Formatting | Biome 2 (replaces ESLint + Prettier)   |
| Testing              | Vitest 4 + @testing-library/react      |
| Package manager      | pnpm                                   |

### Blockchain

| Property | Value                                  |
| -------- | -------------------------------------- |
| Network  | Status Network (Linea zkEVM)           |
| Chain ID | 1918222555 (testnet)                   |
| RPC      | `https://testnet.rpc.status.network`   |
| Explorer | `https://testnet.status.network`       |
| Gas      | Zero — bridged stETH yield covers fees |

### Smart Contracts (Solidity)

```
VoteXyz.sol          투표 생성 / 참여 / 집계
KarmaTracker.sol     KP 발행 / 조회 (non-transferable)
VRFOracle.sol        랜덤 당첨자 선정 (V2)
YieldVault.sol       bridge yield → 가스비 충당 (V2)
```

---

## Getting Started

**Prerequisites:** Node.js ≥ 22, pnpm ≥ 10

```bash
# 1. Clone
git clone <repo-url>
cd VESTAr

# 2. Install
pnpm install

# 3. Dev server
pnpm dev        # → http://localhost:5173
```

### Available Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `pnpm dev`           | Start local dev server with HMR     |
| `pnpm build`         | Type-check + production build       |
| `pnpm preview`       | Preview production build            |
| `pnpm check`         | Biome: lint + format + import check |
| `pnpm check:fix`     | Biome: auto-fix all issues          |
| `pnpm lint`          | Lint only                           |
| `pnpm lint:fix`      | Auto-fix lint issues                |
| `pnpm format`        | Auto-format all files               |
| `pnpm test`          | Run all tests once                  |
| `pnpm test:watch`    | Watch mode                          |
| `pnpm test:coverage` | Coverage report (80% threshold)     |

---

## Project Structure

#### TBA specification

```
src/
├── layouts/
│   └── BaseLayout.tsx       # Header + BottomNav 공통 레이아웃
├── components/
│   ├── Header/
│   ├── Footer/
│   ├── VoteCard/
│   ├── Modal/
│   └── common/
├── pages/
│   ├── Home.tsx
│   ├── VoteDetail.tsx
│   ├── Community.tsx
│   ├── FanPot.tsx
│   ├── MyPage.tsx
│   └── host/
│       ├── Dashboard.tsx
│       └── CreateVote.tsx
├── hooks/
│   ├── useVotes.ts
│   ├── useVote.ts
│   ├── useSubmitVote.ts
│   └── useKarma.ts
├── contracts/
│   ├── abi/VoteXyz.json
│   └── addresses.ts
├── store/
│   └── useAppStore.ts       # Zustand global state
├── constants/
│   └── chains.ts            # Status Network chain config
└── test/
    └── setup.ts             # Vitest global setup
```

### Page Routes

| Route          | Description                    |
| -------------- | ------------------------------ |
| `/`            | 랜딩 페이지                    |
| `/home`        | 전체 투표 목록 + 필터          |
| `/votes/:id`   | 투표 상세 — 참여 + 결과        |
| `/fanpot`      | 팬 저금통 — 팬덤 화력 랭킹     |
| `/community`   | 커뮤니티 — 투표별 댓글/응원    |
| `/mypage`      | 마이페이지 — 내 투표 + KP 현황 |
| `/host`        | Hoster 대시보드                |
| `/host/create` | 투표 생성                      |

> Role separation is on-chain: a wallet that has called `createPoll()` sees the Hoster UI. No separate account types needed.

---

## Core Features

### Hoster (투표 주최자)

- [ ] 투표 생성 — 제목 / 후보 / 기간 / 카테고리
- [ ] 투표권 갱신 방식 — 전체 1회 / 매일 갱신
- [ ] 선택 방식 — 단수 / 복수 선택
- [ ] 결과 공개 방식 — 실시간 / 종료 후
- [ ] 실시간 대시보드 — 참여자 수 / 시간대별 그래프
- [ ] 정산 수령 — 투표 종료 후 주최자 환원금

### User (투표 참여자)

- [ ] 투표 목록 탐색 — 진행 중 / 예정 / 종료 / 카테고리
- [ ] 지갑 연결 → 투표권 구매 → 투표
- [ ] TX hash로 온체인 기록 직접 검증
- [ ] KP 자동 적립 — 투표 참여 시 +20 KP
- [ ] 투표별 댓글 / 응원 메시지

---

## Anti-Manipulation

```
지갑 1개 = 1계정
→ 다중 계정 구조적 불가 (DB 없이 온체인으로 보장)

신규 지갑 제한
→ 지갑 나이 조건으로 봇 차단

모든 투표 기록 온체인 영구 보존
→ 누구나 TX hash로 검증 가능

결과 지연 공개 (V2)
→ RANDAO 기반 Timelock
→ 종료 시각 전까지 플랫폼도 결과 열람 불가
→ 미래 블록 난수값 사용 — 키가 아직 존재하지 않음
```

---

## Business Model

```
투표권 1장 = mockUSDT 100  (문서 기준 고정 가격)
├── 플랫폼    mockUSDT 50
└── 주최자    mockUSDT 50
```

| Phase | 수익원            | 비고                               |
| ----- | ----------------- | ---------------------------------- |
| MVP   | 투표권 과금       | 1장 mockUSDT 100 고정             |
| MVP   | 투표 완료 후 광고 | 감정 고조 시점 노출, CPM 3~5×      |
| V2    | 팬덤 데이터 B2B   | 익명화 온체인 집계, GDPR 이슈 없음 |
| V2    | 프리미엄 대시보드 | 주최자 고급 기능                   |
| V2    | 화이트라벨        | 방송사·기획사용                    |

---

## Why Status Network

| Feature     | Benefit                                                             |
| ----------- | ------------------------------------------------------------------- |
| Zero Gas    | bridged stETH yield가 가스비 대납. 팬은 ballot당 mockUSDT 100만 부담 |
| RLN Privacy | Rate Limiting Nullifier로 봇·다중계정 구조적 차단                   |
| Linea zkEVM | Ethereum L1 보안 + L2 속도. 투표 TX 즉시 확정                       |
| SNT Karma   | SNT 스테이킹 → Karma 획득 → 투표 가중치. 진성 팬일수록 더 큰 목소리 |

---

## Status Network Chain Config

```typescript
export const statusNetwork = {
  id: 1918222555,
  name: "Status Network",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.rpc.status.network"] },
  },
  blockExplorers: {
    default: {
      name: "Status Explorer",
      url: "https://testnet.status.network",
    },
  },
  testnet: true,
};
```

---

## Design System

### Color Tokens

```css
--color-bg: #FFFFFF;        /* Main Background */
--color-banner: #09101C;    /* Banner / Strong Section BG */
--color-primary: #7140FD;   /* Main Button */
--color-primary-fg: #FFFFFF; /* Main Button Text */
--color-lavender: #F8F5FF;  /* Light Purple Background */
--color-lavender-text: #7140FD; /* Text on Light Purple BG */
--color-point-1: #FCC3AB;   /* Point Color 1 */
--color-point-2: #FBE1D7;   /* Point Color 2 */
--color-border: #e7e9ed;    /* Card / Input Border */
--color-text: #090a0b;      /* Primary Text */
--color-muted: #707070;     /* Secondary Text */
--color-green: #22c55e;     /* Success / Gasless badge */
```

### Typography

| Role    | Font             | Usage                 |
| ------- | ---------------- | --------------------- |
| Display | Instrument Serif | 히어로 타이틀         |
| Body    | DM Sans          | 일반 텍스트           |
| Mono    | DM Mono          | 주소 / TX hash / 수치 |

---

## Roadmap

### Phase 1 — Hackathon MVP

- [x] 랜딩 페이지
- [ ] 투표 생성 (기간 / 후보 / 갱신 방식)
- [ ] 지갑 연결 + 투표권 구매
- [ ] 온체인 투표 TX 기록
- [ ] 실시간 결과 조회
- [ ] 투표 완료 후 광고 노출
- [ ] KP 자동 적립

### Phase 2 — 신뢰 레이어 (3개월)

- [ ] RANDAO 기반 결과 지연 공개
- [ ] 이상 투표 감지 알림
- [ ] 온체인 공증 결과 증명서
- [ ] 댓글 / 커뮤니티 기능
- [ ] XMTP 기반 지갑 알림

### Phase 3 — 수익화 (6개월)

- [ ] 방송사 · 기획사 파트너십
- [ ] 팬덤 데이터 B2B
- [ ] 화이트라벨 솔루션
- [ ] Chainlink VRF 연동
- [ ] 다국어 지원 (한 / 영 / 일 / 태)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, code standards, testing requirements, and the PR process.

---

## License

MIT
