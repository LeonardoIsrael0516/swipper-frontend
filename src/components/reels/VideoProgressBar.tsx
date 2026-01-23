import { useEffect, useState, useRef } from 'react';
import { RefObject } from 'react';

interface VideoProgressBarProps {
  videoRef: RefObject<HTMLVideoElement>;
  enabled: boolean;
  fakeProgress?: boolean;
  fakeProgressSpeed?: number;
  fakeProgressSlowdownStart?: number;
}

const calculateFakeProgress = (
  currentTime: number,
  duration: number,
  speed: number,
  slowdownStart: number
): number => {
  if (!duration || duration === 0) return 0;
  
  const realProgress = currentTime / duration;
  
  if (realProgress < slowdownStart) {
    // Acelerar: barrinha avança mais rápido que o vídeo
    return Math.min(realProgress * speed, slowdownStart);
  } else {
    // Desacelerar progressivamente até sincronizar com o vídeo real
    // Nos últimos 5% do vídeo, sincronizar completamente com o progresso real
    const finalSyncPoint = 0.95; // Últimos 5% sincronizam completamente
    
    if (realProgress >= finalSyncPoint) {
      // Nos últimos 5%, usar progresso real diretamente (sincronização completa)
      return realProgress;
    }
    
    // Entre slowdownStart e finalSyncPoint, desacelerar progressivamente
    // Calcular quanto do vídeo real já passou desde o início da desaceleração até o ponto de sincronização final
    const progressInSlowdown = (realProgress - slowdownStart) / (finalSyncPoint - slowdownStart);
    
    // Aplicar curva de desaceleração (ease-out cúbica) para suavizar
    // Isso garante que a desaceleração seja mais rápida no início e mais lenta conforme se aproxima do final
    const easedProgress = 1 - Math.pow(1 - progressInSlowdown, 3);
    
    // Calcular quanto falta na barrinha fake até o ponto de sincronização final
    const remainingFake = finalSyncPoint - slowdownStart;
    
    // Interpolar suavemente entre slowdownStart e finalSyncPoint
    return slowdownStart + (remainingFake * easedProgress);
  }
};

export function VideoProgressBar({
  videoRef,
  enabled,
  fakeProgress = false,
  fakeProgressSpeed = 1.5,
  fakeProgressSlowdownStart = 0.9,
}: VideoProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastCurrentTimeRef = useRef<number>(0); // Rastrear último currentTime para detectar reinício

  useEffect(() => {
    if (!enabled || !videoRef.current) {
      setProgress(0);
      return;
    }

    const video = videoRef.current;

    const updateProgress = () => {
      if (!video) {
        return;
      }

      const currentTime = video.currentTime;
      const duration = video.duration;

      if (!duration || duration === 0 || isNaN(duration)) {
        // Se ainda não tem duração, tentar novamente
        if (!video.paused) {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
        return;
      }

      // Detectar se o vídeo reiniciou (loop) - currentTime voltou para um valor menor que o anterior
      // Mas apenas se a diferença for significativa (mais de 1 segundo) para evitar falsos positivos
      if (currentTime < lastCurrentTimeRef.current - 1 && lastCurrentTimeRef.current > 0.5) {
        // Vídeo reiniciou - resetar progresso
        setProgress(0);
        lastCurrentTimeRef.current = currentTime;
        if (!video.paused) {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
        return;
      }

      lastCurrentTimeRef.current = currentTime;

      let newProgress: number;

      if (fakeProgress) {
        newProgress = calculateFakeProgress(
          currentTime,
          duration,
          fakeProgressSpeed,
          fakeProgressSlowdownStart
        );
      } else {
        newProgress = currentTime / duration;
      }

      // Garantir que progresso está entre 0 e 1
      newProgress = Math.max(0, Math.min(1, newProgress));
      setProgress(newProgress);

      // Continuar atualizando apenas se o vídeo estiver tocando
      if (!video.paused) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    // Função para atualizar progresso quando vídeo estiver pronto
    const updateProgressOnce = () => {
      if (video.readyState >= 2) {
        updateProgress();
      }
    };

    // Listener para quando o vídeo terminar
    const handleEnded = () => {
      setProgress(1);
      lastCurrentTimeRef.current = 0; // Resetar para detectar próximo reinício
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    // Listener para quando o vídeo reiniciar (seeked ou loop)
    const handleSeeked = () => {
      // Resetar progresso quando vídeo for reposicionado
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration && duration > 0) {
        if (currentTime < 0.1) {
          // Vídeo voltou para o início - resetar progresso
          setProgress(0);
          lastCurrentTimeRef.current = 0;
        } else {
          // Vídeo foi reposicionado - atualizar progresso
          updateProgressOnce();
        }
      }
    };

    // Listener para quando o vídeo pausar - atualizar progresso final
    const handlePause = () => {
      updateProgressOnce();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    // Listener para quando o vídeo tocar - iniciar animação
    const handlePlay = () => {
      updateProgressOnce();
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    // Listener para quando metadata estiver carregada
    const handleLoadedMetadata = () => {
      updateProgressOnce();
    };

    // Listener para quando dados estiverem carregados
    const handleLoadedData = () => {
      updateProgressOnce();
    };

    // Listener para timeupdate (atualização de tempo do vídeo)
    const handleTimeUpdate = () => {
      updateProgressOnce();
    };

    // Adicionar listeners
    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);

    // Atualizar progresso inicial
    updateProgressOnce();
    lastCurrentTimeRef.current = video.currentTime || 0;

    // Iniciar animação se vídeo estiver tocando
    if (!video.paused) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [enabled, fakeProgress, fakeProgressSpeed, fakeProgressSlowdownStart, videoRef]);

  if (!enabled) {
    return null;
  }

  // Debug temporário
  if (typeof window !== 'undefined' && (window as any).__DEBUG_VIDEO_PROGRESS) {
    console.log('VideoProgressBar render:', {
      enabled,
      progress,
      videoRef: videoRef.current ? {
        currentTime: videoRef.current.currentTime,
        duration: videoRef.current.duration,
        paused: videoRef.current.paused,
      } : null,
    });
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{
        zIndex: 1000, // Z-index muito alto para ficar acima de tudo
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px', // Altura maior para garantir visibilidade
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fundo semi-transparente
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)', // Cor branca quase opaca
          transition: 'width 0.1s linear', // Transição suave
        }}
      />
    </div>
  );
}

