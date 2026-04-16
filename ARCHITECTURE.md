# VESTAr — Architecture

Mobile-first (430 px) on-chain K-pop fan voting platform.
React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · wagmi v3 · React Query v5

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI Framework | React | 19 |
| Language | TypeScript | ~5.9 |
| Build | Vite | 8 |
| Styling | Tailwind CSS v4 | 4.2 |
| Routing | React Router | 7 |
| Wallet | wagmi + viem | 3 / 2 |
| Data Fetching | TanStack React Query | 5 |
| i18n | i18next + react-i18next | 26 / 17 |
| Linter/Formatter | Biome | 2 |
| Testing | Vitest + Testing Library | 4 |

---

## Project Structure

```
src/
├── main.tsx                            ← Entry — i18n import must come first
├── App.tsx                             ← RouterProvider root
│
├── i18n/
│   ├── index.ts                        ← i18next init (browser language detector)
│   ├── useLanguage.ts                  ← toggle() / setLanguage() / currentLang
│   └── locales/
│       ├── ko/
│       │   ├── common.ts               ← 공통 UI 문자열 (header, nav, profile, search)
│       │   ├── vote.ts                 ← 투표 관련 문자열
│       │   ├── host.ts                 ← 호스트 관련 문자열
│       │   └── error.ts               ← 에러 메시지
│       └── en/
│           ├── common.ts
│           ├── vote.ts
│           ├── host.ts
│           └── error.ts
│
├── constants/
│   ├── chains.ts                       ← Status Network 체인 설정 (현재 config/wagmi.ts)
│   ├── routes.ts                       ← ROUTES 상수 — 경로 하드코딩 방지
│   └── design.ts                       ← COLORS · LAYOUT 디자인 토큰
│
├── types/
│   ├── vote.ts                         ← Vote · Candidate · BadgeVariant · CreateVoteParams
│   ├── wallet.ts                       ← WalletRole · WalletState
│   └── host.ts                         ← HostVote · VoteStats
│
├── config/
│   ├── wagmi.ts                        ← wagmi config (Status Hoodi + mainnet, WalletConnect)
│   └── hosts.ts                        ← HOST_ADDRESSES 허용 목록 + isHost()
│
├── providers/
│   └── WalletProvider.tsx              ← WagmiProvider + QueryClientProvider
│
├── store/
│   ├── useWalletStore.ts               ← 지갑 연결 상태 전역 관리 (Zustand — planned)
│   └── useVoteStore.ts                 ← 필터 · 정렬 · 모달 상태 (planned)
│
├── guards/
│   ├── WalletGuard.tsx                 ← 지갑 미연결 시 /vote 로 리다이렉트
│   └── HostGuard.tsx                   ← 호스트 권한 없을 시 /unauthorized 로 리다이렉트
│
├── routes/
│   └── index.tsx                       ← 전체 라우트 정의 (현재 단일 파일)
│   ── userRoutes.tsx                   ← User 라우트 묶음 (planned)
│   └── hostRoutes.tsx                  ← WalletGuard 포함 Host 라우트 묶음 (planned)
│
├── components/
│   ├── layout/                         ← 현재 위치 (→ shared/ 로 이전 예정)
│   │   ├── AppLayout.tsx               ← 모바일 셸 — 헤더·푸터·패널·검색 조율
│   │   ├── Header.tsx                  ← 스크롤 감지 + 플로팅 동작
│   │   ├── FooterNav.tsx               ← 하단 네비게이션 바
│   │   ├── ProfilePanel.tsx            ← 오른쪽 슬라이드 패널 (통계·메뉴·언어)
│   │   └── SearchOverlay.tsx           ← 상단 슬라이드 검색 오버레이
│   │
│   ├── shared/
│   │   ├── Header/
│   │   │   ├── Header.tsx              ← (layout/Header.tsx 이전 후 위치)
│   │   │   ├── ProfilePanel.tsx
│   │   │   └── SearchOverlay.tsx
│   │   ├── BottomNav/
│   │   │   ├── UserBottomNav.tsx       ← 홈 | 마이
│   │   │   └── HostBottomNav.tsx       ← 대시보드 | 만들기 (planned)
│   │   ├── Modal/
│   │   │   ├── WalletModal.tsx         ← 지갑 연결 선택 (planned)
│   │   │   └── VoteModal.tsx           ← 투표 참여 플로우 (planned)
│   │   └── ui/
│   │       └── LanguageSwitcher.tsx    ← 언어 선택 (KO/EN/JA/ZH)
│   │
│   ├── wallet/
│   │   ├── WalletButton.tsx            ← wagmi useConnect 연결 버튼
│   │   └── ProfileButton.tsx           ← 주소 표시 + 연결 해제 드롭다운
│   │
│   ├── user/
│   │   ├── VoteCard.tsx                ← HOT 투표 카드 (가로 스크롤)
│   │   ├── VoteItem.tsx                ← 투표 목록 아이템 (세로)
│   │   ├── FilterChips.tsx             ← 카테고리 필터 칩 (planned)
│   │   └── AdBanner.tsx                ← 투표 완료 후 광고 (planned)
│   │
│   └── host/
│       ├── VoteStatusCard.tsx          ← 내 투표 현황 카드 (planned)
│       ├── ParticipantChart.tsx        ← 참여자 그래프 (planned)
│       └── CreateVoteForm.tsx          ← 투표 생성 폼 (planned)
│
├── pages/
│   ├── LandingPage.tsx                 ← 랜딩 (TODO)
│   ├── NotFoundPage.tsx                ← 404
│   ├── UnauthorizedPage.tsx            ← 403 (호스트 전용 접근 차단)
│   │
│   ├── user/
│   │   ├── Home.tsx                    ← 투표 목록 메인 (현재 vote/VoteListPage.tsx)
│   │   ├── VoteDetail.tsx              ← 투표 상세 + 참여 (planned)
│   │   ├── Community.tsx               ← 커뮤니티 (planned)
│   │   └── FanPot.tsx                  ← 팬 저금통 (planned)
│   │
│   └── host/
│       ├── Dashboard.tsx               ← 내 투표 관리 (현재 HostDashboardPage.tsx)
│       ├── CreateVote.tsx              ← 투표 생성 (planned)
│       └── VoteAnalytics.tsx           ← 투표 현황 대시보드 (planned)
│
├── hooks/
│   ├── shared/
│   │   ├── useWallet.ts                ← 지갑 연결 상태 + 주소 (현재 useWalletRole.ts)
│   │   ├── useKarma.ts                 ← Karma 포인트 조회 (planned)
│   │   └── useScrollHeader.ts          ← 헤더 스크롤 상태 (현재 useScrollDirection.ts)
│   ├── user/
│   │   ├── useVotes.ts                 ← 투표 목록 조회 (planned)
│   │   ├── useVoteDetail.ts            ← 투표 상세 조회 (planned)
│   │   └── useSubmitVote.ts            ← 투표 트랜잭션 제출 (planned)
│   └── host/
│       ├── useMyVotes.ts               ← 내가 만든 투표 조회 (planned)
│       ├── useCreateVote.ts            ← 투표 생성 트랜잭션 (planned)
│       └── useVoteStats.ts             ← 투표 통계 (planned)
│
├── contracts/
│   ├── abi/
│   │   ├── VoteXyz.json                ← 투표 컨트랙트 ABI (planned)
│   │   └── KarmaTracker.json           ← Karma 트래커 ABI (planned)
│   └── addresses.ts                    ← 체인별 컨트랙트 주소 (planned)
│
├── assets/
│   ├── Vector.svg                      ← 검색 아이콘
│   ├── account_balance_wallet.svg      ← 지갑 아이콘
│   ├── account_circle.svg              ← 프로필 아이콘
│   ├── verified.svg                    ← 인증 배지 아이콘
│   ├── check_box.svg                   ← 체크박스 (선택됨)
│   ├── check_box_outline_blank.svg     ← 체크박스 (미선택)
│   └── archive.svg                     ← 아카이브 아이콘
│
└── test/
    └── setup.ts                        ← Vitest 전역 설정 (jest-dom matchers)
```

