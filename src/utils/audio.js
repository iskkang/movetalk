let mediaRecorder = null
let chunks = []
let startTime = null

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
      mediaRecorder.stream.getTracks().forEach((t) => t.stop())
      mediaRecorder = null
      chunks = []
      resolve(blob)
    }
    mediaRecorder.stop()
  })
}

export function getRecordingDuration() {
  if (!startTime) return 0
  return Date.now() - startTime
}

export function isCurrentlyRecording() {
  return mediaRecorder !== null && mediaRecorder.state === 'recording'
}
