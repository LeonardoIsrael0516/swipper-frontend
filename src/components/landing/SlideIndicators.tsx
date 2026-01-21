import { cn } from '@/lib/utils';

interface SlideIndicatorsProps {
  totalSlides: number;
  currentSlide: number;
  onSlideClick?: (slideIndex: number) => void;
}

export function SlideIndicators({ totalSlides, currentSlide, onSlideClick }: SlideIndicatorsProps) {
  // Calcular progresso de cada barra
  const getBarProgress = (index: number): number => {
    if (index < currentSlide) {
      return 1; // 100% completo (já passou)
    } else if (index === currentSlide) {
      return 1; // 100% completo (slide atual)
    } else {
      return 0; // 0% (ainda não chegou)
    }
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-1">
          {Array.from({ length: totalSlides }).map((_, index) => {
            const progress = getBarProgress(index);
            const isActive = index === currentSlide;
            
            return (
              <button
                key={index}
                onClick={() => onSlideClick?.(index)}
                className={cn(
                  'flex-1 h-1 rounded-full overflow-hidden transition-all duration-300 pointer-events-auto',
                  'hover:h-1.5'
                )}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }}
                aria-label={`Ir para slide ${index + 1}`}
              >
                <div
                  className={cn(
                    'h-full origin-left transition-transform duration-300 ease-out',
                    isActive ? 'bg-primary' : 'bg-primary/60'
                  )}
                  style={{
                    transform: `scaleX(${progress})`,
                    willChange: isActive ? 'transform' : 'auto',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

