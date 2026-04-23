import { useState, useEffect } from 'react'
import { getSessions, deleteSession } from '../utils/api'

export default function HistoryScreen({ onBack, onSelectSession }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(() => setError('기록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation()
    if (!window.confirm('이 대화 기록을 삭제하시겠습니까?')) return
    setDeletingId(sessionId)
    try {
      await deleteSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch {
      alert('삭제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setDeletingId(null)
    }
  }

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
        {!loading && error && <div style={{ ...emptyStyle, color: '#dc2626' }}>{error}</div>}
        {!loading && !error && sessions.length === 0 && (
          <div style={emptyStyle}>저장된 대화 기록이 없습니다.</div>
        )}
        {sessions.map((s) => (
          <div key={s.id} style={cardStyle} onClick={() => onSelectSession(s.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                {s.contact_name}
              </div>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                disabled={deletingId === s.id}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '18px',
                  cursor: deletingId === s.id ? 'not-allowed' : 'pointer',
                  padding: '0 4px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {deletingId === s.id ? '⏳' : '🗑️'}
              </button>
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
