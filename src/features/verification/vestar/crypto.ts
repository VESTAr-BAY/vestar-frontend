import { gcm } from '@noble/ciphers/aes'
import { p256 } from '@noble/curves/p256'
import { sha256 } from '@noble/hashes/sha2'
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
  const plaintext = decryptEcdhP256Aes256GcmEnvelopeJs(envelope, privateKeyPem)
  if (plaintext) {
    return plaintext
  }

  return await decryptEcdhP256Aes256GcmEnvelopeWebCrypto(envelope, privateKeyPem)
}

function decryptEcdhP256Aes256GcmEnvelopeJs(
  envelope: EcdhP256Aes256GcmEnvelope,
  privateKeyPem: string,
): string | null {
  try {
    const privateKeyScalar = extractPkcs8EcPrivateScalar(privateKeyPem)
    const ephemeralPublicKey = extractSpkiEcPublicPoint(base64ToBytes(envelope.ephemeralPublicKey))
    const sharedSecret = p256.getSharedSecret(privateKeyScalar, ephemeralPublicKey, true).slice(1)
    const aesKey = sha256(sharedSecret)
    const decrypted = gcm(aesKey, base64ToBytes(envelope.iv)).decrypt(
      concatBytes(base64ToBytes(envelope.ciphertext), base64ToBytes(envelope.authTag)),
    )

    return bytesToUtf8(decrypted)
  } catch {
    return null
  }
}

async function decryptEcdhP256Aes256GcmEnvelopeWebCrypto(
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

type DerElement = {
  tag: number
  start: number
  end: number
  content: Uint8Array
  nextOffset: number
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

function extractPkcs8EcPrivateScalar(privateKeyPem: string) {
  const topLevelChildren = readDerSequenceChildren(pemToDerBytes(privateKeyPem))
  const privateKeyEnvelope = topLevelChildren.find((element) => element.tag === 0x04)
  if (!privateKeyEnvelope) {
    throw new Error('PKCS#8 private key OCTET STRING is missing')
  }

  const ecPrivateKeyChildren = readDerSequenceChildren(privateKeyEnvelope.content)
  const privateKeyOctet = ecPrivateKeyChildren.find((element) => element.tag === 0x04)
  if (!privateKeyOctet) {
    throw new Error('EC private key OCTET STRING is missing')
  }

  return normalizeP256PrivateScalar(privateKeyOctet.content)
}

function extractSpkiEcPublicPoint(spkiDer: Uint8Array) {
  const topLevelChildren = readDerSequenceChildren(spkiDer)
  const bitString = topLevelChildren.find((element) => element.tag === 0x03)
  if (!bitString || bitString.content.length < 2) {
    throw new Error('SPKI public key BIT STRING is missing')
  }

  if (bitString.content[0] !== 0x00) {
    throw new Error('Unsupported SPKI BIT STRING padding')
  }

  const publicPoint = bitString.content.slice(1)
  if (publicPoint[0] !== 0x04 || publicPoint.length !== 65) {
    throw new Error('Unsupported EC public key point encoding')
  }

  return publicPoint
}

function normalizeP256PrivateScalar(privateScalar: Uint8Array) {
  if (privateScalar.length === 32) {
    return privateScalar
  }

  if (privateScalar.length > 32) {
    return privateScalar.slice(-32)
  }

  const normalized = new Uint8Array(32)
  normalized.set(privateScalar, 32 - privateScalar.length)
  return normalized
}

function readDerSequenceChildren(bytes: Uint8Array) {
  const sequence = readDerElement(bytes, 0)
  if (sequence.tag !== 0x30) {
    throw new Error('Expected ASN.1 SEQUENCE')
  }

  const children: DerElement[] = []
  let offset = sequence.start

  while (offset < sequence.end) {
    const child = readDerElement(bytes, offset)
    children.push(child)
    offset = child.nextOffset
  }

  if (offset !== sequence.end) {
    throw new Error('Invalid ASN.1 SEQUENCE length')
  }

  return children
}

function readDerElement(bytes: Uint8Array, offset: number): DerElement {
  if (offset + 2 > bytes.length) {
    throw new Error('ASN.1 element is truncated')
  }

  const tag = bytes[offset]!
  let length = bytes[offset + 1]!
  let headerLength = 2

  if ((length & 0x80) !== 0) {
    const lengthBytes = length & 0x7f
    if (lengthBytes === 0 || offset + 2 + lengthBytes > bytes.length) {
      throw new Error('Invalid ASN.1 length encoding')
    }

    length = 0
    for (let index = 0; index < lengthBytes; index += 1) {
      length = (length << 8) | bytes[offset + 2 + index]!
    }
    headerLength += lengthBytes
  }

  const start = offset + headerLength
  const end = start + length

  if (end > bytes.length) {
    throw new Error('ASN.1 element overruns the input')
  }

  return {
    tag,
    start,
    end,
    content: bytes.slice(start, end),
    nextOffset: end,
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
