import axios from 'axios'
import { keccak256, stringToHex, type Hex } from 'viem'

type PinataFileUploadResponse =
  | {
      data?: {
        cid?: string
      }
    }
  | {
      IpfsHash?: string
    }

type VerifyUploadArgs = {
  uri: string
  expectedJsonHash?: Hex
}

export type JsonArtifact<T> = {
  body: T
  file: File
  rawJson: string
  hash: Hex
}

export type PinataUploadArtifact = {
  cid: string
  uri: string
  gatewayUrl: string
}

export type PinataJsonUploadArtifact<T> = PinataUploadArtifact & {
  body: T
  rawJson: string
  hash: Hex
}

export const PINATA_GATEWAY_URL = 'https://chocolate-elegant-otter-530.mypinata.cloud'

const PINATA_API_URL = 'https://uploads.pinata.cloud/v3/files'
const VERIFY_RETRY_COUNT = 8
const VERIFY_RETRY_DELAY_MS = 1_500

function sleep(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

function normalizeGatewayUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, '')
  if (!trimmed) {
    return ''
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `https://${trimmed}`
}

function getPinataJwt() {
  const value =
    (import.meta.env.VITE_PINATA_JWT as string | undefined) ||
    (import.meta.env.PINATA_JWT as string | undefined) ||
    ''

  if (!value.trim()) {
    throw new Error('PINATA_JWT 설정이 없어서 IPFS 업로드를 진행할 수 없습니다.')
  }

  return value.trim()
}

function getConfiguredPinataGateways() {
  const configured = (
    (import.meta.env.VITE_PINATA_GATEWAY_URL as string | undefined) ||
    (import.meta.env.PINATA_GATEWAYS as string | undefined) ||
    ''
  )
    .split(',')
    .map(normalizeGatewayUrl)
    .filter(Boolean)

  if (configured.length > 0) {
    return configured
  }

  return [PINATA_GATEWAY_URL]
}

function getGatewayBaseUrl() {
  return getConfiguredPinataGateways()[0]
}

export function resolveIpfsUrls(uri: string): string[] {
  if (!uri) return [uri]
  if (!uri.startsWith('ipfs://')) {
    return [uri]
  }

  const cid = uri.replace('ipfs://', '')
  return getConfiguredPinataGateways().map((gateway) => `${gateway}/ipfs/${cid}`)
}

function createBrowserFile(parts: BlobPart[], fileName: string, type: string) {
  return new File(parts, fileName, { type })
}

function extractPinataCid(payload: PinataFileUploadResponse) {
  if ('data' in payload && payload.data?.cid) {
    return payload.data.cid
  }

  if ('IpfsHash' in payload && payload.IpfsHash) {
    return payload.IpfsHash
  }

  throw new Error('Pinata 업로드 응답에서 CID를 찾지 못했습니다.')
}

function toPinataUploadError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      return new Error(
        'Pinata 업로드 권한이 거부되었습니다. PINATA_JWT 권한과 업로드 설정을 확인해 주세요.',
      )
    }

    if (typeof error.response?.data === 'string' && error.response.data.trim()) {
      return new Error(`Pinata 업로드에 실패했습니다. ${error.response.data}`)
    }

    if (error.message) {
      return new Error(`Pinata 업로드에 실패했습니다. ${error.message}`)
    }
  }

  return error instanceof Error ? error : new Error('Pinata 업로드에 실패했습니다.')
}

function buildNoStoreUrl(url: string, attempt: number) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}vestar_verify=${Date.now()}_${attempt}`
}

async function verifyUploadedIpfsArtifact({
  uri,
  expectedJsonHash,
}: VerifyUploadArgs): Promise<string> {
  const gatewayUrl = resolveIpfsUrl(uri)
  let lastError: unknown = null

  for (let attempt = 0; attempt < VERIFY_RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(buildNoStoreUrl(gatewayUrl, attempt), {
        cache: 'no-store',
      })

      if (response.ok) {
        if (expectedJsonHash) {
          const body = await response.text()
          if (keccak256(stringToHex(body)) === expectedJsonHash) {
            return gatewayUrl
          }
        } else {
          const blob = await response.blob()
          if (blob.size > 0) {
            return gatewayUrl
          }
        }
      }
    } catch (error) {
      lastError = error
    }

    await sleep(VERIFY_RETRY_DELAY_MS)
  }

  if (expectedJsonHash) {
    throw new Error('IPFS 메타데이터 업로드 확인에 실패했습니다.')
  }

  throw new Error(
    lastError instanceof Error
      ? `IPFS 이미지 업로드 확인에 실패했습니다. ${lastError.message}`
      : 'IPFS 이미지 업로드 확인에 실패했습니다.',
  )
}

async function uploadFileForm(file: File): Promise<PinataUploadArtifact> {
  const formData = new FormData()
  formData.append('network', 'public')
  formData.append('file', file)
  formData.append('name', file.name)

  try {
    const response = await axios.post<PinataFileUploadResponse>(PINATA_API_URL, formData, {
      headers: {
        Authorization: `Bearer ${getPinataJwt()}`,
      },
    })

    const cid = extractPinataCid(response.data)

    return {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `${getGatewayBaseUrl()}/ipfs/${cid}`,
    }
  } catch (error) {
    throw toPinataUploadError(error)
  }
}

export function createJsonArtifact<T>(fileName: string, body: T): JsonArtifact<T> {
  const rawJson = JSON.stringify(body, null, 2)

  return {
    body,
    file: createBrowserFile([rawJson], fileName, 'application/json'),
    rawJson,
    hash: keccak256(stringToHex(rawJson)),
  }
}

export async function uploadJsonArtifactToPinata<T>(
  fileName: string,
  body: T,
): Promise<PinataJsonUploadArtifact<T>> {
  const artifact = createJsonArtifact(fileName, body)
  const uploaded = await uploadFileForm(artifact.file)

  await verifyUploadedIpfsArtifact({
    uri: uploaded.uri,
    expectedJsonHash: artifact.hash,
  })

  return {
    ...artifact,
    ...uploaded,
  }
}

export async function uploadFileToPinata(file: File): Promise<PinataUploadArtifact> {
  const uploaded = await uploadFileForm(file)

  await verifyUploadedIpfsArtifact({
    uri: uploaded.uri,
  })

  return uploaded
}

export function resolveIpfsUrl(uri: string): string {
  return resolveIpfsUrls(uri)[0]
}
