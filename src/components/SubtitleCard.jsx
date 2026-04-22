export default function SubtitleCard({ speaker, timestamp, originalText, translatedText }) {
  const isMe = speaker === 'me'

  const containerStyle = {
    display: 'flex',
    justifyContent: isMe ? 'flex-end' : 'flex-start',
    marginBottom: '12px',
    padding: '0 16px',
  }

  const cardStyle = {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    borderLeft: isMe ? '4px solid #1e40af' : '4px solid #c2410c',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
    gap: '12px',
  }

  const speakerStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: isMe ? '#1e40af' : '#c2410c',
  }

  const timeStyle = {
    fontSize: '11px',
    color: '#9ca3af',
  }

  const originalStyle = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
  }

  const translatedStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    lineHeight: '1.3',
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={speakerStyle}>{isMe ? '나' : '상대방'}</span>
          <span style={timeStyle}>{timestamp}</span>
        </div>
        <div style={originalStyle}>{originalText}</div>
        <div style={translatedStyle}>{translatedText}</div>
      </div>
    </div>
  )
}
