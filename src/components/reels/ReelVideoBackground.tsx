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
  const { isSoundUnlocked } = useReelSound();
  
  // Verificar se é HLS
  const isHLS = src?.endsWith('.m3u8') || false;
  
  // Lógica de muted:
  // - Se isSoundUnlocked === true: tentar tocar com som
  // - Se isSoundUnlocked === false: sempre muted (comportamento atual dos navegadores)
  // CRÍTICO: Para iOS, o muted precisa estar no HTML desde o início
  const shouldStartMuted = !isSoundUnlocked && autoplay;
  const effectiveMuted = shouldStartMuted ? true : (isSoundUnlocked ? false : muted);
  const [isMuted, setIsMuted] = useState(effectiveMuted);
  
  // Estado para rastrear se o buffer inicial está carregado (para evitar re-buffer ao desmutar)
  const [initialBufferLoaded, setInitialBufferLoaded] = useState(false);
  
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
      // CRÍTICO: Garantir muted ANTES de definir src (essencial para iOS autoplay)
      // iOS requer muted no HTML antes de qualquer operação
      if (isBlurVersion) {
        video.muted = true;
        video.setAttribute('muted', '');
      } else {
        const shouldBeMuted = !isSoundUnlocked;
        video.muted = shouldBeMuted;
        if (shouldBeMuted) {
          video.setAttribute('muted', '');
        } else {
          video.removeAttribute('muted');
        }
      }
      
      // Garantir playsInline para iOS
      video.setAttribute('playsinline', '');
      video.playsInline = true;
      
      video.src = src;
      // Pré-carregar vídeo mesmo quando não está ativo
      video.load();
      
      // Tentar tocar se estiver ativo e autoplay estiver habilitado
      if (isActive && autoplay) {
        // Aguardar que o vídeo esteja pronto antes de tentar tocar
        const attemptPlay = () => {
          if (video.readyState >= 2 && video.paused) {
            video.play().catch(() => {
              // Autoplay pode falhar no iOS até haver interação
            });
          }
        };
        
        video.addEventListener('loadeddata', attemptPlay, { once: true });
        video.addEventListener('canplay', attemptPlay, { once: true });
        
        // Tentar imediatamente se já estiver pronto
        if (video.readyState >= 2) {
          attemptPlay();
        }
      }
      
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
      // Forçar início do carregamento para pré-carregar vídeo
      hls.startLoad();

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

      // Garantir que o buffer inicial seja carregado
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Forçar carregamento do primeiro segmento para garantir buffer inicial
        if (hls.levels && hls.levels.length > 0) {
          hls.startLoad(0); // Começar do início para garantir buffer inicial
        }
        
        // Tentar tocar quando HLS estiver pronto
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
        
        // Tentar tocar se estiver ativo, mas também pré-carregar se não estiver
        if (isActive && autoplay) {
          video.play().catch(() => {
            // Autoplay pode falhar
          });
        }
      });
      
      // Também tentar tocar quando nível estiver carregado
      hls.on(Hls.Events.LEVEL_LOADED, () => {
        if (isActive && autoplay) {
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
      
      // CRÍTICO: Garantir muted ANTES de definir src
      if (isBlurVersion) {
        video.muted = true;
        video.setAttribute('muted', '');
      } else {
        video.muted = !isSoundUnlocked;
        if (!isSoundUnlocked) {
          video.setAttribute('muted', '');
        }
      }
      
      video.src = secureUrl;
      // Pré-carregar vídeo mesmo quando não está ativo
      video.load();
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
    
    const handleLoadedData = () => {
      // Quando dados carregarem, verificar se precisa tentar tocar
      if (isActive && autoplay && video.paused) {
        // Garantir muted antes de tentar tocar (iOS requer isso)
        const shouldBeMuted = isBlurVersion ? true : !isSoundUnlocked;
        video.muted = shouldBeMuted;
        if (shouldBeMuted) {
          video.setAttribute('muted', '');
        }
        
        video.play().catch(() => {
          // Autoplay pode falhar
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [loop, isActive, autoplay, isBlurVersion, isSoundUnlocked, isHLS]);

  // Listener para rastrear quando o buffer inicial está carregado
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleProgress = () => {
      // Verificar se o buffer inicial (primeiro segundo) está carregado
      if (video.buffered.length > 0 && 
          video.buffered.start(0) === 0 && 
          video.buffered.end(0) >= 1.0) {
        setInitialBufferLoaded(true);
      }
    };

    const handleLoadedData = () => {
      // Quando dados carregarem, verificar buffer
      handleProgress();
    };

    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadeddata', handleLoadedData);
    
    // Verificar imediatamente se já está carregado
    handleProgress();

    return () => {
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [src, isHLS]);

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
      // Desmutar primeiro (mantém vídeo tocando)
      video.muted = false;
      setIsMuted(false);
      
      // Reiniciar do início apenas se o buffer inicial já estiver carregado
      // Isso evita re-buffer e tela branca
      if (initialBufferLoaded) {
        // Buffer inicial está pronto, fazer seek sem causar re-buffer
        video.currentTime = 0;
      } else {
        // Se buffer não está pronto, aguardar um pouco antes de fazer seek
        // Isso dá tempo para o buffer inicial carregar
        const checkAndSeek = () => {
          if (video.buffered.length > 0 && 
              video.buffered.start(0) === 0 && 
              video.buffered.end(0) >= 1.0) {
            video.currentTime = 0;
            setInitialBufferLoaded(true);
          }
        };
        
        // Verificar imediatamente
        checkAndSeek();
        
        // Aguardar eventos de progresso
        const handleProgress = () => {
          checkAndSeek();
        };
        
        video.addEventListener('progress', handleProgress, { once: true });
        
        // Timeout de segurança - após 2s, fazer seek mesmo assim
        const timeout = setTimeout(() => {
          if (video.readyState >= 2) {
            video.currentTime = 0;
            setInitialBufferLoaded(true);
          }
        }, 2000);
        
        return () => {
          clearTimeout(timeout);
          video.removeEventListener('progress', handleProgress);
        };
      }
      
      // Garantir que o vídeo está tocando
      if (video.paused) {
        video.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            // Ignorar erro
          });
      } else {
        setIsPlaying(true);
      }
    }
  }, [isSoundUnlocked, isActive, isBlurVersion, initialBufferLoaded]);

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
      // Vídeo não está ativo - PAUSAR para evitar que vídeos de outros slides toquem
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

  // Efeito específico para HLS: tentar tocar quando slide ficar ativo
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHLS) return;
    
    // Se não está ativo, pausar o vídeo para evitar que vídeos de outros slides toquem
    if (!isActive || !autoplay) {
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      }
      return;
    }

    // CRÍTICO: Garantir muted ANTES de qualquer tentativa de play
    if (isBlurVersion) {
      video.muted = true;
      video.setAttribute('muted', '');
      setIsMuted(true);
    } else {
      video.muted = !isSoundUnlocked;
      if (!isSoundUnlocked) {
        video.setAttribute('muted', '');
        setIsMuted(true);
      }
    }

    // Função para tentar tocar o vídeo HLS
    const attemptHLSPlay = async () => {
      if (!video || !isActive || !autoplay) return;
      
      // Garantir muted novamente antes de cada tentativa
      if (isBlurVersion) {
        video.muted = true;
        video.setAttribute('muted', '');
        setIsMuted(true);
      } else {
        video.muted = !isSoundUnlocked;
        if (!isSoundUnlocked) {
          video.setAttribute('muted', '');
          setIsMuted(true);
        }
      }
      
      // Tentar tocar se estiver pausado
      if (video.paused) {
        try {
          await video.play();
          setIsPlaying(true);
        } catch (error) {
          // Autoplay pode falhar
        }
      }
    };

    // Tentar imediatamente e após delays (HLS pode precisar de mais tempo)
    attemptHLSPlay();
    const timeout1 = setTimeout(attemptHLSPlay, 100);
    const timeout2 = setTimeout(attemptHLSPlay, 300);
    const timeout3 = setTimeout(attemptHLSPlay, 600);
    const timeout4 = setTimeout(attemptHLSPlay, 1000);
    const timeout5 = setTimeout(attemptHLSPlay, 1500);

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
      clearTimeout(timeout5);
      video.removeEventListener('loadedmetadata', handleReady);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('canplaythrough', handleReady);
    };
  }, [isActive, autoplay, isSoundUnlocked, isBlurVersion, isHLS]);

  // Garantir que vídeo sempre tente tocar quando estiver ativo (para iOS e outros casos)
  // Este useEffect é para vídeos não-HLS
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
      
      // CRÍTICO: Garantir muted ANTES de tentar tocar (iOS requer isso)
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
        } else {
          video.removeAttribute('muted');
        }
        setIsMuted(shouldBeMuted);
      }
      
      // Garantir playsInline para iOS
      video.setAttribute('playsinline', '');
      video.playsInline = true;
      
      // Tentar tocar se estiver pausado e pronto para tocar
      if (video.paused && video.readyState >= 2) {
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
      } else if (!video.paused) {
        // Se vídeo já está tocando
        if (video.readyState >= 2) {
          setIsPlaying(true);
          setHasAttemptedPlay(false);
        }
      }
    };

    // Adicionar listeners para quando vídeo estiver pronto
    const handleReady = () => {
      // Aguardar que vídeo esteja pronto (readyState >= 2) antes de tentar tocar
      if (video.readyState >= 2) {
        attemptPlay();
      }
    };

    const handleCanPlay = () => {
      handleReady();
    };

    const handleCanPlayThrough = () => {
      handleReady();
    };

    // Se vídeo já está pronto, tentar imediatamente
    if (video.readyState >= 2) {
      attemptPlay();
    }

    video.addEventListener('loadedmetadata', handleReady);
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);

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
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('touchend', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, [isActive, autoplay, isBlurVersion, isSoundUnlocked, isHLS]);


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
        muted={isBlurVersion ? true : (isSoundUnlocked ? false : true)} // CRÍTICO: muted sempre true quando som não desbloqueado (necessário para autoplay no iOS)
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
          backgroundColor: '#000', // Fundo preto enquanto carrega para evitar branco
        }}
      />
      
      {/* Botão de som removido - agora renderizado diretamente no ReelSlide para ficar acima do ReelContent */}
    </div>
  );
}

