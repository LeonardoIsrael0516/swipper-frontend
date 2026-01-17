import { useState, useEffect, useRef } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { Play, Pause, Mic } from 'lucide-react';

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

// Função para formatar tempo (segundos para MM:SS)
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface AudioElementProps {
  element: SlideElement;
}

export function AudioElement({ element }: AudioElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    audioUrl,
    avatar,
    backgroundColor = '#ffffff',
    buttonColor = '#25D366',
    textColor = '#000000',
    cardSize = 'full',
    borderRadius = 12,
    showTimestamp = true,
  } = config;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar áudio quando URL mudar
  useEffect(() => {
    if (!audioUrl) {
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Erro ao reproduzir áudio:', error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioUrl) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Calcular width baseado no tamanho
  const getWidth = () => {
    switch (cardSize) {
      case 'small':
        return '25%';
      case 'medium':
        return '50%';
      case 'large':
        return '75%';
      case 'full':
      default:
        return '100%';
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const containerStyle: React.CSSProperties = {
    width: getWidth(),
    margin: '0 auto',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor,
    borderRadius: `${borderRadius}px`,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    minHeight: '60px',
  };

  const avatarStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '20px',
    overflow: 'hidden',
  };

  const controlsStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  };

  const buttonStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: buttonColor,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: '#ffffff',
    transition: 'opacity 0.2s',
  };

  const progressBarStyle: React.CSSProperties = {
    flex: 1,
    height: '4px',
    backgroundColor: '#e0e0e0',
    borderRadius: '2px',
    position: 'relative',
    cursor: 'pointer',
    minWidth: 0,
  };

  const progressFillStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${progressPercentage}%`,
    backgroundColor: buttonColor,
    borderRadius: '2px',
    transition: 'width 0.1s',
  };

  const timestampStyle: React.CSSProperties = {
    color: textColor,
    fontSize: '12px',
    fontFamily: 'monospace',
    minWidth: '40px',
    textAlign: 'right',
    flexShrink: 0,
  };

  if (!audioUrl) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={avatarStyle}>
            <Mic className="w-5 h-5 text-muted-foreground" />
          </div>
          <div style={{ ...controlsStyle, justifyContent: 'center' }}>
            <span style={{ color: textColor, fontSize: '14px' }}>
              Adicione um áudio
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Avatar */}
        <div style={avatarStyle}>
          {avatar ? (
            avatar.startsWith('http') || avatar.startsWith('data:') ? (
              <img
                src={avatar}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  // Fallback para emoji se imagem falhar
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.textContent = '🎤';
                  }
                }}
              />
            ) : (
              <span>{avatar}</span>
            )
          ) : (
            <Mic className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Controles */}
        <div style={controlsStyle}>
          {/* Botão Play/Pause */}
          <button
            type="button"
            style={buttonStyle}
            onClick={togglePlayPause}
            disabled={isLoading}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {isLoading ? (
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4" fill="currentColor" style={{ marginLeft: '2px' }} />
            )}
          </button>

          {/* Barra de Progresso */}
          <div style={progressBarStyle} onClick={handleProgressClick}>
            <div style={progressFillStyle} />
          </div>

          {/* Timestamp */}
          {showTimestamp && (
            <div style={timestampStyle}>
              {formatTime(isNaN(currentTime) ? 0 : currentTime)}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

