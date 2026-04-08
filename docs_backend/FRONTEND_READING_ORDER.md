# VESTAr Frontend Reading Order

이 문서는 프론트엔드 구현자가 `docs_backend` 문서를 어떤 순서로 읽으면 되는지 정리한 빠른 가이드다.

목표:

- 프론트가 현재 `vestar-backend`, `frontend-demo`, `vestar-contracts` 구조와 호환되게 구현되도록 돕는다.
- 모든 문서를 처음부터 끝까지 읽지 않아도, 구현 순서에 맞춰 필요한 문서를 먼저 보게 한다.

## 1. 가장 먼저 볼 문서

### [PRIVATE_ELECTION_CREATION_API.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/PRIVATE_ELECTION_CREATION_API.md)

`PRIVATE` election 생성 전에 백엔드와 어떤 request / response를 주고받는지 정의한 문서다.

이 문서를 먼저 봐야 하는 이유:

- `POST /private-elections/prepare` request shape
- response shape
- 서버 검증 규칙
- response 값을 최신 컨트랙트 `ElectionConfig`에 어떻게 매핑하는지

프론트가 `PRIVATE` election 생성 화면을 만든다면 가장 먼저 읽어야 한다.

### [BACKEND_ARCHITECTURE.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/BACKEND_ARCHITECTURE.md)

프론트가 실제로 호출하는 백엔드 API와 전체 흐름을 한 번에 보는 기준 문서다.

이 문서에서 바로 확인할 수 있는 것:

- `POST /uploads/candidate-image`
- `POST /private-elections/prepare`
- `GET /elections/meta`
- `GET /elections`
- `GET /vote-submissions/by-tx-hash`
- `GET /live-tally`
- `GET /finalized-tally`
- `GET /result-summaries`

주의:

- `GET /elections/meta`, `GET /elections`는 배열 응답이다.
- `OPEN` election 메타데이터는 상황에 따라 백엔드만으로 완전히 채워지지 않을 수 있다.

## 2. 생성 구현 시 바로 이어서 볼 문서

### [HASHING_RULES.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/HASHING_RULES.md)

프론트가 on-chain config를 만들 때 해시값을 어떻게 맞춰야 하는지 정의한 문서다.

중요 포인트:

- `seriesId`
- `titleHash`
- `candidateManifestHash`
- `privateKeyCommitmentHash`

`PRIVATE` election은 가능하면 프론트 재계산보다 `prepare` 응답값을 그대로 쓰는 것이 안전하다.

## 3. Private vote 구현 시 볼 문서

### [BALLOT_PAYLOAD_V1.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/BALLOT_PAYLOAD_V1.md)

`PRIVATE` ballot plaintext payload의 canonical schema를 정의한다.

이 문서로 확인할 수 있는 것:

- plaintext payload 필드
- `candidateKeys` shape
- `nonce`
- envelope가 어떤 JSON 구조인지

### [PRIVATE_ELECTION_ECC_ARCHITECTURE.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/PRIVATE_ELECTION_ECC_ARCHITECTURE.md)

현재 private vote 암호화 방식이 `P-256 ECDH + AES-256-GCM` 이라는 점을 설명한다.

이 문서가 필요한 경우:

- 프론트가 직접 ballot 암호화를 구현할 때
- 검증 포털 또는 별도 복호화 도구와 맞춰야 할 때
- RSA 스타일 구현을 하면 안 되는 이유를 확인할 때

## 4. Validation 세부사항이 필요할 때 볼 문서

### [BALLOT_VALIDATION_RULES.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/BALLOT_VALIDATION_RULES.md)

백엔드가 private ballot을 어떤 기준으로 invalid 처리하는지 설명한다.

이 문서가 특히 유용한 경우:

- 프론트에서 invalid 가능성을 미리 막고 싶을 때
- payload를 더 정확히 맞추고 싶을 때
- `candidateKeys`, 중복 후보, selection 수 제한, voter 귀속 조건을 확인할 때

## 5. 집계 화면 구현 시 볼 문서

### [TALLY_PIPELINES_SPEC.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/TALLY_PIPELINES_SPEC.md)

`OPEN` / `PRIVATE` election의 `live_tally`, `finalized_tally`, `result_summaries`가 어떤 source of truth로 만들어지는지 설명한다.

이 문서가 필요한 경우:

- tally dashboard를 만들 때
- `live`와 `finalized`의 차이를 UI에 반영할 때
- `FINALIZED` 이후 어떤 데이터를 보여줘야 하는지 판단할 때

## 6. DB / 운영 구조를 이해해야 할 때 볼 문서

### [DB_SCHEMA.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/DB_SCHEMA.md)

프론트가 직접 DB를 다루지는 않지만, 백엔드 응답 필드가 어디서 오는지 이해할 때 도움이 된다.

### [ENVIRONMENT_VARIABLES.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/ENVIRONMENT_VARIABLES.md)

프론트 구현 자체보다는 운영/개발환경 이해용 문서다.

## 권장 읽기 순서

### `PRIVATE` election 생성부터 구현할 때

1. [PRIVATE_ELECTION_CREATION_API.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/PRIVATE_ELECTION_CREATION_API.md)
2. [BACKEND_ARCHITECTURE.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/BACKEND_ARCHITECTURE.md)
3. [HASHING_RULES.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/HASHING_RULES.md)

### `PRIVATE` vote 제출까지 구현할 때

1. [BALLOT_PAYLOAD_V1.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/BALLOT_PAYLOAD_V1.md)
2. [PRIVATE_ELECTION_ECC_ARCHITECTURE.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/PRIVATE_ELECTION_ECC_ARCHITECTURE.md)
3. [BALLOT_VALIDATION_RULES.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/BALLOT_VALIDATION_RULES.md)

### tally / status 화면을 구현할 때

1. [BACKEND_ARCHITECTURE.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/BACKEND_ARCHITECTURE.md)
2. [TALLY_PIPELINES_SPEC.md](/Users/jeong-yoonho/vscode/Vestar/vestar-docs/docs_backend/TALLY_PIPELINES_SPEC.md)

## 한 줄 요약

- 생성 구현: `PRIVATE_ELECTION_CREATION_API.md`
- API 연결: `BACKEND_ARCHITECTURE.md`
- 해시 규칙: `HASHING_RULES.md`
- private vote payload: `BALLOT_PAYLOAD_V1.md`
- 암호화 방식: `PRIVATE_ELECTION_ECC_ARCHITECTURE.md`
- invalid 기준: `BALLOT_VALIDATION_RULES.md`
- tally 화면: `TALLY_PIPELINES_SPEC.md`
