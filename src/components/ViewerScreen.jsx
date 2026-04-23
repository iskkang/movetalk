import { useState, useEffect, useRef } from 'react'
import SubtitleCard from './SubtitleCard'
import { getSessionDetail } from '../utils/api'

export default function ViewerScreen({ sessionId }) {
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [lastCount, setLastCount] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const data = await getSessionDetail(sessionId)
        if (cancelled) return
        setSession(data)
        setMessages(data.messages || [])
        setError(null)
      } catch {
        if (!cancelled) setError('연결할 수 없습니다. 재시도 중...')
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [sessionId])

  useEffect(() => {
    if (messages.length !== lastCount) {
      setLastCount(messages.length)
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
  }, [messages])

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  }

  const headerStyle = {
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const dotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#16a34a',
    flexShrink: 0,
    animation: 'pulse 2s infinite',
  }

  const titleStyle = {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  }

  const badgeStyle = {
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px',
  }

  const scrollStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
  }

  const emptyStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#9ca3af',
    fontSize: '15px',
    flexDirection: 'column',
    gap: '8px',
  }

  const errorStyle = {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#d97706',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    zIndex: 999,
  }

  const footerStyle = {
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
    fontSize: '12px',
    color: '#9ca3af',
  }

  if (!session && !error) {
    return (
      <div style={containerStyle}>
        <div style={{ ...emptyStyle, height: '100vh' }}>
          <div>연결 중... / Подключение...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {error && <div style={errorStyle}>{error}</div>}

      <div style={headerStyle}>
        <div style={dotStyle} />
        <div style={titleStyle}>
          {session?.session_title || '실시간 자막 / Субтитры в реальном времени'}
        </div>
        {session && (
          <div style={badgeStyle}>
            {session.source_lang?.toUpperCase()}→{session.target_lang?.toUpperCase()}
          </div>
        )}
      </div>

      <div style={scrollStyle} ref={scrollRef}>
        {messages.length === 0 ? (
          <div style={emptyStyle}>
            <div>대화를 기다리는 중...</div>
            <div style={{ fontSize: '13px' }}>Ожидание разговора...</div>
          </div>
        ) : (
          messages.map((m) => (
            <SubtitleCard
              key={m.id}
              speaker={m.speaker_role}
              timestamp={formatTime(m.timestamp)}
              originalText={m.original_text}
              translatedText={m.translated_text}
            />
          ))
        )}
      </div>

      <div style={footerStyle}>
        실시간 자막 보기 · Просмотр субтитров в реальном времени
      </div>
    </div>
  )
}
