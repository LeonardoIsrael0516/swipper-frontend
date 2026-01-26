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

interface ParticlesElementProps {
  element: SlideElement;
  isInBuilder?: boolean;
}

export function ParticlesElement({ element, isInBuilder = false }: ParticlesElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const { subscribeToPointsGained } = usePoints();
  const [isActive, setIsActive] = useState(false);

  const {
    particleType = 'star',
    colors = ['#FFD700', '#FF6B6B', '#4ECDC4'],
    particleCount = 30,
    duration = 2000,
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

  const particles = Array.from({ length: isInBuilder ? 15 : particleCount }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1 + Math.random(),
  }));

  // No builder, usar absolute dentro do container
  const positionType = isInBuilder ? 'absolute' : 'fixed';

  return (
    <div className={`${positionType} inset-0 pointer-events-none z-40`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            color: particle.color,
            animation: isInBuilder
              ? `particle-float ${particle.duration}s ${particle.delay}s ease-out infinite`
              : `particle-float ${particle.duration}s ${particle.delay}s ease-out forwards`,
          }}
        >
          {particleType === 'star' ? '⭐' : particleType === 'heart' ? '❤️' : '✨'}
        </div>
      ))}
      <style>{`
        @keyframes particle-float {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

