import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { usePoints } from '@/contexts/PointsContext';
import { useGamificationTrigger, GamificationTriggerType } from '@/contexts/GamificationTriggerContext';

interface ReelSuccessSoundProps {
  soundUrl?: string;
  soundType?: 'success' | 'coin' | 'ding' | 'achievement';
  volume?: number;
  triggers?: GamificationTriggerType[];
  onManualTrigger?: (callback: () => void) => void;
  reel?: any; // Para verificar gamificação do elemento
  currentSlide?: number; // Para buscar elemento no slide atual
}

export interface ReelSuccessSoundRef {
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

export const ReelSuccessSound = forwardRef<ReelSuccessSoundRef, ReelSuccessSoundProps>(({
  soundUrl = '',
  soundType = 'success',
  volume = 0.5,
  triggers = ['onPointsGained'],
  onManualTrigger,
  reel,
  currentSlide,
}, ref) => {
  const { subscribeToPointsGained } = usePoints();
  const { subscribe: subscribeTrigger } = useGamificationTrigger();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudiosRef = useRef<Set<HTMLAudioElement>>(new Set()); // Rastrear todos os áudios ativos
  const isMountedRef = useRef(true);

  // Sons padrão - usar arquivos locais ou sua CDN
  // Se você tiver uma CDN, substitua estas URLs pelas suas
  // Exemplo: 'https://cdn.seudominio.com/sounds/success.wav'
  const defaultSounds: Record<string, string> = {
    success: '/sounds/success.wav', // Coloque seus arquivos em public/sounds/
    coin: '/sounds/coin.wav',
    ding: '/sounds/ding.wav',
    achievement: '/sounds/achievement.wav',
  };

  // Fallback: sons sintéticos usando Web Audio API (sempre funciona)
  const createFallbackSound = useCallback((type: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Configurações de som para cada tipo
      const soundConfigs: Record<string, { frequencies: number[]; duration: number; type: OscillatorType }> = {
        success: { frequencies: [523.25, 659.25, 783.99], duration: 0.3, type: 'sine' }, // C-E-G (acorde maior)
        coin: { frequencies: [880, 1108.73], duration: 0.15, type: 'triangle' }, // A-D (som de moeda)
        ding: { frequencies: [800], duration: 0.2, type: 'sine' }, // Nota única
        achievement: { frequencies: [523.25, 659.25, 783.99, 1046.50], duration: 0.4, type: 'sine' }, // C-E-G-C (acorde completo)
      };

      const config = soundConfigs[type] || soundConfigs.success;
      const now = audioContext.currentTime;

      // Tocar múltiplas frequências simultaneamente para sons mais ricos
      config.frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = config.type;

        // Envelope ADSR simples
        const startTime = now + index * 0.05; // Pequeno delay entre frequências
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + config.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + config.duration);
      });

      return true;
    } catch (error) {
      console.warn('Erro ao criar som de fallback:', error);
      return false;
    }
  }, [volume]);

  const playSound = useCallback(() => {
    try {
      // Prioridade: 1. URL customizada, 2. URL padrão, 3. Fallback
      const soundToPlay = soundUrl || defaultSounds[soundType] || defaultSounds.success;
      
      // Criar novo elemento de áudio (sempre criar nova instância para não cortar sons anteriores)
      const audio = new Audio(soundToPlay);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.preload = 'auto';
      
      // Adicionar ao conjunto de áudios ativos
      activeAudiosRef.current.add(audio);
      
      // Adicionar tratamento de erro com fallback
      audio.onerror = (e) => {
        console.warn('Erro ao carregar áudio, usando fallback:', soundToPlay);
        // Tentar fallback se o arquivo não carregar
        createFallbackSound(soundType);
        activeAudiosRef.current.delete(audio);
      };

      // Adicionar listener para quando o áudio terminar
      audio.onended = () => {
        // Remover do conjunto de áudios ativos quando terminar
        activeAudiosRef.current.delete(audio);
        // Só limpar a referência principal se for o áudio atual
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      // Tentar tocar o áudio
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Áudio iniciado com sucesso
            // Manter referência principal apenas se não houver outro áudio tocando
            if (!audioRef.current || audioRef.current.paused || audioRef.current.ended) {
              audioRef.current = audio;
            }
          })
          .catch((error) => {
            // Se autoplay for bloqueado ou houver erro, tentar fallback
            console.debug('Erro ao tocar áudio, tentando fallback:', error);
            createFallbackSound(soundType);
            activeAudiosRef.current.delete(audio);
          });
      } else {
        // Manter referência principal apenas se não houver outro áudio tocando
        if (!audioRef.current || audioRef.current.paused || audioRef.current.ended) {
          audioRef.current = audio;
        }
      }
    } catch (error) {
      console.warn('Erro ao tocar som, usando fallback:', error);
      // Último recurso: usar fallback
      createFallbackSound(soundType);
    }
  }, [soundUrl, soundType, volume, createFallbackSound]);

  // Expor método trigger via ref
  useImperativeHandle(ref, () => ({
    trigger: playSound,
  }));

  // Escutar pontos ganhos
  useEffect(() => {
    if (!triggers.includes('onPointsGained')) return;

    const handlePointsGained = () => {
      // onPointsGained não tem elementId, então verificar gamificação global
      if (!reel?.gamificationConfig?.enabled) {
        return; // Não tocar som se gamificação global não está habilitada
      }
      playSound();
    };
    const unsubscribe = subscribeToPointsGained(handlePointsGained);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      unsubscribe();
    };
  }, [triggers, subscribeToPointsGained, playSound, reel]);

  // Escutar outros triggers
  // IMPORTANTE: Separar a lógica de verificação de currentSlide do useEffect
  // para evitar re-subscribe quando currentSlide muda
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    triggers.forEach((triggerType) => {
      if (triggerType !== 'onPointsGained') {
        const unsubscribe = subscribeTrigger(triggerType, (data?: any) => {
          // Verificar se há elementId e se o elemento tem gamificação habilitada
          const elementId = data?.elementId;
          
          if (elementId) {
            // Se há elementId, verificar se o elemento tem gamificação habilitada especificamente para successSound
            // Usar currentSlide atual do closure, mas buscar elemento em todos os slides
            if (!checkElementGamification(elementId, reel, currentSlide, 'successSound')) {
              return; // Não tocar som se elemento não tem gamificação habilitada
            }
          } else {
            // Se não há elementId, verificar gamificação global (para casos como onPointsGained direto)
            if (!reel?.gamificationConfig?.enabled) {
              return; // Não tocar som se gamificação global não está habilitada
            }
          }
          
          playSound();
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      // IMPORTANTE: Não limpar áudios ativos aqui, apenas desinscrever dos triggers
      // Os áudios continuarão tocando mesmo após mudança de slide
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [triggers, subscribeTrigger, playSound, reel]); // Removido currentSlide das dependências

  // Escutar trigger manual
  useEffect(() => {
    if (onManualTrigger) {
      onManualTrigger(playSound);
    }
  }, [onManualTrigger, playSound]);

  // Cleanup apenas quando componente é desmontado (não em re-renderizações)
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Limpar todos os áudios ativos apenas quando componente é desmontado
      activeAudiosRef.current.forEach((audio) => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {
          // Ignorar erros
        }
      });
      activeAudiosRef.current.clear();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (e) {
          // Ignorar erros
        }
        audioRef.current = null;
      }
    };
  }, []); // Array vazio = apenas no mount/unmount

  return null;
});

