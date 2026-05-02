import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirms, setConfirms] = useState([])

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showConfirm = useCallback((message, onConfirm, { confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) => {
    const id = Date.now()
    setConfirms(prev => [...prev, { id, message, onConfirm, confirmText, cancelText }])
  }, [])

  const dismissConfirm = useCallback((id) => {
    setConfirms(prev => prev.filter(c => c.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__msg">{t.message}</span>
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Cerrar">✕</button>
          </div>
        ))}
        {confirms.map(c => (
          <div key={c.id} className="toast toast--confirm" role="alertdialog">
            <span className="toast__msg">{c.message}</span>
            <div className="toast__actions">
              <button className="toast__btn toast__btn--cancel" onClick={() => dismissConfirm(c.id)}>{c.cancelText}</button>
              <button className="toast__btn toast__btn--confirm" onClick={() => { c.onConfirm(); dismissConfirm(c.id) }}>{c.confirmText}</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
