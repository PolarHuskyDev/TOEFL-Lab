import { useState } from 'react'
import { Headphones, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { parseYouTubeUrl, thumbnailUrl } from '@/lib/youtube'
import { getScore } from './score'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function ListeningHome({ sessions, onStart, onOpen, onDelete }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const parsed = parseYouTubeUrl(url)
    if (!parsed) {
      setError('That does not look like a valid YouTube link.')
      return
    }
    onStart({ videoId: parsed.id, start: parsed.start, url: url.trim(), title: title.trim() })
    setUrl('')
    setTitle('')
    setError('')
  }

  const inProgress = sessions.filter((s) => s.status === 'in-progress')
  const finished = sessions.filter((s) => s.status === 'finished')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4">
      <header className="flex items-center gap-2 pt-2">
        <Headphones className="size-6" />
        <h1 className="text-xl font-semibold">Listening practice</h1>
        <ThemeToggle className="ml-auto" />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>New practice</CardTitle>
          <CardDescription>Paste a YouTube video with TOEFL listening questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              type="url"
              inputMode="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (error) setError('')
              }}
              aria-invalid={!!error}
              required
            />
            <Input
              placeholder="Name (optional), e.g. Lecture 3 – Biology"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg">
              Start
            </Button>
          </form>
        </CardContent>
      </Card>

      <SessionList title="In progress" sessions={inProgress} onOpen={onOpen} onDelete={onDelete} />
      <SessionList title="History" sessions={finished} onOpen={onOpen} onDelete={onDelete} />

      {sessions.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Your practice sessions will show up here.</p>
      )}
    </div>
  )
}

function SessionList({ title, sessions, onOpen, onDelete }) {
  if (sessions.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <SessionItem key={s.id} session={s} onOpen={onOpen} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  )
}

function SessionItem({ session, onOpen, onDelete }) {
  const { total, graded, correct } = getScore(session)
  const finished = session.status === 'finished'

  let summary = `${total} question${total === 1 ? '' : 's'}`
  if (finished && graded > 0) summary = `${correct}/${total} correct`
  else if (finished) summary += ' · not graded'
  if (session.sections.length > 1) summary += ` · ${session.sections.length} sections`

  return (
    <li className="flex items-center gap-3 rounded-lg border p-2">
      <button
        type="button"
        onClick={() => onOpen(session)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <img
          src={thumbnailUrl(session.videoId)}
          alt=""
          loading="lazy"
          className="aspect-video w-24 shrink-0 rounded-md bg-muted object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{session.title || `Video ${session.videoId}`}</p>
          <p className="text-xs text-muted-foreground">{dateFormat.format(session.createdAt)}</p>
          <p className="text-xs">{summary}</p>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete"
        onClick={() => {
          if (window.confirm('Delete this practice?')) onDelete(session.id)
        }}
      >
        <Trash2 />
      </Button>
    </li>
  )
}
