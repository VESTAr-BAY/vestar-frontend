import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { getAddress, toHex } from 'viem'
import { vestarStatusTestnetChain } from '../../../contracts/vestar/chain'
import { encryptBallotWithPublicKey, randomNonceHex } from '../../../utils/privateBallot'
import { decryptCanonicalBallotPayload } from './crypto'

describe('decryptCanonicalBallotPayload', () => {
  it('accepts decrypted payloads even when the expected addresses are lowercased', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    })

    const electionId = '0x1111111111111111111111111111111111111111111111111111111111111111' as const
    const checksummedElectionAddress = getAddress('0x88297833b1b316272d182541337f87d7dab25f01')
    const checksummedVoterAddress = getAddress('0xafEdA9845D663bCdC295d98E798CB024f5B76ca1')
    const encryptedBallot = await encryptBallotWithPublicKey({
      publicKeyPem: publicKey.toString(),
      payload: {
        schemaVersion: 1,
        electionId,
        chainId: vestarStatusTestnetChain.id,
        electionAddress: checksummedElectionAddress,
        voterAddress: checksummedVoterAddress,
        candidateKeys: ['candidate-a'],
        nonce: randomNonceHex(),
      },
    })

    const decrypted = await decryptCanonicalBallotPayload(
      electionId,
      checksummedElectionAddress.toLowerCase() as `0x${string}`,
      checksummedVoterAddress.toLowerCase() as `0x${string}`,
      encryptedBallot,
      toHex(privateKey.toString()),
    )

    expect(decrypted).not.toBeNull()
    expect(decrypted?.candidateKeys).toEqual(['candidate-a'])
    expect(decrypted?.electionAddress).toBe(checksummedElectionAddress)
    expect(decrypted?.voterAddress).toBe(checksummedVoterAddress)
  })

  it('decrypts recorded private ballots with canonical candidate keys', async () => {
    const electionId = '0xa01d236533d63e4a96139e71c91a91308ba95de1f0d7e0d02f48e01efe55fae5' as const
    const electionAddress = getAddress('0x885AC0b0850bBDF93827b65a0bfaD2112424DCf7')
    const voterAddress = getAddress('0x81c2C42BD4A2a5F08f70E4e69E7edf790A815CDC')
    const encryptedBallot =
      '0x7b22616c676f726974686d223a22656364682d703235362d6165732d3235362d67636d222c22657068656d6572616c5075626c69634b6579223a224d466b77457759484b6f5a497a6a3043415159494b6f5a497a6a304441516344516741456856364f7a767a56336353553177796e6c4d6e6736636361437266684e625963526754764f676c703561524755772f6730736445787430374d426546634f442f5a615750777a4669425554644562374d566a503670673d3d222c226976223a224579556745704758462b4b2b544b646e222c2261757468546167223a223271727762704f7a4f6d434d6a374151586379516a513d3d222c2263697068657274657874223a224b482f3357582f394a4e6a733431617157565a55334a42342f774b714658397664514870434b3351424b4b6f594f4d444a3654597977336b50344259362b784b6e4a655274724b3755525637434f6a7944393274325a70576845785873584175304a662b396d382b52726176534e31307063724e396c54724254465a6c6168354b30485a38764966506b6e4344437a5a59654f5649396c4d6a662f6958337a4d4a5445334f7978694b454c3158653764424749473439784538476a50594856543379654d43453942696f346f6974424c6c7654754c4c754f676131394564686b396f4b65425a6e6a765a6979737a4c5269346c5544376c756e796971785a75374b726d76355264696f46744a46627a487a6963424d316368335a656d515a464532417a46545933435a7972592f6f344a507774506a52735669596979414b6235614f397a50363275584f79634c74396b47587369737a43524f4a6255502b572f33556578526e35626c5366326c4c67614d424a58524b3935567359526f616668576a38615467516579492b342f6e615841362f62417643656a364b4139374b5a587678744c6e654758645862677948505a54556147434459675076593364623733306d795a495a7a327a4c3052597733384d596c4c5441394142453d227d' as const
    const revealedPrivateKey =
      '0x2d2d2d2d2d424547494e2050524956415445204b45592d2d2d2d2d0a4d494748416745414d424d4742797147534d34394167454743437147534d343941774548424730776177494241515167635547694b4f7071315a324a416270610a662f6c472b4f62745569594f4a306644446b6e65534666625853326852414e4341415242764f4851616a554333477248463276506b4b384534355073457867770a746753536667776a35684737734a5754477055364f342f45346634316e5145324b3077686b50365854633147746a536e757341464c5531580a2d2d2d2d2d454e442050524956415445204b45592d2d2d2d2d0a' as const

    const decrypted = await decryptCanonicalBallotPayload(
      electionId,
      electionAddress,
      voterAddress,
      encryptedBallot,
      revealedPrivateKey,
    )

    expect(decrypted).not.toBeNull()
    expect(decrypted?.candidateKeys).toEqual(['후보', '후2'])
    expect(decrypted?.electionAddress).toBe(electionAddress)
    expect(decrypted?.voterAddress).toBe(voterAddress)
  })

  it('encrypts ballots even when Web Crypto subtle is unavailable', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    })

    const originalCrypto = globalThis.crypto
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto),
      },
    })

    try {
      const electionId =
        '0x2222222222222222222222222222222222222222222222222222222222222222' as const
      const electionAddress = getAddress('0x88297833b1b316272d182541337f87d7dab25f01')
      const voterAddress = getAddress('0xafEdA9845D663bCdC295d98E798CB024f5B76ca1')
      const encryptedBallot = await encryptBallotWithPublicKey({
        publicKeyPem: publicKey.toString(),
        payload: {
          schemaVersion: 1,
          electionId,
          chainId: vestarStatusTestnetChain.id,
          electionAddress,
          voterAddress,
          candidateKeys: ['candidate-a', 'candidate-b'],
          nonce: randomNonceHex(),
        },
      })

      const decrypted = await decryptCanonicalBallotPayload(
        electionId,
        electionAddress,
        voterAddress,
        encryptedBallot,
        toHex(privateKey.toString()),
      )

      expect(decrypted).not.toBeNull()
      expect(decrypted?.candidateKeys).toEqual(['candidate-a', 'candidate-b'])
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: originalCrypto,
      })
    }
  })
})
