import { useEffect } from 'react'

const TYPE_COLORS = {
  error: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
}

export default function Toast({ message, type = 'error', visible, onHide }) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => onHide?.(), 3000)
    return () => clearTimeout(timer)
  }, [visible, message])

  if (!visible) return null

  const style = {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.error,
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 9999,
    maxWidth: '90vw',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  }

  return <div style={style}>{message}</div>
}
