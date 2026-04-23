let mediaRecorder = null
let chunks = []
let startTime = null
let sharedStream = null

async function getStream() {
  if (sharedStream && sharedStream.active) return sharedStream
  sharedStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  return sharedStream
}

export async function startRecording() {
  const stream = await getStream()
  chunks = []
  startTime = Date.now()
  mediaRecorder = new MediaRecorder(stream)
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  mediaRecorder.start()
}

export function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('녹음 중이 아닙니다.'))
      return
    }
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      mediaRecorder = null
      chunks = []
      resolve(blob)
    }
    mediaRecorder.stop()
    // Keep sharedStream alive — don't stop tracks here
  })
}

export function releaseStream() {
  if (sharedStream) {
    sharedStream.getTracks().forEach((t) => t.stop())
    sharedStream = null
  }
  mediaRecorder = null
  chunks = []
}

export function getRecordingDuration() {
  if (!startTime) return 0
  return Date.now() - startTime
}

export function isCurrentlyRecording() {
  return mediaRecorder !== null && mediaRecorder.state === 'recording'
}
