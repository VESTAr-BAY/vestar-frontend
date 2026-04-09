import axios from 'axios'

export async function uploadJsonToPinata(jsonData: any): Promise<string> {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT
  if (!pinataJwt) {
    console.warn('VITE_PINATA_JWT is missing. IPFS upload will be skipped.')
    return ''
  }

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', jsonData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pinataJwt}`,
      },
    })
    return `ipfs://${res.data.IpfsHash}`
  } catch (error) {
    console.error('Failed to upload to Pinata:', error)
    throw new Error('Failed to upload to Pinata IPFS')
  }
}

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

/**
 * Resolves an IPFS URI or HTTP URL to a fetchable URL.
 * ipfs://CID  → https://gateway.pinata.cloud/ipfs/CID
 * https://... → returned as-is
 
 이 분엣 일단 겹치는 건 딱히 없는듯. 그래서 만약 build랑 그런 거 안되면 ai돌려주3
 */
export function resolveIpfsUrl(uri: string): string {
  if (!uri) return uri
  if (uri.startsWith('ipfs://')) return uri.replace('ipfs://', IPFS_GATEWAY)
  return uri
}
