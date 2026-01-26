import { useEffect } from 'react';
import { usePoints } from '@/contexts/PointsContext';

interface ReelPointsProgressProps {
  position?: 'top' | 'bottom' | 'top-left' | 'top-right';
  style?: 'bar' | 'circular';
  milestone?: number;
  progressColor?: string;
  backgroundColor?: string;
  textColor?: string;
  cardBackgroundColor?: string;
  circularProgressColor?: string;
  circularBackgroundColor?: string;
  isInBuilder?: boolean;
}

export function ReelPointsProgress({
  position = 'top',
  style = 'bar',
  milestone = 100,
  progressColor,
  backgroundColor,
  textColor,
  cardBackgroundColor,
  circularProgressColor,
  circularBackgroundColor,
  isInBuilder = false,
}: ReelPointsProgressProps) {
  const { totalPoints } = usePoints();
  // No builder, usar pontos de exemplo para preview
  const displayPoints = isInBuilder ? 45 : totalPoints;
  const progress = Math.min(100, (displayPoints / milestone) * 100);
  
  // Debug em desenvolvimento - usar useEffect para garantir que está sendo atualizado
  useEffect(() => {
    if (import.meta.env.DEV && !isInBuilder) {
      console.log('[ReelPointsProgress] Pontos atualizados:', {
        totalPoints,
        displayPoints,
        milestone,
        progress: `${progress.toFixed(2)}%`,
      });
    }
  }, [totalPoints, displayPoints, milestone, progress, isInBuilder]);
  
  // No builder, usar absolute dentro do container; na página pública, usar fixed
  const positionType = isInBuilder ? 'absolute' : 'fixed';

  const positionClasses = {
    top: 'top-4 left-1/2 -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  if (style === 'circular') {
    const bgColor = (circularBackgroundColor && typeof circularBackgroundColor === 'string' && circularBackgroundColor.trim()) || '#e5e7eb';
    const progColor = (circularProgressColor && typeof circularProgressColor === 'string' && circularProgressColor.trim()) || '#4CAF50';
    const txtColor = (textColor && typeof textColor === 'string' && textColor.trim()) || '#ffffff';
    
    return (
      <div className={`${positionType} z-40 ${positionClasses[position]}`}>
        <div className="relative w-16 h-16">
          <svg className="transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={bgColor}
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={progColor}
              strokeWidth="4"
              strokeDasharray={`${(progress / 100) * 175.9} 175.9`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold" style={{ color: txtColor }}>
              {displayPoints}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const cardBg = (cardBackgroundColor && typeof cardBackgroundColor === 'string' && cardBackgroundColor.trim()) || 'rgba(255, 255, 255, 0.9)';
  const barBg = (backgroundColor && typeof backgroundColor === 'string' && backgroundColor.trim()) || '#e5e7eb';
  const barProgress = (progressColor && typeof progressColor === 'string' && progressColor.trim()) || '#4CAF50';
  const txtColor = (textColor && typeof textColor === 'string' && textColor.trim()) || '#1f2937';
  
  return (
    <div className={`${positionType} z-40 ${positionClasses[position]}`}>
      <div 
        className="backdrop-blur-sm rounded-lg p-3 shadow-lg min-w-[200px]"
        style={{ backgroundColor: cardBg }}
      >
        <div className="text-xs font-medium mb-1" style={{ color: txtColor }}>
          {displayPoints} / {milestone} pontos
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: barBg }}>
          <div
            className="h-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: barProgress
            }}
          />
        </div>
      </div>
    </div>
  );
}

