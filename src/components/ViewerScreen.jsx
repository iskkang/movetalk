import { useState, useEffect, useRef } from 'react'
import SubtitleCard from './SubtitleCard'
import Toast from './Toast'
import { getSessionDetail, transcribeAndTranslate } from '../utils/api'
import { startRecording, stopRecording, getRecordingDuration, releaseStream } from '../utils/audio'

const SPEAK_LABEL = { ko: '말하기', ru: 'Говорить', en: 'Speak' }
const STOP_LABEL = { ko: '누르면 종료', ru: 'нажать для остановки', en: 'tap to stop' }

export default function ViewerScreen({ sessionId }) {
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [lastCount, setLastCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRetry, setShowRetry] = useState(false)
  const [lastBlob, setLastBlob] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' })
  const scrollRef = useRef(null)

  const showToast = (message, type = 'error') => setToast({ visible: true, message, type })
  const hideToast = () => setToast((t) => ({ ...t, visible: false }))

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
    const interval = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
      releaseStream()
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

  const viewerLang = session?.target_lang
  const hostLang = session?.source_lang
  const speakLabel = SPEAK_LABEL[viewerLang] || 'Говорить'
  const stopLabel = STOP_LABEL[viewerLang] || 'нажать для остановки'

  const handleToggleRecording = async () => {
    if (!session || isProcessing) return

    if (isRecording) {
      const duration = getRecordingDuration()
      if (duration < 500) {
        try { await stopRecording() } catch {}
        setIsRecording(false)
        showToast('Слишком коротко. / 너무 짧습니다.')
        return
      }
      setIsRecording(false)
      setIsProcessing(true)
      setShowRetry(false)
      try {
        const blob = await stopRecording()
        setLastBlob(blob)
        const result = await transcribeAndTranslate(blob, viewerLang, hostLang, 'other', sessionId)
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === result.id)
          if (exists) return prev
          return [...prev, {
            id: result.id || Date.now().toString(),
            speaker_role: result.speakerRole,
            original_text: result.originalText,
            translated_text: result.translatedText,
            timestamp: result.timestamp,
          }]
        })
        setShowRetry(false)
      } catch (err) {
        showToast(err.message || 'Ошибка. / 오류가 발생했습니다.')
        setShowRetry(true)
      } finally {
        setIsProcessing(false)
      }
      return
    }

    try {
      await startRecording()
      setIsRecording(true)
    } catch {
      showToast('Микрофон недоступен. / 마이크 접근이 거부되었습니다.')
    }
  }

  const handleRetry = async () => {
    if (!lastBlob || !session) return
    setIsProcessing(true)
    setShowRetry(false)
    try {
      const result = await transcribeAndTranslate(lastBlob, viewerLang, hostLang, 'other', sessionId)
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === result.id)
        if (exists) return prev
        return [...prev, {
          id: result.id || Date.now().toString(),
          speaker_role: result.speakerRole,
          original_text: result.originalText,
          translated_text: result.translatedText,
          timestamp: result.timestamp,
        }]
      })
    } catch (err) {
      showToast(err.message || 'Ошибка. / 오류가 발생했습니다.')
      setShowRetry(true)
    } finally {
      setIsProcessing(false)
    }
  }

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

  const bottomStyle = {
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
  }

  const speakBtnStyle = {
    width: '100%',
    padding: '20px 8px',
    marginBottom: showRetry ? '8px' : 0,
    backgroundColor: isProcessing ? '#e5e7eb' : isRecording ? '#dc2626' : '#ea580c',
    color: isProcessing ? '#9ca3af' : '#ffffff',
    border: isRecording ? '3px solid #fca5a5' : '3px solid transparent',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: isProcessing ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s',
  }

  const retryBtnStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  }

  const processingStyle = {
    textAlign: 'center',
    fontSize: '13px',
    color: '#6b7280',
    padding: '6px 0 2px',
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
      <Toast {...toast} onHide={hideToast} />
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

      <div style={bottomStyle}>
        {isProcessing && (
          <div style={processingStyle}>⏳ Обработка... / 처리 중...</div>
        )}
        <button
          style={speakBtnStyle}
          onClick={handleToggleRecording}
          disabled={isProcessing || !session}
        >
          {isRecording ? `🔴 ${speakLabel} — ${stopLabel}` : `🎙️ ${speakLabel}`}
        </button>
        {showRetry && (
          <button style={retryBtnStyle} onClick={handleRetry}>
            ⚠️ Повторить / 재시도
          </button>
        )}
      </div>
    </div>
  )
}
