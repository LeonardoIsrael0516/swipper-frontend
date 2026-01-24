import { useState, useEffect, memo, useRef } from 'react';
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

interface ReelQuestionGridProps {
  element: SlideElement;
  onNextSlide?: (elementId: string, itemId: string) => void;
  onItemAction?: (itemId: string, actionType: 'none' | 'slide' | 'url', slideId?: string, url?: string, openInNewTab?: boolean) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onVisibilityChange?: (elementId: string, isVisible: boolean, shouldHideSocial: boolean) => void;
  isActive?: boolean;
  showBlockedAnimation?: boolean;
}

export const ReelQuestionGrid = memo(function ReelQuestionGrid({ element, onNextSlide, onItemAction, onSelectionChange, onVisibilityChange, isActive = false, showBlockedAnimation = false }: ReelQuestionGridProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    items = [],
    multipleSelection = false,
    lockSlide = false,
    delayEnabled = false,
    delaySeconds = 0,
    hideSocialElementsOnDelay = false,
    gap = 12,
    borderRadius = 12,
    backgroundColor = '#ffffff',
    textColor = '#000000',
    selectedBackgroundColor = '#007bff',
    selectedTextColor = '#ffffff',
    borderColor = '#e5e7eb',
    borderWidth = 1,
  } = config;

  // Cores fixas do placeholder (não configuráveis)
  const imagePlaceholderColor = '#f3f4f6';
  const imagePlaceholderBorderColor = '#d1d5db';

  // Estado de seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estados de delay
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  // Gerenciar delay - só começar quando o slide estiver ativo
  useEffect(() => {
    // Se o slide não está ativo, ocultar e resetar
    if (!isActive) {
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

    // Slide está ativo - iniciar delay se habilitado
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
  }, [delayEnabled, delaySeconds, isActive, hideSocialElementsOnDelay, element.id, onVisibilityChange]);

  // Notificar mudanças de seleção
  // Usar useRef para evitar loop infinito quando onSelectionChange é recriado
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    if (onSelectionChangeRef.current) {
      onSelectionChangeRef.current(selectedIds);
    }
  }, [selectedIds]); // Remover onSelectionChange das dependências

  // Removido: Mostrar animação sutil após primeira seleção quando múltiplas seleções habilitadas
  // O hint global já aparece quando o slide é desbloqueado, então não precisamos mostrar aqui
  // Isso evita duplicação de hints

  // Normalizar items - incluindo campos de ação
  const normalizedItems = Array.isArray(items) ? items.map((item: any) => ({
    id: item.id || '',
    imageUrl: item.imageUrl && typeof item.imageUrl === 'string' ? item.imageUrl.trim() : undefined,
    title: item.title && typeof item.title === 'string' ? item.title.trim() : '',
    description: item.description && typeof item.description === 'string' ? item.description.trim() : '',
    actionType: item.actionType || 'none',
    slideId: item.slideId,
    url: item.url,
    openInNewTab: item.openInNewTab !== false,
  })) : [];

  // Handler de clique no item - precisa estar depois de normalizedItems
  const handleItemClick = (itemId: string) => {
    const item = normalizedItems.find((it: any) => it.id === itemId);
    const itemActionType = item?.actionType || 'none';
    
    // Debug: verificar campos de ação
    if (import.meta.env.DEV) {
      console.log('handleItemClick (Grid):', { itemId, item, itemActionType, onItemAction: !!onItemAction, lockSlide });
    }
    
    if (multipleSelection) {
      // Toggle na seleção
      setSelectedIds((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((id) => id !== itemId);
        } else {
          return [...prev, itemId];
        }
      });
    } else {
      // Seleção única: selecionar
      setSelectedIds([itemId]);
      
      // Se tem ação configurada e callback de ação, chamar ação primeiro
      // O callback de ação vai verificar fluxo primeiro e depois executar ação do item
      if (itemActionType !== 'none' && onItemAction) {
        setTimeout(() => {
          onItemAction(
            itemId,
            itemActionType,
            item?.slideId,
            item?.url,
            item?.openInNewTab !== false
          );
        }, 300);
        return; // IMPORTANTE: não executar comportamento padrão se tem ação
      } else if (!lockSlide && onNextSlide) {
        // Comportamento padrão: avançar (se lockSlide desabilitado)
        // Pequeno delay para feedback visual
        setTimeout(() => {
          onNextSlide(element.id, itemId);
        }, 300);
      }
    }
  };

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

  const getCardStyle = (itemId: string): React.CSSProperties => {
    const isSelected = selectedIds.includes(itemId);
    
    return {
      backgroundColor: isSelected ? selectedBackgroundColor : backgroundColor,
      color: isSelected ? selectedTextColor : textColor,
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius: `${borderRadius}px`,
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '200px',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
    };
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
      <div style={containerStyle} className={showBlockedAnimation ? 'blocked-scroll-animation' : ''}>
        {normalizedItems.length === 0 ? (
          <div style={getCardStyle('')}>
            <p style={{ color: textColor, fontSize: '14px', opacity: 0.6 }}>
              Nenhum item configurado
            </p>
          </div>
        ) : (
          <div style={gridContainerStyle}>
            {normalizedItems.map((item: any, index: number) => {
              const isSelected = selectedIds.includes(item.id);
              
              return (
                <div
                  key={item.id || index}
                  style={getCardStyle(item.id)}
                  onClick={() => handleItemClick(item.id)}
                  role="button"
                  data-interactive="true"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item.id);
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${item.title || 'Item'}. ${isSelected ? 'Selecionado' : 'Não selecionado'}`}
                  className={`hover:opacity-90 active:scale-[0.98] ${showBlockedAnimation && !isSelected ? 'animate-button-blocked' : ''}`}
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

                  {/* Título e Descrição */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                    <span style={{ fontSize: '16px', fontWeight: 500, color: isSelected ? selectedTextColor : textColor }}>
                      {item.title || `Item ${index + 1}`}
                    </span>
                    {item.description && (
                      <span style={{ fontSize: '14px', color: isSelected ? selectedTextColor : textColor, opacity: 0.7 }}>
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
});

