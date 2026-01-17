import { useState, useEffect, useRef, useLayoutEffect, memo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/builder/elements/StarRating';

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

interface ReelFeedbackProps {
  element: {
    id: string;
    elementType: string;
    uiConfig?: any;
  };
}

export const ReelFeedback = memo(function ReelFeedback({ element }: ReelFeedbackProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    layout = 'list',
    reviews = [],
    gap = 16,
    borderRadius = 12,
    backgroundColor = 'transparent',
    textColor = '#000000',
    starColor = '#FFD700',
    cardBackgroundColor = '#ffffff',
    cardBorderColor = '#e5e7eb',
    showProgress = true,
    showArrows = true,
    controlsColor = '#000000', // Cor para setas e barrinha de progresso
    autoPlay = false,
    autoPlayInterval = 5, // em segundos
  } = config;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Calcular altura máxima dos cards - apenas para carrossel
  useLayoutEffect(() => {
    if (reviews.length === 0 || layout !== 'carousel') {
      setCardHeight(null);
      return;
    }

    const heights: number[] = [];
    cardRefs.current.forEach((element) => {
      if (element) {
        heights.push(element.offsetHeight);
      }
    });

    if (heights.length > 0) {
      const maxHeight = Math.max(...heights);
      setCardHeight(maxHeight);
    }
  }, [reviews, layout]);

  // Auto-advance para carrossel (opcional)
  useEffect(() => {
    if (layout === 'carousel' && reviews.length > 1 && autoPlay && !isHovered) {
      const intervalMs = autoPlayInterval * 1000; // Converter segundos para milissegundos
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }, intervalMs);

      return () => clearInterval(timer);
    }
  }, [layout, reviews.length, autoPlay, autoPlayInterval, isHovered]);

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToReview = (index: number) => {
    setCurrentIndex(index);
  };

  // Se não houver reviews, não renderizar nada
  if (reviews.length === 0) {
    return null;
  }

  const renderReviewCard = (review: any, index?: number, isPeek: boolean = false, isListLayout: boolean = false) => {
    const cardId = review.id || `review-${index}`;
    return (
      <div
        key={cardId}
        ref={(el) => {
          if (el) {
            cardRefs.current.set(cardId, el);
          } else {
            cardRefs.current.delete(cardId);
          }
        }}
        style={{
          backgroundColor: cardBackgroundColor,
          border: `1px solid ${cardBorderColor}`,
          borderRadius: `${borderRadius}px`,
          padding: isListLayout ? '24px' : '20px', // Mais padding no layout lista
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: isListLayout ? '100%' : '280px', // Largura 100% no layout lista, fixa no carrossel
          flexShrink: 0,
          ...(cardHeight && !isListLayout && { height: `${cardHeight}px` }), // Altura fixa apenas no carrossel
        }}
      >
        {/* Header com avatar e nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {review.avatar ? (
            <img
              src={review.avatar}
              alt={review.name || 'Avatar'}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: cardBorderColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: textColor,
                fontSize: '24px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {(review.name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: textColor,
                marginBottom: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {review.name || 'Nome não informado'}
            </div>
            <StarRating
              rating={review.stars || 5}
              style="normal"
              color={starColor}
              size={18}
            />
          </div>
        </div>

        {/* Descrição */}
        <div
          style={{
            fontSize: '15px',
            color: textColor,
            opacity: 0.85,
            lineHeight: '1.6',
            wordWrap: 'break-word',
            marginBottom: isListLayout ? '4px' : '0', // Espaço extra no layout lista
          }}
        >
          {review.description || 'Sem descrição'}
        </div>
      </div>
    );
  };

  // Layout Lista
  if (layout === 'list') {
    return (
      <div
        style={{
          backgroundColor,
          borderRadius: `${borderRadius}px`,
          padding: '16px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${gap}px`,
            width: '100%',
          }}
        >
          {reviews.map((review: any, index: number) =>
            renderReviewCard(review, index, false, true)
          )}
        </div>
      </div>
    );
  }

  // Layout Carrossel
  return (
    <div
      style={{
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: '8px',
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Container do carrossel com peek do próximo */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            gap: `${gap}px`,
            alignItems: 'stretch',
          }}
        >
          {/* Review atual - largura fixa */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              flexShrink: 0,
            }}
          >
            {renderReviewCard(reviews[currentIndex], currentIndex, false)}
          </motion.div>

          {/* Peek do próximo review - aparece do lado direito com largura fixa */}
          {reviews.length > 1 && (
            <motion.div
              key={`peek-${(currentIndex + 1) % reviews.length}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0.6, x: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{
                flexShrink: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              {renderReviewCard(
                reviews[(currentIndex + 1) % reviews.length],
                (currentIndex + 1) % reviews.length,
                true
              )}
            </motion.div>
          )}
        </div>

        {/* Controles de navegação e progresso - juntos na mesma linha */}
        {(showArrows || showProgress) && reviews.length > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            {/* Seta esquerda - só aparece se não estiver no primeiro */}
            {showArrows && currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={prevReview}
                style={{
                  backgroundColor: 'transparent',
                  color: controlsColor,
                  padding: 0,
                  border: 'none',
                  boxShadow: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <ChevronLeft size={24} />
              </Button>
            )}

            {/* Indicador de progresso */}
            {showProgress && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {reviews.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => goToReview(index)}
                    style={{
                      width: index === currentIndex ? '32px' : '8px',
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor:
                        index === currentIndex ? controlsColor : cardBorderColor,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      padding: 0,
                    }}
                    aria-label={`Ir para review ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Seta direita */}
            {showArrows && (
              <Button
                variant="ghost"
                size="icon"
                onClick={nextReview}
                style={{
                  backgroundColor: 'transparent',
                  color: controlsColor,
                  padding: 0,
                  border: 'none',
                  boxShadow: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <ChevronRight size={24} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

