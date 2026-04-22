import SubtitleCard from './SubtitleCard'

export default function HistoryDetailScreen({ sessionId, onBack }) {
  // In Phase 2 (Step 7) this will fetch from API; placeholder for now
  const session = null
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

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div style={screenStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}>←</button>
          <span style={{ fontSize: '18px', fontWeight: '700' }}>세션 상세</span>
        </div>
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>불러오는 중...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={screenStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}>←</button>
          <span style={{ fontSize: '18px', fontWeight: '700' }}>세션 상세</span>
        </div>
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '15px' }}>
          상세 기록을 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  const infoStyle = {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  }

  return (
    <div style={screenStyle}>
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={onBack}>←</button>
        <span style={{ fontSize: '18px', fontWeight: '700' }}>{session.session_title}</span>
      </div>

      <div style={infoStyle}>
        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{session.contact_name}</div>
        {session.company_name && (
          <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>{session.company_name}</div>
        )}
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap' }}>
          <span>{formatDate(session.created_at)}</span>
          <span>{session.source_lang?.toUpperCase()}→{session.target_lang?.toUpperCase()}</span>
          <span>{session.total_messages}개 메시지</span>
          {session.duration && <span>{session.duration}</span>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {(session.messages || []).map((m) => (
          <SubtitleCard
            key={m.id}
            speaker={m.speaker_role}
            timestamp={formatTime(m.timestamp)}
            originalText={m.original_text}
            translatedText={m.translated_text}
          />
        ))}
      </div>
    </div>
  )
}
