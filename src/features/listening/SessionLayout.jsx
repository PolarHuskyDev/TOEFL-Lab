import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { YouTubePlayer } from '@/components/youtube-player'

/**
 * Shared shell for practice and review. Keeping the header and the player here means
 * switching between both views (Finish / Keep practicing) doesn't remount the video.
 */
export function SessionLayout({ session, title, onExit, children }) {
  return (
    <div className="mx-auto flex h-(--app-height) max-w-md flex-col">
      <header className="flex items-center gap-2 px-2 py-2">
        <Button variant="ghost" size="icon" aria-label="Back to home" onClick={onExit}>
          <ArrowLeft />
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{session.title || title}</p>
        <ThemeToggle />
      </header>

      <YouTubePlayer videoId={session.videoId} start={session.start} />

      {children}
    </div>
  )
}
