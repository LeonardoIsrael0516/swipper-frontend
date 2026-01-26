import { useEffect, useState } from 'react';
import { usePoints } from '@/contexts/PointsContext';

interface ReelAchievementProps {
  title?: string;
  description?: string;
  icon?: string;
  condition?: {
    type: 'points';
    value: number;
  };
  duration?: number;
}

export function ReelAchievement({
  title = 'Conquista Desbloqueada!',
  description = 'Parabéns!',
  icon = '🏆',
  condition = { type: 'points', value: 100 },
  duration = 3000,
}: ReelAchievementProps) {
  const { totalPoints, subscribeToPointsGained } = usePoints();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
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
  }, [totalPoints, condition, isUnlocked, duration, subscribeToPointsGained]);

  if (!isUnlocked || !showAnimation) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl max-w-sm mx-4 animate-bounce-in">
        <div className="text-center">
          <div className="text-6xl mb-4">{icon}</div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

