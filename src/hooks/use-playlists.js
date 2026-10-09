import { useCallback, useEffect, useState } from 'react'
import { PLAYLISTS } from '@/data/playlists'
import { fetchPlaylist, hasApiKey } from '@/lib/youtube-api'
import { parsePlaylistId } from '@/lib/youtube'

const CACHE_KEY = 'toefl-lab:playlists'
const USER_KEY = 'toefl-lab:user-playlists'
const MAX_AGE_MS = 12 * 60 * 60 * 1000 // refetch every 12 h

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

const readCache = () => readJson(CACHE_KEY, {})
const writeCache = (cache) => writeJson(CACHE_KEY, cache)

/** Playlists added by the user: [{ id, addedAt }] */
function readUserPlaylists() {
  const value = readJson(USER_KEY, [])
  return Array.isArray(value) ? value : []
}
const writeUserPlaylists = (list) => writeJson(USER_KEY, list)

/** Defaults first, then the user's playlists (in the order they were added). */
function mergePlaylists(userPlaylists) {
  const defaultIds = new Set(PLAYLISTS.map((p) => p.id))
  return [
    ...PLAYLISTS.map((p) => ({ ...p, isDefault: true })),
    ...userPlaylists.filter((p) => !defaultIds.has(p.id)).map((p) => ({ ...p, isDefault: false })),
  ]
}

const isStale = (entry) => !entry || Date.now() - entry.fetchedAt > MAX_AGE_MS

async function fetchPlaylists(list, force) {
  const cache = readCache()
  const errors = {}
  const targets = list.filter((p) => force || isStale(cache[p.id]))

  await Promise.all(
    targets.map(async (p) => {
      try {
        cache[p.id] = { data: await fetchPlaylist(p.id), fetchedAt: Date.now() }
      } catch (e) {
        errors[p.id] = e.message
      }
    }),
  )

  writeCache(cache)
  return { cache, errors }
}

/** Default + user-added playlists with their videos, cached in localStorage. */
export function usePlaylists() {
  const [userPlaylists, setUserPlaylists] = useState(readUserPlaylists)
  const [cache, setCache] = useState(readCache)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(
    () => hasApiKey && mergePlaylists(readUserPlaylists()).some((p) => isStale(readCache()[p.id])),
  )

  const list = mergePlaylists(userPlaylists)

  const apply = useCallback((result) => {
    setCache(result.cache)
    setErrors(result.errors)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!hasApiKey) return
    let cancelled = false
    fetchPlaylists(mergePlaylists(readUserPlaylists()), false).then((result) => {
      if (!cancelled) apply(result)
    })
    return () => {
      cancelled = true
    }
  }, [apply])

  const refresh = useCallback(() => {
    if (!hasApiKey) return
    setLoading(true)
    fetchPlaylists(mergePlaylists(readUserPlaylists()), true).then(apply)
  }, [apply])

  /** Validates the link, downloads the playlist and saves it. Throws an Error with a readable message. */
  const addPlaylist = useCallback(async (input) => {
    const id = parsePlaylistId(input)
    if (!id) throw new Error('That does not look like a YouTube playlist link.')

    const current = readUserPlaylists()
    if (mergePlaylists(current).some((p) => p.id === id)) throw new Error('This playlist is already in your list.')

    const data = await fetchPlaylist(id)

    const nextCache = { ...readCache(), [id]: { data, fetchedAt: Date.now() } }
    writeCache(nextCache)
    setCache(nextCache)

    const nextUser = [...current, { id, addedAt: Date.now() }]
    writeUserPlaylists(nextUser)
    setUserPlaylists(nextUser)
    return id
  }, [])

  /** Only user-added playlists can be removed. */
  const removePlaylist = useCallback((id) => {
    const nextUser = readUserPlaylists().filter((p) => p.id !== id)
    writeUserPlaylists(nextUser)
    setUserPlaylists(nextUser)

    const nextCache = readCache()
    delete nextCache[id]
    writeCache(nextCache)
    setCache(nextCache)
  }, [])

  const playlists = list.map((p) => {
    const data = cache[p.id]?.data
    return {
      id: p.id,
      isDefault: p.isDefault,
      name: p.name ?? data?.title ?? 'Playlist',
      channel: data?.channel ?? '',
      videos: data?.videos ?? [],
      error: errors[p.id] ?? null,
    }
  })

  return { playlists, loading, refresh, addPlaylist, removePlaylist, enabled: hasApiKey }
}
