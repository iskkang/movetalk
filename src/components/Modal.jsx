export default function Modal({ title, children, onClose }) {
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  }

  const panelStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  }

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
  }

  const closeBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    lineHeight: 1,
    padding: '4px',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>{title}</span>
          <button style={closeBtnStyle} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
