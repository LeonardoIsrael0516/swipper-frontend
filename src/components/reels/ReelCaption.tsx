import { Slide } from '@/contexts/BuilderContext';
import { SocialConfig } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';

interface ReelCaptionProps {
  slide: Slide | null;
  socialConfig?: SocialConfig;
  className?: string;
}

export function ReelCaption({ slide, socialConfig, className }: ReelCaptionProps) {
  if (!socialConfig?.enabled || !socialConfig?.showCaptions || !slide?.caption) {
    return null;
  }

  // Processar hashtags e formatação básica
  const processCaption = (caption: string) => {
    // Dividir por espaços e processar hashtags
    const parts = caption.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-blue-400 font-semibold">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={cn('absolute left-3 bottom-11 z-40 max-w-[calc(100%-7rem)]', className)}>
      <div className="text-white text-xs drop-shadow-lg leading-relaxed">
        {processCaption(slide.caption)}
      </div>
    </div>
  );
}

