import { useCallback, useEffect, useState } from 'react'
import { emptySection } from '@/features/listening/score'

const STORAGE_KEY = 'toefl-lab:listening:sessions'

function load() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(value) ? value.map(migrate) : []
  } catch {
    return []
  }
}

/** Sessions saved before sections existed had answers/key at the top level. */
function migrate(session) {
  if (Array.isArray(session.sections)) return session
  const migrated = {
    ...session,
    section: 0,
    sections: [{ answers: session.answers?.length ? session.answers : [null], key: session.key ?? [] }],
  }
  delete migrated.answers
  delete migrated.key
  return migrated
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/**
 * Session shape:
 * {
 *   id, videoId, start, url, title, playlistId,
 *   status: 'in-progress' | 'finished',
 *   section: number,            // index of the current section
 *   current: number,            // index of the question inside the current section
 *   sections: {
 *     answers: ('A'|'B'|'C'|'D'|null)[],
 *     key: ('A'|'B'|'C'|'D'|null)[], // correct answers, filled in on review
 *   }[],
 *   createdAt, updatedAt
 * }
 */
export function useSessions() {
  const [sessions, setSessions] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch {
      // storage full or unavailable: keep working in memory
    }
  }, [sessions])

  const createSession = useCallback(({ videoId, start = 0, url, title = '', playlistId = null }) => {
    const now = Date.now()
    const session = {
      id: newId(),
      videoId,
      start,
      url,
      title,
      playlistId,
      status: 'in-progress',
      section: 0,
      current: 0,
      sections: [emptySection()],
      createdAt: now,
      updatedAt: now,
    }
    setSessions((prev) => [session, ...prev])
    return session.id
  }, [])

  /** patch can be an object or a function (session) => partialSession */
  const updateSession = useCallback((id, patch) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const changes = typeof patch === 'function' ? patch(s) : patch
        return { ...s, ...changes, updatedAt: Date.now() }
      }),
    )
  }, [])

  const deleteSession = useCallback((id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { sessions, createSession, updateSession, deleteSession }
}
