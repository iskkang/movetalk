/*
  REQUIRED ENV VARS:
  OPENAI_API_KEY — from platform.openai.com (used in Step 4)
  SUPABASE_URL — from Supabase project settings
  SUPABASE_SERVICE_KEY — from Supabase project settings (service_role key)
  PORT — optional, defaults to 3001
  FRONTEND_URL — production frontend URL for CORS
*/

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const OpenAI = require('openai')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const { createSession, addMessage, getAllSessions, getSession, endSession, deleteSession } = require('./sessionStore')

const app = express()
const PORT = process.env.PORT || 3001

// CORS
app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
}))

app.use(express.json())

// In-memory rate limiter: 30 req/min per IP
const ipRequests = {}
app.use((req, res, next) => {
  const ip = req.ip
  const now = Date.now()
  if (!ipRequests[ip] || now > ipRequests[ip].resetAt) {
    ipRequests[ip] = { count: 1, resetAt: now + 60_000 }
  } else {
    ipRequests[ip].count++
    if (ipRequests[ip].count > 30) {
      return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' })
    }
  }
  next()
})

// Request logger
app.use((req, res, next) => {
  const ts = new Date().toISOString()
  res.on('finish', () => {
    const result = res.statusCode < 400 ? 'SUCCESS' : 'FAILED'
    console.log(`[${ts}] IP=${req.ip} PATH=${req.path} RESULT=${result}`)
  })
  next()
})

// Multer — 10 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

// ── Endpoints ─────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.post('/api/sessions/start', async (req, res) => {
  const { contactName, companyName, sourceLang, targetLang } = req.body
  const date = new Date().toISOString().split('T')[0]
  const sessionTitle = `${date} | ${contactName} | ${sourceLang.toUpperCase()}→${targetLang.toUpperCase()}`
  try {
    const session = await createSession(contactName, companyName, sourceLang, targetLang, sessionTitle)
    res.json({ sessionId: session.id, sessionTitle: session.session_title, createdAt: session.created_at })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '세션을 시작할 수 없습니다.' })
  }
})

app.get('/api/sessions', async (_req, res) => {
  try {
    res.json(await getAllSessions())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '세션 목록을 불러올 수 없습니다.' })
  }
})

app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    res.json(await getSession(req.params.sessionId))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '세션을 불러올 수 없습니다.' })
  }
})

app.post('/api/sessions/:sessionId/end', async (req, res) => {
  try {
    const result = await endSession(req.params.sessionId)
    res.json({ sessionId: req.params.sessionId, totalMessages: result.totalMessages, duration: result.duration })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '세션을 종료할 수 없습니다.' })
  }
})

app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    await deleteSession(req.params.sessionId)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '세션을 삭제할 수 없습니다.' })
  }
})

app.post('/api/transcribe-and-translate', (req, res, next) => {
  upload.single('audio')(req, res, async (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일이 너무 큽니다. 10MB 이하만 허용됩니다.' })
    }
    if (err) return next(err)

    const { sourceLang, targetLang, speakerRole, sessionId } = req.body

    if (!req.file) {
      return res.status(400).json({ error: '오디오 파일이 없습니다.' })
    }

    try {
      const langNames = { ko: '한국어', ru: '러시아어', en: '영어' }

      // Whisper STT
      const { toFile } = require('openai')
      const audioFile = await toFile(req.file.buffer, 'audio.webm', { type: req.file.mimetype })
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: sourceLang,
      })
      const originalText = transcription.text?.trim()

      if (!originalText) {
        return res.status(422).json({ error: '음성을 인식하지 못했습니다. 다시 시도해주세요.' })
      }

      // GPT-4o translation
      const srcName = langNames[sourceLang] || sourceLang
      const tgtName = langNames[targetLang] || targetLang
      const chat = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional business interpreter specializing in logistics and international trade. Translate the following text from ${srcName} to ${tgtName}. Return only the translated text with no explanations or notes.`,
          },
          { role: 'user', content: originalText },
        ],
        temperature: 0.3,
      })
      const translatedText = chat.choices[0].message.content?.trim()

      // Save to Supabase
      const msg = await addMessage(sessionId, { speakerRole, originalText, translatedText })

      res.json({
        id: msg.id,
        originalText,
        translatedText,
        speakerRole,
        sourceLang,
        targetLang,
        timestamp: msg.timestamp,
      })
    } catch (err) {
      console.error('transcribe-and-translate error:', err)
      res.status(500).json({ error: '처리 중 오류가 발생했습니다. 다시 시도해주세요.' })
    }
  })
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
