import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('ipfs gateway resolution', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses only configured pinata gateways when env is set', async () => {
    vi.stubEnv('PINATA_GATEWAYS', 'https://chocolate-elegant-otter-530.mypinata.cloud')

    const { resolveReadableIpfsUrls } = await import('./ipfs')

    expect(resolveReadableIpfsUrls('ipfs://QmTestCid')).toEqual([
      'https://chocolate-elegant-otter-530.mypinata.cloud/ipfs/QmTestCid',
    ])
  })

  it('does not append public fallback gateways to the configured list', async () => {
    vi.stubEnv(
      'PINATA_GATEWAYS',
      'https://chocolate-elegant-otter-530.mypinata.cloud,https://gateway.example.com',
    )

    const { resolveReadableIpfsUrls } = await import('./ipfs')

    expect(resolveReadableIpfsUrls('ipfs://QmDefaultCid')).toEqual([
      'https://chocolate-elegant-otter-530.mypinata.cloud/ipfs/QmDefaultCid',
      'https://gateway.example.com/ipfs/QmDefaultCid',
    ])
  })
})
