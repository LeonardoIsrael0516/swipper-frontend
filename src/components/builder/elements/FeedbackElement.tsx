import React, { useRef, useLayoutEffect, useState } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { StarRating } from './StarRating';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

interface FeedbackElementProps {
  element: SlideElement;
}

export function FeedbackElement({ element }: FeedbackElementProps) {
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
    controlsColor = '#000000',
  } = config;

  const [cardHeight, setCardHeight] = useState<number | null>(null);
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

  // Se não houver reviews, mostrar placeholder
  if (reviews.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: textColor,
          backgroundColor,
          borderRadius: `${borderRadius}px`,
        }}
      >
        <p style={{ fontSize: '14px', opacity: 0.6 }}>
          Adicione depoimentos ao feedback
        </p>
      </div>
    );
  }

  const renderReviewCard = (review: any, index: number, isPeek: boolean = false, isListLayout: boolean = false) => {
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
          padding: isListLayout ? '24px' : '16px', // Mais padding no layout lista
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
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
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: cardBorderColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: textColor,
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              {(review.name || 'U')[0].toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: textColor,
                marginBottom: '4px',
              }}
            >
              {review.name || 'Nome não informado'}
            </div>
            <StarRating
              rating={review.stars || 5}
              style="normal"
              color={starColor}
              size={16}
            />
          </div>
        </div>

        {/* Descrição */}
        <div
          style={{
            fontSize: '14px',
            color: textColor,
            opacity: 0.8,
            lineHeight: '1.5',
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

  // Layout Carrossel (preview simplificado no builder)
  return (
    <div
      style={{
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        padding: '8px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          gap: `${gap}px`,
          alignItems: 'stretch',
        }}
      >
        {reviews.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            {renderReviewCard(reviews[0], 0, false)}
          </div>
        )}
        
        {reviews.length > 1 && (
          <div
            style={{
              flexShrink: 0,
              overflow: 'hidden',
              opacity: 0.6,
            }}
          >
            {renderReviewCard(reviews[1], 1, true)}
          </div>
        )}

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
            {/* Seta esquerda */}
            {showArrows && (
              <div
                style={{
                  color: controlsColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={24} />
              </div>
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
                  <div
                    key={index}
                    style={{
                      width: index === 0 ? '32px' : '8px',
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: index === 0 ? controlsColor : cardBorderColor,
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Seta direita */}
            {showArrows && (
              <div
                style={{
                  color: controlsColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={24} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

