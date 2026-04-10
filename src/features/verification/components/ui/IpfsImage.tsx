import { type ImgHTMLAttributes, useEffect, useMemo, useState } from 'react'
import { resolveReadableIpfsUrls } from '../../../../utils/ipfs'

type IpfsImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  uri: string
}

export function IpfsImage({ uri, alt = '', onError, ...props }: IpfsImageProps) {
  const sources = useMemo(() => resolveReadableIpfsUrls(uri), [uri])
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [uri])

  if (!uri || sources.length === 0) {
    return null
  }

  return (
    <img
      {...props}
      alt={alt}
      src={sources[sourceIndex]}
      onError={(event) => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((current) => current + 1)
          return
        }

        onError?.(event)
      }}
    />
  )
}
