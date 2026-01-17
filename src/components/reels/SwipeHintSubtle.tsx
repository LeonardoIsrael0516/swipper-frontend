import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

interface SwipeHintSubtleProps {
  onDismiss?: () => void;
  autoHideAfter?: number; // milliseconds
}

export function SwipeHintSubtle({ onDismiss, autoHideAfter = 3000 }: SwipeHintSubtleProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Auto hide after timeout
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setIsVisible(false);
        onDismiss?.();
      }
    }, autoHideAfter);

    // Listen for any user interaction
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        setIsVisible(false);
        onDismiss?.();
      }
    };

    const events = ['scroll', 'touchstart', 'mousedown', 'keydown'];
    events.forEach((event) => {
      window.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, [hasInteracted, autoHideAfter, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[50] pointer-events-none flex items-center justify-center">
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-swipe-hint">
        {/* Arrow pointing up */}
        <div className="flex flex-col items-center gap-1 animate-bounce">
          <ChevronUp className="w-6 h-6 text-white/80 drop-shadow-lg" />
          <ChevronUp className="w-6 h-6 text-white/60 -mt-3 drop-shadow-lg" />
        </div>
      </div>
    </div>
  );
}

