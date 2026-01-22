import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DesktopNavigationArrowsProps {
  currentSlide: number;
  totalSlides: number;
  canGoUp: boolean;
  canGoDown: boolean;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
}

export function DesktopNavigationArrows({
  currentSlide,
  totalSlides,
  canGoUp,
  canGoDown,
  onNavigateUp,
  onNavigateDown,
}: DesktopNavigationArrowsProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Verificar se é desktop (largura maior que 768px)
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, []);

  if (!isDesktop || totalSlides <= 1) {
    return null;
  }

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 flex-col gap-2">
      {/* Seta para cima */}
      <button
        onClick={onNavigateUp}
        disabled={!canGoUp}
        className={`
          w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm 
          flex items-center justify-center shadow-lg
          transition-all duration-200
          ${canGoUp 
            ? 'hover:bg-white hover:scale-110 cursor-pointer active:scale-95' 
            : 'opacity-30 cursor-not-allowed'
          }
        `}
        aria-label="Slide anterior"
      >
        <ChevronUp 
          className={`w-6 h-6 ${canGoUp ? 'text-gray-900' : 'text-gray-400'}`} 
        />
      </button>

      {/* Seta para baixo */}
      <button
        onClick={onNavigateDown}
        disabled={!canGoDown}
        className={`
          w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm 
          flex items-center justify-center shadow-lg
          transition-all duration-200
          ${canGoDown 
            ? 'hover:bg-white hover:scale-110 cursor-pointer active:scale-95' 
            : 'opacity-30 cursor-not-allowed'
          }
        `}
        aria-label="Próximo slide"
      >
        <ChevronDown 
          className={`w-6 h-6 ${canGoDown ? 'text-gray-900' : 'text-gray-400'}`} 
        />
      </button>
    </div>
  );
}

