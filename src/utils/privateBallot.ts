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
  const recipientPublicKey = await crypto.subtle.importKey(
    'spki',
    pemToDerBytes(args.publicKeyPem),
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    [],
  )

  const ephemeralKeyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveBits'],
  )

  const sharedSecret = await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: recipientPublicKey,
    },
    ephemeralKeyPair.privateKey,
    256,
  )

  const symmetricKeyBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', sharedSecret))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const aesKey = await crypto.subtle.importKey(
    'raw',
    symmetricKeyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  )

  const plaintextBytes = new TextEncoder().encode(JSON.stringify(args.payload))
  const encryptedPayload = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      plaintextBytes,
    ),
  )

  const ciphertext = encryptedPayload.slice(0, -16)
  const authTag = encryptedPayload.slice(-16)
  const ephemeralPublicKeySpki = new Uint8Array(
    await crypto.subtle.exportKey('spki', ephemeralKeyPair.publicKey),
  )

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
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
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
