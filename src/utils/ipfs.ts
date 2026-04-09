import axios from 'axios'
import { keccak256, stringToHex, type Hex } from 'viem'

type PinataFileUploadResponse = {
  IpfsHash: string
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

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const DEFAULT_IPFS_GATEWAY_URL = 'https://gateway.pinata.cloud'

function getPinataJwt() {
  return import.meta.env.VITE_PINATA_JWT
}

function getGatewayBaseUrl() {
  const configured = import.meta.env.VITE_PINATA_GATEWAY_URL?.trim()
  if (!configured) {
    return DEFAULT_IPFS_GATEWAY_URL
  }

  return configured.replace(/\/$/, '')
}

function createBrowserFile(parts: BlobPart[], fileName: string, type: string) {
  return new File(parts, fileName, { type })
}

async function uploadFileForm(file: File): Promise<PinataUploadArtifact | null> {
  const pinataJwt = getPinataJwt()
  if (!pinataJwt) {
    console.warn('VITE_PINATA_JWT is missing. IPFS upload will be skipped.')
    return null
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post<PinataFileUploadResponse>(PINATA_API_URL, formData, {
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
  })

  const cid = response.data.IpfsHash

  return {
    cid,
    uri: `ipfs://${cid}`,
    gatewayUrl: `${getGatewayBaseUrl()}/ipfs/${cid}`,
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
): Promise<PinataJsonUploadArtifact<T> | null> {
  const artifact = createJsonArtifact(fileName, body)
  const uploaded = await uploadFileForm(artifact.file)

  if (!uploaded) {
    return null
  }

  return {
    ...artifact,
    ...uploaded,
  }
}

export async function uploadFileToPinata(file: File): Promise<PinataUploadArtifact | null> {
  return uploadFileForm(file)
}

export function resolveIpfsUrl(uri: string): string {
  if (!uri) return uri
  if (uri.startsWith('ipfs://')) {
    return `${getGatewayBaseUrl()}/ipfs/${uri.replace('ipfs://', '')}`
  }
  return uri
}
