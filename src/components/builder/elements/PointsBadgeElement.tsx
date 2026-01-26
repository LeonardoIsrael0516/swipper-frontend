import { SlideElement } from '@/contexts/BuilderContext';
import { usePoints } from '@/contexts/PointsContext';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Função helper para normalizar uiConfig
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

interface PointsBadgeElementProps {
  element: SlideElement;
  isInBuilder?: boolean;
}

export function PointsBadgeElement({ element, isInBuilder = false }: PointsBadgeElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const { subscribeToPointsGained } = usePoints();
  
  const {
    position = 'top-right',
    duration = 2000,
    textFormat = '+{points} pontos',
    backgroundColor = '#4CAF50',
    textColor = '#ffffff',
    borderRadius = 12,
    fontSize = 16,
    padding = { top: 12, right: 16, bottom: 12, left: 16 },
    animationType = 'slide',
    showInBuilder = true,
  } = config;

  const [isVisible, setIsVisible] = useState(false);
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');

  // No builder, sempre mostrar preview
  useEffect(() => {
    if (isInBuilder) {
      setIsVisible(true);
      setPoints(10);
      setReason('Preview');
      // No builder, manter sempre visível
    }
  }, [isInBuilder]);

  // Escutar ganhos de pontos
  useEffect(() => {
    if (isInBuilder) return; // No builder, não escutar eventos reais

    const handlePointsGained = (gainedPoints: number, gainedReason: string) => {
      setPoints(gainedPoints);
      setReason(gainedReason);
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    };

    const unsubscribe = subscribeToPointsGained(handlePointsGained);

    return unsubscribe;
  }, [isInBuilder, duration, subscribeToPointsGained]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const animationClasses = {
    slide: 'animate-slide-in-right',
    fade: 'animate-fade-in',
    bounce: 'animate-bounce-in',
    scale: 'animate-scale-in',
  };

  const formattedText = textFormat.replace('{points}', points.toString());

  // No builder, usar absolute dentro do container do slide
  // Em produção, usar fixed para sobrepor tudo
  const positionType = isInBuilder ? 'absolute' : 'fixed';

  return (
    <div
      className={cn(
        `${positionType} z-50 pointer-events-none`,
        positionClasses[position as keyof typeof positionClasses],
        !isInBuilder && animationClasses[animationType as keyof typeof animationClasses]
      )}
      style={{
        backgroundColor,
        color: textColor,
        borderRadius,
        fontSize: `${fontSize}px`,
        paddingTop: padding.top,
        paddingRight: padding.right,
        paddingBottom: padding.bottom,
        paddingLeft: padding.left,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">{formattedText}</span>
      </div>
    </div>
  );
}

