import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { usePoints } from '@/contexts/PointsContext';
import { useGamificationTrigger, GamificationTriggerType } from '@/contexts/GamificationTriggerContext';
import confetti from 'canvas-confetti';

interface ReelConfettiProps {
  colors?: string[];
  particleCount?: number;
  duration?: number;
  direction?: 'top' | 'bottom' | 'center';
  triggers?: GamificationTriggerType[];
  onManualTrigger?: (callback: () => void) => void;
  reel?: any; // Para verificar gamificação do elemento
  currentSlide?: number; // Para buscar elemento no slide atual
}

export interface ReelConfettiRef {
  trigger: () => void;
}

// Função helper para verificar se elemento tem gamificação habilitada
const checkElementGamification = (elementId: string | undefined, reel: any, currentSlide?: number, checkSpecificElement?: 'pointsBadge' | 'successSound' | 'confetti' | 'particles'): boolean => {
  if (!elementId || !reel) {
    if (import.meta.env.DEV && checkSpecificElement === 'confetti') {
      console.log('[ReelConfetti] checkElementGamification - sem elementId ou reel:', { elementId, hasReel: !!reel });
    }
    return false;
  }
  
  // Buscar elemento em todos os slides (currentSlide pode não estar sincronizado)
  const slidesToCheck = reel.slides || [];
  
  for (const slide of slidesToCheck) {
    if (!slide?.elements) continue;
    const element = slide.elements.find((el: any) => el.id === elementId);
    if (element) {
      // Normalizar uiConfig se for string JSON
      let normalizedUiConfig = element.uiConfig;
      if (typeof normalizedUiConfig === 'string') {
        try {
          normalizedUiConfig = JSON.parse(normalizedUiConfig);
        } catch {
          normalizedUiConfig = {};
        }
      }
      
      const elementGamificationConfig = element?.gamificationConfig || normalizedUiConfig?.gamificationConfig;
      
      // Debug em desenvolvimento
      if (import.meta.env.DEV && checkSpecificElement === 'confetti') {
        console.log('[ReelConfetti] Elemento encontrado:', {
          elementId,
          hasGamificationConfig: !!elementGamificationConfig,
          elementGamificationConfig,
          elementGamificationConfigRaw: element?.gamificationConfig,
          uiConfigGamificationConfig: normalizedUiConfig?.gamificationConfig,
        });
      }
      
      // Se não há configuração de gamificação, retornar false
      if (!elementGamificationConfig) {
        if (import.meta.env.DEV && checkSpecificElement === 'confetti') {
          console.log('[ReelConfetti] Sem configuração de gamificação no elemento - retornando false');
        }
        return false;
      }
      
      // Se está verificando um elemento específico, verificar se está explicitamente habilitado
      if (checkSpecificElement) {
        const elementKey = checkSpecificElement === 'pointsBadge' ? 'enablePointsBadge' :
                          checkSpecificElement === 'successSound' ? 'enableSuccessSound' :
                          checkSpecificElement === 'confetti' ? 'enableConfetti' :
                          checkSpecificElement === 'particles' ? 'enableParticles' : null;
        
        if (!elementKey) {
          return false;
        }
        
        // Debug em desenvolvimento
        if (import.meta.env.DEV && checkSpecificElement === 'confetti') {
          console.log('[ReelConfetti] checkElementGamification:', {
            elementId,
            elementKey,
            elementGamificationConfig,
            enableConfetti: elementGamificationConfig[elementKey],
            enabled: elementGamificationConfig.enabled,
          });
        }
        
        // PRIORIDADE 1: Se o elemento específico está explicitamente desabilitado, retornar false
        if (elementGamificationConfig[elementKey] === false) {
          if (import.meta.env.DEV && checkSpecificElement === 'confetti') {
            console.log('[ReelConfetti] Confetti DESABILITADO no elemento - retornando false');
          }
          return false; // Explicitamente desabilitado - sempre respeitar
        }
        
        // PRIORIDADE 2: Se o elemento específico está explicitamente habilitado, retornar true
        if (elementGamificationConfig[elementKey] === true) {
          if (import.meta.env.DEV && checkSpecificElement === 'confetti') {
            console.log('[ReelConfetti] Confetti HABILITADO no elemento - retornando true');
          }
          return true; // Explicitamente habilitado
        }
        
        // PRIORIDADE 3: Se há um campo 'enabled' que habilita tudo, mas o elemento específico não está definido
        // NÃO assumir habilitado - retornar false (o elemento específico deve estar explicitamente habilitado)
        if (elementGamificationConfig.enabled === true) {
          // Mesmo que enabled esteja true, se o elemento específico não está definido ou não está true, retornar false
          if (import.meta.env.DEV && checkSpecificElement === 'confetti') {
            console.log('[ReelConfetti] enabled=true mas enableConfetti não está definido - retornando false');
          }
          return false;
        }
        
        // Se não está explicitamente habilitado e enabled não está true, retornar false
        if (import.meta.env.DEV && checkSpecificElement === 'confetti') {
          console.log('[ReelConfetti] Confetti não está habilitado - retornando false');
        }
        return false;
      } else {
        // Se não está verificando elemento específico, verificar se pelo menos um está habilitado
        if (elementGamificationConfig.enabled === true) {
          return true;
        }
        
        if (elementGamificationConfig?.enablePointsBadge === true ||
            elementGamificationConfig?.enableSuccessSound === true ||
            elementGamificationConfig?.enableConfetti === true ||
            elementGamificationConfig?.enableParticles === true ||
            elementGamificationConfig?.enablePointsProgress === true ||
            elementGamificationConfig?.enableAchievement === true) {
          return true;
        }
      }
    }
  }
  
  return false;
};

