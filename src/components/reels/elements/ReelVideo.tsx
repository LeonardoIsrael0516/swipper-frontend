import { useRef, useEffect, useState, memo } from 'react';
import { VolumeX } from 'lucide-react';
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube';
import { useReelSound } from '@/contexts/ReelSoundContext';

interface ReelVideoProps {
  src?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  orientation?: 'horizontal' | 'vertical';
  borderRadius?: number;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  isActive?: boolean; // Indica se o vídeo está no slide atual
}

export const ReelVideo = memo(function ReelVideo({
  src,
  youtubeUrl,
  thumbnailUrl,
  autoplay = true,
  loop = true,
  muted = true,
  controls = false,
  orientation = 'vertical',
  borderRadius = 0,
  className = '',
  onPlay,
  onPause,
  isActive = false,
}: ReelVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Contexto global de som
  const { isSoundUnlocked, unlockSound } = useReelSound();
  
  // Determinar origem do vídeo
  const isYouTube = !!youtubeUrl;
  const videoSrc = isYouTube ? null : src;
  
  // Lógica de muted:
  // - Se isSoundUnlocked === true: tentar tocar com som
  // - Se isSoundUnlocked === false: sempre muted (comportamento atual dos navegadores)
  // Inicializar sempre como muted para garantir autoplay funciona
  const [isMuted, setIsMuted] = useState(true); // Sempre começar muted para autoplay funcionar
  
  // Mostrar botão de som apenas se:
  // 1. Autoplay está ativo
  // 2. Som não está desbloqueado
  // 3. E vídeo NÃO está tocando (ou seja, autoplay falhou)
  // Se o vídeo está tocando mutado, não mostrar botão
  const [showYouTubePlayButton, setShowYouTubePlayButton] = useState(false);
  const [showVideoPlayButton, setShowVideoPlayButton] = useState(false);
  
  // Atualizar estado dos botões baseado em se o vídeo está tocando
  useEffect(() => {
    // Só mostrar botão se autoplay está ativo, som não está desbloqueado, E vídeo não está tocando
    const shouldShow = autoplay && !isSoundUnlocked && !isPlaying;
    setShowYouTubePlayButton(shouldShow);
    setShowVideoPlayButton(shouldShow);
  }, [isSoundUnlocked, autoplay, isPlaying]);
  
  // Mostrar botão de play:
  // - YouTube: quando autoplay falhou (vídeo não está tocando)
  // - Vídeo local: quando autoplay falhou (vídeo não está tocando)
  const showPlayButton = isYouTube 
    ? showYouTubePlayButton
    : showVideoPlayButton;

  // YouTube embed URL - autoplay funciona apenas quando muted=true
  // Só fazer autoplay se vídeo está ativo
  const youtubeEmbedUrl = isYouTube && youtubeUrl ? getYouTubeEmbedUrl(extractYouTubeId(youtubeUrl) || '', {
    autoplay: autoplay && isActive, // Só autoplay se estiver ativo
    loop,
    muted: !isSoundUnlocked, // Muted se som não estiver desbloqueado
    controls,
  }) : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    const handlePlay = () => {
      setIsPlaying(true);
      // Não esconder botão aqui - ele só deve ser escondido quando som for desbloqueado
      // O useEffect já gerencia isso baseado em isSoundUnlocked
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (loop) {
        // Loop automático
        video.play().catch(() => {
          // Autoplay pode falhar, mas isso é esperado
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Função para tentar tocar o vídeo
    const tryPlay = () => {
      if (!video || !isActive || !autoplay) return;
      
      // Configurar muted antes de tentar tocar
      if (isSoundUnlocked) {
        video.muted = false;
        setIsMuted(false);
        setShowVideoPlayButton(false);
      } else {
        // Se som não está desbloqueado, tocar muted
        video.muted = true;
        setIsMuted(true);
      }
      
      // Tentar tocar se estiver pausado
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              // Autoplay bloqueado - o useEffect vai atualizar o botão baseado em isPlaying
              // Não fazer nada aqui, o estado isPlaying já vai estar false
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

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    // Controlar play/pause baseado em isActive
    if (isActive && autoplay) {
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
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    } else if (!isActive) {
      // Se vídeo não está ativo, apenas pausar (não resetar currentTime para evitar re-buffer)
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
      // Manter muted se não está ativo
      video.muted = true;
      setIsMuted(true);
    }
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [autoplay, loop, hasUserInteracted, isYouTube, isSoundUnlocked, isActive, onPlay, onPause]);

  // Efeito específico: quando isActive muda para true, forçar play imediatamente
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube || !isActive || !autoplay) return;

    // Garantir muted antes de tentar tocar
    if (!isSoundUnlocked) {
      video.muted = true;
      setIsMuted(true);
    }

    // Tentar tocar imediatamente quando slide fica ativo
    const forcePlay = () => {
      if (video && video.paused && isActive && autoplay) {
        video.play().catch(() => {
          // Autoplay pode falhar no iOS até haver interação
        });
      }
    };

    // Tentar imediatamente
    forcePlay();

    // Tentar após pequenos delays (vídeo pode ainda estar carregando)
    const timeout1 = setTimeout(forcePlay, 50);
    const timeout2 = setTimeout(forcePlay, 200);
    const timeout3 = setTimeout(forcePlay, 500);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [isActive, autoplay, isSoundUnlocked, isYouTube]);

  // Garantir que vídeo sempre tente tocar quando estiver ativo (para iOS e outros casos)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube || !isActive || !autoplay) return;

    // Função para tentar tocar o vídeo (sempre muted se som não desbloqueado)
    const attemptPlay = () => {
      if (!video || !isActive || !autoplay) return;
      
      // SEMPRE garantir muted se som não está desbloqueado (necessário para autoplay)
      if (!isSoundUnlocked) {
        video.muted = true;
        setIsMuted(true);
      }
      
      // Tentar tocar se estiver pausado (mesmo que ainda não esteja totalmente carregado)
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              // Autoplay bloqueado - isso é esperado no iOS até haver interação
              // Não fazer nada, o listener de interação vai tentar novamente
            });
        }
      }
    };

    // Tentar imediatamente
    attemptPlay();

    // Adicionar listeners para quando vídeo estiver pronto
    const handleReady = () => {
      attemptPlay();
    };

    video.addEventListener('loadedmetadata', handleReady);
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('canplaythrough', handleReady);

    // No iOS, autoplay só funciona após interação do usuário
    // Adicionar listener global para qualquer interação na página
    const handleUserInteraction = () => {
      attemptPlay();
    };

    // Adicionar listeners para diferentes tipos de interação (uma vez apenas)
    const options = { once: true, passive: true };
    document.addEventListener('touchstart', handleUserInteraction, options);
    document.addEventListener('touchend', handleUserInteraction, options);
    document.addEventListener('click', handleUserInteraction, options);
    window.addEventListener('scroll', handleUserInteraction, options);

    return () => {
      video.removeEventListener('loadedmetadata', handleReady);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('canplaythrough', handleReady);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('touchend', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, [isActive, autoplay, isSoundUnlocked, isYouTube]);

  const handleUnlockSound = () => {
    // Desbloquear som globalmente - isso afeta todos os vídeos
    unlockSound();
    
    if (isYouTube && iframeRef.current) {
      // Para YouTube, recarregar o iframe sem muted para habilitar som
      setHasUserInteracted(true);
      setIsMuted(false);
      setShowYouTubePlayButton(false);
      
      const videoId = extractYouTubeId(youtubeUrl || '');
      if (videoId) {
        // Criar URL manualmente para garantir que muted=false seja respeitado
        const params = new URLSearchParams();
        params.append('autoplay', '1');
        params.append('loop', loop ? '1' : '0');
        if (loop) {
          params.append('playlist', videoId);
        }
        params.append('modestbranding', '1');
        params.append('playsinline', '1');
        params.append('rel', '0');
        params.append('iv_load_policy', '3');
        params.append('fs', '0');
        params.append('cc_load_policy', '0');
        params.append('disablekb', '1');
        params.append('enablejsapi', '1');
        if (controls === false) {
          params.append('controls', '0');
        }
        if (typeof window !== 'undefined') {
          params.append('origin', window.location.origin);
        }
        // NÃO adicionar mute=1 quando queremos som
        const newUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
        iframeRef.current.src = newUrl;
        setIsPlaying(true);
        onPlay?.();
      }
    } else {
      // Para vídeo local (upload): desmutar e tocar com som
      const video = videoRef.current;
      if (video) {
        setHasUserInteracted(true);
        setIsMuted(false);
        video.muted = false;
        
        // Voltar para o início
        video.currentTime = 0;
        
        // Esconder botão após clicar
        setShowVideoPlayButton(false);
        
        video.play()
          .then(() => {
            setIsPlaying(true);
            onPlay?.();
          })
          .catch((error) => {
            console.error('Error playing video:', error);
            // Se falhar, não mostrar botão novamente (som já foi desbloqueado)
          });
      }
    }
  };
  
  // Atualizar estado quando isSoundUnlocked mudar (para reiniciar com som)
  useEffect(() => {
    if (isActive && isSoundUnlocked) {
      // Som foi desbloqueado e vídeo está ativo - reiniciar com som
      if (isYouTube && iframeRef.current) {
        // Para YouTube, recarregar iframe sem muted
        const videoId = extractYouTubeId(youtubeUrl || '');
        if (videoId) {
          const params = new URLSearchParams();
          params.append('autoplay', '1');
          params.append('loop', loop ? '1' : '0');
          if (loop) {
            params.append('playlist', videoId);
          }
          params.append('modestbranding', '1');
          params.append('playsinline', '1');
          params.append('rel', '0');
          params.append('iv_load_policy', '3');
          params.append('fs', '0');
          params.append('cc_load_policy', '0');
          params.append('disablekb', '1');
          params.append('enablejsapi', '1');
          if (controls === false) {
            params.append('controls', '0');
          }
          if (typeof window !== 'undefined') {
            params.append('origin', window.location.origin);
          }
          // NÃO adicionar mute=1
          const newUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
          iframeRef.current.src = newUrl;
        }
      } else {
        // Para vídeo local - reiniciar do início com som
        const video = videoRef.current;
        if (video) {
          video.currentTime = 0; // Reiniciar do início quando desbloquear som
          video.muted = false;
          setIsMuted(false);
          setShowVideoPlayButton(false);
          // Tentar tocar
          video.play().catch(() => {
            // Ignorar erro se autoplay falhar
          });
        }
      }
    }
  }, [isSoundUnlocked, isActive, isYouTube, youtubeUrl, loop, controls]);


  // Se for YouTube, renderizar iframe
  if (isYouTube && youtubeEmbedUrl) {
    const aspectRatio = orientation === 'horizontal' ? '16/9' : '9/16';
    
    // Técnica de crop para esconder controles/título quando controls=false
    // Aumentamos o iframe e reposicionamos para cortar a parte inferior
    const cropAmount = !controls ? (orientation === 'horizontal' ? 200 : 150) : 0;
    const cropTop = !controls ? (orientation === 'horizontal' ? -100 : -75) : 0;
    
    return (
      <div 
        className={`relative w-full ${className}`} 
        style={{ 
          aspectRatio,
          maxWidth: '100%',
          maxHeight: orientation === 'horizontal' ? 'calc(100vw * 9 / 16)' : '100%',
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          margin: '0 auto',
          position: 'relative',
          isolation: 'isolate', // Cria novo contexto de empilhamento para border radius
          backgroundColor: '#000', // Fundo preto para áreas cortadas
        }}
      >
        <iframe
          ref={iframeRef}
          key={`${extractYouTubeId(youtubeUrl || '')}-${isActive ? 'active' : 'inactive'}`}
          src={youtubeEmbedUrl || undefined}
          className="w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          style={{
            aspectRatio,
            width: orientation === 'vertical' && !controls ? `calc(100% + ${cropAmount}px)` : '100%',
            height: !controls ? `calc(100% + ${cropAmount}px)` : '100%',
            display: 'block',
            borderRadius: `${borderRadius}px`,
            position: 'absolute',
            top: `${cropTop}px`,
            left: orientation === 'vertical' && !controls ? `${cropTop}px` : 0,
            border: 'none',
            opacity: 1,
          }}
        />
        {/* Botão de som minimalista no canto inferior direito */}
        {showYouTubePlayButton && (
          <button
            onClick={handleUnlockSound}
            className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center z-50 cursor-pointer transition-all hover:bg-black/70 hover:scale-110"
            aria-label="Ativar som"
            style={{ zIndex: 50 }}
          >
            <VolumeX className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    );
  }

  // Vídeo local
  if (!videoSrc) {
    return (
      <div className={`relative w-full h-full bg-black/20 flex items-center justify-center ${className}`}>
        <p className="text-white/60 text-sm">Nenhum vídeo configurado</p>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`}
      data-video-element="true"
      style={{ 
        width: '100%',
        aspectRatio: orientation === 'vertical' ? '9/16' : '16/9',
        maxHeight: orientation === 'horizontal' ? 'calc(100vw * 9 / 16)' : '100%',
        maxWidth: '100%',
        borderRadius: `${borderRadius}px`,
        position: 'relative',
        zIndex: 'auto',
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay={isActive && autoplay} // Usar autoplay nativo quando ativo (funciona melhor no iOS)
        loop={loop}
        muted={!isSoundUnlocked} // SEMPRE muted se som não estiver desbloqueado (necessário para autoplay)
        controls={controls}
        playsInline
        preload="auto"
        className="w-full h-full object-contain"
        style={{
          position: 'relative',
          width: '100%',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        poster={thumbnailUrl}
      />

      {/* Botão de som minimalista no canto inferior direito */}
      {showPlayButton && (
        <button
          onClick={handleUnlockSound}
          className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center z-50 cursor-pointer transition-all hover:bg-black/70 hover:scale-110"
          aria-label="Ativar som"
          style={{ zIndex: 50 }}
        >
          <VolumeX className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
});

