import { SlideElement } from '@/contexts/BuilderContext';
import { usePoints } from '@/contexts/PointsContext';
import { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

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

interface SuccessSoundElementProps {
  element: SlideElement;
  isInBuilder?: boolean;
}

export function SuccessSoundElement({ element, isInBuilder = false }: SuccessSoundElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const { subscribeToPointsGained } = usePoints();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    soundUrl = '',
    soundType = 'success',
    volume = 0.5,
    triggers = ['onPointsGained'],
  } = config;

  // No builder, mostrar um indicador visual
  if (isInBuilder) {
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            Som de Sucesso
          </span>
        </div>
        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
          Toca quando pontos são ganhos
        </p>
      </div>
    );
  }

  // Sons padrão (podem ser URLs ou usar biblioteca de sons)
  const defaultSounds: Record<string, string> = {
    success: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    coin: 'https://www.soundjay.com/misc/sounds/coin-drop-1.wav',
    ding: 'https://www.soundjay.com/misc/sounds/ding-idea-40142.wav',
    achievement: 'https://www.soundjay.com/misc/sounds/achievement-01.wav',
  };

  useEffect(() => {
    if (isInBuilder) return;

    const playSound = () => {
      const soundToPlay = soundUrl || defaultSounds[soundType] || defaultSounds.success;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(soundToPlay);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {
        // Silenciar erro se não conseguir tocar (pode ser bloqueado pelo navegador)
      });
      
      audioRef.current = audio;
    };

    let unsubscribe: (() => void) | undefined;

    if (triggers.includes('onPointsGained')) {
      const handlePointsGained = () => {
        playSound();
      };
      unsubscribe = subscribeToPointsGained(handlePointsGained);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInBuilder, soundUrl, soundType, volume, triggers, subscribeToPointsGained]);

  return null; // Componente invisível
}

