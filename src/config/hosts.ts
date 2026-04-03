/**
 * Allowlist of host wallet addresses (lowercase).
 * These addresses can access /host/* routes and create votes.
 */
const HOST_ADDRESSES: Set<string> = new Set([
  // Add host wallet addresses here, e.g.:
  // "0xabc123...".toLowerCase(),
]);

export function isHost(address: string | undefined): boolean {
  if (!address) return false;
  return HOST_ADDRESSES.has(address.toLowerCase());
}
