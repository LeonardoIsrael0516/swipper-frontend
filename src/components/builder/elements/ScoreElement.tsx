import React, { useState, useEffect, useRef } from 'react';
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

interface ScoreElementProps {
  element: SlideElement;
  isActive?: boolean;
}

// Componente para renderizar barra de progresso horizontal animada
const ProgressBarItem = ({ 
  title, 
  value, 
  percentage, 
  progressColor, 
  backgroundColor, 
  textColor, 
  isActive 
}: { 
  title: string; 
  value: string; 
  percentage: number; 
  progressColor: string; 
  backgroundColor: string; 
  textColor: string; 
  isActive?: boolean;
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Limpar animação anterior se existir
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!isActive) {
      setAnimatedPercentage(0);
      startTimeRef.current = null;
      return;
    }

    // Resetar para zero quando o slide fica ativo
    setAnimatedPercentage(0);
    const duration = 2000; // 2 segundos para animação
    const targetPercentage = Math.max(0, Math.min(100, percentage || 0));

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const currentPercentage = progress * targetPercentage;
      
      const clampedPercentage = Math.max(0, Math.min(100, currentPercentage));
      setAnimatedPercentage(clampedPercentage);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedPercentage(targetPercentage);
        animationRef.current = null;
      }
    };

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      startTimeRef.current = null;
    };
  }, [percentage, isActive]);

  const displayPercentage = isActive ? animatedPercentage : 0;

  return (
    <div style={{ width: '100%', marginBottom: '16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px' 
      }}>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: '500', 
          color: textColor || '#000000' 
        }}>
          {title}
        </span>
        <span style={{ 
          fontSize: '14px', 
          color: textColor || '#000000',
          marginLeft: '12px' 
        }}>
          {value}
        </span>
      </div>
      <div style={{
        width: '100%',
        height: '12px',
        backgroundColor: backgroundColor || '#e5e7eb',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div
          style={{
            width: `${displayPercentage}%`,
            height: '100%',
            backgroundColor: progressColor || '#ef4444',
            borderRadius: '6px',
            transition: 'width 0.1s ease',
            boxShadow: `0 0 8px ${progressColor || '#ef4444'}40`,
            position: 'relative',
          }}
        >
          {/* Indicador circular no final da barra */}
          {displayPercentage > 0 && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: `2px solid ${progressColor || '#ef4444'}`,
              }}
            />
          )}
        </div>
      </div>
      <div style={{ 
        textAlign: 'right', 
        fontSize: '12px', 
        color: textColor || '#000000',
        marginTop: '4px' 
      }}>
        {Math.round(Math.max(0, Math.min(100, displayPercentage)))}%
      </div>
    </div>
  );
};

export function ScoreElement({ element, isActive = true }: ScoreElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    title = 'HOJE',
    showImage = true,
    imageUrl = null,
    imageSize = 100,
    titleColor = '#22c55e',
    items = [],
  } = config;

  const containerStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  if (items.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', opacity: 0.6 }}>
          <p>Adicione itens ao Score</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Título */}
      <div style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color: titleColor,
        textAlign: 'left',
        marginBottom: showImage && imageUrl ? '12px' : '0',
      }}>
        {title}
      </div>

      {/* Imagem */}
      {showImage && imageUrl && (
        <div style={{ 
          width: '100%', 
          marginBottom: '16px',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
          <img 
            src={imageUrl} 
            alt={title} 
            style={{ 
              width: `${imageSize}%`, 
              height: 'auto', 
              display: 'block',
              objectFit: 'cover',
            }} 
          />
        </div>
      )}

      {/* Itens de progresso */}
      <div style={{ width: '100%' }}>
        {items.map((item: any, index: number) => {
          const itemProgressColor = item.progressColor || '#ef4444';
          const itemBackgroundColor = item.backgroundColor || '#e5e7eb';
          const itemTextColor = item.textColor || '#000000';
          
          return (
            <ProgressBarItem
              key={item.id || index}
              title={item.title || `Item ${index + 1}`}
              value={item.value || ''}
              percentage={item.percentage ?? 0}
              progressColor={itemProgressColor}
              backgroundColor={itemBackgroundColor}
              textColor={itemTextColor}
              isActive={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}

