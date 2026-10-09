import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OPTIONS, getScore, getSectionScore, patchSection } from './score'

export function ListeningReview({ session, onChange, onResume, onDone }) {
  const { total, graded, correct } = getScore(session)
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0

  const multiple = session.sections.length > 1

  function setKey(sectionIndex, index, option) {
    onChange((s) =>
      patchSection(s.sections, sectionIndex, (sec) => {
        const key = [...sec.key]
        key[index] = key[index] === option ? null : option
        return { ...sec, key }
      }),
    )
  }

  return (
    <>
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

        {session.sections.map((section, sectionIndex) => (
          <SectionAnswers
            key={sectionIndex}
            section={section}
            title={multiple ? `Section ${sectionIndex + 1}` : null}
            onSetKey={(i, option) => setKey(sectionIndex, i, option)}
          />
        ))}
      </main>

      <footer className="grid grid-cols-2 gap-2 border-t p-3">
        <Button variant="outline" size="lg" onClick={onResume}>
          Keep practicing
        </Button>
        <Button size="lg" onClick={onDone}>
          Done
        </Button>
      </footer>
    </>
  )
}

function SectionAnswers({ section, title, onSetKey }) {
  const { total, graded, correct } = getSectionScore(section)

  return (
    <section className="flex flex-col gap-2">
      {title && (
        <div className="flex items-baseline justify-between pt-2">
          <h2 className="text-sm font-medium">{title}</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {graded > 0 ? `${correct}/${total}` : `${total} question${total === 1 ? '' : 's'}`}
          </span>
        </div>
      )}
      <ol className="flex flex-col gap-2">
        {section.answers.map((answer, i) => {
          const key = section.key[i] ?? null
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
                    onClick={() => onSetKey(i, option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
