import { hexToBytes, type Address, type Hex } from 'viem'
import type {
  CanonicalBallotPayloadV1,
  EcdhP256Aes256GcmEnvelope,
  EncryptedBallotEnvelope,
  RsaOaepAes256GcmEnvelope,
} from './types'
import {
  base64ToBytes,
  bytesEqual,
  bytesToUtf8,
  concatBytes,
  decodeHexUtf8,
  getCryptoApi,
  isMatchingBallotPayload,
  keccakParts,
  pemToDerBytes,
  toArrayBuffer,
  utf8Bytes,
} from './utils'

export function decryptDemoPrivateSelectionIndex(
  electionId: Hex,
  voterAddress: Address,
  encryptedBallot: Hex | null,
  revealedPrivateKey: Hex,
): number | null {
  if (!encryptedBallot || revealedPrivateKey === '0x') {
    return null
  }

  const ballotBytes = hexToBytes(encryptedBallot)
  const keyBytes = hexToBytes(revealedPrivateKey)

  if (ballotBytes.length === 26 && ballotBytes[0] === 0x02 && keyBytes.length > 0) {
    const expectedSalt = keccakParts(
      utf8Bytes('vestar-demo-private-v2:salt'),
      hexToBytes(electionId),
      hexToBytes(voterAddress),
    ).slice(0, 8)
    const salt = ballotBytes.slice(1, 9)

    if (!bytesEqual(salt, expectedSalt)) {
      return null
    }

    const maskedSelection = ballotBytes[9]
    const stream = keccakParts(utf8Bytes('vestar-demo-private-v2:stream'), keyBytes, salt)
    const expectedTag = keccakParts(
      utf8Bytes('vestar-demo-private-v2:tag'),
      keyBytes,
      salt,
      Uint8Array.of(maskedSelection),
    ).slice(0, 16)
    const providedTag = ballotBytes.slice(10, 26)

    if (!bytesEqual(providedTag, expectedTag)) {
      return null
    }

    return maskedSelection ^ stream[0]
  }

  return null
}

export async function decryptCanonicalBallotPayload(
  electionId: Hex,
  electionAddress: Address,
  voterAddress: Address,
  encryptedBallot: Hex | null,
  revealedPrivateKey: Hex,
): Promise<CanonicalBallotPayloadV1 | null> {
  if (!encryptedBallot || revealedPrivateKey === '0x') {
    return null
  }

  const envelope = parseEncryptedBallotEnvelope(encryptedBallot)
  if (!envelope) {
    return null
  }

  const privateKeyPem = decodeHexUtf8(revealedPrivateKey)
  if (!privateKeyPem) {
    return null
  }

  let plaintext: string | null = null

  if (envelope.algorithm === 'rsa-oaep-aes-256-gcm') {
    plaintext = await decryptRsaOaepAes256GcmEnvelope(envelope, privateKeyPem)
  } else if (envelope.algorithm === 'ecdh-p256-aes-256-gcm') {
    plaintext = await decryptEcdhP256Aes256GcmEnvelope(envelope, privateKeyPem)
  }

  if (!plaintext) {
    return null
  }

  const payload = parseCanonicalBallotPayload(plaintext)
  if (!payload) {
    return null
  }

  if (!isMatchingBallotPayload(payload, electionId, electionAddress, voterAddress)) {
    return null
  }

  return payload
}

export function parseEncryptedBallotEnvelope(encryptedBallot: Hex): EncryptedBallotEnvelope | null {
  try {
    const rawJson = decodeHexUtf8(encryptedBallot)
    if (!rawJson) {
      return null
    }

    const parsed = JSON.parse(rawJson) as Partial<EncryptedBallotEnvelope>
    if (
      parsed.algorithm === 'rsa-oaep-aes-256-gcm' &&
      typeof parsed.encryptedKey === 'string' &&
      typeof parsed.iv === 'string' &&
      typeof parsed.authTag === 'string' &&
      typeof parsed.ciphertext === 'string'
    ) {
      return parsed as RsaOaepAes256GcmEnvelope
    }

    if (
      parsed.algorithm === 'ecdh-p256-aes-256-gcm' &&
      typeof parsed.ephemeralPublicKey === 'string' &&
      typeof parsed.iv === 'string' &&
      typeof parsed.authTag === 'string' &&
      typeof parsed.ciphertext === 'string'
    ) {
      return parsed as EcdhP256Aes256GcmEnvelope
    }
  } catch {
    return null
  }

  return null
}

async function decryptRsaOaepAes256GcmEnvelope(
  envelope: RsaOaepAes256GcmEnvelope,
  privateKeyPem: string,
): Promise<string | null> {
  try {
    const cryptoApi = getCryptoApi()
    const privateKey = await cryptoApi.subtle.importKey(
      'pkcs8',
      pemToDerBytes(privateKeyPem),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt'],
    )
    const symmetricKey = await cryptoApi.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      base64ToBytes(envelope.encryptedKey),
    )

    return await decryptAes256GcmPayload(
      new Uint8Array(symmetricKey),
      envelope.iv,
      envelope.authTag,
      envelope.ciphertext,
    )
  } catch {
    return null
  }
}

async function decryptEcdhP256Aes256GcmEnvelope(
  envelope: EcdhP256Aes256GcmEnvelope,
  privateKeyPem: string,
): Promise<string | null> {
  try {
    const cryptoApi = getCryptoApi()
    const privateKey = await cryptoApi.subtle.importKey(
      'pkcs8',
      pemToDerBytes(privateKeyPem),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveBits'],
    )
    const ephemeralPublicKey = await cryptoApi.subtle.importKey(
      'spki',
      base64ToBytes(envelope.ephemeralPublicKey),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      [],
    )
    const sharedSecret = await cryptoApi.subtle.deriveBits(
      { name: 'ECDH', public: ephemeralPublicKey },
      privateKey,
      256,
    )
    const aesKey = new Uint8Array(await cryptoApi.subtle.digest('SHA-256', sharedSecret))

    return await decryptAes256GcmPayload(aesKey, envelope.iv, envelope.authTag, envelope.ciphertext)
  } catch {
    return null
  }
}

async function decryptAes256GcmPayload(
  aesKeyBytes: Uint8Array,
  ivBase64: string,
  authTagBase64: string,
  ciphertextBase64: string,
): Promise<string | null> {
  try {
    const cryptoApi = getCryptoApi()
    const aesKey = await cryptoApi.subtle.importKey(
      'raw',
      toArrayBuffer(aesKeyBytes),
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    )
    const ciphertext = base64ToBytes(ciphertextBase64)
    const authTag = base64ToBytes(authTagBase64)
    const encrypted = concatBytes(ciphertext, authTag)
    const plaintext = await cryptoApi.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToBytes(ivBase64),
        tagLength: 128,
      },
      aesKey,
      encrypted,
    )

    return bytesToUtf8(new Uint8Array(plaintext))
  } catch {
    return null
  }
}

function parseCanonicalBallotPayload(plaintext: string): CanonicalBallotPayloadV1 | null {
  try {
    const parsed = JSON.parse(plaintext) as CanonicalBallotPayloadV1
    if (!Array.isArray(parsed.candidateKeys) || parsed.candidateKeys.length === 0) {
      return null
    }

    const candidateKeys = parsed.candidateKeys.filter(
      (candidateKey): candidateKey is string =>
        typeof candidateKey === 'string' && candidateKey.trim().length > 0,
    )
    if (candidateKeys.length === 0) {
      return null
    }

    return {
      ...parsed,
      candidateKeys,
    }
  } catch {
    return null
  }
}