---

## Routes

```
/                   → redirect → /vote
├── /vote           → Home (VoteListPage)          public
├── /vote/:id       → VoteDetail                   public          (planned)
├── /community      → Community                    public          (planned)
├── /fanpot         → FanPot                       public          (planned)
├── /unauthorized   → UnauthorizedPage             public
│
└── [WalletGuard]
    └── [HostGuard]
        ├── /host               → Dashboard         wallet + host
        ├── /host/create        → CreateVote        wallet + host  (planned)
        └── /host/:id/analytics → VoteAnalytics     wallet + host  (planned)

* → NotFoundPage
```

---

## Data Flow

```
wagmi (on-chain)
  └── useAccount / useConnect / useDisconnect
        └── WalletGuard / HostGuard / Header

React Query (off-chain API)
  └── useVotes / useVoteDetail / useVoteStats
        └── VoteListPage / VoteDetail / Dashboard

Local State (React hooks)
  └── useScrollDirection → AppLayout → Header + FooterNav
  └── useState (panelOpen, searchOpen) → AppLayout
  └── useState (activeFilter) → VoteListPage

i18next
  └── useTranslation() → all UI components
```

---

## Design System

Defined in `src/index.css` via Tailwind v4 `@theme`:

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#7140FD` | CTA buttons, active states |
| `--color-violet` | `#7140FF` | Accents, badges |
| `--color-bg` | `#F7F8FA` | Page background |
| `--color-header-bg` | `#13141A` | Header / footer (default) |
| `--color-header-float` | `#1C2033` | Header / footer (floating) |
| `--color-lavender` | `#F0EDFF` | Hover backgrounds, chip active |
| `--color-border` | `#E7E9ED` | Card borders |
| `--color-text` | `#090A0B` | Body text |
| `--color-muted` | `#707070` | Secondary text |
| `--color-green` | `#22C55E` | Wallet connected dot |
| `--font-sans` | `DM Sans` | Body text |
| `--font-mono` | `DM Mono` | Addresses, counts, badges |