export const ReelConfetti = forwardRef<ReelConfettiRef, ReelConfettiProps>(({
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
  particleCount = 50,
  duration = 3000,
  direction = 'bottom',
  triggers = ['onPointsGained'],
  onManualTrigger,
  reel,
  currentSlide,
}, ref) => {
  const { subscribeToPointsGained } = usePoints();
  const { subscribe: subscribeTrigger } = useGamificationTrigger();
  const confettiInstanceRef = useRef<confetti.CreateTypes | null>(null);

  const activateConfetti = () => {
    const colorsToUse = colors || ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
    
    // Explosão principal de baixo para cima
    confetti({
      particleCount: particleCount || 50,
      angle: 90, // 90 graus = para cima
      spread: 70, // Spread maior para efeito de explosão
      origin: { x: 0.5, y: 1 }, // x: centro (0.5), y: parte inferior (1)
      colors: colorsToUse,
      startVelocity: 55, // Velocidade inicial maior
      gravity: 0.8, // Gravidade menor para subir mais
      ticks: 200,
      drift: 0,
      decay: 0.9,
    });

    // Explosões laterais para efeito mais impactante
    confetti({
      particleCount: Math.floor((particleCount || 50) / 3),
      angle: 60,
      spread: 55,
      origin: { x: 0.5, y: 1 },
      colors: colorsToUse,
      startVelocity: 50,
      gravity: 0.8,
      ticks: 200,
      drift: -0.2,
      decay: 0.9,
    });

    confetti({
      particleCount: Math.floor((particleCount || 50) / 3),
      angle: 120,
      spread: 55,
      origin: { x: 0.5, y: 1 },
      colors: colorsToUse,
      startVelocity: 50,
      gravity: 0.8,
      ticks: 200,
      drift: 0.2,
      decay: 0.9,
    });

    // Explosão adicional após pequeno delay para efeito em camadas
    setTimeout(() => {
      confetti({
        particleCount: Math.floor((particleCount || 50) / 2),
        angle: 90,
        spread: 60,
        origin: { x: 0.5, y: 1 },
        colors: colorsToUse,
        startVelocity: 45,
        gravity: 0.8,
        ticks: 200,
        drift: 0,
        decay: 0.9,
      });
    }, 150);
  };

  // Expor método trigger via ref
  useImperativeHandle(ref, () => ({
    trigger: activateConfetti,
  }));

  // Escutar pontos ganhos
  // IMPORTANTE: onPointsGained não deve disparar confetti automaticamente
  // O confetti só deve ser disparado por triggers específicos de elementos (onButtonClick, onQuestionAnswer, etc)
  // que têm elementId e verificam se o elemento tem enableConfetti habilitado
  useEffect(() => {
    if (!triggers.includes('onPointsGained')) return;

    const handlePointsGained = () => {
      // NÃO disparar confetti por onPointsGained - precisa de trigger específico com elementId
      // Isso evita que confetti apareça quando pontos são adicionados por elementos sem confetti habilitado
      if (import.meta.env.DEV) {
        console.log('[ReelConfetti] onPointsGained recebido mas NÃO disparando confetti (precisa de trigger com elementId)');
      }
      return;
    };
    const unsubscribe = subscribeToPointsGained(handlePointsGained);

    return unsubscribe;
  }, [triggers, subscribeToPointsGained, particleCount, colors, reel]);

  // Escutar outros triggers
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    triggers.forEach((triggerType) => {
      if (triggerType !== 'onPointsGained') {
        const unsubscribe = subscribeTrigger(triggerType, (data?: any) => {
          // Verificar se há elementId e se o elemento tem gamificação habilitada
          const elementId = data?.elementId;
          
          if (elementId) {
            // Se há elementId, verificar se o elemento tem gamificação habilitada especificamente para confetti
            const shouldActivate = checkElementGamification(elementId, reel, currentSlide, 'confetti');
            
            if (import.meta.env.DEV) {
              console.log('[ReelConfetti] Trigger recebido:', {
                triggerType,
                elementId,
                shouldActivate,
                reelGamificationEnabled: reel?.gamificationConfig?.enabled,
              });
            }
            
            if (!shouldActivate) {
              if (import.meta.env.DEV) {
                console.log('[ReelConfetti] Confetti NÃO será disparado - elemento não tem enableConfetti habilitado');
              }
              return; // Não disparar confetti se elemento não tem gamificação habilitada
            }
          } else {
            // Se não há elementId, NÃO disparar confetti baseado apenas na configuração global
            // O confetti só deve ser disparado quando há um elemento específico com enableConfetti habilitado
            if (import.meta.env.DEV) {
              console.log('[ReelConfetti] Trigger sem elementId - NÃO disparando confetti (precisa de elemento específico)');
            }
            return; // Não disparar confetti sem elementId
          }
          
          if (import.meta.env.DEV) {
            console.log('[ReelConfetti] Disparando confetti');
          }
          activateConfetti();
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [triggers, subscribeTrigger, particleCount, colors, reel, currentSlide]);

  // Escutar trigger manual
  useEffect(() => {
    if (onManualTrigger) {
      onManualTrigger(activateConfetti);
    }
  }, [onManualTrigger, particleCount, colors]);

  return null;
});

