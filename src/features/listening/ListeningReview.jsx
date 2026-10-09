import { ArrowLeft, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { YouTubePlayer } from '@/components/youtube-player'
import { cn } from '@/lib/utils'
import { OPTIONS, getScore } from './score'

export function ListeningReview({ session, onChange, onResume, onDone }) {
  const { total, graded, correct } = getScore(session)
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0

  function setKey(index, option) {
    onChange((s) => {
      const key = [...s.key]
      key[index] = key[index] === option ? null : option
      return { key }
    })
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <header className="flex items-center gap-2 px-2 py-2">
        <Button variant="ghost" size="icon" aria-label="Back to home" onClick={onDone}>
          <ArrowLeft />
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{session.title || 'Review'}</p>
        <ThemeToggle />
      </header>

      <YouTubePlayer videoId={session.videoId} start={session.start} />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-4xl font-semibold tabular-nums">
            {correct}/{total}
          </p>
          <p className="text-sm text-muted-foreground">
            {graded < total
              ? `${graded} of ${total} graded — tap the correct answer for each question`
              : `${percent}%`}
          </p>
        </div>

        <ol className="flex flex-col gap-2">
          {session.answers.map((answer, i) => {
            const key = session.key[i] ?? null
            const isCorrect = key && answer === key
            return (
              <li
                key={i}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-2',
                  key && (isCorrect ? 'border-green-600/40 bg-green-600/10' : 'border-destructive/40 bg-destructive/10'),
                )}
              >
                <span className="w-6 text-right text-sm tabular-nums text-muted-foreground">{i + 1}.</span>
                <div className="flex w-12 items-center gap-1">
                  <span className="text-lg font-semibold">{answer ?? '–'}</span>
                  {key && (isCorrect ? <Check className="size-4 text-green-600" /> : <X className="size-4 text-destructive" />)}
                </div>
                <div className="ml-auto flex gap-1" role="group" aria-label={`Correct answer for question ${i + 1}`}>
                  {OPTIONS.map((option) => (
                    <Button
                      key={option}
                      size="icon"
                      variant={key === option ? 'default' : 'outline'}
                      aria-pressed={key === option}
                      onClick={() => setKey(i, option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
      </main>

      <footer className="grid grid-cols-2 gap-2 border-t p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <Button variant="outline" size="lg" onClick={onResume}>
          Keep practicing
        </Button>
        <Button size="lg" onClick={onDone}>
          Done
        </Button>
      </footer>
    </div>
  )
}
