const MAX_VERIFICATION_RPC_CONCURRENCY = 2
const RATE_LIMIT_RETRY_DELAYS_MS = [250, 600, 1_200] as const

let activeVerificationRpcCount = 0
const verificationRpcQueue: Array<() => void> = []

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function acquireVerificationRpcSlot() {
  if (activeVerificationRpcCount < MAX_VERIFICATION_RPC_CONCURRENCY) {
    activeVerificationRpcCount += 1
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    verificationRpcQueue.push(() => {
      activeVerificationRpcCount += 1
      resolve()
    })
  })
}

function releaseVerificationRpcSlot() {
  activeVerificationRpcCount = Math.max(0, activeVerificationRpcCount - 1)
  const next = verificationRpcQueue.shift()
  next?.()
}

function isVerificationRpcRateLimitError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('429') ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    message.includes('rate-limit')
  )
}

export async function scheduleVerificationRpc<T>(request: () => Promise<T>): Promise<T> {
  let attempt = 0

  while (true) {
    await acquireVerificationRpcSlot()

    let shouldRetry = false
    let retryDelay = 0

    try {
      return await request()
    } catch (error) {
      if (
        isVerificationRpcRateLimitError(error) &&
        attempt < RATE_LIMIT_RETRY_DELAYS_MS.length
      ) {
        shouldRetry = true
        retryDelay = RATE_LIMIT_RETRY_DELAYS_MS[attempt] ?? RATE_LIMIT_RETRY_DELAYS_MS.at(-1) ?? 0
        attempt += 1
      } else {
        throw error
      }
    } finally {
      releaseVerificationRpcSlot()
    }

    if (!shouldRetry) {
      break
    }

    await sleep(retryDelay)
  }

  throw new Error('Verification RPC request failed unexpectedly.')
}

export async function mapWithConcurrency<TInput, TOutput>(
  items: readonly TInput[],
  limit: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
) {
  if (items.length === 0) {
    return [] as TOutput[]
  }

  const results = new Array<TOutput>(items.length)
  let nextIndex = 0
  const workerCount = Math.max(1, Math.min(limit, items.length))

  async function worker() {
    while (true) {
      const currentIndex = nextIndex
      nextIndex += 1

      if (currentIndex >= items.length) {
        return
      }

      results[currentIndex] = await mapper(items[currentIndex]!, currentIndex)
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}
