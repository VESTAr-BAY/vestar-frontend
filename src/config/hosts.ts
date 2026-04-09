/**
 * Allowlist of host wallet addresses (lowercase).
 * These addresses can access /host/* routes and create votes.
 */
const HOST_ADDRESSES: Set<string> = new Set([
  '0x19462D8199e41924D47EfECa0DBc7B8294d30103'.toLowerCase(),
])

export function isHost(address: string | undefined): boolean {
  if (!address) return false
  return HOST_ADDRESSES.has(address.toLowerCase())
}
