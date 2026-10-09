import { useEffect, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { YouTubePlayer } from '@/components/youtube-player'
import { cn } from '@/lib/utils'
import { OPTIONS } from './score'

export function ListeningPractice({ session, onChange, onFinish, onExit }) {
  const { answers, current } = session
  const selected = answers[current] ?? null

  function select(option) {
    onChange((s) => {
      const next = [...s.answers]
      next[s.current] = next[s.current] === option ? null : option
      return { answers: next }
    })
  }

  function goNext() {
    onChange((s) => {
      const next = [...s.answers]
      if (s.current === next.length - 1) next.push(null)
      return { answers: next, current: s.current + 1 }
    })
  }

  function goBack() {
    onChange((s) => ({ current: Math.max(0, s.current - 1) }))
  }

  function goTo(index) {
    onChange({ current: index })
  }

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col">
      <header className="flex items-center gap-2 px-2 py-2">
        <Button variant="ghost" size="icon" aria-label="Back to home" onClick={onExit}>
          <ArrowLeft />
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{session.title || 'Listening practice'}</p>
        <ThemeToggle />
      </header>

      <YouTubePlayer videoId={session.videoId} start={session.start} />

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <QuestionStrip answers={answers} current={current} onSelect={goTo} />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Question</p>
          <p className="text-5xl font-semibold tabular-nums">{current + 1}</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {OPTIONS.map((option) => (
            <Button
              key={option}
              variant={selected === option ? 'default' : 'outline'}
              aria-pressed={selected === option}
              onClick={() => select(option)}
              className="h-16 text-2xl font-semibold"
            >
              {option}
            </Button>
          ))}
        </div>
      </main>

      <footer className="grid grid-cols-3 gap-2 border-t p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <Button variant="outline" size="lg" onClick={goBack} disabled={current === 0}>
          <ChevronLeft data-icon="inline-start" />
          Back
        </Button>
        <Button variant="secondary" size="lg" onClick={goNext}>
          Next
          <ChevronRight data-icon="inline-end" />
        </Button>
        <Button size="lg" onClick={onFinish}>
          <Flag data-icon="inline-start" />
          Finish
        </Button>
      </footer>
    </div>
  )
}

function QuestionStrip({ answers, current, onSelect }) {
  const refs = useRef([])

  useEffect(() => {
    refs.current[current]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [current])

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {answers.map((answer, i) => (
        <button
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Question ${i + 1}${answer ? `, answer ${answer}` : ''}`}
          className={cn(
            'flex size-9 shrink-0 flex-col items-center justify-center rounded-full border text-xs leading-none tabular-nums',
            answer && 'bg-muted',
            i === current && 'border-primary ring-2 ring-primary/30',
          )}
        >
          <span>{i + 1}</span>
          {answer && <span className="text-[10px] font-semibold text-muted-foreground">{answer}</span>}
        </button>
      ))}
    </div>
  )
}