**Layout constraint:** `max-width: 430px`, body `background: #E8E8E8` (shows on sides on desktop).

**Scroll behavior (Header + FooterNav):**
- `default` — anchored top/bottom, full width
- `hidden` — slides off-screen (scroll down > 4 px)
- `floating` — pill shape, inset 16 px (scroll up)

---

## i18n

Supported languages: `ko` (default) · `en` · `ja` · `zh`

Detection order: `localStorage` → browser `navigator`

Namespace structure:
- `common` — header, nav, profile, search
- `vote` — hero, filters, badges, counts, buttons
- `host` — dashboard, create form, analytics
- `error` — guard messages, fallback text

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_WALLETCONNECT_PROJECT_ID` | ✅ | WalletConnect Cloud project ID |

All `VITE_` prefixed variables are embedded at build time by Vite and safe to expose to the browser. Never use `VITE_` for secrets.

---

## Testing

```bash
pnpm test              # run once
pnpm test:watch        # watch mode
pnpm test:coverage     # coverage report (target: 80%)
```

Coverage thresholds (enforced in CI): **80%** lines / functions / branches / statements.

Test files co-located with source: `*.test.ts` / `*.test.tsx`

---

## Key Conventions

- **Immutability** — never mutate objects; use spread / `Object.assign`
- **File size** — 200–400 lines typical, 800 max; split by feature
- **No `console.log`** — use structured logging or remove before commit
- **No hardcoded strings** — use i18n keys; no hardcoded addresses beyond `config/`
- **Types over interfaces** for unions; interfaces for object shapes
- **`as const`** on static data (translation objects, ABI arrays, address maps)
