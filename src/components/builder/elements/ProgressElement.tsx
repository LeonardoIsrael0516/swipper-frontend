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

interface ProgressElementProps {
  element: SlideElement;
}

export function ProgressElement({ element }: ProgressElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    title = 'Estamos criando o seu plano personalizado',
    progress = 100,
    layout: rawLayout = 'linear',
    backgroundColor = '#ffffff',
    progressColor = '#007bff',
    textColor = '#000000',
    borderRadius = 12,
    padding = { top: 24, right: 24, bottom: 24, left: 24 },
  } = config;

  // Garantir que layout válido (remover rocket e wave se existirem)
  const layout = (rawLayout === 'circular' || rawLayout === 'pulse') ? rawLayout : 'linear';

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

  // Preview estático do layout linear
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
            width: `${progress}%`,
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: '12px',
            transition: 'width 0.3s ease',
            boxShadow: `0 0 10px ${progressColor}40`,
          }}
        />
      </div>
      <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '8px' }}>
        {progress}%
      </div>
    </div>
  );

  // Preview estático do layout circular
  const renderCircular = () => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

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
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
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
          {progress}%
        </div>
      </div>
    );
  };

  // Preview estático do layout pulse
  const renderPulse = () => {
    const scale = progress / 100;

    return (
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
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
            transition: 'transform 0.3s ease',
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
          {progress}%
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
    <div style={style}>
      <div style={{ fontWeight: 'bold', fontSize: '18px', textAlign: 'center' }}>
        {title}
      </div>
      {renderLayout()}
    </div>
  );
}

