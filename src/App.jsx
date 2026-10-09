import { useState } from 'react'
import { useSessions } from '@/hooks/use-sessions'
import { ListeningHome } from '@/features/listening/ListeningHome'
import { ListeningPractice } from '@/features/listening/ListeningPractice'
import { ListeningReview } from '@/features/listening/ListeningReview'
import { SessionLayout } from '@/features/listening/SessionLayout'
import { finalizeSections } from '@/features/listening/score'
import { fetchVideoTitle } from '@/lib/youtube'

function App() {
  const { sessions, createSession, updateSession, deleteSession } = useSessions()
  const [view, setView] = useState({ name: 'home' })

  const session = sessions.find((s) => s.id === view.sessionId)
  const goHome = () => setView({ name: 'home' })

  // Practice and review share the same layout so the video player stays mounted when switching.
  if ((view.name === 'practice' || view.name === 'review') && session) {
    const isPractice = view.name === 'practice'
    return (
      <SessionLayout session={session} title={isPractice ? 'Listening practice' : 'Review'} onExit={goHome}>
        {isPractice ? (
          <ListeningPractice
            session={session}
            onChange={(patch) => updateSession(session.id, patch)}
            onFinish={() => {
              updateSession(session.id, (s) => {
                const sections = finalizeSections(s.sections)
                return { sections, section: 0, current: 0, status: 'finished' }
              })
              setView({ name: 'review', sessionId: session.id })
            }}
          />
        ) : (
          <ListeningReview
            session={session}
            onChange={(patch) => updateSession(session.id, patch)}
            onDone={goHome}
            onResume={() => {
              updateSession(session.id, (s) => {
                const section = s.sections.length - 1
                return { status: 'in-progress', section, current: s.sections[section].answers.length - 1 }
              })
              setView({ name: 'practice', sessionId: session.id })
            }}
          />
        )}
      </SessionLayout>
    )
  }

  return (
    <ListeningHome
      sessions={sessions}
      onStart={(data) => {
        const id = createSession(data)
        setView({ name: 'practice', sessionId: id })
        if (!data.title) {
          fetchVideoTitle(data.videoId).then((title) => {
            if (title) updateSession(id, (s) => (s.title ? {} : { title }))
          })
        }
      }}
      onOpen={(s) => setView({ name: s.status === 'finished' ? 'review' : 'practice', sessionId: s.id })}
      onDelete={deleteSession}
    />
  )
}

export default App
