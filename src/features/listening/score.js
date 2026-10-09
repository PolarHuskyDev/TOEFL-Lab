export const OPTIONS = ['A', 'B', 'C', 'D']

export function emptySection() {
  return { answers: [null], key: [] }
}

export function getSectionScore(section) {
  const total = section.answers.length
  let graded = 0
  let correct = 0
  section.answers.forEach((answer, i) => {
    const key = section.key[i]
    if (!key) return
    graded++
    if (answer === key) correct++
  })
  return { total, graded, correct }
}

/** Totals across all sections of a session. */
export function getScore(session) {
  return session.sections.reduce(
    (acc, section) => {
      const s = getSectionScore(section)
      return { total: acc.total + s.total, graded: acc.graded + s.graded, correct: acc.correct + s.correct }
    },
    { total: 0, graded: 0, correct: 0 },
  )
}

/** Drops empty questions at the end (e.g. pressing Next and then Finish). Keeps at least one. */
export function trimTrailingEmpty(answers) {
  const out = [...answers]
  while (out.length > 1 && out[out.length - 1] == null) out.pop()
  return out
}

export function trimSection(section) {
  return { ...section, answers: trimTrailingEmpty(section.answers) }
}

/** Trims every section and removes sections with no answers at all (always keeps at least one). */
export function finalizeSections(sections) {
  const trimmed = sections.map(trimSection)
  const used = trimmed.filter((s) => s.answers.some((a) => a != null))
  return used.length > 0 ? used : [trimmed[0] ?? emptySection()]
}

/** Returns { sections } with sections[index] replaced by fn(sections[index]). */
export function patchSection(sections, index, fn) {
  const next = [...sections]
  next[index] = fn(next[index])
  return { sections: next }
}
