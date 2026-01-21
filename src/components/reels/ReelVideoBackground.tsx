import { useRef, useEffect, useState } from 'react';
import { VolumeX } from 'lucide-react';
import { useReelSound } from '@/contexts/ReelSoundContext';

interface ReelVideoBackgroundProps {
  src: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  opacity?: number;
  isActive?: boolean;
  isBlurVersion?: boolean; // Para versão blur no desktop
  className?: string;
}

export function ReelVideoBackground({
  src,
  thumbnailUrl,
  autoplay = true,
  loop = true,
  muted = true,
  opacity = 1,
  isActive = false,
  isBlurVersion = false,
  className = '',
}: ReelVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const lastActiveStateRef = useRef<boolean>(false); // Rastrear último estado de isActive
  
  // Contexto global de som
  const { isSoundUnlocked, unlockSound } = useReelSound();
  
  // Lógica de muted:
  // - Se isSoundUnlocked === true: tentar tocar com som
  // - Se isSoundUnlocked === false: sempre muted (comportamento atual dos navegadores)
  const shouldStartMuted = !isSoundUnlocked && autoplay;
  const effectiveMuted = shouldStartMuted ? true : (isSoundUnlocked ? false : muted);
  const [isMuted, setIsMuted] = useState(effectiveMuted);
  
  // Mostrar botão de som apenas se autoplay está ativo E som não está desbloqueado
  // E não é a versão blur (só mostrar na versão nítida)
  const shouldShowSoundButton = autoplay && !isSoundUnlocked && !isBlurVersion;
  const [showSoundButton, setShowSoundButton] = useState(shouldShowSoundButton);
  
  // Sincronizar estado do botão quando isSoundUnlocked ou autoplay mudarem
  useEffect(() => {
    const shouldShow = autoplay && !isSoundUnlocked && !isBlurVersion;
    setShowSoundButton(shouldShow);
  }, [isSoundUnlocked, autoplay, isBlurVersion]);

  // Setup event listeners uma vez
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (loop && isActive) {
        // Loop automático apenas se estiver ativo
        video.play().catch(() => {
          // Autoplay pode falhar, mas isso é esperado
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [loop, isActive]);

  // Efeito para desmutar quando som é desbloqueado
  // IMPORTANTE: Versão blur sempre deve ficar muted (não tocar som)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;
    
    // Versão blur sempre fica muted - apenas a versão nítida toca som
    if (isBlurVersion) {
      video.muted = true;
      setIsMuted(true);
      return;
    }
    
    // Para versão nítida: quando isSoundUnlocked muda, reiniciar do início com som
    if (isSoundUnlocked) {
      // Reiniciar do início e desmutar
      video.currentTime = 0;
      video.muted = false;
      setIsMuted(false);
      setShowSoundButton(false);
      
      // Tocar novamente do início com som
      video.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Error playing video:', error);
        });
    }
  }, [isSoundUnlocked, isActive, isBlurVersion]);

  // Consolidar lógica de play/pause baseada em isActive
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay) return;

    // Função para tentar tocar o vídeo
    const tryPlay = () => {
      if (!video || !isActive || !autoplay) return;
      
      // Configurar muted antes de tentar tocar
      if (isBlurVersion) {
        video.muted = true;
        setIsMuted(true);
      } else {
        const shouldBeMuted = !isSoundUnlocked;
        video.muted = shouldBeMuted;
        setIsMuted(shouldBeMuted);
        setShowSoundButton(shouldBeMuted);
      }
      
      // Tentar tocar se estiver pausado
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              // Autoplay bloqueado - manter botão visível se necessário
              if (!isBlurVersion && !isSoundUnlocked) {
                setShowSoundButton(true);
              }
            });
        }
      }
    };

    // Listener para quando o vídeo estiver pronto para tocar
    const handleCanPlay = () => {
      if (isActive && autoplay) {
        tryPlay();
      }
    };

    const handleLoadedData = () => {
      if (isActive && autoplay) {
        tryPlay();
      }
    };

    // Adicionar listeners sempre (mesmo quando não está ativo, para quando ficar ativo)
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    if (isActive) {
      // Tentar tocar imediatamente
      tryPlay();
      
      // Tentar novamente após delays (para casos onde o vídeo ainda está carregando)
      const timeoutId1 = setTimeout(tryPlay, 100);
      const timeoutId2 = setTimeout(tryPlay, 500);
      const timeoutId3 = setTimeout(tryPlay, 1000);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    } else {
      // Vídeo não está ativo - apenas pausar (não resetar currentTime para evitar re-buffer)
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, [isActive, autoplay, isBlurVersion, isSoundUnlocked]); // Incluir isSoundUnlocked para sincronizar muted inicial

  // Garantir que vídeo tente tocar quando estiver pronto (mesmo após montagem ou atualização)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive || !autoplay) return;

    // Verificar se vídeo já está pronto para tocar
    const checkAndPlay = () => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA ou superior
        // Vídeo já está pronto - configurar muted e tentar tocar
        if (isBlurVersion) {
          video.muted = true;
          setIsMuted(true);
        } else {
          const shouldBeMuted = !isSoundUnlocked;
          video.muted = shouldBeMuted;
          setIsMuted(shouldBeMuted);
        }
        
        if (video.paused) {
          video.play().catch(() => {
            // Autoplay pode falhar, isso é esperado
          });
        }
      }
    };

    // Verificar imediatamente
    checkAndPlay();

    // Adicionar listener para quando vídeo estiver pronto
    const handleReady = () => {
      checkAndPlay();
    };

    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);

    return () => {
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
    };
  }, [isActive, autoplay, isBlurVersion, isSoundUnlocked]);

  const handleUnlockSound = () => {
    // Desbloquear som globalmente - isso afeta todos os vídeos
    unlockSound();
    
    // Para vídeo de background: reiniciar do início com som
    const video = videoRef.current;
    if (video && isActive && !isBlurVersion) {
      setHasUserInteracted(true);
      
      // Reiniciar do início
      video.currentTime = 0;
      video.muted = false;
      setIsMuted(false);
      setShowSoundButton(false);
      
      // Tocar do início com som
      video.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Error playing video:', error);
        });
    }
  };

  // Classes para versão blur (fundo fixo no desktop)
  // No mobile, a versão blur não deve aparecer (hidden), apenas a versão nítida
  // Versão nítida deve estar absolute com z-index baixo para ficar abaixo dos elementos
  const blurClasses = isBlurVersion 
    ? `reel-slide-desktop-bg hidden md:block reel-video-bg-blur`
    : "absolute inset-0 w-full h-full object-cover z-0";

  return (
    <div 
      className={`relative ${isBlurVersion ? '' : 'w-full h-full'} ${className}`} 
      style={{ 
        zIndex: showSoundButton && !isBlurVersion && isActive ? 50 : 0, // Aumentar z-index do container quando botão está visível
        position: 'relative',
      }}
    >
      <video
        ref={videoRef}
        key={src} // Key estável baseado na URL
        src={src}
        autoPlay={false} // Sempre false - controlamos via JavaScript
        loop={loop}
        muted={isBlurVersion ? true : (!isSoundUnlocked ? true : isMuted)} // Versão blur sempre muted, versão nítida sempre muted se som não desbloqueado
        playsInline
        preload="auto"
        poster={thumbnailUrl}
        className={blurClasses}
        style={{
          opacity: isBlurVersion && !isActive ? 0 : (opacity !== undefined ? opacity : 1),
          transition: 'opacity 0.3s ease-in-out',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: 'none', // Vídeo não deve capturar cliques
        }}
      />
      
      {/* Botão de som removido - agora renderizado diretamente no ReelSlide para ficar acima do ReelContent */}
    </div>
  );
}

