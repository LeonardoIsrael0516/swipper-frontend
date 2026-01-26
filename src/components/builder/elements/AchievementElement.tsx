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

interface AchievementElementProps {
  element: SlideElement;
  isInBuilder?: boolean;
}

export function AchievementElement({ element, isInBuilder = false }: AchievementElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const { totalPoints, subscribeToPointsGained } = usePoints();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const {
    title = 'Conquista Desbloqueada!',
    description = 'Parabéns!',
    icon = '🏆',
    condition = { type: 'points', value: 100 },
    duration = 3000,
    showInBuilder = true,
  } = config;

  // No builder, sempre mostrar preview
  useEffect(() => {
    if (isInBuilder) {
      setIsUnlocked(true);
      setShowAnimation(true);
      // No builder, manter sempre visível
    }
  }, [isInBuilder]);

  useEffect(() => {
    if (isInBuilder) return;

    const checkCondition = () => {
      if (condition.type === 'points' && totalPoints >= condition.value) {
        if (!isUnlocked) {
          setIsUnlocked(true);
          setShowAnimation(true);
          const timer = setTimeout(() => setShowAnimation(false), duration);
          return () => clearTimeout(timer);
        }
      }
    };

    checkCondition();

    let unsubscribe: (() => void) | undefined;

    if (condition.type === 'points') {
      const handlePointsGained = () => {
        checkCondition();
      };
      unsubscribe = subscribeToPointsGained(handlePointsGained);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInBuilder, totalPoints, condition, isUnlocked, duration, subscribeToPointsGained]);

  if (!isUnlocked || !showAnimation) return null;

  // No builder, usar absolute dentro do container
  const positionType = isInBuilder ? 'absolute' : 'fixed';

  return (
    <div className={`${positionType} inset-0 flex items-center justify-center z-50 pointer-events-none`}>
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl max-w-sm mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">{icon}</div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

