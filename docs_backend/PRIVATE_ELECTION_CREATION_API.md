# VESTAr Private Election Creation API

## 목적

이 문서는 `PRIVATE` election 생성 시 프론트와 백엔드가 주고받는 `prepare` 메시지 형식을 정의한다.

## 핵심 전제

- 프론트는 on-chain 생성 전에 해시 원문과 UI 메타데이터를 백엔드에 먼저 보낸다.
- 백엔드는 draft 저장, candidate 저장, key pair 생성, 해시 계산을 수행한다.
- 프론트는 백엔드가 응답한 해시/공개키/commitment를 사용해 `createElection(...)`를 직접 호출한다.
- 최신 컨트랙트에서는 `electionId`를 config에 넣지 않으며, factory가 내부에서 생성한다.
- on-chain 생성 성공 후 DB 확정은 인덱서가 수행한다.

범위:

- 이 문서는 `PRIVATE` election 생성용 `prepare` API만 다룬다.
- `OPEN` election 생성은 이 API를 사용하지 않는다.

## Endpoint

```http
POST /private-elections/prepare
```

## 이 문서만으로 커버하는 범위

이 문서는 프론트가 `PRIVATE` election 생성 전에 반드시 호출해야 하는 백엔드 `prepare` API를 정의한다.

프론트 구현자가 이 문서에서 바로 가져가야 하는 핵심은 아래다.

- 요청 JSON shape
- 응답 JSON shape
- 해시 대상 canonical preimage
- 응답값을 최신 컨트랙트 `createElection(config)`에 어떻게 매핑하는지

별도 참고가 필요한 문서:

- 해시 규칙 상세: `HASHING_RULES.md`
- private ballot payload/envelope: `BALLOT_PAYLOAD_V1.md`
- private ballot 검증 규칙: `BALLOT_VALIDATION_RULES.md`

## 요청 형식

TypeScript 기준:

```ts
type PreparePrivateElectionRequest = {
  seriesPreimage: string;
  seriesCoverImageUrl?: string | null;
  title: string;
  coverImageUrl?: string | null;
  candidateManifestPreimage: {
    candidates: Array<{
      candidateKey: string;
      displayOrder: number;
      imageUrl?: string | null;
    }>;
  };
};
```

```json
{
  "seriesPreimage": "SHOW ME THE MONEY 12",
  "seriesCoverImageUrl": "http://localhost:3000/uploads/candidate-images/smtm12-banner.jpg",
  "title": "SMTM12 FINAL STAGE",
  "coverImageUrl": "http://localhost:3000/uploads/candidate-images/smtm12-final-stage.jpg",
  "candidateManifestPreimage": {
    "candidates": [
      {
        "candidateKey": "임영웅",
        "displayOrder": 1,
        "imageUrl": "http://localhost:3000/uploads/candidate-images/candidate-1.jpg"
      },
      {
        "candidateKey": "아이유",
        "displayOrder": 2,
        "imageUrl": "http://localhost:3000/uploads/candidate-images/candidate-2.jpg"
      }
    ]
  }
}
```

## 요청 필드 설명

- `seriesPreimage`
  - 컨트랙트 `seriesId`의 preimage
  - 현재 DB `election_series.series_preimage`에도 이 원문 문자열을 그대로 저장한다
- `seriesCoverImageUrl`
  - series 배너 이미지 URL
  - DB/UI 전용 메타데이터
- `title`
  - election 제목 원문
- `coverImageUrl`
  - election 대표 배너 이미지 URL
  - DB/UI 전용 메타데이터
- `candidateManifestPreimage.candidates[].candidateKey`
  - 후보 식별 key 원문
- `candidateManifestPreimage.candidates[].displayOrder`
  - 후보 표시 순서
- `candidateManifestPreimage.candidates[].imageUrl`
  - 후보 이미지 URL
  - DB/UI 전용 메타데이터

## 서버 검증 규칙

현재 백엔드는 `PreparePrivateElectionPipe`에서 아래 규칙을 강제한다.

- request body는 object여야 한다
- `seriesPreimage`
  - 비어 있지 않은 string이어야 한다
- `title`
  - 비어 있지 않은 string이어야 한다
- `seriesCoverImageUrl`
  - `string | null | undefined`
- `coverImageUrl`
  - `string | null | undefined`
- `candidateManifestPreimage`
  - object여야 한다
- `candidateManifestPreimage.candidates`
  - 비어 있지 않은 array여야 한다
- `candidateManifestPreimage.candidates[i].candidateKey`
  - 비어 있지 않은 string이어야 한다
