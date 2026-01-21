import React, { useState, useEffect } from 'react';
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

interface DashElementProps {
  element: SlideElement;
  isActive?: boolean;
}

// Componente para renderizar item circular
const CircularItem = ({ percentage, color, description, columns, backgroundColor, transitionColor, time, isActive, textColor }: { percentage: number; color: string; description?: string; columns: number; backgroundColor?: string; transitionColor?: string; time?: number; isActive?: boolean; textColor?: string }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const animationRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef<number | null>(null);

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
    const duration = (time || 5) * 1000; // Converter segundos para milissegundos
    const targetPercentage = Math.max(0, Math.min(100, percentage || 0)); // Garantir que está entre 0 e 100

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const currentPercentage = progress * targetPercentage;
      
      // Garantir que o valor está dentro do range válido
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
  }, [percentage, time, isActive]);

  const displayPercentage = isActive ? animatedPercentage : 0;
  const isCompleted = displayPercentage >= percentage;
  // Ajustar tamanho baseado no número de colunas
  let size = 120;
  let radius = 50;
  let strokeWidth = 8;
  let fontSize = 18;
  let descriptionFontSize = 14;
  
  if (columns === 3) {
    size = 80;
    radius = 33;
    strokeWidth = 6;
    fontSize = 14;
    descriptionFontSize = 12;
  } else if (columns === 4) {
    size = 60;
    radius = 25;
    strokeWidth = 5;
    fontSize = 12;
    descriptionFontSize = 11;
  }
  
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayPercentage / 100) * circumference;
  const center = size / 2;

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: columns >= 3 ? '4px' : '8px' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={backgroundColor || '#e5e7eb'}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isCompleted ? color : (transitionColor || color)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: `${fontSize}px`,
            fontWeight: 'bold',
            color: textColor || '#000000',
          }}
        >
          {Math.round(Math.max(0, Math.min(100, displayPercentage)))}%
        </div>
      </div>
      {description && (
        <div style={{ fontSize: `${descriptionFontSize}px`, color: textColor || '#000000', textAlign: 'center' }}>
          {description}
        </div>
      )}
    </div>
  );
};

// Componente para renderizar item barra (vertical)
const BarItem = ({ percentage, color, description, columns, backgroundColor, transitionColor, time, isActive, textColor }: { percentage: number; color: string; description?: string; columns: number; backgroundColor?: string; transitionColor?: string; time?: number; isActive?: boolean; textColor?: string }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const animationRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef<number | null>(null);

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
    const duration = (time || 5) * 1000; // Converter segundos para milissegundos
    const targetPercentage = Math.max(0, Math.min(100, percentage || 0)); // Garantir que está entre 0 e 100

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const currentPercentage = progress * targetPercentage;
      
      // Garantir que o valor está dentro do range válido
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
  }, [percentage, time, isActive]);

  const displayPercentage = isActive ? animatedPercentage : 0;
  const isCompleted = displayPercentage >= percentage;
  // Ajustar tamanho baseado no número de colunas
  let barWidth = 60;
  let barMaxHeight = 200;
  let fontSize = 14;
  let descriptionFontSize = 14;
  let gap = 8;
  
  if (columns === 3) {
    barWidth = 50;
    barMaxHeight = 150;
    fontSize = 12;
    descriptionFontSize = 12;
    gap = 6;
  } else if (columns === 4) {
    barWidth = 40;
    barMaxHeight = 120;
    fontSize = 11;
    descriptionFontSize = 11;
    gap = 4;
  }
  
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${gap}px` }}>
      <div
        style={{
          width: `${barWidth}px`,
          height: `${barMaxHeight}px`,
          backgroundColor: backgroundColor || '#e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div
          style={{
            width: '100%',
            height: `${displayPercentage}%`,
            backgroundColor: isCompleted ? color : (transitionColor || color),
            borderRadius: '0',
            boxShadow: `0 0 10px ${(isCompleted ? color : (transitionColor || color))}40`,
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '4px',
          }}
        >
          <div style={{ 
            textAlign: 'center', 
            fontSize: `${fontSize}px`, 
            fontWeight: 'bold', 
            color: textColor || '#000000',
            width: '100%',
          }}>
            {Math.round(Math.max(0, Math.min(100, displayPercentage)))}%
          </div>
        </div>
      </div>
      {description && (
        <div style={{ fontSize: `${descriptionFontSize}px`, color: textColor || '#000000', textAlign: 'center' }}>
          {description}
        </div>
      )}
    </div>
  );
};

export function DashElement({ element, isActive = true }: DashElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    columns = 2,
    defaultType = 'circular',
    items = [],
  } = config;

  // Estilo do container
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '16px',
    width: '100%',
    padding: '16px',
  };

  // Estilo de cada item
  const itemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Se não houver itens, mostrar placeholder
  if (items.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ ...itemStyle, gridColumn: `1 / ${columns + 1}`, textAlign: 'center', color: '#666' }}>
          <p style={{ fontSize: '14px', opacity: 0.6 }}>Adicione itens ao Dash</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {items.map((item: any, index: number) => {
        // Cores do item com fallbacks
        const itemBackgroundColor = item.backgroundColor || '#e5e7eb';
        const itemTransitionColor = item.transitionColor || item.color || '#007bff';
        const itemFinalColor = item.color || item.finalColor || '#007bff';
        
        const itemConfig = {
          percentage: item.percentage ?? 0,
          color: itemFinalColor,
          description: item.description || '',
          columns,
          backgroundColor: itemBackgroundColor,
          transitionColor: itemTransitionColor,
          time: item.time || 5,
          isActive,
          textColor: item.textColor || '#000000',
        };

        // Usar tipo do item ou defaultType se não especificado
        const itemType = item.type || defaultType;
        
        return (
          <div key={item.id || index} style={itemStyle}>
            {itemType === 'barra' ? (
              <BarItem {...itemConfig} />
            ) : (
              <CircularItem {...itemConfig} />
            )}
          </div>
        );
      })}
    </div>
  );
}

