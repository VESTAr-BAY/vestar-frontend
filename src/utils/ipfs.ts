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
