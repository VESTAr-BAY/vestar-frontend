import { describe, expect, it } from 'vitest'
import { mapWithConcurrency, scheduleVerificationRpc } from './rpc'

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

describe('mapWithConcurrency', () => {
  it('preserves input order while limiting concurrent work', async () => {
    let active = 0
    let maxActive = 0

    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await wait(5)
      active -= 1
      return value * 10
    })

    expect(results).toEqual([10, 20, 30, 40, 50])
    expect(maxActive).toBeLessThanOrEqual(2)
  })
})

describe('scheduleVerificationRpc', () => {
  it('retries rate-limited requests and eventually resolves', async () => {
    let attempts = 0

    const result = await scheduleVerificationRpc(async () => {
      attempts += 1

      if (attempts < 3) {
        throw new Error('429 Too Many Requests')
      }

      return 'ok'
    })

    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })

  it('does not retry non-rate-limit errors', async () => {
    let attempts = 0

    await expect(
      scheduleVerificationRpc(async () => {
        attempts += 1
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')

    expect(attempts).toBe(1)
  })
})
