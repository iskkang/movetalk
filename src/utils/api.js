const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function startSession(contactName, companyName, sourceLang, targetLang) {
  const res = await fetch(`${BASE_URL}/api/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactName, companyName, sourceLang, targetLang }),
  })
  if (!res.ok) throw new Error('세션을 시작할 수 없습니다. 다시 시도해주세요.')
  return res.json()
}

export async function transcribeAndTranslate(audioBlob, sourceLang, targetLang, speakerRole, sessionId) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)
  try {
    const form = new FormData()
    form.append('audio', audioBlob, 'audio.webm')
    form.append('sourceLang', sourceLang)
    form.append('targetLang', targetLang)
    form.append('speakerRole', speakerRole)
    form.append('sessionId', sessionId)
    const res = await fetch(`${BASE_URL}/api/transcribe-and-translate`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!res.ok) throw new Error('처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    return res.json()
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('응답 시간이 초과되었습니다. 다시 시도해주세요.')
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function getSessions() {
  const res = await fetch(`${BASE_URL}/api/sessions`)
  if (!res.ok) throw new Error('기록을 불러오지 못했습니다. 다시 시도해주세요.')
  return res.json()
}

export async function getSessionDetail(sessionId) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}`)
  if (!res.ok) throw new Error('상세 기록을 불러오지 못했습니다.')
  return res.json()
}

export async function endSession(sessionId) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/end`, { method: 'POST' })
  if (!res.ok) throw new Error('세션 종료에 실패했습니다.')
  return res.json()
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('삭제에 실패했습니다.')
  return res.json()
}
