import { useState, useRef, useEffect } from 'react'
import SubtitleCard from './SubtitleCard'
import Toast from './Toast'
import Modal from './Modal'
import { startRecording, stopRecording, getRecordingDuration } from '../utils/audio'
import { transcribeAndTranslate, endSession } from '../utils/api'

export default function SessionScreen({
  contactName, companyName, sourceLang, targetLang, sessionId, sessionTitle,
  onEnd, onViewHistory,
}) {
  const [messages, setMessages] = useState([])
  const [sessionEnded, setSessionEnded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' })
  const [isRecording, setIsRecording] = useState(false)
  const [recordingRole, setRecordingRole] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastBlob, setLastBlob] = useState(null)
  const [lastRole, setLastRole] = useState(null)
  const [showRetry, setShowRetry] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const scrollRef = useRef(null)

  const shareLink = `${window.location.origin}${window.location.pathname}?view=${sessionId}`

  const showToast = (message, type = 'error') =>
    setToast({ visible: true, message, type })
  const hideToast = () => setToast((t) => ({ ...t, visible: false }))

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleToggleRecording = async (role) => {
    if (sessionEnded || isProcessing) return

    // If recording with the same role, stop
    if (isRecording && recordingRole === role) {
      const duration = getRecordingDuration()
      if (duration < 500) {
        try { await stopRecording() } catch {}
        setIsRecording(false)
        setRecordingRole(null)
        showToast('너무 짧습니다. 다시 눌러 말해주세요. / Слишком коротко.')
        return
      }
      setIsRecording(false)
      setRecordingRole(null)
      setIsProcessing(true)
      setShowRetry(false)

      try {
        const blob = await stopRecording()
        setLastBlob(blob)
        setLastRole(role)
        await sendAudio(blob, role)
      } catch {
        showToast('녹음 중 오류가 발생했습니다.')
        setIsProcessing(false)
      }
      return
    }

    // If recording with different role, stop that first
    if (isRecording) {
      try { await stopRecording() } catch {}
      setIsRecording(false)
      setRecordingRole(null)
    }

    // Start recording
    try {
      await startRecording()
      setIsRecording(true)
      setRecordingRole(role)
    } catch {
      showToast('마이크 접근이 거부되었습니다. / Микрофон недоступен.')
    }
  }

  const sendAudio = async (blob, role) => {
    const actualSrc = role === 'me' ? sourceLang : targetLang
    const actualTgt = role === 'me' ? targetLang : sourceLang
    try {
      const result = await transcribeAndTranslate(blob, actualSrc, actualTgt, role, sessionId)
      setMessages((prev) => [...prev, {
        id: result.id || Date.now().toString(),
        speakerRole: result.speakerRole,
        originalText: result.originalText,
        translatedText: result.translatedText,
        timestamp: result.timestamp
          ? new Date(result.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      }])
      setShowRetry(false)
    } catch (err) {
      showToast(err.message || '오류가 발생했습니다. 재시도하세요.')
      setShowRetry(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = async () => {
    if (!lastBlob || !lastRole) return
    setIsProcessing(true)
    setShowRetry(false)
    await sendAudio(lastBlob, lastRole)
  }

  const handleEndSession = async () => {
    if (isRecording) {
      try { await stopRecording() } catch {}
      setIsRecording(false)
    }
    try { await endSession(sessionId) } catch {}
    setSessionEnded(true)
    setShowModal(true)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      showToast('링크 복사 실패')
    }
  }

  // Styles
  const topBarStyle = {
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const dotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: sessionEnded ? '#9ca3af' : '#16a34a',
    flexShrink: 0,
  }

  const titleStyle = { fontSize: '14px', fontWeight: '700', color: '#111827', flex: 1 }
  const companyStyle = { fontSize: '11px', color: '#9ca3af' }

  const langBadgeStyle = {
    fontSize: '11px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 7px',
    borderRadius: '4px',
    flexShrink: 0,
  }

  const endBtnStyle = {
    padding: '5px 10px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
  }

  const shareLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    padding: '8px 10px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
  }

  const linkTextStyle = {
    flex: 1,
    fontSize: '11px',
    color: '#1d4ed8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const copyBtnStyle = {
    padding: '4px 10px',
    backgroundColor: linkCopied ? '#16a34a' : '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.2s',
  }

  const conversationStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
    minHeight: 0,
  }

  const emptyStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#9ca3af',
    fontSize: '14px',
    textAlign: 'center',
    padding: '0 16px',
  }

  const bottomStyle = {
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
  }

  const btnRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: showRetry ? '8px' : 0,
  }

  const getBtnStyle = (role, color) => ({
    padding: '18px 8px',
    backgroundColor: isProcessing
      ? '#e5e7eb'
      : isRecording && recordingRole === role
      ? '#dc2626'
      : color,
    color: isProcessing ? '#9ca3af' : '#ffffff',
    border: isRecording && recordingRole === role ? '3px solid #fca5a5' : '3px solid transparent',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: sessionEnded || isProcessing ? 'not-allowed' : 'pointer',
    opacity: sessionEnded ? 0.5 : 1,
    transition: 'background-color 0.2s, border-color 0.2s',
  })

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

  const modalBtnStyle = {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '10px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Toast {...toast} onHide={hideToast} />

      {/* Top bar */}
      <div style={topBarStyle}>
        <div style={rowStyle}>
          <div style={dotStyle} />
          <div style={{ flex: 1 }}>
            <div style={titleStyle}>{sessionTitle || contactName}</div>
            {companyName && <div style={companyStyle}>{companyName}</div>}
          </div>
          <div style={langBadgeStyle}>{sourceLang.toUpperCase()} → {targetLang.toUpperCase()}</div>
          {!sessionEnded && (
            <button style={endBtnStyle} onClick={handleEndSession}>종료</button>
          )}
        </div>

        {/* Share link */}
        <div style={shareLinkStyle}>
          <span style={{ fontSize: '11px', color: '#374151', flexShrink: 0 }}>
            📎 상대방 링크:
          </span>
          <span style={linkTextStyle}>{shareLink}</span>
          <button style={copyBtnStyle} onClick={handleCopyLink}>
            {linkCopied ? '✓ 복사됨' : '복사'}
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div style={conversationStyle} ref={scrollRef}>
        {messages.length === 0 ? (
          <div style={emptyStyle}>
            버튼을 눌러 말하기 시작하세요<br />
            <span style={{ fontSize: '12px', marginTop: '4px' }}>Нажмите кнопку, чтобы начать</span>
          </div>
        ) : (
          messages.map((m) => (
            <SubtitleCard
              key={m.id}
              speaker={m.speakerRole}
              timestamp={m.timestamp}
              originalText={m.originalText}
              translatedText={m.translatedText}
            />
          ))
        )}
      </div>

      {/* Bottom controls */}
      <div style={bottomStyle}>
        {isProcessing && (
          <div style={processingStyle}>⏳ 처리 중... / Обработка...</div>
        )}
        <div style={btnRowStyle}>
          <button
            style={getBtnStyle('me', '#1d4ed8')}
            onClick={() => handleToggleRecording('me')}
            disabled={sessionEnded || isProcessing}
          >
            {isRecording && recordingRole === 'me' ? '🔴 나 말하기\n누르면 종료' : '🎙️ 나 말하기'}
          </button>
          <button
            style={getBtnStyle('other', '#ea580c')}
            onClick={() => handleToggleRecording('other')}
            disabled={sessionEnded || isProcessing}
          >
            {isRecording && recordingRole === 'other' ? '🔴 상대방\n누르면 종료' : '🎙️ 상대방'}
          </button>
        </div>
        {showRetry && (
          <button style={retryBtnStyle} onClick={handleRetry}>
            ⚠️ 실패 — 재시도 / Повторить
          </button>
        )}
      </div>

      {/* Session end modal */}
      {showModal && (
        <Modal title="세션 종료 / Сеанс завершён" onClose={() => setShowModal(false)}>
          <div style={{ fontSize: '14px', color: '#374151', marginBottom: '20px' }}>
            <div><strong>{sessionTitle}</strong></div>
            <div>총 {messages.length}개 메시지</div>
          </div>
          <button
            style={{ ...modalBtnStyle, backgroundColor: '#1d4ed8', color: '#fff' }}
            onClick={() => { setShowModal(false); onViewHistory() }}
          >
            대화 기록 보기
          </button>
          <button
            style={{ ...modalBtnStyle, backgroundColor: '#e5e7eb', color: '#374151' }}
            onClick={() => { setShowModal(false); onEnd() }}
          >
            새 세션 시작
          </button>
        </Modal>
      )}
    </div>
  )
}
