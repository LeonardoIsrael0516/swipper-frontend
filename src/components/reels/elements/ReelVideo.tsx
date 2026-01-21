import { useRef, useEffect, useState, memo } from 'react';
import { VolumeX } from 'lucide-react';
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube';
import { useReelSound } from '@/contexts/ReelSoundContext';
import Hls from 'hls.js';

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
  const [hasAttemptedPlay, setHasAttemptedPlay] = useState(false); // Rastrear se já tentamos tocar
  
  // Contexto global de som
  const { isSoundUnlocked, unlockSound } = useReelSound();
  
  // Determinar origem do vídeo
  const isYouTube = !!youtubeUrl;
  const videoSrc = isYouTube ? null : src;
  const isHLS = videoSrc?.endsWith('.m3u8') || false;
  
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
    // Só mostrar botão se autoplay está ativo, som não está desbloqueado, vídeo não está tocando, E já tentamos tocar
    // Adicionar delay para dar tempo do vídeo começar a tocar antes de mostrar o botão
    if (autoplay && !isSoundUnlocked && !isPlaying && hasAttemptedPlay) {
      const timeout = setTimeout(() => {
        // Verificar novamente se ainda não está tocando após o delay
        const video = videoRef.current;
        if (video && video.paused && !isPlaying) {
          setShowYouTubePlayButton(true);
          setShowVideoPlayButton(true);
        }
      }, 1500); // Aguardar 1.5s antes de mostrar o botão (dar mais tempo para vídeo começar, especialmente no primeiro carregamento)
      
      return () => clearTimeout(timeout);
    } else {
      // Se vídeo está tocando ou não tentamos tocar, esconder botão
      setShowYouTubePlayButton(false);
      setShowVideoPlayButton(false);
    }
  }, [isSoundUnlocked, autoplay, isPlaying, hasAttemptedPlay]);
  
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

  // Configurar HLS se necessário
  // Pré-carregar vídeo mesmo quando não está ativo para melhorar performance
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube || !isHLS || !videoSrc) return;

    // Verificar se o navegador suporta HLS nativamente (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari suporta HLS nativamente - pré-carregar mesmo quando não está ativo
      if (!video.src || video.src !== videoSrc) {
        video.src = videoSrc;
        video.load(); // Forçar carregamento para pré-carregar
      }
      return;
    }

    // Para outros navegadores, usar hls.js
    if (Hls.isSupported()) {
      // Garantir que a URL seja HTTPS
      const secureUrl = videoSrc.startsWith('http://') 
        ? videoSrc.replace('http://', 'https://')
        : videoSrc;

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

      hls.loadSource(secureUrl);
      hls.attachMedia(video);

      // Configurar muted para autoplay funcionar
      if (!isSoundUnlocked) {
        video.muted = true;
      }

      // Pré-carregar vídeo mesmo quando não está ativo para melhorar performance
      // O hls.js já começa a carregar quando attachMedia é chamado

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
              // Tentar novamente após um delay
              setTimeout(() => {
                if (video && isActive && autoplay && !video.src) {
                  const newHls = new Hls({
                    enableWorker: false,
                    lowLatencyMode: false,
                    backBufferLength: 90,
                  });
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
        if (!isSoundUnlocked) {
          video.muted = true;
        }
        // Tentar tocar se estiver ativo, senão aguardar até ficar ativo
        if (isActive && autoplay) {
          video.play().catch(() => {
            // Autoplay pode falhar, mas vamos tentar novamente quando slide ficar ativo
          });
        }
      });

      return () => {
        hls.destroy();
      };
    } else {
      // Fallback: tentar usar video.src mesmo sem suporte
      const secureUrl = videoSrc.startsWith('http://') 
        ? videoSrc.replace('http://', 'https://')
        : videoSrc;
      if (!video.src || video.src !== secureUrl) {
        video.src = secureUrl;
        // Pré-carregar vídeo mesmo quando não está ativo para melhorar performance
        video.load();
      }
    }
  }, [videoSrc, isHLS, isYouTube]); // Remover isActive, autoplay, isSoundUnlocked das dependências para pré-carregar sempre

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube || isHLS) return; // Não processar vídeos HLS aqui (já processado acima)

    const handlePlay = () => {
      setIsPlaying(true);
      // Quando vídeo começa a tocar, resetar hasAttemptedPlay para esconder botão
      setHasAttemptedPlay(false);
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
        // Marcar que tentamos tocar apenas quando realmente tentamos
        setHasAttemptedPlay(true);
        
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

    // Adicionar listeners para múltiplos eventos de carregamento
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    // Controlar play/pause baseado em isActive
    if (isActive && autoplay) {
      // Tentar tocar imediatamente
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
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
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
      // Resetar hasAttemptedPlay quando slide não está ativo
      setHasAttemptedPlay(false);
    }
    
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [autoplay, loop, hasUserInteracted, isYouTube, isSoundUnlocked, isActive, onPlay, onPause]);

  // Efeito específico: quando isActive muda para true, forçar play imediatamente
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube || !isActive || !autoplay) {
      // Resetar hasAttemptedPlay quando não está ativo
      if (!isActive) {
        setHasAttemptedPlay(false);
      }
      return;
    }

    // Garantir muted antes de tentar tocar
    if (!isSoundUnlocked) {
      video.muted = true;
      setIsMuted(true);
    }

    // Tentar tocar imediatamente quando slide fica ativo
    const forcePlay = () => {
      if (video && video.paused && isActive && autoplay) {
        // Marcar que tentamos tocar apenas quando realmente tentamos
        setHasAttemptedPlay(true);
        video.play().catch(() => {
          // Autoplay pode falhar no iOS até haver interação
        });
      } else if (video && !video.paused) {
        // Se vídeo já está tocando, não marcar hasAttemptedPlay
        setIsPlaying(true);
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
  // Este useEffect é para vídeos não-HLS e não-YouTube
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube || isHLS || !isActive || !autoplay) return;

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
              setHasAttemptedPlay(false); // Resetar quando começar a tocar
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
  }, [isActive, autoplay, isSoundUnlocked, isYouTube, isHLS]);

  // Efeito específico para HLS: tentar tocar quando slide ficar ativo
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube || !isHLS || !isActive || !autoplay) return;

    // Função para tentar tocar o vídeo HLS
    const attemptHLSPlay = () => {
      if (!video || !isActive || !autoplay) return;
      
      // Garantir muted antes de tentar tocar
      if (!isSoundUnlocked) {
        video.muted = true;
        setIsMuted(true);
      }
      
      // Tentar tocar se estiver pausado
      if (video.paused) {
        video.play().catch(() => {
          // Autoplay pode falhar
        });
      }
    };

    // Tentar imediatamente e após delays (HLS pode precisar de mais tempo)
    attemptHLSPlay();
    const timeout1 = setTimeout(attemptHLSPlay, 100);
    const timeout2 = setTimeout(attemptHLSPlay, 300);
    const timeout3 = setTimeout(attemptHLSPlay, 600);
    const timeout4 = setTimeout(attemptHLSPlay, 1000);

    // Adicionar listeners para quando HLS estiver pronto
    const handleReady = () => {
      attemptHLSPlay();
    };

    video.addEventListener('loadedmetadata', handleReady);
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('canplaythrough', handleReady);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      video.removeEventListener('loadedmetadata', handleReady);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('canplaythrough', handleReady);
    };
  }, [isActive, autoplay, isSoundUnlocked, isYouTube, isHLS]);

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
        src={isHLS ? undefined : videoSrc} // HLS é configurado via hls.js, não via src
        autoPlay={isActive && autoplay && !isHLS} // HLS autoplay é controlado via hls.js
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
          backgroundColor: 'transparent', // Evitar tela branca
        }}
        poster={thumbnailUrl || undefined}
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

