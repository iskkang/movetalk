import { useState } from 'react'
import Toast from './Toast'
import { LANGUAGES } from '../App'
import { startSession } from '../utils/api'

export default function StartScreen({ onStart, onHistory }) {
  const [contactName, setContactName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [sourceLang, setSourceLang] = useState('ko')
  const [targetLang, setTargetLang] = useState('ru')
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' })
  const [loading, setLoading] = useState(false)

  const showToast = (message, type = 'error') =>
    setToast({ visible: true, message, type })
  const hideToast = () => setToast((t) => ({ ...t, visible: false }))

  const handleStart = async () => {
    if (!contactName.trim()) {
      showToast('상대방 이름을 입력해주세요. / Введите имя собеседника.')
      return
    }
    setLoading(true)
    try {
      const { sessionId, sessionTitle } = await startSession(
        contactName.trim(), companyName.trim(), sourceLang, targetLang
      )
      onStart({ contactName: contactName.trim(), companyName: companyName.trim(), sourceLang, targetLang, sessionId, sessionTitle })
    } catch {
      showToast('세션을 시작할 수 없습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const screenStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: '#f9fafb',
  }
  const cardStyle = {
    width: '100%', maxWidth: '420px', backgroundColor: '#ffffff',
    borderRadius: '16px', padding: '32px 24px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  }
  const titleStyle = { fontSize: '22px', fontWeight: '700', textAlign: 'center', marginBottom: '28px', color: '#111827' }
  const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }
  const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', outline: 'none', marginBottom: '16px', color: '#111827' }
  const selectStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', outline: 'none', marginBottom: '16px', color: '#111827', backgroundColor: '#ffffff' }
  const langRowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
  const startBtnStyle = { width: '100%', padding: '16px', backgroundColor: loading ? '#86efac' : '#16a34a', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '17px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '12px' }
  const historyBtnStyle = { width: '100%', padding: '14px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }

  return (
    <div style={screenStyle}>
      <Toast {...toast} onHide={hideToast} />
      <div style={cardStyle}>
        <div style={titleStyle}>🎙️ Live Subtitle Interpreter</div>
        <label style={labelStyle}>상대방 이름 * / Имя собеседника *</label>
        <input style={inputStyle} placeholder="이름 / Имя" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <label style={labelStyle}>회사명 / Компания (선택)</label>
        <input style={inputStyle} placeholder="회사명 / Компания" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        <div style={langRowStyle}>
          <div>
            <label style={labelStyle}>내 언어 / Мой язык</label>
            <select style={selectStyle} value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>상대방 언어 / Язык собеседника</label>
            <select style={selectStyle} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
        <button style={startBtnStyle} onClick={handleStart} disabled={loading}>
          {loading ? '시작 중...' : 'Start Session / Начать сеанс'}
        </button>
        <button style={historyBtnStyle} onClick={onHistory}>대화 기록 / История</button>
      </div>
    </div>
  )
}
