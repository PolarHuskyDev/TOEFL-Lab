export const OPTIONS = ['A', 'B', 'C', 'D']

export function getScore(session) {
  const total = session.answers.length
  let graded = 0
  let correct = 0
  session.answers.forEach((answer, i) => {
    const key = session.key[i]
    if (!key) return
    graded++
    if (answer === key) correct++
  })
  return { total, graded, correct }
}

/** Drops empty questions at the end (e.g. pressing Next and then Finish). Keeps at least one. */
export function trimTrailingEmpty(answers) {
  const out = [...answers]
  while (out.length > 1 && out[out.length - 1] == null) out.pop()
  return out
}
