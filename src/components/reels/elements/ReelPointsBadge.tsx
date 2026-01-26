import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { usePoints } from '@/contexts/PointsContext';
import { useGamificationTrigger, GamificationTriggerType } from '@/contexts/GamificationTriggerContext';
import { cn } from '@/lib/utils';

interface ReelPointsBadgeProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number;
  textFormat?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontSize?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  animationType?: 'slide' | 'fade' | 'bounce' | 'scale';
  triggers?: GamificationTriggerType[];
  onManualTrigger?: (callback: (points: number, reason: string) => void) => void;
  reel?: any; // Para verificar gamificação do elemento
  currentSlide?: number; // Para buscar elemento no slide atual
}

export interface ReelPointsBadgeRef {
  trigger: (points: number, reason: string) => void;
}

// Função helper para verificar se elemento tem gamificação habilitada
const checkElementGamification = (elementId: string | undefined, reel: any, currentSlide?: number, checkSpecificElement?: 'pointsBadge' | 'successSound' | 'confetti' | 'particles'): boolean => {
  if (!elementId || !reel) {
    if (import.meta.env.DEV) {
      console.log('[checkElementGamification] Parâmetros inválidos:', { elementId, hasReel: !!reel });
    }
    return false;
  }
  
  // Buscar elemento em todos os slides (currentSlide pode não estar sincronizado)
  const slidesToCheck = reel.slides || [];
  
  if (import.meta.env.DEV) {
    console.log('[checkElementGamification] Buscando elemento:', {
      elementId,
      slidesCount: slidesToCheck.length,
      checkSpecificElement,
    });
  }
  
  for (const slide of slidesToCheck) {
    if (!slide?.elements) continue;
    const element = slide.elements.find((el: any) => el.id === elementId);
    if (element) {
      // Verificar gamificationConfig em diferentes locais possíveis
      const elementGamificationConfig = element?.gamificationConfig || element?.uiConfig?.gamificationConfig;
      
      if (import.meta.env.DEV) {
        console.log('[checkElementGamification] Elemento encontrado:', {
          elementId,
          hasGamificationConfig: !!elementGamificationConfig,
          config: elementGamificationConfig,
          checkSpecificElement,
        });
      }
      
      // Se há um campo 'enabled' que habilita tudo, usar ele
      if (elementGamificationConfig?.enabled === true) {
        if (import.meta.env.DEV) {
          console.log('[checkElementGamification] Elemento tem enabled=true');
        }
        return true;
      }
      
      // Se está verificando um elemento específico, verificar se está habilitado
      if (checkSpecificElement) {
        const elementKey = checkSpecificElement === 'pointsBadge' ? 'enablePointsBadge' :
                          checkSpecificElement === 'successSound' ? 'enableSuccessSound' :
                          checkSpecificElement === 'confetti' ? 'enableConfetti' :
                          checkSpecificElement === 'particles' ? 'enableParticles' : null;
        
        if (elementKey && elementGamificationConfig?.[elementKey] === true) {
          if (import.meta.env.DEV) {
            console.log('[checkElementGamification] Elemento específico habilitado:', elementKey);
          }
          return true;
        } else {
          if (import.meta.env.DEV) {
            console.log('[checkElementGamification] Elemento específico não habilitado:', {
              elementKey,
              value: elementGamificationConfig?.[elementKey],
            });
          }
        }
      } else {
        // Se não está verificando elemento específico, verificar se pelo menos um está habilitado
        if (elementGamificationConfig?.enablePointsBadge === true ||
            elementGamificationConfig?.enableSuccessSound === true ||
            elementGamificationConfig?.enableConfetti === true ||
            elementGamificationConfig?.enableParticles === true ||
            elementGamificationConfig?.enablePointsProgress === true ||
            elementGamificationConfig?.enableAchievement === true) {
          if (import.meta.env.DEV) {
            console.log('[checkElementGamification] Pelo menos um elemento habilitado');
          }
          return true;
        }
      }
    }
  }
  
  if (import.meta.env.DEV) {
    console.log('[checkElementGamification] Elemento não encontrado ou sem gamificação habilitada');
  }
  
  return false;
};

