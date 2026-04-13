import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useState } from 'react'
import type { ToastType } from '../components/shared/Toast'
import { Toast } from '../components/shared/Toast'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  autoClose?: boolean
}

interface ToastContextValue {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

let _idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = String(_idCounter++)
    setToasts((prev) => [
      ...prev,
      {
        ...toast,
        id,
        autoClose: toast.autoClose ?? true,
      },
    ])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 z-[500] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}
