import { useState, useRef, useEffect } from 'react'
import SubtitleCard from './SubtitleCard'
import Toast from './Toast'
import Modal from './Modal'
import { startRecording, stopRecording, getRecordingDuration, releaseStream } from '../utils/audio'
import { transcribeAndTranslate, endSession, getSessionDetail } from '../utils/api'

export default function SessionScreen({
  contactName, companyName, sourceLang, targetLang, sessionId, sessionTitle,
  onEnd, onViewHistory,
}) {
  const [messages, setMessages] = useState([])
  const [sessionEnded, setSessionEnded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' })
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastBlob, setLastBlob] = useState(null)
  const [showRetry, setShowRetry] = useState(false)

  const SPEAK_LABEL = { ko: '말하기', ru: 'Говорить', en: 'Speak' }
  const STOP_LABEL = { ko: '누르면 종료', ru: 'нажать для остановки', en: 'tap to stop' }
  const speakLabel = SPEAK_LABEL[sourceLang] || '말하기'
  const stopLabel = STOP_LABEL[sourceLang] || '누르면 종료'
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const scrollRef = useRef(null)

  const shareLink = `${window.location.origin}/?view=${sessionId}`
  const displayCode = sessionId.slice(0, 6).toUpperCase()
  const shareMessage = `MoveTalk 통역 세션에 참여해 주세요.\n링크: ${shareLink}`

  const showToast = (message, type = 'error') =>
    setToast({ visible: true, message, type })
  const hideToast = () => setToast((t) => ({ ...t, visible: false }))

  // Auto-copy link when session starts
  useEffect(() => {
    navigator.clipboard.writeText(shareLink).catch(() => {})
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Poll server every 2s to pick up messages from the remote party
  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const data = await getSessionDetail(sessionId)
        if (cancelled) return
        setMessages((prev) => {
          const prevById = new Map(prev.map((m) => [m.id, m]))
          const serverMsgs = (data.messages || []).map((m) => {
            if (prevById.has(m.id)) return prevById.get(m.id)
            return {
              id: m.id,
              speakerRole: m.speaker_role,
              originalText: m.original_text,
              translatedText: m.translated_text,
              timestamp: m.timestamp
                ? new Date(m.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                : '',
            }
          })
          if (
            serverMsgs.length === prev.length &&
            serverMsgs.every((m, i) => m.id === prev[i]?.id)
          ) return prev
          return serverMsgs
        })
      } catch {
        // Silently ignore poll errors — Toast already shown for recording errors
      }
    }
    const interval = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [sessionId])

  const handleToggleRecording = async () => {
    if (sessionEnded || isProcessing) return

    if (isRecording) {
      const duration = getRecordingDuration()
      if (duration < 500) {
        try { await stopRecording() } catch {}
        setIsRecording(false)
        showToast('너무 짧습니다. 다시 눌러 말해주세요. / Слишком коротко.')
        return
      }
      setIsRecording(false)
      setIsProcessing(true)
      setShowRetry(false)
      try {
        const blob = await stopRecording()
        setLastBlob(blob)
        await sendAudio(blob)
      } catch {
        showToast('녹음 중 오류가 발생했습니다.')
        setIsProcessing(false)
      }
      return
    }

    try {
      await startRecording()
      setIsRecording(true)
    } catch {
      showToast('마이크 접근이 거부되었습니다. / Микрофон недоступен.')
    }
  }

  const sendAudio = async (blob) => {
    try {
      const result = await transcribeAndTranslate(blob, sourceLang, targetLang, 'me', sessionId)
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
    if (!lastBlob) return
    setIsProcessing(true)
    setShowRetry(false)
    await sendAudio(lastBlob)
  }

  const handleEndSession = async () => {
    if (isRecording) {
      try { await stopRecording() } catch {}
      setIsRecording(false)
    }
    releaseStream()
    try { await endSession(sessionId) } catch {}
    setSessionEnded(true)
    setShowModal(true)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      showToast('복사 실패')
    }
  }

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank')
  }

  const handleShareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent('MoveTalk 통역 세션에 참여해 주세요.')}`,
      '_blank'
    )
  }

  const handleShareSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(shareMessage)}`
  }

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: 'MoveTalk 통역 세션', text: shareMessage, url: shareLink })
    } catch {}
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

  const inviteBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '8px',
    padding: '8px 10px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
  }

  const inviteBtnStyle = {
    padding: '6px 14px',
    backgroundColor: showInvitePanel ? '#1e40af' : '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    flexShrink: 0,
  }

  const sharePanelStyle = {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
    flexWrap: 'wrap',
  }

  const shareBtn = (bg) => ({
    flex: 1,
    minWidth: '52px',
    padding: '8px 4px',
    backgroundColor: bg,
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
  })

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

  const speakBtnStyle = {
    width: '100%',
    padding: '20px 8px',
    marginBottom: showRetry ? '8px' : 0,
    backgroundColor: isProcessing ? '#e5e7eb' : isRecording ? '#dc2626' : '#1d4ed8',
    color: isProcessing ? '#9ca3af' : '#ffffff',
    border: isRecording ? '3px solid #fca5a5' : '3px solid transparent',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: sessionEnded || isProcessing ? 'not-allowed' : 'pointer',
    opacity: sessionEnded ? 0.5 : 1,
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

        {/* Invite bar */}
        <div style={inviteBarStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '10px', color: '#6b7280' }}>참여 코드 / Код</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#1d4ed8', letterSpacing: '3px', fontFamily: 'monospace' }}>
              {displayCode}
            </span>
          </div>
          <button style={inviteBtnStyle} onClick={() => setShowInvitePanel((v) => !v)}>
            {showInvitePanel ? '닫기' : '📨 초대하기'}
          </button>
        </div>

        {showInvitePanel && (
          <div style={sharePanelStyle}>
            <button style={shareBtn('#25D366')} onClick={handleShareWhatsApp}>WhatsApp</button>
            <button style={shareBtn('#0088cc')} onClick={handleShareTelegram}>Telegram</button>
            <button style={shareBtn('#4b5563')} onClick={handleShareSMS}>SMS</button>
            {typeof navigator.share === 'function' && (
              <button style={shareBtn('#7c3aed')} onClick={handleNativeShare}>공유</button>
            )}
            <button style={shareBtn(codeCopied ? '#16a34a' : '#374151')} onClick={handleCopyLink}>
              {codeCopied ? '✓ 복사' : '📋 복사'}
            </button>
          </div>
        )}
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
        <button
          style={speakBtnStyle}
          onClick={handleToggleRecording}
          disabled={sessionEnded || isProcessing}
        >
          {isRecording ? `🔴 ${speakLabel} — ${stopLabel}` : `🎙️ ${speakLabel}`}
        </button>
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
