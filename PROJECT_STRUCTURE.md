routes/      라우트 정의만 모아둠
layouts/     UserLayout / HostLayout 두 개
guards/      WalletGuard — /host 진입 차단
pages/       user/ 와 host/ 완전 분리
components/  shared/ user/ host/ 3단 분리
hooks/       shared/ user/ host/ 3단 분리
contracts/   ABI + 주소
store/       Zustand (지갑 상태, 투표 상태)
i18n/        번역 파일 + 초기화
constants/   routes / chains / design 토큰
types/       Vote / Host / Wallet 타입