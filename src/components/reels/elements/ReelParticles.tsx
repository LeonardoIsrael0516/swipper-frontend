import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { usePoints } from '@/contexts/PointsContext';
import { useGamificationTrigger, GamificationTriggerType } from '@/contexts/GamificationTriggerContext';

interface ReelParticlesProps {
  particleType?: 'star' | 'heart' | 'sparkle';
  colors?: string[];
  particleCount?: number;
  duration?: number;
  triggers?: GamificationTriggerType[];
  onManualTrigger?: (callback: () => void) => void;
  reel?: any; // Para verificar gamificação do elemento
  currentSlide?: number; // Para buscar elemento no slide atual
}

export interface ReelParticlesRef {
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

export const ReelParticles = forwardRef<ReelParticlesRef, ReelParticlesProps>(({
  particleType = 'star',
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4'],
  particleCount = 30,
  duration = 2000,
  triggers = ['onPointsGained'],
  onManualTrigger,
  reel,
  currentSlide,
}, ref) => {
  const { subscribeToPointsGained } = usePoints();
  const { subscribe: subscribeTrigger } = useGamificationTrigger();
  const [isActive, setIsActive] = useState(false);

  const activateParticles = () => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), duration);
  };

  // Expor método trigger via ref
  useImperativeHandle(ref, () => ({
    trigger: activateParticles,
  }));

  // Escutar pontos ganhos
  useEffect(() => {
    if (!triggers.includes('onPointsGained')) return;

    const handlePointsGained = () => {
      // onPointsGained não tem elementId, então verificar gamificação global
      if (!reel?.gamificationConfig?.enabled) {
        return; // Não disparar partículas se gamificação global não está habilitada
      }
      activateParticles();
    };
    const unsubscribe = subscribeToPointsGained(handlePointsGained);

    return unsubscribe;
  }, [duration, triggers, subscribeToPointsGained, reel]);

  // Escutar outros triggers
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    triggers.forEach((triggerType) => {
      if (triggerType !== 'onPointsGained') {
        const unsubscribe = subscribeTrigger(triggerType, (data?: any) => {
          // Verificar se há elementId e se o elemento tem gamificação habilitada
          const elementId = data?.elementId;
          
          if (elementId) {
            // Se há elementId, verificar se o elemento tem gamificação habilitada especificamente para particles
            if (!checkElementGamification(elementId, reel, currentSlide, 'particles')) {
              return; // Não disparar partículas se elemento não tem gamificação habilitada
            }
          } else {
            // Se não há elementId, verificar gamificação global (para casos como onPointsGained direto)
            if (!reel?.gamificationConfig?.enabled) {
              return; // Não disparar partículas se gamificação global não está habilitada
            }
          }
          
          activateParticles();
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
      onManualTrigger(activateParticles);
    }
  }, [onManualTrigger]);

  if (!isActive) return null;

  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1 + Math.random(),
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            color: particle.color,
            animation: `particle-float ${particle.duration}s ${particle.delay}s ease-out forwards`,
          }}
        >
          {particleType === 'star' ? '⭐' : particleType === 'heart' ? '❤️' : '✨'}
        </div>
      ))}
      <style>{`
        @keyframes particle-float {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});

