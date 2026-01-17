import { useEffect, useState } from 'react';
import { ChevronUp, Hand } from 'lucide-react';

interface SwipeHintProps {
  onDismiss?: () => void;
  autoHideAfter?: number; // milliseconds
}

export function SwipeHint({ onDismiss, autoHideAfter = 5000 }: SwipeHintProps) {
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
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-swipe-hint">
        {/* Hand icon with swipe animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-2xl">
            <Hand className="w-8 h-8 text-gray-900" />
          </div>
        </div>

        {/* Text */}
        <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3">
          <p className="text-white text-sm font-medium flex items-center gap-2">
            <ChevronUp className="w-4 h-4 animate-bounce" />
            Deslize para cima
          </p>
        </div>

        {/* Arrow pointing up */}
        <div className="flex flex-col items-center gap-1 animate-bounce">
          <ChevronUp className="w-6 h-6 text-white/80" />
          <ChevronUp className="w-6 h-6 text-white/60 -mt-3" />
        </div>
      </div>
    </div>
  );
}

