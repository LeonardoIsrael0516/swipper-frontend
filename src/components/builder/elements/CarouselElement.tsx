import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { SlideElement } from '@/contexts/BuilderContext';
import * as LucideIcons from 'lucide-react';
import { FileText, Circle, Layers, Layout, Code, Image as ImageIcon } from 'lucide-react';
import './Carousel.css';

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

interface CarouselElementProps {
  element: SlideElement;
}

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

// Função para obter o componente do ícone dinamicamente
const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> | null => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || null;
};

// Ícones padrão do lucide-react (fallback)
const DEFAULT_ICONS = [
  <FileText key="file-text" className="carousel-icon" />,
  <Circle key="circle" className="carousel-icon" />,
  <Layers key="layers" className="carousel-icon" />,
  <Layout key="layout" className="carousel-icon" />,
  <Code key="code" className="carousel-icon" />,
];

// Função para renderizar ícone (pode ser emoji, URL de imagem, ícone do lucide, ou componente React)
const renderIcon = (icon: string | undefined, index: number) => {
  if (!icon) {
    return DEFAULT_ICONS[index % DEFAULT_ICONS.length];
  }
  
  // Se for ícone do lucide-react (formato "icon:NomeDoIcone")
  if (icon.startsWith('icon:')) {
    const iconName = icon.replace('icon:', '');
    const IconComponent = getIconComponent(iconName);
    if (IconComponent) {
      return <IconComponent className="carousel-icon" />;
    }
    // Fallback para ícone padrão se não encontrar
    return DEFAULT_ICONS[index % DEFAULT_ICONS.length];
  }
  
  // Se for URL de imagem
  if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/')) {
    return <img src={icon} alt="" className="carousel-icon" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />;
  }
  
  // Se for emoji
  return <span className="carousel-icon" style={{ fontSize: '16px' }}>{icon}</span>;
};

