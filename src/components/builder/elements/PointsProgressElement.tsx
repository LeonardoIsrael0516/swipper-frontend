import { SlideElement } from '@/contexts/BuilderContext';
import { usePoints } from '@/contexts/PointsContext';

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

interface PointsProgressElementProps {
  element: SlideElement;
  isInBuilder?: boolean;
}

export function PointsProgressElement({ element, isInBuilder = false }: PointsProgressElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const { totalPoints } = usePoints();

  const {
    position = 'top',
    style = 'bar',
    milestone = 100,
    backgroundColor = '#e5e7eb',
    fillColor = '#4CAF50',
    textColor = '#000000',
    showText = true,
  } = config;

  // No builder, usar pontos de exemplo para preview
  const displayPoints = isInBuilder ? 45 : totalPoints;
  const progress = Math.min(100, (displayPoints / milestone) * 100);

  const positionClasses = {
    top: 'top-4 left-1/2 -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  // No builder, usar absolute dentro do container
  const positionType = isInBuilder ? 'absolute' : 'fixed';

  if (style === 'circular') {
    return (
      <div className={`${positionType} z-40 ${positionClasses[position as keyof typeof positionClasses]}`}>
        <div className="relative w-16 h-16">
          <svg className="transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={backgroundColor}
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={fillColor}
              strokeWidth="4"
              strokeDasharray={`${(progress / 100) * 175.9} 175.9`}
              strokeLinecap="round"
            />
          </svg>
          {showText && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold" style={{ color: textColor }}>
                {displayPoints}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${positionType} z-40 ${positionClasses[position as keyof typeof positionClasses]}`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg min-w-[200px]">
        {showText && (
          <div className="text-xs font-medium mb-1" style={{ color: textColor }}>
            {displayPoints} / {milestone} pontos
          </div>
        )}
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: fillColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}

