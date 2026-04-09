export type Lang = 'en' | 'ko'

const STRINGS = {
  // ── Navigation ─────────────────────────────────────────────────────────────
  nav_home: { en: 'Home', ko: '홈' },
  nav_my: { en: 'My', ko: '마이' },

  // ── Global buttons / aria-labels ───────────────────────────────────────────
  btn_connect: { en: 'Connect', ko: '연결' },
  btn_close: { en: 'Close', ko: '닫기' },
  btn_cancel: { en: 'Cancel', ko: '취소' },
  btn_vote_now: { en: 'Vote Now', ko: '투표하기' },
  btn_search: { en: 'Search', ko: '검색' },
  btn_back: { en: 'Back', ko: '뒤로' },
  btn_profile: { en: 'Profile', ko: '프로필' },
  btn_share: { en: 'Share', ko: '공유' },
  btn_hold: { en: 'Create poll', ko: '투표 생성' },
  btn_update_version: { en: 'Update Version', ko: '버전 업데이트' },

  // ── Search overlay ──────────────────────────────────────────────────────────
  search_placeholder: { en: 'Search votes…', ko: '투표 검색…' },
  search_clear: { en: 'Clear', ko: '지우기' },
  search_trending: { en: 'Trending Now', ko: '인기' },
  search_no_results: { en: 'No results', ko: '검색 결과 없음' },
  search_no_results_sub: {
    en: 'Try a different keyword',
    ko: '다른 검색어를 입력해보세요',
  },

  // ── Vote List ───────────────────────────────────────────────────────────────
  vl_hero_title: { en: 'Vote Now', ko: '지금 투표하세요' },
  vl_hero_sub: {
    en: 'Join the K-pop community vote',
    ko: 'K-pop 팬이라면 지금 바로 참여하세요',
  },
  vl_hot_section: { en: 'HOT Votes', ko: 'HOT 투표' },
  vl_see_all: { en: 'See all', ko: '전체 보기' },
  vl_active_section: { en: 'Active Votes', ko: '진행 중인 투표' },
  vl_ended_section: { en: 'Ended Votes', ko: '마감된 투표' },
  vl_sort: { en: 'Sort ▾', ko: '정렬 ▾' },
  vl_sort_latest: { en: 'Newest first', ko: '최신 생성순' },
  vl_participating: { en: 'participating', ko: '참여 중' },
  vl_ended_badge: { en: 'Ended', ko: '종료됨' },
  vl_vote_btn: { en: 'Vote', ko: '투표하기' },
  vl_voted_alt: { en: 'Voted', ko: '투표 완료' },
  vl_empty_active: {
    en: 'There are no active vote series yet.',
    ko: '아직 진행 중인 투표가 없어요',
  },
  vl_empty_ended: { en: 'There are no ended vote series yet.', ko: '아직 마감된 투표가 없어요' },

  // ── Vote List filter chips ──────────────────────────────────────────────────
  filter_all: { en: 'All', ko: '전체' },
  filter_music: { en: 'Music Shows', ko: '음악방송' },
  filter_awards: { en: 'Awards', ko: '시상식' },
  filter_fan: { en: 'Fan Votes', ko: '팬투표' },
  filter_popular: { en: 'Popular', ko: '인기순' },

  // ── Badges ─────────────────────────────────────────────────────────────────
  badge_end: { en: 'END', ko: '종료' },

  // ── Vote Hero ───────────────────────────────────────────────────────────────
  vh_participants: { en: 'participants', ko: '명 참여' },
  vh_goal: { en: 'Goal', ko: '목표' },

  // ── Vote Info Section ───────────────────────────────────────────────────────
  vi_host: { en: 'Host', ko: '주최' },
  vi_start: { en: 'Start', ko: '시작' },
  vi_end: { en: 'End', ko: '종료' },
  vi_results: { en: 'Results', ko: '결과 공개' },

  // ── Candidate Section ───────────────────────────────────────────────────────
  cs_candidates: { en: 'Candidates', ko: '후보 선택' },
  cs_my_pick: { en: 'My Pick', ko: '내 선택' },
  cs_results_hidden: {
    en: 'Results will be revealed after voting ends',
    ko: '결과는 투표 종료 후 공개됩니다',
  },

  // ── Vote Detail action bar ──────────────────────────────────────────────────
  vd_select_candidate: { en: 'Select a candidate', ko: '후보를 선택하세요' },
  vd_select_section: {
    en: 'Select a candidate in each section',
    ko: '섹션에서 후보를 선택하세요',
  },
  vd_connect_wallet: {
    en: 'Connect wallet to vote',
    ko: '지갑 연결 후 투표하기',
  },
  vd_checking_eligibility: {
    en: 'Checking ballot availability…',
    ko: '투표 가능 여부를 확인하는 중…',
  },
  vd_ballot_unavailable: {
    en: 'No ballot available right now',
    ko: '현재 투표권이 없어요',
  },
  vd_onchain_pending: {
    en: 'On-chain vote is not ready yet',
    ko: '온체인 투표 준비 중이에요',
  },
  vd_voting_ended: {
    en: 'Voting has ended · No more votes',
    ko: '투표가 종료되었습니다 · 더 이상 투표할 수 없어요',
  },
  vd_switch_network: {
    en: 'Switch to Status Testnet',
    ko: '네트워크 전환 필요 — Status Testnet',
  },

  // ── Danger Confirm Modal ────────────────────────────────────────────────────
  dm_title: { en: 'Confirm Your Vote', ko: '투표를 확인하세요' },
  dm_irreversible: {
    en: 'This action is irreversible. Once submitted, your vote cannot be changed or cancelled.',
    ko: '이 투표는 되돌릴 수 없어요. 한 번 제출하면 변경하거나 취소할 수 없습니다.',
  },
  dm_vote_fee: { en: 'Vote fee', ko: '투표권' },
  dm_selected_candidates: { en: 'Selected candidates', ko: '선택한 후보' },

  // ── Bottom Sheet (Vote Status) ──────────────────────────────────────────────
  bs_title: { en: 'Vote Status', ko: '투표 상태' },
  bs_confirm_wallet: { en: 'Confirm in wallet', ko: '지갑에서 승인해주세요' },
  bs_confirm_wallet_sub: {
    en: 'Review the transaction in your wallet and approve it.',
    ko: '지갑에서 트랜잭션 내용을 확인하고 승인해주세요.',
  },
  bs_processing: { en: 'Processing your vote…', ko: '투표를 처리하는 중…' },
  bs_processing_sub: {
    en: 'The transaction has been sent and is being confirmed on-chain.',
    ko: '트랜잭션이 전송되었고 체인에서 확인되는 중입니다.',
  },
  bs_selected_candidates: { en: 'Selected candidates', ko: '선택한 후보' },
  bs_private_vote_note: {
    en: 'Private votes may appear as encrypted bytes in the wallet by design.',
    ko: '비공개 투표는 설계상 지갑에서 암호화된 bytes 형태로 보일 수 있습니다.',
  },
  bs_success_title: { en: 'Vote recorded!', ko: '투표가 기록됐어요!' },
  bs_success_sub: {
    en: 'Your vote has been securely saved',
    ko: '투표가 안전하게 저장됐습니다',
  },
  bs_receipt: { en: 'RECEIPT', ko: '영수증' },
  bs_karma_reward: {
    en: 'Vote reward has been credited',
    ko: '투표 참여 보상이 지급되었습니다',
  },

  // ── Profile Panel ───────────────────────────────────────────────────────────
  pp_my_votes: { en: 'My Votes', ko: '내 투표 내역' },
  pp_karma_history: { en: 'Karma History', ko: 'Karma 내역' },
  pp_stt_staking: { en: 'STT Staking', ko: 'STT 스테이킹' },
  pp_votes_stat: { en: 'Votes', ko: '투표 수' },
  pp_tier_stat: { en: 'Tier', ko: '등급' },
  pp_mock_usdt_stat: { en: 'MockUSDT', ko: 'MockUSDT' },
  pp_not_connected: { en: 'Not Connected', ko: '지갑 미연결' },
  pp_mint_mock_usdt: { en: 'Mint MockUSDT', ko: 'MockUSDT 민트' },
  pp_mint_mock_usdt_loading: { en: 'Minting…', ko: '민트 중…' },
  pp_host_page: { en: 'Hold', ko: '주최하기' },
  pp_connect_wallet: { en: 'Connect Wallet', ko: '지갑 연결' },
  pp_connect_wallet_loading: { en: 'Connecting…', ko: '연결 중…' },
  pp_disconnect: { en: 'Disconnect Wallet', ko: '지갑 연결 해제' },
  pp_language: { en: 'Language', ko: '언어' },

  // ── PWA update ─────────────────────────────────────────────────────────────
  pwa_update_ready: {
    en: 'A new version is ready.',
    ko: '새 버전이 준비됐어요.',
  },
  pwa_update_desc: {
    en: 'Tap the button to refresh and use the latest app.',
    ko: '버튼을 누르면 최신 버전으로 새로고침됩니다.',
  },
  pwa_update_loading: {
    en: 'Updating…',
    ko: '업데이트 중…',
  },

  // ── My Page ─────────────────────────────────────────────────────────────────
  mp_back: { en: 'Home', ko: '홈으로' },
  mp_karma_tier: { en: 'Karma Tier', ko: 'Karma 등급' },
  mp_total_karma: { en: 'Total Karma', ko: '총 Karma' },
  mp_tab_votes: { en: 'Vote History', ko: '투표 내역' },
  mp_tab_karma: { en: 'Karma History', ko: 'Karma 내역' },
  mp_verification_title: { en: 'Open the verification portal', ko: '검증 포탈 열기' },
  mp_verification_sub: {
    en: 'Review vote receipts, results, and proof details in one place.',
    ko: '투표 기록, 결과, 검증 근거를 한곳에서 다시 확인할 수 있어요.',
  },
  mp_verification_cta: { en: 'Try Verification', ko: '검증해보기' },
  common_loading: { en: 'Loading...', ko: '불러오는 중...' },
  mp_no_votes: { en: 'No votes yet', ko: '아직 참여한 투표가 없어요' },
  mp_no_karma: { en: 'No Karma earned yet', ko: '아직 획득한 Karma가 없어요' },
  mp_total_karma_stat: { en: 'Total Karma', ko: '총 보유 Karma' },
  mp_voted_label: { en: 'Voted:', ko: '선택:' },

  // ── Vote Result ─────────────────────────────────────────────────────────────
  vr_results: { en: 'Results', ko: '결과 발표' },
  vr_ended: { en: '· Ended', ko: '종료' },
  vr_1st_place: { en: '1st Place', ko: '1위' },
  vr_rankings: { en: 'Rankings', ko: '전체 순위' },

  // ── Vote Series ─────────────────────────────────────────────────────────────
  vs_back_to_list: { en: 'Back to list', ko: '목록으로 돌아가기' },
  vs_label: { en: 'Series', ko: '시리즈' },
  vs_loading: { en: 'Loading votes…', ko: '투표를 찾는 중' },
  vs_empty: {
    en: 'There are no votes in this series yet.',
    ko: '이 시리즈에 표시할 투표가 아직 없습니다.',
  },

  // ── Not Found ───────────────────────────────────────────────────────────────
  nf_title: { en: 'Page not found', ko: '페이지를 찾을 수 없어요' },
  nf_sub: {
    en: 'The address is invalid or the page has been deleted.',
    ko: '주소가 잘못됐거나 삭제된 페이지예요',
  },
  nf_btn: { en: 'Go back home', ko: '홈으로 돌아가기' },

  // ── Infinite Scroll ─────────────────────────────────────────────────────────
  is_all_caught_up: { en: 'All caught up', ko: '모두 불러왔어요' },

  // ── Landing Page ────────────────────────────────────────────────────────────
  lp_title: { en: 'Host Your Vote', ko: '투표 개설하기' },
  lp_sub: {
    en: 'Connect your wallet to create and manage K-pop community votes',
    ko: '지갑을 연결하고 K-pop 커뮤니티 투표를 만들고 관리하세요',
  },
  lp_connect_cta: {
    en: 'Connect Wallet to Get Started',
    ko: '지갑 연결하여 시작하기',
  },
  lp_go_host: { en: 'Go to Vote Dashboard', ko: '투표 대시보드로 이동' },
  lp_browse: { en: 'Browse Votes', ko: '투표 목록 보기' },

  // ── Host Dashboard ──────────────────────────────────────────────────────────
  hd_title: { en: 'Manage My Votes', ko: '내 투표 관리' },
  hd_sub: {
    en: 'Create votes and check results',
    ko: '투표를 만들고 결과를 확인하세요',
  },
  hd_active: { en: 'Active', ko: '진행 중' },
  hd_total_votes: { en: 'Total Votes', ko: '총 참여' },
  hd_completed: { en: 'Completed', ko: '완료된 투표' },
  hd_create_btn: { en: 'Create New Vote', ko: '새 투표 만들기' },
  hd_my_votes: { en: 'My Votes', ko: '내 투표 목록' },
  hd_view_results: { en: 'View Results', ko: '결과 보기' },
  hd_manage: { en: 'Manage', ko: '관리' },
} as const

export type StringKey = keyof typeof STRINGS

export function getStr(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang]
}