function CarouselItem({ 
  item, 
  index, 
  itemWidth, 
  round, 
  trackItemOffset, 
  x, 
  transition 
}: {
  item: any;
  index: number;
  itemWidth: number;
  round: boolean;
  trackItemOffset: number;
  x: any;
  transition: any;
}) {
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const outputRange = [90, 0, -90];
  const rotateY = useTransform(x, range, outputRange, { clamp: false });

  const itemStyle: React.CSSProperties = {
    width: itemWidth,
    height: round ? itemWidth : '100%',
    rotateY: rotateY,
    ...(round && { borderRadius: '50%' }),
    ...(item.backgroundImage && {
      backgroundImage: `url(${item.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }),
    position: 'relative',
    ...(item.backgroundImage && item.overlay?.enabled && {
      '--overlay-color': item.overlay.color || '#000000',
      '--overlay-opacity': item.overlay.opacity !== undefined ? item.overlay.opacity : 0.5,
    } as React.CSSProperties),
  };

  const hasOverlay = item.backgroundImage && item.overlay?.enabled;

  return (
    <motion.div
      key={`${item?.id ?? index}-${index}`}
      className={`carousel-item ${round ? 'round' : ''} ${hasOverlay ? 'with-overlay' : ''}`}
      style={itemStyle}
      transition={transition}
    >
      <div className={`carousel-item-header ${round ? 'round' : ''}`}>
        {(() => {
          const icon = item.icon;
          const isEmoji = icon && !icon.startsWith('icon:') && !icon.startsWith('http://') && !icon.startsWith('https://') && !icon.startsWith('/');
          
          if (isEmoji) {
            // Emoji sem container branco - renderizar diretamente
            return <span style={{ fontSize: '28px', display: 'inline-block' }}>{icon}</span>;
          } else {
            // Ícone ou imagem com container branco
            return <span className="carousel-icon-container">{renderIcon(item.icon, index)}</span>;
          }
        })()}
      </div>
      <div className="carousel-item-content">
        <div className="carousel-item-title">{item.title || 'Título'}</div>
        <p className="carousel-item-description">{item.description || 'Descrição'}</p>
      </div>
    </motion.div>
  );
}

export function CarouselElement({ element }: CarouselElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    items = [],
    baseWidth = 300,
    autoplay = false,
    autoplayDelay = 3000,
    pauseOnHover = false,
    loop = false,
    round = false,
    gap = 16,
    borderRadius = 24,
    backgroundColor = '#0d0716',
    borderColor = '#555',
    textColor = '#fff',
  } = config;

  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + gap;

  const itemsForRender = useMemo(() => {
    if (!loop) return items;
    if (items.length === 0) return [];
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  const [position, setPosition] = useState(loop ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return undefined;
    if (pauseOnHover && isHovered) return undefined;

    const timer = setInterval(() => {
      setPosition(prev => Math.min(prev + 1, itemsForRender.length - 1));
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  useEffect(() => {
    const startingPosition = loop ? 1 : 0;
    setPosition(startingPosition);
    x.set(-startingPosition * trackItemOffset);
  }, [items.length, loop, trackItemOffset, x]);

  useEffect(() => {
    if (!loop && position > itemsForRender.length - 1) {
      setPosition(Math.max(0, itemsForRender.length - 1));
    }
  }, [itemsForRender.length, loop, position]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationStart = () => {
    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }

    const lastCloneIndex = itemsForRender.length - 1;
    if (position === lastCloneIndex) {
      setIsJumping(true);
      const target = 1;
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    if (position === 0) {
      setIsJumping(true);
      const target = items.length;
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    setIsAnimating(false);
  };

  const handleDragEnd = (_: any, info: any) => {
    const { offset, velocity } = info;
    const direction =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;

    if (direction === 0) return;

    setPosition(prev => {
      const next = prev + direction;
      const max = itemsForRender.length - 1;
      return Math.max(0, Math.min(next, max));
    });
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0
        }
      };

  const activeIndex =
    items.length === 0 ? 0 : loop ? (position - 1 + items.length) % items.length : Math.min(position, items.length - 1);

  // Estilo do container
  const containerStyle: React.CSSProperties = {
    width: `${baseWidth}px`,
    borderRadius: `${borderRadius}px`,
    borderColor: borderColor,
    backgroundColor: backgroundColor,
    margin: '0 auto', // Centralizar
    ...(round && { height: `${baseWidth}px`, borderRadius: '50%' }),
  };

  // Se não houver itens, mostrar placeholder
  if (items.length === 0) {
    return (
      <div 
        className="carousel-container"
        style={containerStyle}
      >
        <div style={{ padding: '40px', textAlign: 'center', color: textColor }}>
          <p style={{ fontSize: '14px', opacity: 0.6 }}>Adicione itens ao carrossel</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`carousel-container ${round ? 'round' : ''}`}
      style={{
        ...containerStyle,
        marginTop: '16px',
        marginBottom: '16px',
      }}
    >
      <motion.div
        className="carousel-track"
        drag={isAnimating ? false : 'x'}
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${gap}px`,
          perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
          x
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselItem
            key={`${item?.id ?? index}-${index}`}
            item={item}
            index={index}
            itemWidth={itemWidth}
            round={round}
            trackItemOffset={trackItemOffset}
            x={x}
            transition={effectiveTransition}
          />
        ))}
      </motion.div>

      <div className={`carousel-indicators-container ${round ? 'round' : ''}`}>
        <div className="carousel-indicators">
          {items.map((_: any, index: number) => (
            <motion.div
              key={index}
              className={`carousel-indicator ${activeIndex === index ? 'active' : 'inactive'}`}
              animate={{
                scale: activeIndex === index ? 1.2 : 1
              }}
              onClick={() => setPosition(loop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .carousel-item-title {
          color: ${textColor} !important;
        }
        .carousel-item-description {
          color: ${textColor} !important;
        }
        .carousel-item {
          background-color: ${backgroundColor} !important;
          border-color: ${borderColor} !important;
        }
        .carousel-container {
          border-color: ${borderColor} !important;
          background-color: ${backgroundColor} !important;
        }
      `}</style>
    </div>
  );
}

