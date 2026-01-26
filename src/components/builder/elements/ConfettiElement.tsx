import { SlideElement } from '@/contexts/BuilderContext';
import { usePoints } from '@/contexts/PointsContext';
import { useEffect, useState } from 'react';

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

interface ConfettiElementProps {
  element: SlideElement;
  isInBuilder?: boolean;
}

export function ConfettiElement({ element, isInBuilder = false }: ConfettiElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const { subscribeToPointsGained } = usePoints();
  const [isActive, setIsActive] = useState(false);

  const {
    colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
    particleCount = 50,
    duration = 3000,
    direction = 'top',
    triggers = ['onPointsGained'],
    showInBuilder = true,
  } = config;

  // No builder, sempre mostrar preview
  useEffect(() => {
    if (isInBuilder) {
      setIsActive(true);
      // No builder, manter ativo para preview contínuo
    }
  }, [isInBuilder]);

  useEffect(() => {
    if (isInBuilder) return;

    let unsubscribe: (() => void) | undefined;

    if (triggers.includes('onPointsGained')) {
      const handlePointsGained = () => {
        setIsActive(true);
        const timer = setTimeout(() => setIsActive(false), duration);
        return () => clearTimeout(timer);
      };
      unsubscribe = subscribeToPointsGained(handlePointsGained);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInBuilder, duration, triggers, subscribeToPointsGained]);

  if (!isActive) return null;

  const particles = Array.from({ length: isInBuilder ? 20 : particleCount }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 2,
  }));

  const directionClass = {
    top: 'top-0',
    bottom: 'bottom-0',
    center: 'top-1/2',
  }[direction] || 'top-0';

  // No builder, usar absolute dentro do container
  const positionType = isInBuilder ? 'absolute' : 'fixed';

  return (
    <div className={`${positionType} inset-0 pointer-events-none z-40 ${directionClass}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animation: isInBuilder 
              ? `confetti-fall ${particle.duration}s ${particle.delay}s ease-out infinite`
              : `confetti-fall ${particle.duration}s ${particle.delay}s ease-out forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