- `candidateManifestPreimage.candidates[i].displayOrder`
  - `1` 이상 정수여야 한다
- `candidateManifestPreimage.candidates[i].imageUrl`
  - `string | null | undefined`

대표 400 응답 예시:

```json
{
  "statusCode": 400,
  "message": "candidateManifestPreimage.candidates[0].displayOrder must be an integer greater than or equal to 1",
  "error": "Bad Request"
}
```

## 해시 대상 데이터 형식

프론트가 최종적으로 컨트랙트 `candidateManifestHash`에 대응시키는 해시 원본 형식은 아래와 같다.

```json
{
  "candidates": [
    { "candidateKey": "임영웅", "displayOrder": 1 },
    { "candidateKey": "아이유", "displayOrder": 2 }
  ]
}
```

중요:

- 이 형식이 바로 온체인 `candidateManifestHash`의 canonical preimage다.
- 후보 이미지 URL은 이 해시 원본에 포함되지 않는다.
- `seriesCoverImageUrl`, `coverImageUrl`, candidate `imageUrl`은 모두 UI/DB 전용 메타데이터다.

## 백엔드 처리

백엔드는 이 요청을 받으면:

- `election_series` 생성 또는 재사용
- `series_cover_image_url` 저장 또는 갱신
- `seriesIdHash` 계산
- `titleHash` 계산
- `candidateManifestHash` 계산
- `election_drafts` 생성
- `election_candidates` 생성
- P-256 key pair 생성
- `private_key_commitment_hash` 생성
- `private_key_encrypted` 생성
- `election_keys` 생성

주의:

- 후보 이미지는 `election_candidates.image_url`에 저장된다.
- `candidateManifestHash` 계산에는 candidate `imageUrl`이 포함되지 않는다.
- 이미지 URL은 UI 메타데이터일 뿐, 온체인 무결성 해시 대상이 아니다.

강조:

- `election_drafts.candidate_manifest_preimage`에는 **바로 위 canonical preimage가 저장된다.**
- 즉 DB의 `candidate_manifest_preimage` 필드는 온체인 `candidateManifestHash` 계산에 사용된 원본 메시지를 그대로 보관하는 필드다.
- 이미지 URL은 이 필드가 아니라 `election_candidates.image_url`에만 저장된다.

## 응답 형식

TypeScript 기준:

```ts
type PreparePrivateElectionResponse = {
  seriesIdHash: `0x${string}`;
  titleHash: `0x${string}`;
  candidateManifestHash: `0x${string}`;
  keySchemeVersion: number;
  publicKey: {
    format: "pem";
    algorithm: "ECDH-P256";
    value: string;
  };
  privateKeyCommitmentHash: `0x${string}`;
  candidateManifestPreimage: {
    candidates: Array<{
      candidateKey: string;
      displayOrder: number;
    }>;
  };
};
```

```json
{
  "seriesIdHash": "0x...",
  "titleHash": "0x...",
  "candidateManifestHash": "0x...",
  "keySchemeVersion": 1,
  "publicKey": {
    "format": "pem",
    "algorithm": "ECDH-P256",
    "value": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
  },
  "privateKeyCommitmentHash": "0x...",
  "candidateManifestPreimage": {
    "candidates": [
      { "candidateKey": "임영웅", "displayOrder": 1 },
      { "candidateKey": "아이유", "displayOrder": 2 }
    ]
  }
}
```

## 응답 필드 설명

- `seriesIdHash`
  - 컨트랙트 `seriesId`
- `titleHash`
  - 컨트랙트 `titleHash`
- `candidateManifestHash`
  - 컨트랙트 `candidateManifestHash`
- `keySchemeVersion`
  - 현재 `1`
- `publicKey`
  - `P-256 ECDH` 공개키 PEM
- `privateKeyCommitmentHash`
  - 컨트랙트 `privateKeyCommitmentHash`
- `candidateManifestPreimage`
  - 해시용으로 정렬/정규화된 후보 원문
  - 현재 응답에는 `candidateKey`, `displayOrder`만 포함된다

중요:

- 응답의 `candidateManifestPreimage`는 요청 원문을 그대로 echo하는 것이 아니다.
- 백엔드가 `displayOrder` 기준으로 정렬하고 `imageUrl`을 제거한 canonical preimage를 반환한다.
- 프론트는 이후 private ballot plaintext를 만들 때도 이 canonical 후보 집합을 기준으로 보는 편이 안전하다.

즉 프론트는 이 응답의 `candidateManifestPreimage`를

