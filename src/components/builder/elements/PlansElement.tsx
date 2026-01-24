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

// Função para formatar preço
const formatPrice = (value: number) => {
  return value.toFixed(2).replace('.', ',');
};

interface PlansElementProps {
  element: SlideElement;
  onButtonClick?: (url: string, openInNewTab: boolean) => void;
  isInBuilder?: boolean;
}

export function PlansElement({ element, onButtonClick, isInBuilder = false }: PlansElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const {
    plans = [],
    currency = 'R$',
    
    // Design - Cores de texto
    planNameColor = '#000000',
    priceColor = '#000000',
    originalPriceColor = '#999999',
    currencyColor,
    periodColor = '#666666',
    descriptionColor = '#666666',
    alternativePaymentColor = '#666666',
    
    // Design - Botão
    buttonColorType = 'solid',
    buttonBackgroundColor = '#000000',
    buttonGradient = {
      direction: 'to right',
      color1: '#000000',
      color2: '#1a1a1a',
    },
    buttonTextColor = '#ffffff',
    buttonStrokeEnabled = false,
    buttonStrokeColor = '#000000',
    buttonStrokeWidth = 0,
    buttonBorderRadius = 12,
    buttonPadding = { top: 14, right: 28, bottom: 14, left: 28 },
    
    // Design - Card geral
    cardBackgroundType = 'solid',
    cardBackgroundColor = '#ffffff',
    cardBackgroundGradient = {
      direction: 'to right',
      color1: '#ffffff',
      color2: '#f5f5f5',
    },
    cardBackgroundImage,
    cardBackgroundOverlay,
    cardStrokeEnabled = false,
    cardStrokeColor = '#b3b3b3',
    cardStrokeWidth = 1,
    cardBorderRadius = 12,
    cardPadding = { top: 24, right: 20, bottom: 24, left: 20 },
    cardShadow = false,
    cardShadowColor = 'rgba(0, 0, 0, 0.1)',
    
    // Design - Badge "MAIS POPULAR"
    badgeBackgroundColor = '#000000',
    badgeTextColor = '#ffffff',
    badgePosition = 'top',
    
    // Layout
    gap = 12,
  } = config;

  // Inicializar com o plano popular (ou o primeiro se não houver popular)
  useEffect(() => {
    if (plans.length > 0 && !isInBuilder) {
      const popularPlan = plans.find((p: any) => p.isPopular);
      if (popularPlan) {
        setSelectedPlanId(popularPlan.id);
      } else if (plans.length > 0) {
        // Se não houver popular, selecionar o primeiro
        setSelectedPlanId(plans[0].id);
      }
    }
  }, [plans, isInBuilder]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isInBuilder) return;
    
    // Buscar o plano selecionado
    const selectedPlan = plans.find((p: any) => p.id === selectedPlanId);
    if (!selectedPlan || !selectedPlan.buttonUrl) return;
    
    if (onButtonClick && selectedPlan.buttonUrl) {
      onButtonClick(selectedPlan.buttonUrl, selectedPlan.buttonOpenInNewTab !== false);
    } else if (selectedPlan.buttonUrl) {
      let finalUrl = selectedPlan.buttonUrl.trim();
      
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      
      try {
        const urlObj = new URL(finalUrl);
        // Remover UTMs apenas se estivermos no builder/preview
        // Nas páginas reais, manter UTMs (importantes para tracking)
        const cleanUrl = removeUtmParamsIfNeeded(urlObj.href);
        
        if (selectedPlan.buttonOpenInNewTab !== false) {
          window.open(cleanUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = cleanUrl;
        }
      } catch (error) {
        if (selectedPlan.buttonOpenInNewTab !== false) {
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = finalUrl;
        }
      }
    }
  };

  const renderButtonIcon = (icon?: string) => {
    if (!icon) return null;
    
    if (icon.startsWith('icon:')) {
      const iconName = icon.replace('icon:', '');
      const IconComponent = (LucideIcons as any)[iconName];
      if (IconComponent) {
        return <IconComponent className="w-5 h-5" style={{ color: buttonTextColor }} />;
      }
    }
    
    return <span className="text-lg">{icon}</span>;
  };

  // Construir background style do card
  const getCardBackgroundStyle = () => {
    if (cardBackgroundType === 'gradient' && cardBackgroundGradient) {
      if (cardBackgroundGradient.direction === 'radial') {
        return `radial-gradient(circle, ${cardBackgroundGradient.color1}, ${cardBackgroundGradient.color2})`;
      } else {
        return `linear-gradient(${cardBackgroundGradient.direction}, ${cardBackgroundGradient.color1}, ${cardBackgroundGradient.color2})`;
      }
    } else if (cardBackgroundType === 'image' && cardBackgroundImage) {
      return `url(${cardBackgroundImage})`;
    } else {
      return cardBackgroundColor || '#ffffff';
    }
  };

  // Construir background style do botão
  const getButtonBackgroundStyle = () => {
    if (buttonColorType === 'gradient' && buttonGradient) {
      if (buttonGradient.direction === 'radial') {
        return `radial-gradient(circle, ${buttonGradient.color1}, ${buttonGradient.color2})`;
      } else {
        return `linear-gradient(${buttonGradient.direction}, ${buttonGradient.color1}, ${buttonGradient.color2})`;
      }
    } else {
      return buttonBackgroundColor || '#000000';
    }
  };

  // Calcular desconto
  const calculateDiscount = (plan: any) => {
    if (plan.discount !== undefined) {
      return plan.discount;
    }
    if (plan.originalPrice && plan.originalPrice > plan.price) {
      return Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
    }
    return undefined;
  };

  if (plans.length === 0) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground text-center">
          Adicione planos para começar
        </p>
      </div>
    );
  }

  // Estilos do botão (definido fora do map para ser usado no botão final)
  const buttonStyle: React.CSSProperties = {
    background: getButtonBackgroundStyle(),
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
  };

  return (
    <div className="flex flex-col" style={{ gap: `${gap}px` }}>
      {plans.map((plan: any) => {
        const cardStyle: React.CSSProperties = {
          background: getCardBackgroundStyle(),
          backgroundSize: cardBackgroundType === 'image' ? 'cover' : 'auto',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: `${cardBorderRadius}px`,
          padding: cardPadding
            ? `${cardPadding.top || 0}px ${cardPadding.right || 0}px ${cardPadding.bottom || 0}px ${cardPadding.left || 0}px`
            : '16px',
          border: cardStrokeEnabled && cardStrokeWidth > 0
            ? `${cardStrokeWidth}px solid ${cardStrokeColor || '#e5e5e5'}`
            : 'none',
          boxShadow: cardShadow 
            ? `0 2px 4px ${cardShadowColor || 'rgba(0, 0, 0, 0.1)'}`
            : 'none',
          width: '100%',
          position: 'relative',
          minHeight: '80px',
        };

        const overlayStyle: React.CSSProperties = cardBackgroundOverlay?.enabled && cardBackgroundType === 'image' && cardBackgroundImage
          ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: cardBackgroundOverlay.color || '#000000',
              opacity: cardBackgroundOverlay.opacity !== undefined ? cardBackgroundOverlay.opacity : 0.5,
              borderRadius: `${cardBorderRadius}px`,
              pointerEvents: 'none',
              zIndex: 0,
            }
          : {};

        const badgeStyle: React.CSSProperties = {
          backgroundColor: badgeBackgroundColor,
          color: badgeTextColor,
          borderRadius: badgePosition === 'top' 
            ? `${cardBorderRadius}px ${cardBorderRadius}px 0 0`
            : `0 0 ${cardBorderRadius}px ${cardBorderRadius}px`,
          padding: '2px 8px',
          fontSize: '10px',
          fontWeight: 'bold',
          textAlign: 'center',
          position: 'absolute',
          left: 0,
          right: 0,
          [badgePosition === 'top' ? 'top' : 'bottom']: 0,
          zIndex: 10,
        };

        const discount = calculateDiscount(plan);

        // Lógica de opacidade: se há um plano selecionado, os não selecionados ficam mais apagados
        const isSelected = selectedPlanId === plan.id;
        const cardOpacity = isSelected 
          ? 1 
          : (selectedPlanId ? 0.5 : (plan.isPopular ? 1 : 0.7));

        return (
          <div key={plan.id} style={{ ...cardStyle, opacity: cardOpacity }} className={cn('relative')}>
            {/* Overlay da imagem de fundo */}
            {cardBackgroundOverlay?.enabled && cardBackgroundType === 'image' && cardBackgroundImage && (
              <div style={overlayStyle} />
            )}
            
            {/* Badge "MAIS POPULAR" */}
            {plan.isPopular && (
              <div style={badgeStyle}>
                MAIS POPULAR
              </div>
            )}
            
            {/* Conteúdo com z-index para ficar acima do overlay */}
            <div 
              className="relative z-10 flex items-center gap-3"
              style={{
                paddingTop: plan.isPopular && badgePosition === 'top' ? '20px' : '0',
                paddingBottom: plan.isPopular && badgePosition === 'bottom' ? '20px' : '0',
              }}
            >
              {/* Radio button à esquerda */}
              <input
                type="radio"
                name={`plan-${element.id}`}
                id={`plan-${plan.id}`}
                checked={selectedPlanId === plan.id}
                onChange={() => !isInBuilder && setSelectedPlanId(plan.id)}
                disabled={isInBuilder}
                className="w-5 h-5 cursor-pointer flex-shrink-0"
                style={{ cursor: isInBuilder ? 'default' : 'pointer' }}
              />
              
              {/* Conteúdo à direita - layout horizontal */}
              <label 
                htmlFor={`plan-${plan.id}`}
                className="flex-1 cursor-pointer flex items-center justify-between gap-4"
                style={{ cursor: isInBuilder ? 'default' : 'pointer' }}
              >
                {/* Nome do plano à esquerda */}
                <div className="flex-1">
                  <h3 style={{ color: planNameColor, fontSize: '16px', fontWeight: 700, margin: 0 }}>
                    {plan.name || 'Plano'}
                  </h3>
                </div>

                {/* Preços à direita */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Preço anterior (riscado) */}
                  {plan.originalPrice && plan.originalPrice > plan.price && (
                    <span 
                      style={{ 
                        color: originalPriceColor || '#999999', 
                        textDecoration: 'line-through',
                        fontSize: '14px',
                      }}
                    >
                      {plan.currency || currency} {formatPrice(plan.originalPrice)}
                    </span>
                  )}

                  {/* Preço principal */}
                  <div className="flex items-baseline gap-1">
                    <span style={{ color: currencyColor || priceColor, fontSize: '14px', fontWeight: 500 }}>
                      {plan.currency || currency}
                    </span>
                    <span style={{ color: priceColor, fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>
                      {formatPrice(plan.price || 0)}
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        );
      })}
      
      {/* Botão único no final */}
      {plans.length > 0 && (
        <button
          type="button"
          onClick={handleButtonClick}
          style={buttonStyle}
          className={cn(
            isInBuilder && 'pointer-events-none',
            !isInBuilder && 'hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]',
            !selectedPlanId && 'opacity-50 cursor-not-allowed'
          )}
          disabled={isInBuilder || !selectedPlanId}
        >
          {plans.find((p: any) => p.id === selectedPlanId)?.buttonIcon && 
            renderButtonIcon(plans.find((p: any) => p.id === selectedPlanId)?.buttonIcon)
          }
          <span>{plans.find((p: any) => p.id === selectedPlanId)?.buttonTitle || plans[0]?.buttonTitle || 'COMPRAR'}</span>
        </button>
      )}
    </div>
  );
}

