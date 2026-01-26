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
  if (!elementId || !reel) return false;
  
  // Buscar elemento em todos os slides (currentSlide pode não estar sincronizado)
  const slidesToCheck = reel.slides || [];
  
  for (const slide of slidesToCheck) {
    if (!slide?.elements) continue;
    const element = slide.elements.find((el: any) => el.id === elementId);
    if (element) {
      const elementGamificationConfig = element?.gamificationConfig || element?.uiConfig?.gamificationConfig;
      
      // Se há um campo 'enabled' que habilita tudo, usar ele
      if (elementGamificationConfig?.enabled === true) {
        return true;
      }
      
      // Se está verificando um elemento específico, verificar se está habilitado
      if (checkSpecificElement) {
        const elementKey = checkSpecificElement === 'pointsBadge' ? 'enablePointsBadge' :
                          checkSpecificElement === 'successSound' ? 'enableSuccessSound' :
                          checkSpecificElement === 'confetti' ? 'enableConfetti' :
                          checkSpecificElement === 'particles' ? 'enableParticles' : null;
        
        if (elementKey && elementGamificationConfig?.[elementKey] === true) {
          return true;
        }
      } else {
        // Se não está verificando elemento específico, verificar se pelo menos um está habilitado
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
  useEffect(() => {
    if (!triggers.includes('onPointsGained')) return;

    const handlePointsGained = () => {
      // onPointsGained não tem elementId, então verificar gamificação global
      if (!reel?.gamificationConfig?.enabled) {
        return; // Não disparar confetti se gamificação global não está habilitada
      }
      activateConfetti();
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
            if (!checkElementGamification(elementId, reel, currentSlide, 'confetti')) {
              return; // Não disparar confetti se elemento não tem gamificação habilitada
            }
          } else {
            // Se não há elementId, verificar gamificação global (para casos como onPointsGained direto)
            if (!reel?.gamificationConfig?.enabled) {
              return; // Não disparar confetti se gamificação global não está habilitada
            }
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

