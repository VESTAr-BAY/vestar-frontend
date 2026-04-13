import { type Address, getAddress, type Hex, toHex } from 'viem'
import { vestarStatusTestnetChain } from './chain'

interface CanonicalBallotPayloadV1 {
  schemaVersion: 1
  electionId: Hex
  chainId: number
  electionAddress: Address
  voterAddress: Address
  candidateKeys: string[]
  nonce: Hex
}

interface EncryptPrivateBallotInput {
  electionId: Hex
  electionAddress: Address
  electionPublicKey: Hex
  voterAddress: Address
  candidateKeys: string[]
}

interface EcdhP256Aes256GcmEnvelope {
  algorithm: 'ecdh-p256-aes-256-gcm'
  ephemeralPublicKey: string
  iv: string
  authTag: string
  ciphertext: string
}

// sungje : PRIVATE ballot은 백엔드 문서의 canonical payload 순서를 그대로 고정
function serializeCanonicalBallotPayload(payload: CanonicalBallotPayloadV1) {
  return JSON.stringify({
    schemaVersion: payload.schemaVersion,
    electionId: payload.electionId,
    chainId: payload.chainId,
    electionAddress: payload.electionAddress,
    voterAddress: payload.voterAddress,
    candidateKeys: payload.candidateKeys,
    nonce: payload.nonce,
  })
}

function getCryptoApi() {
  if (typeof globalThis.crypto === 'undefined') {
    throw new Error('Web Crypto API is unavailable')
  }

  return globalThis.crypto
}

function utf8Bytes(value: string) {
  return new TextEncoder().encode(value)
}

function decodeHexUtf8(value: Hex) {
  try {
    return new TextDecoder().decode(hexToBytes(value)).replace(/\0+$/g, '').trim()
  } catch {
    return null
  }
}

function hexToBytes(value: Hex) {
  const hex = value.slice(2)
  const output = new Uint8Array(hex.length / 2)

  for (let index = 0; index < output.length; index += 1) {
    output[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }

  return output
}

function bytesToBase64(value: Uint8Array) {
  let binary = ''
  value.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return globalThis.btoa(binary)
}

function pemToDerBytes(pem: string) {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  const binary = globalThis.atob(body)
  const output = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index)
  }

  return output
}

function randomNonceHex() {
  const bytes = getCryptoApi().getRandomValues(new Uint8Array(16))
  let output = '0x'

  bytes.forEach((byte) => {
    output += byte.toString(16).padStart(2, '0')
  })

  return output as Hex
}

export async function encryptPrivateBallot({
  electionId,
  electionAddress,
  electionPublicKey,
  voterAddress,
  candidateKeys,
}: EncryptPrivateBallotInput): Promise<Hex> {
  const publicKeyPem = decodeHexUtf8(electionPublicKey)
  if (!publicKeyPem) {
    throw new Error('Private election public key is missing')
  }

  const cryptoApi = getCryptoApi()
  const importedElectionPublicKey = await cryptoApi.subtle.importKey(
    'spki',
    pemToDerBytes(publicKeyPem),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  const ephemeralKeyPair = await cryptoApi.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )
  const sharedSecret = await cryptoApi.subtle.deriveBits(
    { name: 'ECDH', public: importedElectionPublicKey },
    ephemeralKeyPair.privateKey,
    256,
  )
  const aesKeyBytes = new Uint8Array(await cryptoApi.subtle.digest('SHA-256', sharedSecret))
  const aesKey = await cryptoApi.subtle.importKey('raw', aesKeyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
  ])

  const iv = cryptoApi.getRandomValues(new Uint8Array(12))
  const payload = serializeCanonicalBallotPayload({
    schemaVersion: 1,
    electionId,
    chainId: vestarStatusTestnetChain.id,
    electionAddress: getAddress(electionAddress),
    voterAddress: getAddress(voterAddress),
    candidateKeys,
    nonce: randomNonceHex(),
  })
  const encrypted = new Uint8Array(
    await cryptoApi.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      aesKey,
      utf8Bytes(payload),
    ),
  )
  const authTagLength = 16
  const ciphertext = encrypted.slice(0, -authTagLength)
  const authTag = encrypted.slice(-authTagLength)
  const ephemeralPublicKey = new Uint8Array(
    await cryptoApi.subtle.exportKey('spki', ephemeralKeyPair.publicKey),
  )

  const envelope: EcdhP256Aes256GcmEnvelope = {
    algorithm: 'ecdh-p256-aes-256-gcm',
    ephemeralPublicKey: bytesToBase64(ephemeralPublicKey),
    iv: bytesToBase64(iv),
    authTag: bytesToBase64(authTag),
    ciphertext: bytesToBase64(ciphertext),
  }

  return toHex(JSON.stringify(envelope))
}
