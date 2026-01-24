import { useState, useEffect } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { cn, removeUtmParamsIfNeeded } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

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

interface PriceElementProps {
  element: SlideElement;
  onButtonClick?: (url: string, openInNewTab: boolean) => void;
  isInBuilder?: boolean;
}

export function PriceElement({ element, onButtonClick, isInBuilder = false }: PriceElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    // Preços
    price = 99,
    currency = 'R$',
    period = '',
    originalPrice,
    discount,
    
    // Informações adicionais
    title,
    subtitle,
    description,
    
    // Lista de benefícios
    benefits = [],
    showBenefits = false,
    
    // Botão de compra
    buttonTitle = 'Comprar Agora',
    buttonUrl = '',
    buttonOpenInNewTab = true,
    buttonIcon = '',
    
    // Design - Fundo
    backgroundType = 'solid',
    backgroundColor = '#1a1a1a',
    backgroundGradient = {
      direction: 'to right',
      color1: '#1a1a1a',
      color2: '#2a2a2a',
    },
    backgroundImage,
    backgroundOverlay,
    
    // Design - Cores de texto
    titleColor = '#ffffff',
    subtitleColor = '#cccccc',
    priceColor = '#ffffff',
    originalPriceColor = '#999999',
    currencyColor,
    periodColor = '#cccccc',
    descriptionColor = '#cccccc',
    benefitsTextColor = '#ffffff',
    
    // Design - Botão
    buttonColorType = 'solid',
    buttonBackgroundColor = '#25D366',
    buttonGradient = {
      direction: 'to right',
      color1: '#25D366',
      color2: '#20B858',
    },
    buttonTextColor = '#ffffff',
    buttonStrokeEnabled = false,
    buttonStrokeColor = '#000000',
    buttonStrokeWidth = 0,
    buttonBorderRadius = 12,
    buttonPadding = { top: 14, right: 28, bottom: 14, left: 28 },
    
    // Design - Card geral
    cardStrokeEnabled = false,
    cardStrokeColor = '#333333',
    cardStrokeWidth = 1,
    cardBorderRadius = 16,
    cardPadding = { top: 24, right: 24, bottom: 24, left: 24 },
    cardShadow = true,
    cardShadowColor = 'rgba(0, 0, 0, 0.3)',
  } = config;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isInBuilder) return;
    
    if (onButtonClick && buttonUrl) {
      onButtonClick(buttonUrl, buttonOpenInNewTab);
    } else if (buttonUrl) {
      // Validar e preparar URL
      let finalUrl = buttonUrl.trim();
      
      // Adicionar protocolo se não tiver
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      
      // Validar URL antes de abrir
      try {
        const urlObj = new URL(finalUrl);
        // Remover UTMs apenas se estivermos no builder/preview
        // Nas páginas reais, manter UTMs (importantes para tracking)
        const cleanUrl = removeUtmParamsIfNeeded(urlObj.href);
        
        if (buttonOpenInNewTab) {
          window.open(cleanUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = cleanUrl;
        }
      } catch (error) {
        console.error('URL inválida:', error);
        // Tentar abrir mesmo assim se for uma URL simples
        if (buttonOpenInNewTab) {
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = finalUrl;
        }
      }
    }
  };

  // Calcular desconto se não fornecido mas originalPrice existe
  const calculatedDiscount = discount !== undefined 
    ? discount 
    : (originalPrice && originalPrice > price) 
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;

  // Construir background style do card
  let cardBackgroundStyle: string;
  if (backgroundType === 'gradient' && backgroundGradient) {
    if (backgroundGradient.direction === 'radial') {
      cardBackgroundStyle = `radial-gradient(circle, ${backgroundGradient.color1}, ${backgroundGradient.color2})`;
    } else {
      cardBackgroundStyle = `linear-gradient(${backgroundGradient.direction}, ${backgroundGradient.color1}, ${backgroundGradient.color2})`;
    }
  } else if (backgroundType === 'image' && backgroundImage) {
    cardBackgroundStyle = `url(${backgroundImage})`;
  } else {
    cardBackgroundStyle = backgroundColor || '#1a1a1a';
  }

  // Construir background style do botão
  let buttonBackgroundStyle: string;
  if (buttonColorType === 'gradient' && buttonGradient) {
    if (buttonGradient.direction === 'radial') {
      buttonBackgroundStyle = `radial-gradient(circle, ${buttonGradient.color1}, ${buttonGradient.color2})`;
    } else {
      buttonBackgroundStyle = `linear-gradient(${buttonGradient.direction}, ${buttonGradient.color1}, ${buttonGradient.color2})`;
    }
  } else {
    buttonBackgroundStyle = buttonBackgroundColor || '#25D366';
  }

  // Renderizar ícone do botão
  const renderButtonIcon = () => {
    if (!buttonIcon) return null;
    
    // Verificar se é um ícone Lucide
    if (buttonIcon.startsWith('icon:')) {
      const iconName = buttonIcon.replace('icon:', '');
      const IconComponent = (LucideIcons as any)[iconName];
      if (IconComponent) {
        return <IconComponent className="w-5 h-5" style={{ color: buttonTextColor }} />;
      }
    }
    
    // Caso contrário, tratar como emoji
    return <span className="text-lg">{buttonIcon}</span>;
  };

  // Renderizar ícone do benefício
  const renderBenefitIcon = (icon?: string) => {
    if (!icon) return <span className="text-green-500">✓</span>;
    
    // Verificar se é um ícone Lucide
    if (icon.startsWith('icon:')) {
      const iconName = icon.replace('icon:', '');
      const IconComponent = (LucideIcons as any)[iconName];
      if (IconComponent) {
        return <IconComponent className="w-4 h-4" style={{ color: benefitsTextColor }} />;
      }
    }
    
    // Caso contrário, tratar como emoji
    return <span className="text-base">{icon}</span>;
  };

  const cardStyle: React.CSSProperties = {
    background: cardBackgroundStyle,
    backgroundSize: backgroundType === 'image' ? 'cover' : 'auto',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    borderRadius: `${cardBorderRadius}px`,
    padding: cardPadding
      ? `${cardPadding.top || 0}px ${cardPadding.right || 0}px ${cardPadding.bottom || 0}px ${cardPadding.left || 0}px`
      : '24px',
    border: cardStrokeEnabled && cardStrokeWidth > 0
      ? `${cardStrokeWidth}px solid ${cardStrokeColor || '#333333'}`
      : 'none',
    boxShadow: cardShadow 
      ? `0 4px 6px ${cardShadowColor || 'rgba(0, 0, 0, 0.3)'}`
      : 'none',
    width: '100%',
    position: 'relative',
  };

  const overlayStyle: React.CSSProperties = backgroundOverlay?.enabled && backgroundType === 'image' && backgroundImage
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backgroundOverlay.color || '#000000',
        opacity: backgroundOverlay.opacity !== undefined ? backgroundOverlay.opacity : 0.5,
        borderRadius: `${cardBorderRadius}px`,
        pointerEvents: 'none',
        zIndex: 0,
      }
    : {};

  const buttonStyle: React.CSSProperties = {
    background: buttonBackgroundStyle,
    color: buttonTextColor,
    borderRadius: `${buttonBorderRadius}px`,
    padding: buttonPadding
      ? `${buttonPadding.top || 0}px ${buttonPadding.right || 0}px ${buttonPadding.bottom || 0}px ${buttonPadding.left || 0}px`
      : '14px 28px',
    border: buttonStrokeEnabled && buttonStrokeWidth > 0
      ? `${buttonStrokeWidth}px solid ${buttonStrokeColor || '#000000'}`
      : 'none',
    cursor: isInBuilder ? 'default' : 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: '16px',
    transition: isInBuilder ? 'none' : 'all 0.2s ease',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  // Formatar preço
  const formatPrice = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  return (
    <div style={cardStyle} className={cn('flex flex-col gap-4')}>
      {/* Overlay da imagem de fundo */}
      {backgroundOverlay?.enabled && backgroundType === 'image' && backgroundImage && (
        <div style={overlayStyle} />
      )}
      
      {/* Conteúdo com z-index para ficar acima do overlay */}
      <div className="relative z-10 flex flex-col gap-4">
        {/* Título */}
        {title && (
        <div>
          <h3 style={{ color: titleColor, fontSize: '20px', fontWeight: 700, margin: 0 }}>
            {title}
          </h3>
        </div>
      )}

        {/* Subtítulo */}
        {subtitle && (
        <div>
          <p style={{ color: subtitleColor, fontSize: '14px', margin: 0, opacity: 0.8 }}>
            {subtitle}
          </p>
        </div>
      )}

        {/* Preços */}
        <div className="flex flex-col gap-2">
        {/* Preço anterior (riscado) */}
        {originalPrice && originalPrice > price && (
          <div className="flex items-center gap-2">
            <span 
              style={{ 
                color: originalPriceColor || '#999999', 
                textDecoration: 'line-through',
                fontSize: '18px',
              }}
            >
              De {currency} {formatPrice(originalPrice)}
            </span>
            {calculatedDiscount && (
              <span 
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                -{calculatedDiscount}%
              </span>
            )}
          </div>
        )}

        {/* Preço principal */}
        <div className="flex items-baseline gap-1">
          <span style={{ color: currencyColor || priceColor, fontSize: '20px', fontWeight: 500 }}>
            {currency}
          </span>
          <span style={{ color: priceColor, fontSize: '48px', fontWeight: 700, lineHeight: 1 }}>
            {formatPrice(price)}
          </span>
          {period && (
            <span style={{ color: periodColor || '#cccccc', fontSize: '18px', fontWeight: 400 }}>
              {period}
            </span>
          )}
        </div>
        </div>

        {/* Descrição */}
        {description && (
        <div>
          <p style={{ color: descriptionColor || '#cccccc', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
      )}

        {/* Lista de benefícios */}
        {showBenefits && benefits && benefits.length > 0 && (
          <div className="flex flex-col gap-2">
          {benefits.map((benefit: any, index: number) => (
            <div 
              key={benefit.id || index} 
              className="flex items-center gap-2"
              style={{ color: benefitsTextColor || '#ffffff' }}
            >
              {renderBenefitIcon(benefit.icon)}
              <span style={{ fontSize: '14px' }}>{benefit.text || `Benefício ${index + 1}`}</span>
            </div>
            ))}
          </div>
        )}

        {/* Botão de compra */}
        {buttonTitle && (
          <button
            type="button"
            onClick={handleButtonClick}
            style={buttonStyle}
            className={cn(
              isInBuilder && 'pointer-events-none',
              !isInBuilder && 'hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
            )}
            disabled={isInBuilder}
          >
            {buttonIcon && renderButtonIcon()}
            <span>{buttonTitle}</span>
          </button>
        )}
      </div>
    </div>
  );
}

