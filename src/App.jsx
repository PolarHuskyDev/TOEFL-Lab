import { useState } from 'react'
import { useSessions } from '@/hooks/use-sessions'
import { ListeningHome } from '@/features/listening/ListeningHome'
import { ListeningPractice } from '@/features/listening/ListeningPractice'
import { ListeningReview } from '@/features/listening/ListeningReview'
import { trimTrailingEmpty } from '@/features/listening/score'

function App() {
  const { sessions, createSession, updateSession, deleteSession } = useSessions()
  const [view, setView] = useState({ name: 'home' })

  const session = sessions.find((s) => s.id === view.sessionId)
  const goHome = () => setView({ name: 'home' })

  if (view.name === 'practice' && session) {
    return (
      <ListeningPractice
        session={session}
        onChange={(patch) => updateSession(session.id, patch)}
        onExit={goHome}
        onFinish={() => {
          updateSession(session.id, (s) => {
            const answers = trimTrailingEmpty(s.answers)
            return { answers, current: Math.min(s.current, answers.length - 1), status: 'finished' }
          })
          setView({ name: 'review', sessionId: session.id })
        }}
      />
    )
  }

  if (view.name === 'review' && session) {
    return (
      <ListeningReview
        session={session}
        onChange={(patch) => updateSession(session.id, patch)}
        onDone={goHome}
        onResume={() => {
          updateSession(session.id, (s) => ({ status: 'in-progress', current: s.answers.length - 1 }))
          setView({ name: 'practice', sessionId: session.id })
        }}
      />
    )
  }

  return (
    <ListeningHome
      sessions={sessions}
      onStart={(data) => {
        const id = createSession(data)
        setView({ name: 'practice', sessionId: id })
      }}
      onOpen={(s) => setView({ name: s.status === 'finished' ? 'review' : 'practice', sessionId: s.id })}
      onDelete={deleteSession}
    />
  )
}

export default App
