import type { Address } from 'viem'
import { LOG_BLOCK_CHUNK_SIZE, publicClient } from './constants'

export async function getLogsChunked<TLog>({
  address,
  event,
  fromBlock,
  toBlock,
}: {
  address: Address
  event: unknown
  fromBlock: bigint | 'earliest'
  toBlock: bigint | 'latest'
}) {
  if (fromBlock === 'earliest') {
    return (await publicClient.getLogs({
      address,
      event: event as never,
      fromBlock,
      toBlock,
    })) as TLog[]
  }

  const latestBlock = toBlock === 'latest' ? await publicClient.getBlockNumber() : toBlock
  if (fromBlock > latestBlock) {
    return [] as TLog[]
  }

  const logs: TLog[] = []
  let cursor = fromBlock

  while (cursor <= latestBlock) {
    const chunkEnd =
      cursor + LOG_BLOCK_CHUNK_SIZE > latestBlock ? latestBlock : cursor + LOG_BLOCK_CHUNK_SIZE
    const chunkLogs = (await publicClient.getLogs({
      address,
      event: event as never,
      fromBlock: cursor,
      toBlock: chunkEnd,
    })) as TLog[]

    logs.push(...chunkLogs)
    cursor = chunkEnd + 1n
  }

  return logs
}
