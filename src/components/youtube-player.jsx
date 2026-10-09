import { memo } from 'react'
import { cn } from '@/lib/utils'
import { embedUrl } from '@/lib/youtube'

export const YouTubePlayer = memo(function YouTubePlayer({ videoId, start = 0, className }) {
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden bg-black', className)}>
      <iframe
        key={videoId}
        src={embedUrl(videoId, start)}
        title="YouTube video player"
        className="absolute inset-0 size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  )
})
