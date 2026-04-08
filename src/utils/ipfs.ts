const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

/**
 * Resolves an IPFS URI or HTTP URL to a fetchable URL.
 * ipfs://CID  → https://gateway.pinata.cloud/ipfs/CID
 * https://... → returned as-is
 */
export function resolveIpfsUrl(uri: string): string {
  if (!uri) return uri
  if (uri.startsWith('ipfs://')) return uri.replace('ipfs://', IPFS_GATEWAY)
  return uri
}
