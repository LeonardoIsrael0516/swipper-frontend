import { useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReelCarouselProps {
  items: ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  showControls?: boolean;
  className?: string;
}

export function ReelCarousel({
  items,
  autoPlay = false,
  interval = 3000,
  showControls = true,
  className = '',
}: ReelCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const previous = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  // Auto-play
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length]);

  if (items.length === 0) return null;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Carousel Items */}
      <div className="relative w-full h-full overflow-hidden rounded-xl">
        {items.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
              index === currentIndex
                ? 'translate-x-0 opacity-100'
                : index < currentIndex
                ? '-translate-x-full opacity-0'
                : 'translate-x-full opacity-0'
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Controls */}
      {showControls && items.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={previous}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

