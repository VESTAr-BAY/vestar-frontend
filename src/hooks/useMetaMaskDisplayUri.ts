import { useCallback, useEffect, useState } from 'react'
import { useConnect } from 'wagmi'

interface ConnectorMessage {
  data?: unknown
  type?: string
}

interface ConnectorEmitter {
  off: (eventName: string, listener: (message: ConnectorMessage) => void) => void
  on: (eventName: string, listener: (message: ConnectorMessage) => void) => void
}

export function useMetaMaskDisplayUri() {
  const { connectors } = useConnect()
  const [displayUri, setDisplayUri] = useState<string | null>(null)

  useEffect(() => {
    const metaMaskConnector = connectors.find((connector) => connector.id === 'metaMaskSDK')
    if (!metaMaskConnector) return

    const emitter = metaMaskConnector.emitter as unknown as ConnectorEmitter

    const handleMessage = (message: ConnectorMessage) => {
      if (message.type !== 'display_uri' || typeof message.data !== 'string') return
      if (message.data.trim().length === 0) return
      setDisplayUri(message.data)
    }

    emitter.on('message', handleMessage)
    return () => {
      emitter.off('message', handleMessage)
    }
  }, [connectors])

  const resetDisplayUri = useCallback(() => {
    setDisplayUri(null)
  }, [])

  return {
    displayUri,
    resetDisplayUri,
  }
}
