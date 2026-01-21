import { useState, useEffect, memo } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { Image as ImageIcon } from 'lucide-react';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
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

interface ImageElementProps {
  element: SlideElement;
}

export const ImageElement = memo(function ImageElement({ element }: ImageElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    imageUrl,
    size = 'full',
    borderRadius = 0,
    overlay,
    objectFit = 'contain',
  } = config;

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  // Debug em desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('ImageElement render:', {
        elementId: element.id,
        elementType: element.elementType,
        rawUiConfig: element.uiConfig,
        normalizedConfig: config,
        imageUrl: config.imageUrl,
        hasImageUrl: !!config.imageUrl,
        imageLoaded,
        imageError,
        forceShow,
      });
    }
  }, [element.id, element.uiConfig, config, config.imageUrl, imageLoaded, imageError, forceShow]);

  // Verificar se a imagem já está carregada no cache do navegador
  useEffect(() => {
    if (!imageUrl) {
      setImageError(false);
      setImageLoaded(false);
      setForceShow(false);
      return;
    }

    // Resetar estados
    setImageError(false);
    setImageLoaded(false);
    setForceShow(false);

    let imgLoaded = false;
    let imgErrored = false;

    // Verificar se a imagem já está carregada no cache
    const img = new Image();
    img.onload = () => {
      imgLoaded = true;
      setImageLoaded(true);
      setImageError(false);
      setForceShow(true);
      if (import.meta.env.DEV) {
        console.log('Image preload successful:', { elementId: element.id, imageUrl });
      }
    };
    img.onerror = () => {
      imgErrored = true;
      setImageError(true);
      setImageLoaded(false);
      setForceShow(false);
      if (import.meta.env.DEV) {
        console.error('Image preload failed:', { elementId: element.id, imageUrl });
      }
    };
    img.src = imageUrl;

    // Fallback: se após 1 segundo a imagem não carregou e não deu erro,
    // forçar exibição (pode estar em cache e onLoad não disparou)
    const timeout = setTimeout(() => {
      if (!imgLoaded && !imgErrored) {
        // Tentar verificar novamente se a imagem está carregada
        const testImg = new Image();
        testImg.onload = () => {
          setImageLoaded(true);
          setImageError(false);
          setForceShow(true);
          if (import.meta.env.DEV) {
            console.log('Image fallback check successful:', { elementId: element.id, imageUrl });
          }
        };
        testImg.onerror = () => {
          // Se ainda não carregou, manter como erro
          setImageError(true);
          if (import.meta.env.DEV) {
            console.error('Image fallback check failed:', { elementId: element.id, imageUrl });
          }
        };
        testImg.src = imageUrl;
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      // Limpar referências
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, element.id]);

  // Calcular width baseado no tamanho
  const getWidth = () => {
    switch (size) {
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

  const containerStyle: React.CSSProperties = {
    width: getWidth(),
    borderRadius: `${borderRadius}px`,
    overflow: 'hidden',
    position: 'relative',
    margin: '0 auto', // Centralizar quando não for full width
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    objectFit: objectFit || 'contain',
    // Sempre exibir a imagem se tiver URL e não houver erro confirmado
    // Não depender apenas de imageLoaded porque onLoad pode não disparar para imagens em cache
    display: (imageUrl && !imageError) ? 'block' : 'none',
    opacity: (imageLoaded || forceShow) ? 1 : (imageUrl && !imageError ? 1 : 0), // Mostrar com opacidade total se tiver URL
  };

  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // Padrão de grid usando SVG data URI
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    border: '2px dashed rgba(0, 0, 0, 0.2)',
    borderRadius: `${borderRadius}px`,
    color: 'rgba(0, 0, 0, 0.6)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    position: 'relative',
  };

  const overlayStyle: React.CSSProperties = overlay?.enabled
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: overlay.color || '#000000',
        opacity: overlay.opacity !== undefined ? overlay.opacity : 0.5,
        pointerEvents: 'none',
      }
    : {};

  // Mostrar placeholder apenas se não houver URL ou se houver erro confirmado
  const showPlaceholder = !imageUrl || (imageError && !forceShow);

  return (
    <div style={containerStyle}>
      {showPlaceholder ? (
        <div style={placeholderStyle}>
          <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm font-medium">Adicione uma imagem</p>
        </div>
      ) : (
        <>
          <img
            src={imageUrl}
            alt=""
            style={imageStyle}
            onLoad={() => {
              setImageLoaded(true);
              setImageError(false);
              setForceShow(true);
              if (import.meta.env.DEV) {
                console.log('Image onLoad fired:', { elementId: element.id, imageUrl });
              }
            }}
            onError={(e) => {
              setImageError(true);
              setImageLoaded(false);
              setForceShow(false);
              if (import.meta.env.DEV) {
                console.error('Image onError fired:', { elementId: element.id, imageUrl, error: e });
              }
            }}
            onLoadStart={() => {
              if (import.meta.env.DEV) {
                console.log('Image onLoadStart fired:', { elementId: element.id, imageUrl });
              }
            }}
            loading="eager"
          />
          {!imageLoaded && !imageError && !forceShow && imageUrl && (
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
              <ImageIcon className="w-8 h-8 opacity-30" />
            </div>
          )}
        </>
      )}
      {overlay?.enabled && !showPlaceholder && (
        <div style={overlayStyle} />
      )}
    </div>
  );
});