export const ReelPointsBadge = forwardRef<ReelPointsBadgeRef, ReelPointsBadgeProps>(({
  position = 'top-right',
  duration = 2000,
  textFormat = '+{points} pontos',
  backgroundColor = '#4CAF50',
  textColor = '#ffffff',
  borderRadius = 12,
  fontSize = 16,
  padding = { top: 12, right: 16, bottom: 12, left: 16 },
  animationType = 'slide',
  triggers = ['onPointsGained'],
  onManualTrigger,
  reel,
  currentSlide,
}, ref) => {
  const { subscribeToPointsGained } = usePoints();
  const { subscribe: subscribeTrigger } = useGamificationTrigger();
  const [isVisible, setIsVisible] = useState(false);
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');

  const showBadge = (gainedPoints: number, gainedReason: string) => {
    setPoints(gainedPoints);
    setReason(gainedReason);
    setIsVisible(true);
    
    setTimeout(() => {
      setIsVisible(false);
    }, duration);
  };

  // Expor método trigger via ref
  useImperativeHandle(ref, () => ({
    trigger: showBadge,
  }));

  // Escutar pontos ganhos
  useEffect(() => {
    if (!triggers.includes('onPointsGained')) return;

    const handlePointsGained = (gainedPoints: number, gainedReason: string) => {
      // onPointsGained não tem elementId, então verificar gamificação global
      if (!reel?.gamificationConfig?.enabled) {
        return; // Não mostrar badge se gamificação global não está habilitada
      }
      showBadge(gainedPoints, gainedReason);
    };

    const unsubscribe = subscribeToPointsGained(handlePointsGained);
    return unsubscribe;
  }, [duration, subscribeToPointsGained, triggers, reel]);

  // Escutar outros triggers
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    triggers.forEach((triggerType) => {
      if (triggerType !== 'onPointsGained') {
        const unsubscribe = subscribeTrigger(triggerType, (data?: any) => {
          // Debug em desenvolvimento
          if (import.meta.env.DEV) {
            console.log('[ReelPointsBadge] Trigger recebido:', {
              triggerType,
              data,
              hasReel: !!reel,
              currentSlide,
              reelGamificationEnabled: reel?.gamificationConfig?.enabled,
            });
          }
          
          // Verificar se há elementId e se o elemento tem gamificação habilitada
          const elementId = data?.elementId;
          
          if (elementId) {
            // Se há elementId, verificar se o elemento tem gamificação habilitada especificamente para pointsBadge
            const hasGamification = checkElementGamification(elementId, reel, currentSlide, 'pointsBadge');
            if (import.meta.env.DEV) {
              console.log('[ReelPointsBadge] Verificação de elemento:', {
                elementId,
                hasGamification,
                hasReel: !!reel,
                slidesCount: reel?.slides?.length,
              });
            }
            if (!hasGamification) {
              return; // Não mostrar badge se elemento não tem gamificação habilitada
            }
          } else {
            // Se não há elementId, verificar gamificação global
            // Mas apenas para triggers que não são específicos de elementos
            // onFormComplete, onItemAction podem não ter elementId mas devem verificar elemento
            if (triggerType === 'onFormComplete' || triggerType === 'onItemAction') {
              // Para esses triggers, se não há elementId, não mostrar (precisa de elemento específico)
              return;
            }
            // Para outros triggers sem elementId, verificar gamificação global
            if (!reel?.gamificationConfig?.enabled) {
              if (import.meta.env.DEV) {
                console.log('[ReelPointsBadge] Gamificação global não habilitada');
              }
              return; // Não mostrar badge se gamificação global não está habilitada
            }
          }
          
          const triggerPoints = data?.points || 10;
          const triggerReason = data?.reason || 'Ação realizada';
          
          if (import.meta.env.DEV) {
            console.log('[ReelPointsBadge] Mostrando badge:', { triggerPoints, triggerReason });
          }
          
          showBadge(triggerPoints, triggerReason);
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [triggers, subscribeTrigger, reel, currentSlide]);

  // Escutar trigger manual
  useEffect(() => {
    if (onManualTrigger) {
      onManualTrigger(showBadge);
    }
  }, [onManualTrigger]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const animationClasses = {
    slide: 'animate-slide-in-right',
    fade: 'animate-fade-in',
    bounce: 'animate-bounce-in',
    scale: 'animate-scale-in',
  };

  const formattedText = textFormat.replace('{points}', points.toString());

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        positionClasses[position],
        animationClasses[animationType]
      )}
      style={{
        backgroundColor,
        color: textColor,
        borderRadius,
        fontSize: `${fontSize}px`,
        paddingTop: padding.top,
        paddingRight: padding.right,
        paddingBottom: padding.bottom,
        paddingLeft: padding.left,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">{formattedText}</span>
      </div>
    </div>
  );
});

