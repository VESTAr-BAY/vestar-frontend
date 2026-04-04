import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { ToastProvider, useToast } from '../providers/ToastProvider'

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ToastProvider, null, children)

describe('useToast', () => {
  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('addToast appends a toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    act(() => result.current.addToast({ type: 'success', message: '투표 완료!' }))
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('투표 완료!')
    expect(result.current.toasts[0].type).toBe('success')
  })

  it('each toast gets a unique id', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    act(() => {
      result.current.addToast({ type: 'success', message: 'A' })
      result.current.addToast({ type: 'info', message: 'B' })
    })
    const [a, b] = result.current.toasts
    expect(a.id).not.toBe(b.id)
  })

  it('removeToast removes toast by id', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    act(() => result.current.addToast({ type: 'success', message: 'test' }))
    const id = result.current.toasts[0].id
    act(() => result.current.removeToast(id))
    expect(result.current.toasts).toHaveLength(0)
  })

  it('can hold multiple toasts simultaneously', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    act(() => {
      result.current.addToast({ type: 'success', message: 'A' })
      result.current.addToast({ type: 'error', message: 'B' })
      result.current.addToast({ type: 'info', message: 'C' })
    })
    expect(result.current.toasts).toHaveLength(3)
  })
})
