import { gcm } from '@noble/ciphers/aes'
import { p256 } from '@noble/curves/p256'
import { sha256 } from '@noble/hashes/sha2'
import { hexToBytes, toBytes, toHex } from 'viem'

export interface PrivateBallotPayload {
  schemaVersion: number
  electionId: string
  chainId: number
  electionAddress: string
  voterAddress: string
  candidateKeys: string[]
  nonce: `0x${string}`
}

function pemToDerBytes(pem: string) {
  const pemBody = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replaceAll(/\s+/g, '')

  return Uint8Array.from(atob(pemBody), (char) => char.charCodeAt(0))
}

export async function encryptBallotWithPublicKey(args: {
  publicKeyPem: string
  payload: PrivateBallotPayload
}) {
  const recipientPublicPoint = extractSpkiEcPublicPoint(pemToDerBytes(args.publicKeyPem))
  const ephemeralPrivateKey = normalizeP256PrivateScalar(p256.utils.randomSecretKey())
  const ephemeralPublicKeySpki = encodeSpkiEcPublicPoint(
    p256.getPublicKey(ephemeralPrivateKey, false),
  )
  const sharedSecret = p256.getSharedSecret(ephemeralPrivateKey, recipientPublicPoint, true).slice(1)
  const symmetricKeyBytes = sha256(sharedSecret)
  const iv = randomBytes(12)
  const plaintextBytes = new TextEncoder().encode(JSON.stringify(args.payload))
  const encryptedPayload = gcm(symmetricKeyBytes, iv).encrypt(plaintextBytes)
  const ciphertext = encryptedPayload.slice(0, -16)
  const authTag = encryptedPayload.slice(-16)

  const envelope = {
    algorithm: 'ecdh-p256-aes-256-gcm',
    ephemeralPublicKey: bytesToBase64(ephemeralPublicKeySpki),
    iv: bytesToBase64(iv),
    authTag: bytesToBase64(authTag),
    ciphertext: bytesToBase64(ciphertext),
  }

  return toHex(toBytes(JSON.stringify(envelope)))
}

export function randomNonceHex() {
  return toHex(randomBytes(32))
}

export function pemToHexBytes(pem: string) {
  return toHex(pemToDerBytes(pem))
}

export function hexJsonToString(hexValue: `0x${string}`) {
  return new TextDecoder().decode(hexToBytes(hexValue))
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

const P256_SPKI_PREFIX = Uint8Array.from([
  0x30,
  0x59,
  0x30,
  0x13,
  0x06,
  0x07,
  0x2a,
  0x86,
  0x48,
  0xce,
  0x3d,
  0x02,
  0x01,
  0x06,
  0x08,
  0x2a,
  0x86,
  0x48,
  0xce,
  0x3d,
  0x03,
  0x01,
  0x07,
  0x03,
  0x42,
  0x00,
])

type DerElement = {
  tag: number
  start: number
  end: number
  content: Uint8Array
  nextOffset: number
}

function randomBytes(length: number) {
  const output = new Uint8Array(length)

  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(output)
    return output
  }

  let offset = 0
  while (offset < length) {
    const chunk = p256.utils.randomSecretKey()
    const nextLength = Math.min(chunk.length, length - offset)
    output.set(chunk.slice(0, nextLength), offset)
    offset += nextLength
  }

  return output
}

function encodeSpkiEcPublicPoint(publicPoint: Uint8Array) {
  if (publicPoint[0] !== 0x04 || publicPoint.length !== 65) {
    throw new Error('Unsupported EC public key point encoding')
  }

  const output = new Uint8Array(P256_SPKI_PREFIX.length + publicPoint.length)
  output.set(P256_SPKI_PREFIX, 0)
  output.set(publicPoint, P256_SPKI_PREFIX.length)
  return output
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
