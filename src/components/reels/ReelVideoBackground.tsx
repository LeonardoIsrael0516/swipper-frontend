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

    // Verificar se o estado mudou de inativo para ativo
    const wasActive = lastActiveStateRef.current;
    lastActiveStateRef.current = isActive;

    if (isActive) {
      // Versão blur sempre fica muted
      if (isBlurVersion) {
        video.muted = true;
        setIsMuted(true);
      } else {
        // Versão nítida: configurar muted conforme som desbloqueado
        const shouldBeMuted = !isSoundUnlocked;
        video.muted = shouldBeMuted;
        setIsMuted(shouldBeMuted);
        setShowSoundButton(shouldBeMuted);
      }

      // Só tentar tocar se:
      // 1. O slide acabou de ficar ativo (não estava ativo antes)
      // 2. E o vídeo está pausado
      // Isso evita tocar múltiplas vezes quando já está tocando
      if (!wasActive && video.paused) {
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
      } else if (wasActive && !video.paused) {
        // Se já estava ativo e está tocando, apenas garantir muted está correto
        if (isBlurVersion) {
          video.muted = true;
          setIsMuted(true);
        } else {
          const shouldBeMuted = !isSoundUnlocked;
          video.muted = shouldBeMuted;
          setIsMuted(shouldBeMuted);
        }
      }
    } else {
      // Vídeo não está ativo - apenas pausar (não resetar currentTime para evitar piscar)
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, autoplay, isBlurVersion, isSoundUnlocked]); // Incluir isSoundUnlocked para sincronizar muted inicial

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
        muted={isBlurVersion ? true : (isSoundUnlocked ? false : isMuted)} // Versão blur sempre muted, versão nítida conforme som desbloqueado
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

