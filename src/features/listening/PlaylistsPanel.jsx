import { useMemo, useState } from 'react'
import { ChevronDown, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePlaylists } from '@/hooks/use-playlists'
import { thumbnailUrl } from '@/lib/youtube'
import { cn } from '@/lib/utils'
import { getScore } from './score'

export function PlaylistsPanel({ sessions, onPickVideo }) {
  const { playlists, loading, refresh, addPlaylist, removePlaylist, enabled } = usePlaylists()
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(() => new Set(playlists[0] ? [playlists[0].id] : []))

  // Latest session per video, to show progress next to each video.
  const latestByVideo = useMemo(() => {
    const map = new Map()
    for (const s of sessions) {
      const prev = map.get(s.videoId)
      if (!prev || s.updatedAt > prev.updatedAt) map.set(s.videoId, s)
    }
    return map
  }, [sessions])

  if (!enabled) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        To load playlists, add <code className="font-mono">VITE_YOUTUBE_API_KEY</code> to{' '}
        <code className="font-mono">.env.local</code> and restart the app.
      </p>
    )
  }

  function toggle(id) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Playlists</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw data-icon="inline-start" className={cn(loading && 'animate-spin')} />
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
          <Button
            variant={adding ? 'secondary' : 'outline'}
            size="icon"
            aria-label={adding ? 'Cancel' : 'Add playlist'}
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? <X /> : <Plus />}
          </Button>
        </div>
      </div>

      {adding && (
        <AddPlaylistForm
          onAdd={addPlaylist}
          onAdded={(id) => {
            setAdding(false)
            setOpen((prev) => new Set(prev).add(id))
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {playlists.map((playlist) => {
        const isOpen = open.has(playlist.id)
        return (
          <div key={playlist.id} className="overflow-hidden rounded-lg border">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => toggle(playlist.id)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{playlist.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[playlist.channel, `${playlist.videos.length} videos`].filter(Boolean).join(' · ')}
                  </p>
                  {playlist.error && <p className="text-xs text-destructive">{playlist.error}</p>}
                </div>
                <ChevronDown className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {!playlist.isDefault && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2"
                  aria-label="Remove playlist"
                  onClick={() => {
                    if (window.confirm(`Remove "${playlist.name}"? Your practice history is kept.`)) {
                      removePlaylist(playlist.id)
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              )}
            </div>

            {isOpen && (
              <ul className="flex flex-col border-t">
                {playlist.videos.length === 0 && (
                  <li className="p-3 text-sm text-muted-foreground">{loading ? 'Loading videos…' : 'No videos.'}</li>
                )}
                {playlist.videos.map((video, i) => (
                  <li key={video.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => onPickVideo({ ...video, playlistId: playlist.id })}
                      className="flex w-full items-center gap-3 p-2 text-left hover:bg-muted"
                    >
                      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                      <img
                        src={thumbnailUrl(video.id)}
                        alt=""
                        loading="lazy"
                        className="aspect-video w-20 shrink-0 rounded bg-muted object-cover"
                      />
                      <p className="line-clamp-2 min-w-0 flex-1 text-sm">{video.title}</p>
                      <VideoStatus session={latestByVideo.get(video.id)} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}

function VideoStatus({ session }) {
  if (!session) return null
  if (session.status === 'in-progress') {
    return <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px]">In progress</span>
  }
  const { total, graded, correct } = getScore(session)
  return (
    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground tabular-nums">
      {graded > 0 ? `${correct}/${total}` : 'Done'}
    </span>
  )
}

function AddPlaylistForm({ onAdd, onAdded, onCancel }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const id = await onAdd(value)
      onAdded(id)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border p-3">
      <Input
        autoFocus
        type="url"
        inputMode="url"
        placeholder="https://www.youtube.com/playlist?list=..."
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (error) setError('')
        }}
        aria-invalid={!!error}
        disabled={saving}
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !value.trim()}>
          {saving ? 'Adding…' : 'Add playlist'}
        </Button>
      </div>
    </form>
  )
}
