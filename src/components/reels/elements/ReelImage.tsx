import { CSSProperties, useState } from 'react';

interface ReelImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  parallax?: boolean;
  blur?: number;
  opacity?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function ReelImage({
  src,
  alt = '',
  className = '',
  style,
  parallax = false,
  blur,
  opacity,
  objectFit = 'cover',
}: ReelImageProps) {
  const [loaded, setLoaded] = useState(false);

  const imageStyle: CSSProperties = {
    objectFit,
    ...(blur && { filter: `blur(${blur}px)` }),
    ...(opacity !== undefined && { opacity }),
    ...style,
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${parallax ? 'parallax-image' : ''}`}
        style={imageStyle}
        onLoad={() => setLoaded(true)}
        loading="eager"
      />
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
}

