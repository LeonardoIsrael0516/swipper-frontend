import { memo, useLayoutEffect, useState, useRef } from 'react';

interface ReelProgressBarProps {
  currentSlide: number;
  totalSlides: number;
}

export const ReelProgressBar = memo(function ReelProgressBar({
  currentSlide,
  totalSlides,
}: ReelProgressBarProps) {
  const [displayedSlide, setDisplayedSlide] = useState(currentSlide);
  const prevSlideRef = useRef(currentSlide);
  const animationFrameRef = useRef<number | null>(null);

  // Sincronizar imediatamente quando currentSlide mudar usando useLayoutEffect
  useLayoutEffect(() => {
    // Cancelar animação anterior se houver
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Atualizar imediatamente para slides completos (já passados)
    if (currentSlide > prevSlideRef.current) {
      // Avançando: atualizar imediatamente
      setDisplayedSlide(currentSlide);
      prevSlideRef.current = currentSlide;
    } else if (currentSlide < prevSlideRef.current) {
      // Retrocedendo: atualizar imediatamente
      setDisplayedSlide(currentSlide);
      prevSlideRef.current = currentSlide;
    } else {
      // Mesmo slide: garantir sincronização
      setDisplayedSlide(currentSlide);
      prevSlideRef.current = currentSlide;
    }
  }, [currentSlide]);

  // Calcular progresso de cada barra usando transform para melhor performance
  // Cada barrinha é preenchida completamente quando o slide correspondente está ativo
  const getBarProgress = (index: number): number => {
    if (index <= displayedSlide) {
      return 1; // 100% completo (já passou ou está no slide atual)
    } else {
      return 0; // 0% (ainda não chegou)
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 reel-progress-bar">
      <div className="flex-1 flex gap-1">
        {Array.from({ length: totalSlides }).map((_, index) => {
          const progress = getBarProgress(index);
          const isActive = index === displayedSlide;
          
          return (
            <div
              key={index}
              className="flex-1 h-1 rounded-full overflow-hidden"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="h-full origin-left transition-transform duration-300 ease-out"
                style={{
                  transform: `scaleX(${progress})`,
                  willChange: isActive ? 'transform' : 'auto',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 4px rgba(255, 255, 255, 0.8), 0 0 8px rgba(255, 255, 255, 0.4), inset 0 1px 0 rgba(0, 0, 0, 0.1)',
                  // Adicionar contorno escuro para contraste em fundos claros
                  filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

