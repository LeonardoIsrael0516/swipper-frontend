import { useState, useEffect, memo } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';

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

interface ButtonElementProps {
  element: SlideElement;
  onButtonClick?: (destination: 'next-slide' | 'url', url?: string, openInNewTab?: boolean) => void;
  onVisibilityChange?: (elementId: string, isVisible: boolean, shouldHideSocial: boolean) => void;
  isInBuilder?: boolean;
  isActive?: boolean;
  showBlockedAnimation?: boolean;
}

export const ButtonElement = memo(function ButtonElement({ element, onButtonClick, onVisibilityChange, isInBuilder = false, isActive = false, showBlockedAnimation = false }: ButtonElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    title = 'Clique aqui',
    destination = 'next-slide',
    url = '',
    openInNewTab = true,
    delayEnabled = false,
    delaySeconds = 0,
    lockSlide = false,
    hideSocialElementsOnDelay = false,
    columnMode = false,
    pulseAnimation = false,
    colorType = 'solid',
    backgroundColor = '#007bff',
    gradient = {
      direction: 'to right',
      color1: '#007bff',
      color2: '#0056b3',
    },
    textColor = '#ffffff',
    strokeEnabled = false,
    strokeColor = '#000000',
    strokeWidth = 0,
    borderRadius = 8,
    padding = { top: 12, right: 24, bottom: 12, left: 24 },
  } = config;

  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  // Gerenciar delay - só começar quando o slide estiver ativo (ou se estiver no builder)
  useEffect(() => {
    // No builder, sempre considerar ativo (isInBuilder = true)
    const shouldBeActive = isInBuilder || isActive;

    // Se não está ativo (e não é builder), resetar
    if (!shouldBeActive) {
      if (delayEnabled && delaySeconds > 0) {
        setIsVisible(false);
        setOpacity(0);
      } else {
        // Sem delay, mostrar imediatamente mesmo quando inativo
        setIsVisible(true);
        setOpacity(1);
      }
      return;
    }

    // Slide está ativo (ou é builder) - iniciar delay se habilitado
    if (delayEnabled && delaySeconds > 0) {
      // Iniciar invisível
      setIsVisible(false);
      setOpacity(0);
      
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Fade-in suave após tornar visível
        setTimeout(() => setOpacity(1), 50);
        // Notificar quando ficar visível se deve ocultar elementos sociais
        if (onVisibilityChange && hideSocialElementsOnDelay) {
          onVisibilityChange(element.id, true, true);
        }
      }, delaySeconds * 1000);

      return () => {
        clearTimeout(timer);
        // Notificar quando ficar invisível
        if (onVisibilityChange && hideSocialElementsOnDelay) {
          onVisibilityChange(element.id, false, true);
        }
      };
    } else {
      // Sem delay ou delay desabilitado - mostrar imediatamente
      setIsVisible(true);
      setOpacity(1);
      // Se não há delay, não deve ocultar elementos sociais
      if (onVisibilityChange && hideSocialElementsOnDelay) {
        onVisibilityChange(element.id, true, false);
      }
    }
  }, [delayEnabled, delaySeconds, isActive, isInBuilder, hideSocialElementsOnDelay, element.id, onVisibilityChange]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onButtonClick) {
      onButtonClick(destination, url, openInNewTab);
    } else if (destination === 'url' && url) {
      // Validar e preparar URL
      let finalUrl = url.trim();
      
      // Adicionar protocolo se não tiver
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      
      // Validar URL antes de abrir
      try {
        const urlObj = new URL(finalUrl);
        // Remover parâmetros UTM da URL (especialmente importante no builder)
        const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        utmParams.forEach(param => urlObj.searchParams.delete(param));
        
        if (openInNewTab) {
          window.open(urlObj.href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = urlObj.href;
        }
      } catch (error) {
        console.error('URL inválida:', error);
        // Tentar abrir mesmo assim se for uma URL simples
        if (openInNewTab) {
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = finalUrl;
        }
      }
    }
  };

  // Construir background style
  let backgroundStyle: string;
  if (colorType === 'gradient' && gradient) {
    backgroundStyle = `linear-gradient(${gradient.direction}, ${gradient.color1}, ${gradient.color2})`;
  } else {
    backgroundStyle = backgroundColor || '#007bff';
  }

  const style: React.CSSProperties = {
    background: backgroundStyle,
    color: textColor,
    borderRadius: `${borderRadius}px`,
    padding: padding
      ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`
      : '12px 24px',
    border: strokeEnabled && strokeWidth > 0
      ? `${strokeWidth}px solid ${strokeColor || '#000000'}`
      : 'none',
    cursor: isInBuilder ? 'default' : 'pointer',
    opacity,
    transition: 'opacity 0.3s ease-in-out',
    display: isVisible ? (columnMode ? 'inline-block' : 'block') : 'none',
    width: columnMode ? 'auto' : '100%',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  return (
    <>
      <style>{`
        @keyframes blocked-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
          }
        }
        .blocked-scroll-animation {
          animation: blocked-pulse 0.5s ease-in-out 3;
        }
      `}</style>
      <button
        type="button"
        onClick={handleClick}
        style={style}
        className={cn(
          'font-medium text-center',
          pulseAnimation && !isInBuilder && 'animate-button-pulse',
          showBlockedAnimation && !isInBuilder && 'blocked-scroll-animation'
        )}
        disabled={isInBuilder}
      >
        {title}
      </button>
    </>
  );
});

