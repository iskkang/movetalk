export default function HistoryScreen({ onBack, onSelectSession }) {
  // In Phase 2 (Step 7) this will fetch from API; placeholder for now
  const sessions = []
  const loading = false

  const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
  }

  const backBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#374151',
    padding: '4px 8px',
  }

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
  }

  const listStyle = {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const emptyStyle = {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '15px',
    marginTop: '60px',
  }

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    cursor: 'pointer',
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div style={screenStyle}>
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={onBack}>←</button>
        <span style={titleStyle}>대화 기록</span>
      </div>

      <div style={listStyle}>
        {loading && <div style={emptyStyle}>불러오는 중...</div>}
        {!loading && sessions.length === 0 && (
          <div style={emptyStyle}>저장된 대화 기록이 없습니다.</div>
        )}
        {sessions.map((s) => (
          <div key={s.id} style={cardStyle} onClick={() => onSelectSession(s.id)}>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
              {s.contact_name}
            </div>
            {s.company_name && (
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>{s.company_name}</div>
            )}
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.session_title}</div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
              <span>{formatDate(s.created_at)}</span>
              <span>{s.source_lang?.toUpperCase()}→{s.target_lang?.toUpperCase()}</span>
              <span>{s.total_messages}개 메시지</span>
              {s.duration && <span>{s.duration}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
