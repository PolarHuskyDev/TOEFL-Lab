import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ChevronsRight, Flag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OPTIONS, emptySection, patchSection, trimSection } from './score'

export function ListeningPractice({ session, onChange, onFinish }) {
  const { sections, section, current } = session
  const answers = sections[section].answers
  const selected = answers[current] ?? null
  const isLastSection = section === sections.length - 1

  /** Picking an option saves it and jumps to the next question. Tapping the selected option again clears it. */
  function select(option) {
    onChange((s) => {
      const isSelected = s.sections[s.section].answers[s.current] === option
      if (isSelected) {
        return patchSection(s.sections, s.section, (sec) => {
          const next = [...sec.answers]
          next[s.current] = null
          return { ...sec, answers: next }
        })
      }
      return {
        ...patchSection(s.sections, s.section, (sec) => {
          const next = [...sec.answers]
          next[s.current] = option
          if (s.current === next.length - 1) next.push(null)
          return { ...sec, answers: next }
        }),
        current: s.current + 1,
      }
    })
  }

  function goNext() {
    onChange((s) => ({
      ...patchSection(s.sections, s.section, (sec) => {
        const next = [...sec.answers]
        if (s.current === next.length - 1) next.push(null)
        return { ...sec, answers: next }
      }),
      current: s.current + 1,
    }))
  }

  /** Back also crosses into the previous section (to its last question). */
  function goBack() {
    onChange((s) => {
      if (s.current > 0) return { current: s.current - 1 }
      if (s.section === 0) return {}
      const prev = s.section - 1
      return { section: prev, current: s.sections[prev].answers.length - 1 }
    })
  }

  function goToQuestion(index) {
    onChange({ current: index })
  }

  function goToSection(index) {
    onChange({ section: index, current: 0 })
  }

  /** Moves to the next section, creating it if the current one is the last. Question count restarts at 1. */
  function nextSection() {
    onChange((s) => {
      const { sections: next } = patchSection(s.sections, s.section, trimSection)
      if (s.section === next.length - 1) next.push(emptySection())
      return { sections: next, section: s.section + 1, current: 0 }
    })
  }

  return (
    <>
      <main className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
            {sections.map((_, i) => (
              <Button
                key={i}
                size="sm"
                variant={i === section ? 'secondary' : 'ghost'}
                aria-pressed={i === section}
                onClick={() => goToSection(i)}
              >
                Section {i + 1}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={nextSection}>
            {isLastSection ? <Plus data-icon="inline-start" /> : <ChevronsRight data-icon="inline-start" />}
            {isLastSection ? 'New section' : 'Next section'}
          </Button>
        </div>

        <QuestionStrip key={section} answers={answers} current={current} onSelect={goToQuestion} />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {sections.length > 1 ? `Section ${section + 1} · Question` : 'Question'}
          </p>
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

      <footer className="grid grid-cols-3 gap-2 border-t p-3">
        <Button variant="outline" size="lg" onClick={goBack} disabled={current === 0 && section === 0}>
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
    </>
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
