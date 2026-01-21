import { useState, useEffect, memo, useRef } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
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

interface ReelQuestionnaireProps {
  element: SlideElement;
  onNextSlide?: (elementId: string, itemId: string) => void;
  onItemAction?: (itemId: string, actionType: 'none' | 'slide' | 'url', slideId?: string, url?: string, openInNewTab?: boolean) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onVisibilityChange?: (elementId: string, isVisible: boolean, shouldHideSocial: boolean) => void;
  isActive?: boolean;
}

// Função para obter o componente do ícone do Lucide React
const getIconComponent = (iconName: string) => {
  if (!iconName || typeof iconName !== 'string') return null;
  
  const cleanIconName = iconName.trim();
  if (!cleanIconName) return null;
  
  const IconComponent = (LucideIcons as any)[cleanIconName];
  
  if (IconComponent && typeof IconComponent === 'function') {
    return IconComponent;
  }
  
  return null;
};

// Função para renderizar o ícone à esquerda do item
const renderLeftIcon = (item: any) => {
  if (!item) return null;
  
  // PRIORIDADE ABSOLUTA: Se icon começar com "icon:", SEMPRE renderizar como ícone
  const iconValue = item.icon && typeof item.icon === 'string' ? item.icon.trim() : '';
  const hasIconValue = iconValue && iconValue.startsWith('icon:');
  
  // Determinar iconType: priorizar campo icon se tiver valor válido
  let iconType = item.iconType;
  if (hasIconValue) {
    iconType = 'icon';
  } else if (!iconType) {
    // Se não houver iconType definido e não tem icon válido, detectar automaticamente
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
      iconType = 'image';
    } else if (item.emoji && typeof item.emoji === 'string' && item.emoji.trim()) {
      iconType = 'emoji';
    } else {
      iconType = 'emoji'; // padrão
    }
  }
  
  if (iconType === 'icon' || hasIconValue) {
    if (!iconValue) return null;
    
    // Remover prefixo "icon:" se presente
    const iconName = iconValue.startsWith('icon:') 
      ? iconValue.substring(5).trim() 
      : iconValue;
    
    if (!iconName) return null;
    
    const IconComponent = getIconComponent(iconName);
    if (IconComponent && typeof IconComponent === 'function') {
      const Icon = IconComponent;
      return <Icon className="w-5 h-5 flex-shrink-0" />;
    }
    
    // Se não encontrou o componente, não renderizar nada
    return null;
  }
  
  if (iconType === 'emoji') {
    const emoji = item.emoji || '';
    if (!emoji || typeof emoji !== 'string') return null;
    
    const trimmedEmoji = emoji.trim();
    if (!trimmedEmoji) return null;
    
    return <span className="text-xl flex-shrink-0">{trimmedEmoji}</span>;
  }
  
  if (iconType === 'image') {
    const imageUrl = item.imageUrl || '';
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    
    const trimmedImageUrl = imageUrl.trim();
    if (!trimmedImageUrl) return null;
    
    return (
      <img 
        src={trimmedImageUrl} 
        alt="" 
        className="w-5 h-5 object-cover flex-shrink-0 rounded"
      />
    );
  }
  
  return null;
};

// Função para renderizar o ícone final do item
const renderEndIcon = (endIcon: string, endIconCustom: string, isSelected: boolean, textColor: string) => {
  if (endIcon === 'none' || !endIcon) return null;
  
  const currentColor = textColor;
  
  if (endIcon === 'custom' && endIconCustom) {
    const trimmedCustom = endIconCustom.trim();
    if (!trimmedCustom) return null;
    
    // Se começar com "icon:", renderizar como ícone Lucide
    if (trimmedCustom.startsWith('icon:')) {
      const iconName = trimmedCustom.substring(5).trim();
      if (!iconName) return null;
      
      const IconComponent = getIconComponent(iconName);
      if (IconComponent && typeof IconComponent === 'function') {
        const Icon = IconComponent;
        return <Icon className="w-5 h-5" style={{ color: currentColor }} />;
      }
      
      return null;
    }
    
    // Se for URL de imagem
    if (trimmedCustom.startsWith('http://') || trimmedCustom.startsWith('https://') || trimmedCustom.startsWith('/')) {
      return <img src={trimmedCustom} alt="" className="w-5 h-5 object-cover rounded" />;
    }
    
    // Se for emoji
    return <span className="text-xl">{trimmedCustom}</span>;
  }
  
  // Ícones pré-definidos
  if (endIcon === 'arrow') {
    const ArrowRight = LucideIcons.ArrowRight;
    return <ArrowRight className="w-5 h-5" style={{ color: currentColor }} />;
  }
  if (endIcon === 'check') {
    const CheckCircle = LucideIcons.CheckCircle;
    return <CheckCircle className="w-5 h-5" style={{ color: currentColor }} />;
  }
  if (endIcon === 'verified') {
    // Checkbox quadrado: desmarcado por padrão, marcado quando selecionado
    if (isSelected) {
      const CheckSquare = LucideIcons.CheckSquare || LucideIcons.CheckSquare2;
      if (CheckSquare) {
        return <CheckSquare className="w-5 h-5" style={{ color: currentColor }} />;
      }
    } else {
      const Square = LucideIcons.Square;
      if (Square) {
        return <Square className="w-5 h-5" style={{ color: currentColor }} />;
      }
    }
  }
  
  return null;
};

