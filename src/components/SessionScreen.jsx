import { useState, useRef, useEffect } from 'react'
import SubtitleCard from './SubtitleCard'
import Toast from './Toast'
import Modal from './Modal'

export default function SessionScreen({
  contactName, companyName, sourceLang, targetLang, sessionId, sessionTitle,
  onEnd, onViewHistory,
}) {
  const [messages, setMessages] = useState([])
  const [sessionEnded, setSessionEnded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' })
  const scrollRef = useRef(null)

  const showToast = (message, type = 'error') =>
    setToast({ visible: true, message, type })
  const hideToast = () => setToast((t) => ({ ...t, visible: false }))

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleEndSession = () => {
    setSessionEnded(true)
    setShowModal(true)
  }

  const topBarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }

  const sessionInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  }

  const dotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#16a34a',
    flexShrink: 0,
  }

  const titleBlockStyle = { flex: 1 }

  const titleTextStyle = {
    fontSize: '15px',
    fontWeight: '700',
    color: '#111827',
  }

  const companyTextStyle = {
    fontSize: '12px',
    color: '#9ca3af',
  }

  const langBadgeStyle = {
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px',
    flexShrink: 0,
  }

  const endBtnStyle = {
    padding: '6px 12px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
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
    fontSize: '15px',
  }

  const bottomStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
  }

  const myBtnStyle = {
    padding: '20px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: sessionEnded ? 'not-allowed' : 'pointer',
    opacity: sessionEnded ? 0.5 : 1,
  }

  const otherBtnStyle = {
    ...myBtnStyle,
    backgroundColor: '#ea580c',
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
        <div style={sessionInfoStyle}>
          <div style={dotStyle} />
          <div style={titleBlockStyle}>
            <div style={titleTextStyle}>{sessionTitle || contactName}</div>
            {companyName && <div style={companyTextStyle}>{companyName}</div>}
          </div>
          <div style={langBadgeStyle}>{sourceLang.toUpperCase()} → {targetLang.toUpperCase()}</div>
        </div>
        {!sessionEnded && (
          <button style={{ ...endBtnStyle, marginLeft: '12px' }} onClick={handleEndSession}>
            세션 종료
          </button>
        )}
      </div>

      {/* Conversation */}
      <div style={conversationStyle} ref={scrollRef}>
        {messages.length === 0 ? (
          <div style={emptyStyle}>버튼을 눌러 말하기 시작하세요</div>
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
        <button style={myBtnStyle} disabled={sessionEnded}>
          나 말하기
        </button>
        <button style={otherBtnStyle} disabled={sessionEnded}>
          상대방 말하기
        </button>
      </div>

      {/* Session end modal */}
      {showModal && (
        <Modal title="세션 종료" onClose={() => setShowModal(false)}>
          <div style={{ fontSize: '15px', color: '#374151', marginBottom: '20px' }}>
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
