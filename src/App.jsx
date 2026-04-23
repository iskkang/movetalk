import { useState } from 'react'
import StartScreen from './components/StartScreen'
import SessionScreen from './components/SessionScreen'
import HistoryScreen from './components/HistoryScreen'
import HistoryDetailScreen from './components/HistoryDetailScreen'
import ViewerScreen from './components/ViewerScreen'

export const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'ru', label: 'Russian' },
]

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('start')
  const [sessionInfo, setSessionInfo] = useState(null)
  const [selectedSessionId, setSelectedSessionId] = useState(null)

  // Viewer mode: other party opens a shared link
  const viewSessionId = new URLSearchParams(window.location.search).get('view')
  if (viewSessionId) {
    return <ViewerScreen sessionId={viewSessionId} />
  }

  const goSession = (info) => {
    setSessionInfo(info)
    setCurrentScreen('session')
  }

  const goHistory = () => setCurrentScreen('history')

  const goHistoryDetail = (sessionId) => {
    setSelectedSessionId(sessionId)
    setCurrentScreen('historyDetail')
  }

  const goStart = () => setCurrentScreen('start')

  if (currentScreen === 'session' && sessionInfo) {
    return (
      <SessionScreen
        {...sessionInfo}
        onEnd={goStart}
        onViewHistory={goHistory}
      />
    )
  }

  if (currentScreen === 'history') {
    return (
      <HistoryScreen
        onBack={goStart}
        onSelectSession={goHistoryDetail}
      />
    )
  }

  if (currentScreen === 'historyDetail' && selectedSessionId) {
    return (
      <HistoryDetailScreen
        sessionId={selectedSessionId}
        onBack={goHistory}
      />
    )
  }

  return (
    <StartScreen
      onStart={goSession}
      onHistory={goHistory}
    />
  )
}
