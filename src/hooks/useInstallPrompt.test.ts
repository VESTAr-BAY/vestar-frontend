import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInstallPrompt } from './useInstallPrompt'

describe('useInstallPrompt', () => {
  let mockPrompt: ReturnType<typeof vi.fn>
  let beforeInstallHandler: ((e: Event) => void) | null = null

  beforeEach(() => {
    mockPrompt = vi.fn().mockResolvedValue({ outcome: 'accepted' })
    beforeInstallHandler = null

    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'beforeinstallprompt') {
        beforeInstallHandler = handler as (e: Event) => void
      }
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with canInstall false when no prompt event has fired', () => {
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.canInstall).toBe(false)
  })

  it('sets canInstall true when beforeinstallprompt fires', () => {
    const { result } = renderHook(() => useInstallPrompt())

    act(() => {
      const fakeEvent = new Event('beforeinstallprompt') as Event & { prompt: typeof mockPrompt }
      fakeEvent.prompt = mockPrompt
      Object.defineProperty(fakeEvent, 'preventDefault', { value: vi.fn() })
      beforeInstallHandler?.(fakeEvent)
    })

    expect(result.current.canInstall).toBe(true)
  })

  it('calls prompt() and resets canInstall when install() is called', async () => {
    const { result } = renderHook(() => useInstallPrompt())

    act(() => {
      const fakeEvent = new Event('beforeinstallprompt') as Event & { prompt: typeof mockPrompt }
      fakeEvent.prompt = mockPrompt
      Object.defineProperty(fakeEvent, 'preventDefault', { value: vi.fn() })
      beforeInstallHandler?.(fakeEvent)
    })

    expect(result.current.canInstall).toBe(true)

    await act(async () => {
      await result.current.install()
    })

    expect(mockPrompt).toHaveBeenCalledTimes(1)
    expect(result.current.canInstall).toBe(false)
  })

  it('does nothing when install() is called with no prompt event', async () => {
    const { result } = renderHook(() => useInstallPrompt())

    await act(async () => {
      await result.current.install()
    })

    expect(mockPrompt).not.toHaveBeenCalled()
    expect(result.current.canInstall).toBe(false)
  })

  it('removes the event listener on unmount', () => {
    const { unmount } = renderHook(() => useInstallPrompt())
    unmount()
    expect(window.removeEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
  })
})