- 온체인 hash 대상 원문
- DB `candidate_manifest_preimage`에 저장된 원문

과 동일한 canonical 데이터로 이해하면 된다.

## 프론트 구현 규칙

프론트는 `PRIVATE` election 생성 시 아래 순서를 따라야 한다.

1. 사용자가 입력한 `seriesPreimage`, `title`, 후보 목록, 이미지 메타를 모은다.
2. `POST /private-elections/prepare`를 호출한다.
3. 응답으로 받은 해시값/공개키/commitment를 그대로 사용한다.
4. organizer 지갑으로 factory `createElection(config)`를 직접 호출한다.

중요:

- `PRIVATE`에서는 프론트가 `seriesId`, `titleHash`, `candidateManifestHash`, `privateKeyCommitmentHash`를 재계산하지 않는 편이 안전하다.
- 현재 시스템에서는 백엔드 응답값을 그대로 사용하는 것이 canonical 기준이다.
- `publicKey.value`는 PEM 문자열이므로, 프론트는 컨트랙트 입력용 `bytes`로 변환해서 `electionPublicKey`에 넣어야 한다.

## 응답 -> 최신 컨트랙트 `ElectionConfig` 매핑

최신 컨트랙트에서는 `electionId`를 프론트가 넣지 않는다.  
프론트는 아래 필드들을 준비해서 `createElection(config)`에 넣는다.

```ts
type ElectionConfigInput = {
  seriesId: `0x${string}`;
  visibilityMode: 1;
  titleHash: `0x${string}`;
  candidateManifestHash: `0x${string}`;
  candidateManifestURI: string;
  startAt: bigint;
  endAt: bigint;
  resultRevealAt: bigint;
  minKarmaTier: number;
  ballotPolicy: number;
  resetInterval: bigint;
  paymentMode: number;
  costPerBallot: bigint;
  allowMultipleChoice: boolean;
  maxSelectionsPerSubmission: number;
  timezoneWindowOffset: number;
  paymentToken: `0x${string}`;
  electionPublicKey: `0x${string}`;
  privateKeyCommitmentHash: `0x${string}`;
  keySchemeVersion: number;
};
```

`prepare` 응답값에서 직접 매핑되는 필드:

- `seriesId = response.seriesIdHash`
- `visibilityMode = PRIVATE(1)`
- `titleHash = response.titleHash`
- `candidateManifestHash = response.candidateManifestHash`
- `candidateManifestURI = ""` 또는 프론트가 별도로 관리하는 URI
- `electionPublicKey = pemToHexBytes(response.publicKey.value)`
- `privateKeyCommitmentHash = response.privateKeyCommitmentHash`
- `keySchemeVersion = response.keySchemeVersion`

프론트가 별도로 채워야 하는 필드:

- `startAt`
- `endAt`
- `resultRevealAt`
- `minKarmaTier`
- `ballotPolicy`
- `resetInterval`
- `paymentMode`
- `costPerBallot`
- `allowMultipleChoice`
- `maxSelectionsPerSubmission`
- `timezoneWindowOffset`
- `paymentToken`

## On-chain 이후 처리

프론트는 `prepare` 이후 organizer 지갑으로 `createElection(...)`를 보낸다.

중요:

- 최신 컨트랙트 `ElectionConfig`에는 `electionId` 필드가 없다.
- 프론트는 `seriesId`, `titleHash`, `candidateManifestHash`, 공개키/commitment 등만 config에 넣는다.
- `electionId`는 factory가 내부적으로 생성하고, 이후 `ElectionCreated` 이벤트와 `electionId()` read를 통해 확인한다.

그 이후 백엔드는 인덱서를 통해:

- `ElectionCreated` 감지
- `onchain_election_id`
- `onchain_election_address`
- `organizer_wallet_address`
- 정책/시간/결제 snapshot
- `onchain_state`

를 `onchain_elections`에 채운다.

## 프론트 구현 체크리스트

- `OPEN` election 생성에는 이 API를 호출하지 않는다.
- `PRIVATE` election 생성에만 이 API를 호출한다.
- 응답의 `publicKey.value`는 PEM 문자열이며, 그대로 컨트랙트에 넣지 않는다.
- 응답의 `candidateManifestPreimage`는 정렬/정규화된 canonical 후보 원문이므로, 프론트가 이후 private ballot plaintext를 만들 때도 같은 candidate key 집합을 기준으로 사용해야 한다.
- 이미지 URL은 온체인 hash 대상이 아니므로 `candidateManifestHash` 재계산 시 포함하면 안 된다.
