import { useBuilder } from '@/contexts/BuilderContext';
import { usePoints } from '@/contexts/PointsContext';
import { ReelPointsBadge } from '@/components/reels/elements/ReelPointsBadge';
import { ReelSuccessSound } from '@/components/reels/elements/ReelSuccessSound';
import { ReelConfetti } from '@/components/reels/elements/ReelConfetti';
import { ReelPointsProgress } from '@/components/reels/elements/ReelPointsProgress';
import { ReelAchievement } from '@/components/reels/elements/ReelAchievement';
import { ReelParticles } from '@/components/reels/elements/ReelParticles';
import { GamificationConfig } from '@/contexts/BuilderContext';
import { GamificationTriggerType } from '@/contexts/GamificationTriggerContext';

interface GamificationOverlayProps {
  isInBuilder?: boolean;
  reel?: { gamificationConfig?: GamificationConfig; slides?: any[] } | null;
  selectedSlide?: any;
  currentSlide?: number; // Para passar para elementos de gamificação
}

export function GamificationOverlay({ isInBuilder = false, reel: reelProp, selectedSlide: selectedSlideProp, currentSlide }: GamificationOverlayProps) {
  // Tentar pegar do BuilderContext primeiro, senão usar props
  let builderContext;
  try {
    builderContext = useBuilder();
  } catch {
    builderContext = null;
  }
  
  const reel = reelProp || builderContext?.reel;
  const selectedSlide = selectedSlideProp || builderContext?.selectedSlide;
  const gamificationConfig = reel?.gamificationConfig;
  const slideGamificationConfig = selectedSlide?.gamificationConfig;

  // Verificar se gamificação está habilitada globalmente
  if (!gamificationConfig?.enabled) {
    // No builder, mostrar preview mesmo se não estiver habilitado
    if (isInBuilder) {
      return (
        <div className="fixed bottom-4 right-4 z-50 bg-muted/50 border border-border/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p>Gamificação desabilitada</p>
          <p className="text-[10px] mt-1">Ative em Gamificação para ver elementos</p>
        </div>
      );
    }
    return null;
  }

  // Se está no builder e não há slide selecionado, não renderizar
  if (isInBuilder && !selectedSlide) return null;

  // Verificar se há configuração de elementos
  if (!gamificationConfig.elements) {
    return null;
  }

  // Função para verificar se um elemento está habilitado
  // Verifica apenas configuração global (elementos individuais têm suas próprias configurações)
  const isElementEnabled = (elementName: keyof GamificationConfig['elements']): boolean => {
    // Verificar se o elemento existe e está habilitado
    const elementConfig = gamificationConfig.elements?.[elementName];
    if (!elementConfig) return false;
    // Verificar explicitamente se enabled é true (não apenas truthy)
    return elementConfig.enabled === true;
  };

  // Usar triggers disponíveis (removido onSlideChange - não deve disparar automaticamente)
  // Os elementos Reel vão verificar se devem responder a cada trigger baseado em sua configuração
  // Os elementos individuais (botão, question) controlam quando ativar através de seus próprios triggers
  const finalTriggers: GamificationTriggerType[] = [
    'onButtonClick',
    'onQuestionAnswer',
    'onFormComplete',
    'onPointsGained',
    'onItemAction',
  ];

  // Verificar se pelo menos um elemento está habilitado
  const hasEnabledElements = 
    isElementEnabled('pointsBadge') ||
    isElementEnabled('successSound') ||
    isElementEnabled('confetti') ||
    isElementEnabled('particles') ||
    isElementEnabled('pointsProgress') ||
    isElementEnabled('achievement');

  // Se não há elementos habilitados, não renderizar
  if (!hasEnabledElements) {
    return null;
  }

  // Debug em desenvolvimento
  if (import.meta.env.DEV) {
    console.log('[GamificationOverlay] Renderizando elementos:', {
      hasReel: !!reel,
      reelGamificationEnabled: reel?.gamificationConfig?.enabled,
      currentSlide,
      hasEnabledElements,
      pointsBadgeEnabled: isElementEnabled('pointsBadge'),
      successSoundEnabled: isElementEnabled('successSound'),
      confettiEnabled: isElementEnabled('confetti'),
      particlesEnabled: isElementEnabled('particles'),
    });
  }

  return (
    <>
      {/* Points Badge */}
      {isElementEnabled('pointsBadge') && gamificationConfig.elements.pointsBadge && (
        <ReelPointsBadge
          position={gamificationConfig.elements.pointsBadge.position || 'top-right'}
          duration={gamificationConfig.elements.pointsBadge.duration || 2000}
          textFormat={gamificationConfig.elements.pointsBadge.textFormat || '+{points} pontos'}
          backgroundColor={gamificationConfig.elements.pointsBadge.backgroundColor || '#4CAF50'}
          textColor={gamificationConfig.elements.pointsBadge.textColor || '#ffffff'}
          triggers={finalTriggers}
          reel={reel}
          currentSlide={currentSlide}
        />
      )}

      {/* Success Sound */}
      {isElementEnabled('successSound') && gamificationConfig.elements.successSound && (
        <ReelSuccessSound
          soundType={gamificationConfig.elements.successSound.soundType || 'success'}
          volume={gamificationConfig.elements.successSound.volume ?? 0.5}
          triggers={finalTriggers}
          reel={reel}
          currentSlide={currentSlide}
        />
      )}

      {/* Confetti */}
      {isElementEnabled('confetti') && gamificationConfig.elements.confetti && (
        <ReelConfetti
          colors={gamificationConfig.elements.confetti.colors || ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']}
          particleCount={gamificationConfig.elements.confetti.particleCount || 50}
          duration={gamificationConfig.elements.confetti.duration || 3000}
          direction={gamificationConfig.elements.confetti.direction || 'bottom'}
          triggers={finalTriggers}
          reel={reel}
          currentSlide={currentSlide}
        />
      )}

      {/* Particles */}
      {isElementEnabled('particles') && gamificationConfig.elements.particles && (
        <ReelParticles
          particleType={gamificationConfig.elements.particles.particleType || 'star'}
          colors={gamificationConfig.elements.particles.colors || ['#FFD700', '#FF6B6B', '#4ECDC4']}
          particleCount={gamificationConfig.elements.particles.particleCount || 30}
          triggers={finalTriggers}
          reel={reel}
          currentSlide={currentSlide}
        />
      )}

      {/* Points Progress */}
      {isElementEnabled('pointsProgress') && 
       gamificationConfig.elements.pointsProgress && 
       !selectedSlide?.hideGamificationProgress && (
        <ReelPointsProgress
          position={gamificationConfig.elements.pointsProgress.position || 'top'}
          style={gamificationConfig.elements.pointsProgress.style || 'bar'}
          milestone={gamificationConfig.elements.pointsProgress.milestone || 100}
          progressColor={gamificationConfig.elements.pointsProgress.progressColor}
          backgroundColor={gamificationConfig.elements.pointsProgress.backgroundColor}
          textColor={gamificationConfig.elements.pointsProgress.textColor}
          cardBackgroundColor={gamificationConfig.elements.pointsProgress.cardBackgroundColor}
          circularProgressColor={gamificationConfig.elements.pointsProgress.circularProgressColor}
          circularBackgroundColor={gamificationConfig.elements.pointsProgress.circularBackgroundColor}
          isInBuilder={isInBuilder}
        />
      )}

      {/* Achievement */}
      {isElementEnabled('achievement') && gamificationConfig.elements.achievement && (
        <ReelAchievement
          title={gamificationConfig.elements.achievement.title || 'Conquista Desbloqueada!'}
          description={gamificationConfig.elements.achievement.description || 'Parabéns!'}
          icon={gamificationConfig.elements.achievement.icon || '🏆'}
          condition={gamificationConfig.elements.achievement.condition || { type: 'points', value: 100 }}
        />
      )}
    </>
  );
}

