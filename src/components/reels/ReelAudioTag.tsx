import { Slide } from '@/contexts/BuilderContext';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReelAudioTagProps {
  slide: Slide | null;
  className?: string;
}

export function ReelAudioTag({ slide, className }: ReelAudioTagProps) {
  if (!slide?.audioTag) {
    return null;
  }

  // Verificar se o slide tem vídeo no background
  const hasVideo = slide.backgroundConfig?.type === 'video' || 
                   slide.uiConfig?.backgroundConfig?.type === 'video';

  if (!hasVideo) {
    return null;
  }

  return (
    <div className={cn('absolute left-3 bottom-4 z-40', className)}>
      <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/20">
        <Music className="w-2.5 h-2.5 text-white drop-shadow-md" />
        <span className="text-white text-[10px] font-medium truncate max-w-[180px] drop-shadow-md">
          {slide.audioTag}
        </span>
      </div>
    </div>
  );
}

