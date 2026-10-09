const ID_RE = /^[A-Za-z0-9_-]{11}$/

/**
 * Extracts the video id (and optional start time) from any common YouTube URL:
 * youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/ or a bare 11-char id.
 */
export function parseYouTubeUrl(input) {
  const raw = input.trim()
  if (!raw) return null
  if (ID_RE.test(raw)) return { id: raw, start: 0 }

  let url
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '')
  let id = null

  if (host === 'youtu.be') {
    id = url.pathname.slice(1).split('/')[0]
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v')
    } else {
      const match = url.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/)
      if (match) id = match[2]
    }
  }

  if (!id || !ID_RE.test(id)) return null
  return { id, start: parseStart(url.searchParams.get('t') ?? url.searchParams.get('start')) }
}

function parseStart(value) {
  if (!value) return 0
  if (/^\d+s?$/.test(value)) return parseInt(value, 10)
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match) return 0
  const [, h = 0, m = 0, s = 0] = match
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

export function embedUrl(id, start = 0) {
  const params = new URLSearchParams({ playsinline: '1', rel: '0' })
  if (start) params.set('start', String(start))
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`
}

export function thumbnailUrl(id) {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
}

const titleCache = new Map()

/**
 * Gets the video title without an API key (oEmbed). Falls back to noembed.com if
 * YouTube's endpoint is blocked (CORS). Returns null if it can't be found.
 */
export async function fetchVideoTitle(videoId) {
  if (titleCache.has(videoId)) return titleCache.get(videoId)

  const watchUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)
  const endpoints = [
    `https://www.youtube.com/oembed?format=json&url=${watchUrl}`,
    `https://noembed.com/embed?url=${watchUrl}`,
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint)
      if (!res.ok) continue
      const data = await res.json()
      if (data?.title) {
        titleCache.set(videoId, data.title)
        return data.title
      }
    } catch {
      // network / CORS error: try the next endpoint
    }
  }
  return null
}

const PLAYLIST_ID_RE = /^[A-Za-z0-9_-]{12,64}$/

/** Extracts the playlist id from a YouTube playlist URL (`list=` param) or a bare id. */
export function parsePlaylistId(input) {
  const raw = input.trim()
  if (!raw) return null
  if (PLAYLIST_ID_RE.test(raw)) return raw
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    const id = url.searchParams.get('list')
    return id && PLAYLIST_ID_RE.test(id) ? id : null
  } catch {
    return null
  }
}
