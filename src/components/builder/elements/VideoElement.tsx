import { useState, useEffect } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { Video, Play, Loader2 } from 'lucide-react';
import { getYouTubeThumbnailUrl, extractYouTubeId } from '@/lib/youtube';

// Função helper para normalizar uiConfig
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

interface VideoElementProps {
  element: SlideElement;
}

export function VideoElement({ element }: VideoElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    videoUrl,
    youtubeUrl,
    thumbnailUrl,
    orientation = 'vertical',
    borderRadius = 0,
  } = config;

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Obter thumbnail baseado na origem
  const displayThumbnail =
    thumbnailUrl ||
    (youtubeUrl ? getYouTubeThumbnailUrl(extractYouTubeId(youtubeUrl) || '', 'high') : null);

  // Verificar se temos um vídeo válido
  const hasVideo = !!(videoUrl || youtubeUrl);

  useEffect(() => {
    if (!displayThumbnail) {
      setImageError(false);
      setImageLoaded(false);
      return;
    }

    // Preload thumbnail
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };
    img.src = displayThumbnail;
  }, [displayThumbnail]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: `${borderRadius}px`,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: orientation === 'horizontal' ? '16/9' : '9/16',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  };

  const thumbnailStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: imageLoaded && !imageError ? 'block' : 'none',
  };

  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // Padrão de grid usando SVG data URI
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    border: '2px dashed rgba(0, 0, 0, 0.2)',
    color: 'rgba(0, 0, 0, 0.6)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    position: 'relative',
  };

  if (!hasVideo) {
    return (
      <div style={containerStyle}>
        <div style={placeholderStyle}>
          <Video className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm font-medium">Adicione um vídeo</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {displayThumbnail && (
        <>
          <img
            src={displayThumbnail}
            alt="Video thumbnail"
            style={thumbnailStyle}
            onLoad={() => {
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
          />
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 opacity-30 animate-spin" />
            </div>
          )}
          {imageError && (
            <div style={placeholderStyle}>
              <Video className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm font-medium">Erro ao carregar preview</p>
            </div>
          )}
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 text-black ml-1" fill="black" />
            </div>
          </div>
        </>
      )}
      {!displayThumbnail && (
        <div style={placeholderStyle}>
          <Video className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm font-medium">Vídeo configurado</p>
        </div>
      )}
    </div>
  );
}

