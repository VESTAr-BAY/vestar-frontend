import { useCallback, useState } from 'react'
import type { StatusFeePreview } from '../utils/statusFee'

interface StatusFeePromptConfig {
  title: string
  description: string
  note?: string | ((preview: StatusFeePreview) => string)
  estimate: () => Promise<StatusFeePreview>
  proceed: () => Promise<void>
}

interface StatusFeePromptState {
  title: string
  description: string
  note?: string
  estimate: () => Promise<StatusFeePreview>
  proceed: () => Promise<void>
  preview: StatusFeePreview
}

export function useStatusFeePrompt(onError?: (error: unknown) => void) {
  const [prompt, setPrompt] = useState<StatusFeePromptState | null>(null)
  const [busyAction, setBusyAction] = useState<'recheck' | 'proceed' | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)

  const openForAction = useCallback(
    async (config: StatusFeePromptConfig) => {
      setIsEstimating(true)

      try {
        const preview = await config.estimate()

        console.info('[StatusFee] prompt estimate result', {
          title: config.title,
          isGasless: preview.isGasless,
          transactionCount: preview.transactionCount,
          totalEstimatedFee: preview.totalEstimatedFee.toString(),
        })

        // preview.isGasless = false // [StatusFee] test

        if (preview.isGasless) {
          console.info('[StatusFee] proceeding without prompt because estimate is gasless', {
            title: config.title,
          })
          await config.proceed()
          return
        }

        console.info('[StatusFee] opening premium fee prompt', {
          title: config.title,
        })
        const note = typeof config.note === 'function' ? config.note(preview) : config.note

        setPrompt({
          ...config,
          note,
          preview,
        })
      } catch (error) {
        onError?.(error)
      } finally {
        setIsEstimating(false)
      }
    },
    [onError],
  )

  const closePrompt = useCallback(() => {
    if (busyAction) {
      return
    }

    setPrompt(null)
  }, [busyAction])

  const handleRecheck = useCallback(async () => {
    if (!prompt) {
      return
    }

    setBusyAction('recheck')

    try {
      const nextPreview = await prompt.estimate()

      console.info('[StatusFee] recheck result', {
        title: prompt.title,
        isGasless: nextPreview.isGasless,
        transactionCount: nextPreview.transactionCount,
        totalEstimatedFee: nextPreview.totalEstimatedFee.toString(),
      })

      if (nextPreview.isGasless) {
        const proceed = prompt.proceed
        setPrompt(null)
        console.info('[StatusFee] recheck turned gasless, proceeding now', {
          title: prompt.title,
        })
        await proceed()
        return
      }

      setPrompt((current) => (current ? { ...current, preview: nextPreview } : current))
    } catch (error) {
      onError?.(error)
    } finally {
      setBusyAction(null)
    }
  }, [onError, prompt])

  const handleProceed = useCallback(async () => {
    if (!prompt) {
      return
    }

    setBusyAction('proceed')

    try {
      const nextPreview = await prompt.estimate()
      const proceed = prompt.proceed

      console.info('[StatusFee] proceed confirmation estimate result', {
        title: prompt.title,
        isGasless: nextPreview.isGasless,
        transactionCount: nextPreview.transactionCount,
        totalEstimatedFee: nextPreview.totalEstimatedFee.toString(),
      })

      setPrompt(null)

      console.info('[StatusFee] continuing to wallet flow after latest estimate', {
        title: prompt.title,
        isGasless: nextPreview.isGasless,
      })
      await proceed()
    } catch (error) {
      onError?.(error)
    } finally {
      setBusyAction(null)
    }
  }, [onError, prompt])

  return {
    prompt,
    busyAction,
    isEstimating,
    openForAction,
    closePrompt,
    handleRecheck,
    handleProceed,
  }
}
