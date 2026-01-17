import { useEffect, useState, useRef, memo } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
const normalizeUiConfig = (uiConfig: any): any => {
  if (!uiConfig) return {};
  if (typeof uiConfig === 'string') {
    try {
      return JSON.parse(uiConfig);
    } catch {
      return {};
    }
  }
  if (typeof uiConfig === 'object' && uiConfig !== null) {
    return uiConfig;
  }
  return {};
};

interface ReelProgressProps {
  element: SlideElement;
  isActive: boolean;
  onComplete?: () => void;
  onProgressChange?: (progress: number) => void;
}

export const ReelProgress = memo(function ReelProgress({ element, isActive, onComplete, onProgressChange }: ReelProgressProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    title = 'Estamos criando o seu plano personalizado',
    progress: targetProgress = 100,
    duration = 5,
    layout: rawLayout = 'linear',
    backgroundColor = '#ffffff',
    progressColor = '#007bff',
    textColor = '#000000',
    borderRadius = 12,
    padding = { top: 24, right: 24, bottom: 24, left: 24 },
  } = config;

  // Garantir que layout válido (remover rocket e wave se existirem)
  const layout = (rawLayout === 'circular' || rawLayout === 'pulse') ? rawLayout : 'linear';

  const [currentProgress, setCurrentProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  const isActiveRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onProgressChangeRef = useRef(onProgressChange);

  // Atualizar refs quando props mudarem (sem causar re-render)
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onProgressChangeRef.current = onProgressChange;
  }, [onComplete, onProgressChange]);

  // Animar progresso quando o slide ficar ativo
  useEffect(() => {
    if (!isActive) {
      // Reset quando desativar
      setCurrentProgress(0);
      startTimeRef.current = null;
      hasCompletedRef.current = false;
      isActiveRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Se já está animando e ainda está ativo, não reiniciar
    if (isActiveRef.current && animationFrameRef.current) {
      return;
    }

    // Iniciar animação
    setCurrentProgress(0);
    startTimeRef.current = Date.now();
    hasCompletedRef.current = false;
    isActiveRef.current = true;

    const animate = () => {
      if (!startTimeRef.current || !isActiveRef.current) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const elapsed = (Date.now() - startTimeRef.current!) / 1000; // em segundos
      const progressRatio = Math.min(elapsed / duration, 1); // 0 a 1
      const calculatedProgress = progressRatio * targetProgress; // 0 a targetProgress

      setCurrentProgress(calculatedProgress);

      // Notificar mudança de progresso
      if (onProgressChangeRef.current) {
        onProgressChangeRef.current(calculatedProgress);
      }

      if (calculatedProgress < targetProgress) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Completar
        setCurrentProgress(targetProgress);
        if (onProgressChangeRef.current) {
          onProgressChangeRef.current(targetProgress);
        }
        
        // Chamar onComplete apenas uma vez
        if (!hasCompletedRef.current && onCompleteRef.current) {
          hasCompletedRef.current = true;
          // Pequeno delay para garantir que a animação finalizou visualmente
          setTimeout(() => {
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
          }, 100);
        }
        
        // Parar animação
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive, duration, targetProgress]);

  const style: React.CSSProperties = {
    backgroundColor,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    padding: padding
      ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`
      : '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
  };

  // Layout Linear (Barra Horizontal)
  const renderLinear = () => (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          height: '24px',
          backgroundColor: '#e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${currentProgress}%`,
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: '12px',
            boxShadow: `0 0 10px ${progressColor}40`,
            position: 'relative',
            willChange: 'width',
          }}
        >
          {/* Efeito de brilho */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '8px', fontWeight: 'bold' }}>
        {Math.round(currentProgress)}%
      </div>
    </div>
  );

  // Layout Circular
  const renderCircular = () => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (currentProgress / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ willChange: 'stroke-dashoffset' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: textColor,
          }}
        >
          {Math.round(currentProgress)}%
        </div>
      </div>
    );
  };

  // Layout Pulse (Loading Pulsante)
  const renderPulse = () => {
    const scale = currentProgress / 100;

    return (
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        {/* Ondas concêntricas */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${scale + i * 0.2})`,
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: `2px solid ${progressColor}`,
              opacity: Math.max(0, 1 - (currentProgress / 100) - i * 0.3),
              willChange: 'transform, opacity',
            }}
          />
        ))}
        {/* Círculo principal */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: progressColor,
            opacity: 0.8,
            willChange: 'transform',
            boxShadow: `0 0 20px ${progressColor}60`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: textColor,
            zIndex: 1,
          }}
        >
          {Math.round(currentProgress)}%
        </div>
      </div>
    );
  };

  const renderLayout = () => {
    switch (layout) {
      case 'circular':
        return renderCircular();
      case 'pulse':
        return renderPulse();
      case 'linear':
      default:
        return renderLinear();
    }
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
      <div style={style}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', textAlign: 'center' }}>
          {title}
        </div>
        {renderLayout()}
      </div>
    </>
  );
});
