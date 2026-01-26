import { ReactNode, CSSProperties, useRef, useEffect, memo, useMemo, forwardRef } from 'react';
import { BackgroundConfig } from '@/contexts/BuilderContext';
import { ReelVideoBackground } from './ReelVideoBackground';
import { VideoProgressBar } from './VideoProgressBar';
import { useReelSound } from '@/contexts/ReelSoundContext';
import { VolumeX } from 'lucide-react';

export interface ReelSlideConfig {
  backgroundColor?: string;
  backgroundGradient?: {
    type: 'linear' | 'radial' | 'conic';
    direction?: string;
    colors: string[];
  };
  backgroundImage?: string;
  backgroundVideo?: string;
  backgroundConfig?: BackgroundConfig; // Novo campo para suportar BackgroundConfig completo
  opacity?: number;
  blur?: number;
}

interface ReelSlideProps {
  children: ReactNode;
  config?: ReelSlideConfig;
  className?: string;
  isActive?: boolean; // Indica se este é o slide atual visível
  'data-slide-index'?: number;
}

const ReelSlideComponent = forwardRef<HTMLDivElement, ReelSlideProps>(
  ({ children, config, className = '', isActive = false, ...props }, ref) => {
  const slideRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isSoundUnlocked, unlockSound } = useReelSound();
  
  // Usar ref externo se fornecido, senão usar interno
  const actualRef = (ref as React.RefObject<HTMLDivElement>) || slideRef;
  
  // Verificar se o slide tem vídeo de background que precisa desbloquear som
  const hasVideoBackground = useMemo(() => 
    (config?.backgroundConfig?.type === 'video' && config.backgroundConfig.video?.url) ||
    (config?.backgroundVideo && !config?.backgroundConfig),
    [config?.backgroundConfig, config?.backgroundVideo]
  );
  
  // Listener para ativar som ao tocar no vídeo de background
  useEffect(() => {
    if (!hasVideoBackground || !isActive || isSoundUnlocked) return;
    
    const slideElement = actualRef.current;
    if (!slideElement) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Verificar se o clique foi em um elemento interativo
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-interactive]') ||
        target.closest('[role="button"]')
      ) {
        return;
      }
      
      // Verificar se o clique foi em um elemento de vídeo (não no background)
      if (target.closest('[data-video-element]')) {
        return;
      }
      
      // Ativar som
      unlockSound();
    };
    
    // Para mobile, usar touchend ao invés de touchstart para não interferir com o vídeo
    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Verificar se o toque foi em um elemento interativo
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-interactive]') ||
        target.closest('[role="button"]')
      ) {
        return;
      }
      
      // Verificar se o toque foi em um elemento de vídeo (não no background)
      if (target.closest('[data-video-element]')) {
        return;
      }
      
      // Ativar som
      // Usar setTimeout para garantir que o evento não interfira com o vídeo
      setTimeout(() => {
        unlockSound();
      }, 50);
    };
    
    slideElement.addEventListener('click', handleClick as EventListener, { capture: false });
    slideElement.addEventListener('touchend', handleTouchEnd as EventListener, { capture: false, passive: true });
    
    return () => {
      slideElement.removeEventListener('click', handleClick as EventListener);
      slideElement.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [hasVideoBackground, isActive, isSoundUnlocked, unlockSound]);
  
  // Memoizar cálculo de backgroundStyle
  const backgroundStyle = useMemo((): CSSProperties => {
    const style: CSSProperties = {};

    // Priorizar backgroundConfig se existir
    if (config?.backgroundConfig) {
      const bgConfig = config.backgroundConfig;
      
      switch (bgConfig.type) {
        case 'color':
          style.backgroundColor = bgConfig.color || '#9333ea';
          break;
          
        case 'gradient':
          if (bgConfig.gradient) {
            const { gradient } = bgConfig;
            const stops = gradient.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
            
            if (gradient.direction === 'linear') {
              style.background = `linear-gradient(${gradient.angle || 90}deg, ${stops})`;
            } else if (gradient.direction === 'radial') {
              style.background = `radial-gradient(circle, ${stops})`;
            } else {
              style.background = `conic-gradient(from ${gradient.angle || 0}deg, ${stops})`;
            }
          }
          break;
          
        case 'image':
          if (bgConfig.image?.url) {
            const { image } = bgConfig;
            style.backgroundImage = `url(${image.url})`;
            style.backgroundPosition = image.position || 'center';
            style.backgroundRepeat = image.repeat || 'no-repeat';
            style.backgroundSize = image.size || 'cover';
            if (image.opacity !== undefined) {
              style.opacity = image.opacity;
            }
          }
          break;
          
        case 'video':
          // Vídeo será renderizado separadamente
          return style;
      }
      
      return style;
    }

    // Fallback para formato antigo
    if (config?.backgroundVideo) {
      // Video background handled separately
      return style;
    }

    if (config?.backgroundImage) {
      style.backgroundImage = `url(${config.backgroundImage})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else if (config?.backgroundGradient) {
      const { type, direction = 'to bottom', colors } = config.backgroundGradient;
      const gradientColors = colors.join(', ');
      
      if (type === 'linear') {
        style.background = `linear-gradient(${direction}, ${gradientColors})`;
      } else if (type === 'radial') {
        style.background = `radial-gradient(circle, ${gradientColors})`;
      } else if (type === 'conic') {
        style.background = `conic-gradient(${gradientColors})`;
      }
    } else if (config?.backgroundColor) {
      style.backgroundColor = config.backgroundColor;
    }

    if (config?.opacity !== undefined) {
      style.opacity = config.opacity;
    }

    if (config?.blur) {
      style.filter = `blur(${config.blur}px)`;
    }

    return style;
  }, [config]);

  const renderBackgroundVideo = () => {
    // Verificar backgroundConfig primeiro
    if (config?.backgroundConfig?.type === 'video' && config.backgroundConfig.video?.url) {
      const { video } = config.backgroundConfig;
      return (
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={video.url}
          autoPlay={video.autoplay !== false}
          loop={video.loop !== false}
          muted={video.muted !== false}
          playsInline
          style={{
            opacity: video.opacity !== undefined ? video.opacity : 1,
          }}
        />
      );
    }
    
    // Fallback para formato antigo
    if (config?.backgroundVideo) {
      return (
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={config.backgroundVideo} type="video/mp4" />
        </video>
      );
    }
    
    return null;
  };
  
  // Memoizar cálculos de tipos de background
  const backgroundTypes = useMemo(() => {
    const isColorBackground = 
      (config?.backgroundConfig?.type === 'color') ||
      (config?.backgroundColor && !config?.backgroundConfig);
    
    const isGradientBackground = 
      (config?.backgroundConfig?.type === 'gradient') ||
      (config?.backgroundGradient && !config?.backgroundConfig);
    
    const isImageBackground = 
      (config?.backgroundConfig?.type === 'image') ||
      (config?.backgroundImage && !config?.backgroundConfig);
    
    const isVideoBackground = 
      (config?.backgroundConfig?.type === 'video') ||
      (config?.backgroundVideo && !config?.backgroundConfig);
    
    return { isColorBackground, isGradientBackground, isImageBackground, isVideoBackground };
  }, [config]);
  
  // Determinar se deve usar background fixo
  // No desktop: apenas cores e gradientes ficam fullscreen
  // Imagens e vídeos ficam no container com aspect ratio 9:15.35
  const useFixedBg = useMemo(() => {
    if (!isActive) return false;
    // Apenas cores e gradientes usam background fixo fullscreen no desktop
    return (
      backgroundTypes.isColorBackground || 
      backgroundTypes.isGradientBackground ||
      (!config?.backgroundConfig && (config?.backgroundColor || config?.backgroundGradient))
    );
  }, [isActive, backgroundTypes, config]);
  
  const shouldRemoveSlideBackground = useFixedBg && (backgroundTypes.isColorBackground || backgroundTypes.isGradientBackground);
  
  // Criar estilo para background fixo (apenas cores e gradientes)
  const fixedBgStyle: React.CSSProperties = useMemo(() => ({
    ...backgroundStyle,
  }), [backgroundStyle]);
  
  // Estilo do slide
  const slideStyle: React.CSSProperties = useMemo(() => {
    if (backgroundTypes.isVideoBackground) {
      return { backgroundColor: 'transparent' };
    }
    
    if (Object.keys(backgroundStyle).length > 0) {
      return { ...backgroundStyle };
    }
    
    if (config?.backgroundColor && (!config?.backgroundConfig || config.backgroundConfig.type !== 'color')) {
      return { backgroundColor: config.backgroundColor };
    }
    
    return {};
  }, [backgroundTypes.isVideoBackground, backgroundStyle, config]);
  
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Background fixo para desktop - ocupa tela inteira */}
      {/* Apenas cores e gradientes ficam fullscreen no desktop */}
      {/* Imagens e vídeos ficam dentro do container com aspect ratio 9:15.35 */}
      {useFixedBg && (
        <div
          className="reel-slide-desktop-bg hidden md:block"
          style={fixedBgStyle}
        />
      )}
      
      {/* Vídeos de background: renderizar versão com blur (apenas desktop quando ativo) */}
      {backgroundTypes.isVideoBackground && isActive && config?.backgroundConfig?.type === 'video' && config.backgroundConfig.video?.url && (
        <ReelVideoBackground
          src={config.backgroundConfig.video.url}
          thumbnailUrl={(config.backgroundConfig.video as any)?.thumbnailUrl}
          autoplay={config.backgroundConfig.video.autoplay !== false}
          loop={config.backgroundConfig.video.loop !== false}
          muted={config.backgroundConfig.video.muted !== false}
          opacity={config.backgroundConfig.video.opacity !== undefined ? config.backgroundConfig.video.opacity : 1}
          isActive={isActive}
          isBlurVersion={true}
          showProgressBar={false}
        />
      )}
      {backgroundTypes.isVideoBackground && isActive && config?.backgroundVideo && !config?.backgroundConfig && (
        <ReelVideoBackground
          src={config.backgroundVideo}
          autoplay={true}
          loop={true}
          muted={true}
          opacity={1}
          isActive={isActive}
          isBlurVersion={true}
          showProgressBar={false}
        />
      )}
      
      <div
        ref={actualRef}
        className={`reel-slide relative ${className} ${shouldRemoveSlideBackground ? 'slide-active-desktop' : 'slide-normal-background'}`}
        style={{
          ...slideStyle,
          // Ajustar overflow: se há barrinha de progresso, usar overflow-x: hidden mas permitir overflow-y: visible no topo
          overflow: backgroundTypes.isVideoBackground && config?.backgroundConfig?.type === 'video' && config.backgroundConfig.video?.showProgressBar 
            ? 'visible' 
            : 'hidden',
          overflowX: 'hidden', // Sempre esconder overflow horizontal
          overflowY: backgroundTypes.isVideoBackground && config?.backgroundConfig?.type === 'video' && config.backgroundConfig.video?.showProgressBar 
            ? 'visible' 
            : 'hidden',
        }}
        data-slide-index={props['data-slide-index']}
      >
        {/* Barrinha de progresso renderizada DENTRO do container mas com position absolute e z-index alto para ficar acima */}
        {backgroundTypes.isVideoBackground && config?.backgroundConfig?.type === 'video' && config.backgroundConfig.video?.url && config.backgroundConfig.video.showProgressBar && (
          <div 
            style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              zIndex: 1000, 
              pointerEvents: 'none',
            }}
          >
            <VideoProgressBar
              videoRef={videoRef}
              enabled={true}
              fakeProgress={config.backgroundConfig.video.fakeProgress || false}
              fakeProgressSpeed={config.backgroundConfig.video.fakeProgressSpeed || 1.5}
              fakeProgressSlowdownStart={config.backgroundConfig.video.fakeProgressSlowdownStart || 0.9}
            />
          </div>
        )}
        {/* Video background if provided - apenas renderizar se não for background fixo */}
        {!backgroundTypes.isVideoBackground && renderBackgroundVideo()}
        
        {/* Vídeo nítido dentro do slide (desktop e mobile) - deve ficar abaixo dos elementos */}
        {/* Removido pointer-events: none do container para permitir cliques no botão de som */}
        {backgroundTypes.isVideoBackground && config?.backgroundConfig?.type === 'video' && config.backgroundConfig.video?.url && (
          <>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              <ReelVideoBackground
                src={config.backgroundConfig.video.url}
                thumbnailUrl={(config.backgroundConfig.video as any)?.thumbnailUrl}
                autoplay={config.backgroundConfig.video.autoplay !== false}
                loop={config.backgroundConfig.video.loop !== false}
                muted={config.backgroundConfig.video.muted !== false}
                opacity={config.backgroundConfig.video.opacity !== undefined ? config.backgroundConfig.video.opacity : 1}
                isActive={isActive}
                isBlurVersion={false}
                showProgressBar={false}
                fakeProgress={config.backgroundConfig.video.fakeProgress || false}
                fakeProgressSpeed={config.backgroundConfig.video.fakeProgressSpeed || 1.5}
                fakeProgressSlowdownStart={config.backgroundConfig.video.fakeProgressSlowdownStart || 0.9}
                videoRef={videoRef}
              />
            </div>
          </>
        )}
        {backgroundTypes.isVideoBackground && config?.backgroundVideo && !config?.backgroundConfig && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <ReelVideoBackground
              src={config.backgroundVideo}
              autoplay={true}
              loop={true}
              muted={true}
              opacity={1}
              isActive={isActive}
              isBlurVersion={false}
              showProgressBar={false}
            />
          </div>
        )}


        {/* Content - garantir z-index maior que vídeo */}
        {/* Remover wrapper extra - ReelContent já tem position absolute e z-index */}
        {children}

        {/* Botão de som renderizado diretamente no slide para ficar acima do ReelContent */}
        {hasVideoBackground && isActive && !isSoundUnlocked && config?.backgroundConfig?.type === 'video' && config.backgroundConfig.video?.autoplay !== false && (
          <button
            onClick={unlockSound}
            className="absolute bottom-4 right-4 md:bottom-4 md:right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-black/70 hover:scale-110"
            style={{
              zIndex: 100, // Acima do ReelContent (z-index 30)
              position: 'absolute',
              pointerEvents: 'auto',
              bottom: '1rem',
              right: '1rem',
              left: 'auto',
            }}
            aria-label="Ativar som"
          >
            <VolumeX className="w-5 h-5 text-white" />
          </button>
        )}
        {hasVideoBackground && isActive && !isSoundUnlocked && config?.backgroundVideo && !config?.backgroundConfig && (
          <button
            onClick={unlockSound}
            className="absolute bottom-4 right-4 md:bottom-4 md:right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-black/70 hover:scale-110"
            style={{
              zIndex: 100, // Acima do ReelContent (z-index 30)
              position: 'absolute',
              pointerEvents: 'auto',
              bottom: '1rem',
              right: '1rem',
              left: 'auto',
            }}
            aria-label="Ativar som"
          >
            <VolumeX className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
});

ReelSlideComponent.displayName = 'ReelSlide';

export const ReelSlide = memo(ReelSlideComponent);

