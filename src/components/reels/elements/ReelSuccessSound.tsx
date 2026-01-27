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
      
      // Se não há configuração de gamificação, retornar false
      if (!elementGamificationConfig) {
        return false;
      }
      
      // Se está verificando um elemento específico, verificar se está explicitamente habilitado
      if (checkSpecificElement) {
        const elementKey = checkSpecificElement === 'pointsBadge' ? 'enablePointsBadge' :
                          checkSpecificElement === 'successSound' ? 'enableSuccessSound' :
                          checkSpecificElement === 'confetti' ? 'enableConfetti' :
                          checkSpecificElement === 'particles' ? 'enableParticles' : null;
        
        // Se há um campo 'enabled' que habilita tudo, verificar se o elemento específico também está habilitado
        if (elementGamificationConfig.enabled === true) {
          // Se enabled está true, verificar se o elemento específico não está explicitamente desabilitado
          if (elementKey && elementGamificationConfig[elementKey] === false) {
            return false; // Explicitamente desabilitado
          }
          // Se enabled está true e o elemento específico não está desabilitado, verificar se está habilitado
          if (elementKey && elementGamificationConfig[elementKey] === true) {
            return true; // Explicitamente habilitado
          }
          // Se enabled está true mas o elemento específico não está definido, retornar false (não assumir habilitado)
          return false;
        }
        
        // Se enabled não está true, verificar se o elemento específico está explicitamente habilitado
        if (elementKey && elementGamificationConfig[elementKey] === true) {
          return true;
        }
        
        // Se não está explicitamente habilitado, retornar false
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

// Detectar iOS
const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
  const hasUserInteractedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sons padrão - usar arquivos locais ou sua CDN
  // Se você tiver uma CDN, substitua estas URLs pelas suas
  // Exemplo: 'https://cdn.seudominio.com/sounds/success.wav'
  const defaultSounds: Record<string, string> = {
    success: '/sounds/success.wav', // Coloque seus arquivos em public/sounds/
    coin: '/sounds/coin.wav',
    ding: '/sounds/ding.wav',
    achievement: '/sounds/achievement.wav',
  };

  // Inicializar AudioContext após primeira interação (necessário para iOS)
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Erro ao criar AudioContext:', error);
      }
    }
    // Retomar contexto se estiver suspenso (iOS)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {
        // Ignorar erro se não conseguir retomar
      });
    }
  }, []);

  // Marcar que usuário interagiu (necessário para iOS)
  useEffect(() => {
    if (isIOSDevice()) {
      const handleUserInteraction = () => {
        hasUserInteractedRef.current = true;
        initAudioContext();
        // Remover listeners após primeira interação
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('touchend', handleUserInteraction);
        document.removeEventListener('click', handleUserInteraction);
      };
      
      document.addEventListener('touchstart', handleUserInteraction, { once: true, passive: true });
      document.addEventListener('touchend', handleUserInteraction, { once: true, passive: true });
      document.addEventListener('click', handleUserInteraction, { once: true, passive: true });
    } else {
      // Em outros dispositivos, marcar como interagido imediatamente
      hasUserInteractedRef.current = true;
      initAudioContext();
    }
  }, [initAudioContext]);

  // Fallback: sons sintéticos usando Web Audio API (sempre funciona)
  const createFallbackSound = useCallback((type: string) => {
    try {
      // Garantir que AudioContext está inicializado
      if (!audioContextRef.current) {
        initAudioContext();
      }
      
      if (!audioContextRef.current) {
        return false;
      }
      
      const audioContext = audioContextRef.current;
      
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
  }, [volume, initAudioContext]);

  const playSound = useCallback(() => {
    // No iOS, só tocar se usuário já interagiu
    if (isIOSDevice() && !hasUserInteractedRef.current) {
      // Tentar usar fallback que funciona melhor no iOS
      createFallbackSound(soundType);
      return;
    }

    try {
      // Prioridade: 1. URL customizada, 2. URL padrão, 3. Fallback
      const soundToPlay = soundUrl || defaultSounds[soundType] || defaultSounds.success;
      
      // Criar novo elemento de áudio (sempre criar nova instância para não cortar sons anteriores)
      const audio = new Audio(soundToPlay);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.preload = 'auto';
      
      // No iOS, adicionar atributos necessários
      if (isIOSDevice()) {
        audio.setAttribute('playsinline', '');
      }
      
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
  // IMPORTANTE: onPointsGained não deve tocar som automaticamente
  // O som só deve ser tocado por triggers específicos de elementos (onButtonClick, onQuestionAnswer, etc)
  // que têm elementId e verificam se o elemento tem enableSuccessSound habilitado
  useEffect(() => {
    if (!triggers.includes('onPointsGained')) return;

    const handlePointsGained = () => {
      // NÃO tocar som por onPointsGained - precisa de trigger específico com elementId
      // Isso evita que som toque quando pontos são adicionados por elementos sem som habilitado
      if (import.meta.env.DEV) {
        console.log('[ReelSuccessSound] onPointsGained recebido mas NÃO tocando som (precisa de trigger com elementId)');
      }
      return;
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
            // Se não há elementId, NÃO tocar som baseado apenas na configuração global
            // O som só deve ser tocado quando há um elemento específico com enableSuccessSound habilitado
            if (import.meta.env.DEV) {
              console.log('[ReelSuccessSound] Trigger sem elementId - NÃO tocando som (precisa de elemento específico)');
            }
            return; // Não tocar som sem elementId
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

