const API_URL = 'https://www.googleapis.com/youtube/v3'
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

export const hasApiKey = Boolean(API_KEY)

const HIDDEN_TITLES = new Set(['Private video', 'Deleted video'])
const MAX_VIDEOS = 500

async function get(path, params) {
  const url = new URL(`${API_URL}/${path}`)
  for (const [k, v] of Object.entries({ ...params, key: API_KEY })) {
    if (v != null && v !== '') url.searchParams.set(k, v)
  }
  const res = await fetch(url)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error?.message ?? `YouTube API error (${res.status})`)
  return data
}

/** Returns { id, title, channel, videos: [{ id, title }] } */
export async function fetchPlaylist(playlistId) {
  const info = await get('playlists', { part: 'snippet', id: playlistId })
  const snippet = info.items?.[0]?.snippet
  if (!snippet) throw new Error('Playlist not found or private')

  const videos = []
  let pageToken = ''
  do {
    const page = await get('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: '50',
      pageToken,
    })
    for (const item of page.items ?? []) {
      const id = item.contentDetails?.videoId
      const title = item.snippet?.title ?? ''
      if (!id || HIDDEN_TITLES.has(title)) continue
      videos.push({ id, title })
    }
    pageToken = page.nextPageToken ?? ''
  } while (pageToken && videos.length < MAX_VIDEOS)

  return { id: playlistId, title: snippet.title, channel: snippet.channelTitle, videos }
}