export const ReelQuestionnaire = memo(function ReelQuestionnaire({ element, onNextSlide, onItemAction, onSelectionChange, onVisibilityChange, isActive = false }: ReelQuestionnaireProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    items = [],
    layout = 'list',
    multipleSelection = false,
    lockSlide = false,
    delayEnabled = false,
    delaySeconds = 0,
    hideSocialElementsOnDelay = false,
    endIcon = 'none',
    endIconCustom = '',
    itemHeight = 80,
    gap = 12,
    borderRadius = 12,
    backgroundColor = '#ffffff',
    textColor = '#000000',
    selectedBackgroundColor = '#007bff',
    selectedTextColor = '#ffffff',
    borderColor = '#e5e7eb',
    borderWidth = 1,
  } = config;

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

  // Garantir que items é um array e normalizar cada item
  const normalizedItems = Array.isArray(items) ? items.map((item: any) => {
    // PRIORIDADE ABSOLUTA: Se icon começar com "icon:", SEMPRE definir iconType como 'icon'
    // Preservar o valor original do icon (não fazer trim na normalização para não perder dados)
    const iconValue = item.icon && typeof item.icon === 'string' ? item.icon : '';
    const hasValidIcon = iconValue && iconValue.trim().startsWith('icon:');
    
    let detectedIconType = item.iconType;
    
    // Se tem icon válido, SEMPRE usar iconType 'icon'
    if (hasValidIcon) {
      detectedIconType = 'icon';
    } else if (!detectedIconType || detectedIconType === 'icon') {
      // Se não tem icon válido mas iconType é 'icon', detectar baseado em outros campos
      if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
        detectedIconType = 'image';
      } else if (item.emoji && typeof item.emoji === 'string' && item.emoji.trim()) {
        detectedIconType = 'emoji';
      } else if (!detectedIconType) {
        detectedIconType = 'emoji';
      }
    } else if (!detectedIconType && item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
      detectedIconType = 'image';
    } else if (!detectedIconType && item.emoji && typeof item.emoji === 'string' && item.emoji.trim()) {
      detectedIconType = 'emoji';
    }
    
    const finalIconType = detectedIconType || 'emoji';
    
    const normalized = {
      ...item,
      iconType: finalIconType,
      // SEMPRE preservar o campo icon original, mesmo se vazio (não fazer trim aqui)
      icon: iconValue || (item.icon !== undefined ? item.icon : ''),
      emoji: item.emoji && typeof item.emoji === 'string' ? item.emoji.trim() : '',
      imageUrl: item.imageUrl && typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '',
      title: item.title && typeof item.title === 'string' ? item.title.trim() : '',
      description: item.description && typeof item.description === 'string' ? item.description.trim() : '',
      // Campos de ação
      actionType: item.actionType || 'none',
      slideId: item.slideId,
      url: item.url,
      openInNewTab: item.openInNewTab !== false,
    };
    
    return normalized;
  }) : [];

  // Handler de clique no item - precisa estar depois de normalizedItems
  const handleItemClick = (itemId: string) => {
    const item = normalizedItems.find((it: any) => it.id === itemId);
    const itemActionType = item?.actionType || 'none';
    
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

  const getItemStyle = (itemId: string): React.CSSProperties => {
    const isSelected = selectedIds.includes(itemId);
    
    return {
      minHeight: `${itemHeight}px`,
      backgroundColor: isSelected ? selectedBackgroundColor : backgroundColor,
      color: isSelected ? selectedTextColor : textColor,
      border: `${borderWidth}px solid ${borderColor}`,
      borderRadius: `${borderRadius}px`,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
    };
  };

  const gridContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: layout === 'grid' ? 'repeat(2, 1fr)' : '1fr',
    gap: `${gap}px`,
    width: '100%',
  };

  return (
    <>
      <div style={containerStyle}>
        {normalizedItems.length === 0 ? (
          <div style={getItemStyle('')}>
            <p style={{ color: textColor, fontSize: '14px', opacity: 0.6 }}>
              Nenhum item configurado
            </p>
          </div>
        ) : (
          <div style={layout === 'grid' ? gridContainerStyle : containerStyle}>
            {normalizedItems.map((item: any, index: number) => {
              const isSelected = selectedIds.includes(item.id);
              
              return (
                <div
                  key={item.id || index}
                  style={getItemStyle(item.id)}
                  onClick={() => handleItemClick(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item.id);
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${item.title || 'Item'}. ${isSelected ? 'Selecionado' : 'Não selecionado'}`}
                  className="hover:opacity-90 active:scale-[0.98]"
                >
                  {/* Ícone à esquerda */}
                  <div style={{ flexShrink: 0 }}>
                    {renderLeftIcon(item)}
                  </div>
                  
                  {/* Conteúdo do item */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                    <span style={{ fontSize: '16px', fontWeight: 500, color: isSelected ? selectedTextColor : textColor }}>
                      {item.title || `Item ${index + 1}`}
                    </span>
                    {item.description && (
                      <span style={{ fontSize: '14px', color: isSelected ? selectedTextColor : textColor, opacity: 0.7 }}>
                        {item.description}
                      </span>
                    )}
                  </div>
                  
                  {/* Ícone final */}
                  <div style={{ flexShrink: 0 }}>
                    {renderEndIcon(endIcon, endIconCustom, isSelected, isSelected ? selectedTextColor : textColor)}
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

