import { useRef, useEffect, useState } from 'react';
import { VolumeX } from 'lucide-react';
import { useReelSound } from '@/contexts/ReelSoundContext';
import Hls from 'hls.js';

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
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false); // Rastrear se já tentamos tocar
  const hlsRef = useRef<Hls | null>(null); // Referência para instância HLS
  
  // Contexto global de som
  const { isSoundUnlocked, unlockSound } = useReelSound();
  
  // Verificar se é HLS
  const isHLS = src?.endsWith('.m3u8') || false;
  
  // Lógica de muted:
  // - Se isSoundUnlocked === true: tentar tocar com som
  // - Se isSoundUnlocked === false: sempre muted (comportamento atual dos navegadores)
  const shouldStartMuted = !isSoundUnlocked && autoplay;
  const effectiveMuted = shouldStartMuted ? true : (isSoundUnlocked ? false : muted);
  const [isMuted, setIsMuted] = useState(effectiveMuted);
  
  // Mostrar botão de som apenas se:
  // 1. Autoplay está ativo
  // 2. Som não está desbloqueado
  // 3. Não é a versão blur (só mostrar na versão nítida)
  // 4. E vídeo NÃO está tocando (ou seja, autoplay falhou)
  // Se o vídeo está tocando mutado, não mostrar botão
  const [showSoundButton, setShowSoundButton] = useState(false);
  
  // Atualizar estado do botão baseado em se o vídeo está tocando
  useEffect(() => {
    // Só mostrar botão se autoplay está ativo, som não está desbloqueado, não é blur, vídeo não está tocando, E já tentamos tocar
    // Adicionar delay para dar tempo do vídeo começar a tocar antes de mostrar o botão
    if (autoplay && !isSoundUnlocked && !isBlurVersion && !isPlaying && hasAttemptedPlay) {
      const timeout = setTimeout(() => {
        // Verificar novamente se ainda não está tocando após o delay
        const video = videoRef.current;
        if (video && video.paused && !isPlaying) {
          setShowSoundButton(true);
        }
      }, 1500); // Aguardar 1.5s antes de mostrar o botão (dar mais tempo para vídeo começar, especialmente no primeiro carregamento)
      
      return () => clearTimeout(timeout);
    } else {
      // Se vídeo está tocando ou não tentamos tocar, esconder botão
      setShowSoundButton(false);
    }
  }, [isSoundUnlocked, autoplay, isBlurVersion, isPlaying, hasAttemptedPlay]);

  // Configurar HLS se necessário
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHLS || !src) return;

    // Limpar instância HLS anterior se existir
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Verificar se o navegador suporta HLS nativamente (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari suporta HLS nativamente
      video.src = src;
      return;
    }

    // Para outros navegadores, usar hls.js
    if (Hls.isSupported()) {
      // Garantir que a URL seja HTTPS
      const secureUrl = src.startsWith('http://') 
        ? src.replace('http://', 'https://')
        : src;

      // CRÍTICO: Garantir muted ANTES de anexar mídia
      // Isso é essencial para autoplay funcionar em todos os navegadores
      if (isBlurVersion) {
        video.muted = true;
        video.setAttribute('muted', '');
      } else {
        video.muted = !isSoundUnlocked;
        if (!isSoundUnlocked) {
          video.setAttribute('muted', '');
        }
      }

      const hls = new Hls({
        enableWorker: false, // Desabilitar worker pode ajudar com problemas de SSL
        lowLatencyMode: false,
        backBufferLength: 90,
        xhrSetup: (xhr, url) => {
          // Garantir que todas as requisições sejam HTTPS
          const secureUrl = url.startsWith('http://') 
            ? url.replace('http://', 'https://')
            : url;
          // Tentar usar a URL segura se possível
          try {
            // Configurar CORS
            xhr.withCredentials = false;
            // Não podemos mudar a URL diretamente, mas podemos garantir HTTPS
          } catch (e) {
            // Ignorar erros de configuração
          }
        },
        // Configurações adicionais para lidar com SSL
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        // Configurações de rede mais conservadoras
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
      });

      hlsRef.current = hls;
      hls.loadSource(secureUrl);
      hls.attachMedia(video);

      // Tratamento de erros
      hls.on(Hls.Events.ERROR, (event, data) => {
        // Ignorar erros de SSL não fatais (podem ser falsos positivos)
        if (data.details && data.details.includes('SSL') && !data.fatal) {
          return;
        }

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Tentar recuperar de erros de rede
              console.warn('HLS network error, attempting to recover...', data);
              try {
                hls.startLoad();
              } catch (e) {
                console.error('Failed to recover from network error:', e);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // Tentar recuperar de erros de mídia
              console.warn('HLS media error, attempting to recover...', data);
              try {
                hls.recoverMediaError();
              } catch (e) {
                console.error('Failed to recover from media error:', e);
              }
              break;
            default:
              // Erro fatal, recriar instância
              console.error('HLS fatal error, destroying and recreating...', data);
              hls.destroy();
              hlsRef.current = null;
              // Tentar novamente após um delay
              setTimeout(() => {
                if (video && isActive && autoplay && !hlsRef.current && !video.src) {
                  const newHls = new Hls({
                    enableWorker: false,
                    lowLatencyMode: false,
                    backBufferLength: 90,
                  });
                  hlsRef.current = newHls;
                  newHls.loadSource(secureUrl);
                  newHls.attachMedia(video);
                }
              }, 1000);
              break;
          }
        } else {
          // Erro não fatal, apenas logar se não for SSL
          if (!data.details || !data.details.includes('SSL')) {
            console.warn('HLS non-fatal error:', data);
          }
        }
      });

      // Tentar tocar quando HLS estiver pronto
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Garantir muted antes de tentar tocar
        if (isBlurVersion) {
          video.muted = true;
          video.setAttribute('muted', '');
        } else {
          video.muted = !isSoundUnlocked;
          if (!isSoundUnlocked) {
            video.setAttribute('muted', '');
          }
        }
        
        if (isActive && autoplay) {
          video.play().catch(() => {
            // Autoplay pode falhar
          });
        }
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    } else {
      // Fallback: tentar usar video.src mesmo sem suporte
      const secureUrl = src.startsWith('http://') 
        ? src.replace('http://', 'https://')
        : src;
      video.src = secureUrl;
    }
  }, [src, isHLS, isActive, autoplay, isBlurVersion, isSoundUnlocked]);

  // Setup event listeners uma vez
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isHLS) return; // Não processar vídeos HLS aqui (já processado acima)

    const handlePlay = () => {
      setIsPlaying(true);
      // Quando vídeo começa a tocar, resetar hasAttemptedPlay para esconder botão
      setHasAttemptedPlay(false);
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
    if (!video || !autoplay || isHLS) return; // HLS é controlado pelo useEffect acima

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
      }
      
      // Tentar tocar se estiver pausado
      if (video.paused) {
        // Marcar que tentamos tocar apenas quando realmente tentamos
        setHasAttemptedPlay(true);
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              // Autoplay bloqueado - o useEffect vai atualizar o botão baseado em isPlaying
              // Não fazer nada aqui, o estado isPlaying já vai estar false
            });
        }
      } else {
        // Se vídeo já está tocando, não marcar hasAttemptedPlay
        // Isso evita mostrar botão quando vídeo já está tocando
        if (video.readyState >= 2) {
          setIsPlaying(true);
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

    const handleLoadedMetadata = () => {
      // Tentar tocar assim que metadata estiver carregada
      if (isActive && autoplay) {
        tryPlay();
      }
    };

    // Adicionar listeners sempre (mesmo quando não está ativo, para quando ficar ativo)
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    if (isActive) {
      // Garantir muted antes de tentar tocar (necessário para autoplay funcionar)
      if (isBlurVersion) {
        video.muted = true;
        setIsMuted(true);
      } else {
        const shouldBeMuted = !isSoundUnlocked;
        video.muted = shouldBeMuted;
        setIsMuted(shouldBeMuted);
      }
      
      // Tentar tocar imediatamente (o autoplay nativo também vai tentar)
      tryPlay();
      
      // Tentar novamente após delays (para casos onde o vídeo ainda está carregando)
      const timeoutId1 = setTimeout(tryPlay, 100);
      const timeoutId2 = setTimeout(tryPlay, 300);
      const timeoutId3 = setTimeout(tryPlay, 600);
      const timeoutId4 = setTimeout(tryPlay, 1000);
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
        clearTimeout(timeoutId4);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    } else {
      // Vídeo não está ativo - apenas pausar (não resetar currentTime para evitar re-buffer)
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
      // Resetar hasAttemptedPlay quando slide não está ativo
      setHasAttemptedPlay(false);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, [isActive, autoplay, isBlurVersion, isSoundUnlocked]); // Incluir isSoundUnlocked para sincronizar muted inicial

  // Garantir que vídeo sempre tente tocar quando estiver ativo (para iOS e outros casos)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive || !autoplay || isHLS) {
      // Resetar hasAttemptedPlay quando não está ativo
      if (!isActive) {
        setHasAttemptedPlay(false);
      }
      return;
    }

    // Função para tentar tocar o vídeo (sempre muted se som não desbloqueado)
    const attemptPlay = () => {
      if (!video || !isActive || !autoplay) return;
      
      // CRÍTICO: Garantir muted ANTES de tentar tocar
      // Configurar muted corretamente
      if (isBlurVersion) {
        video.muted = true;
        video.setAttribute('muted', '');
        setIsMuted(true);
      } else {
        // Versão nítida: sempre muted se som não desbloqueado
        const shouldBeMuted = !isSoundUnlocked;
        video.muted = shouldBeMuted;
        if (shouldBeMuted) {
          video.setAttribute('muted', '');
        }
        setIsMuted(shouldBeMuted);
      }
      
      // Tentar tocar se estiver pausado (mesmo que ainda não esteja totalmente carregado)
      if (video.paused) {
        // Marcar que tentamos tocar apenas quando realmente tentamos
        setHasAttemptedPlay(true);
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setHasAttemptedPlay(false); // Resetar quando começar a tocar
            })
            .catch(() => {
              // Autoplay bloqueado - isso é esperado no iOS até haver interação
              // O useEffect vai atualizar o botão baseado em isPlaying
            });
        }
      } else {
        // Se vídeo já está tocando, não marcar hasAttemptedPlay
        if (video.readyState >= 2) {
          setIsPlaying(true);
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
        src={isHLS ? undefined : src} // HLS é configurado via hls.js, não via src
        autoPlay={isActive && autoplay && !isHLS} // HLS autoplay é controlado via hls.js
        loop={loop}
        muted={isBlurVersion ? true : !isSoundUnlocked} // Versão blur sempre muted, versão nítida sempre muted se som não desbloqueado (necessário para autoplay)
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

