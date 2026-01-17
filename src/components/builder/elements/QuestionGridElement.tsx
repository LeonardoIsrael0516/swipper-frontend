import { useState, useEffect } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { Image } from 'lucide-react';

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

interface QuestionGridElementProps {
  element: SlideElement;
}

export function QuestionGridElement({ element }: QuestionGridElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    items = [],
    delayEnabled = false,
    delaySeconds = 0,
    gap = 12,
    borderRadius = 12,
    backgroundColor = '#ffffff',
    textColor = '#000000',
    borderColor = '#e5e7eb',
    borderWidth = 1,
  } = config;

  // Cores fixas do placeholder (não configuráveis)
  const imagePlaceholderColor = '#f3f4f6';
  const imagePlaceholderBorderColor = '#d1d5db';

  const [isVisible, setIsVisible] = useState(!delayEnabled);
  const [opacity, setOpacity] = useState(delayEnabled ? 0 : 1);

  // Gerenciar delay
  useEffect(() => {
    if (delayEnabled && delaySeconds > 0) {
      setIsVisible(false);
      setOpacity(0);
      
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Fade-in suave
        setTimeout(() => setOpacity(1), 50);
      }, delaySeconds * 1000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
      setOpacity(1);
    }
  }, [delayEnabled, delaySeconds]);

  // Normalizar items - apenas imageUrl, title, description
  const normalizedItems = Array.isArray(items) ? items.map((item: any) => ({
    id: item.id || '',
    imageUrl: item.imageUrl && typeof item.imageUrl === 'string' ? item.imageUrl.trim() : undefined,
    title: item.title && typeof item.title === 'string' ? item.title.trim() : '',
    description: item.description && typeof item.description === 'string' ? item.description.trim() : '',
  })) : [];

  const containerStyle: React.CSSProperties = {
    display: isVisible ? 'flex' : 'none',
    flexDirection: 'column',
    gap: `${gap}px`,
    width: '100%',
    opacity,
    transition: 'opacity 0.3s ease-in-out',
  };

  const gridContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: `${gap}px`,
    width: '100%',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor,
    color: textColor,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '200px',
  };

  const imageContainerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
  };

  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: imagePlaceholderColor,
    border: `2px dashed ${imagePlaceholderBorderColor}`,
    borderRadius: '8px',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '8px',
  };

  return (
    <div style={containerStyle}>
      {normalizedItems.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ color: textColor, fontSize: '14px', opacity: 0.6 }}>
            Nenhum item configurado
          </p>
        </div>
      ) : (
        <div style={gridContainerStyle}>
          {normalizedItems.map((item: any, index: number) => (
            <div
              key={item.id || index}
              style={cardStyle}
            >
              {/* Container da Imagem */}
              <div style={imageContainerStyle}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title || `Item ${index + 1}`}
                    style={imageStyle}
                    onError={(e) => {
                      // Em caso de erro no carregamento, mostrar placeholder
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        target.style.display = 'none';
                        const placeholder = parent.querySelector('.image-placeholder') as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="image-placeholder"
                  style={{ ...placeholderStyle, display: item.imageUrl ? 'none' : 'flex' }}
                >
                  <Image className="w-8 h-8" style={{ color: imagePlaceholderBorderColor }} />
                </div>
              </div>

              {/* Título */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: textColor }}>
                  {item.title || `Item ${index + 1}`}
                </span>
                {item.description && (
                  <span style={{ fontSize: '14px', color: textColor, opacity: 0.7 }}>
                    {item.description}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

