import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronDown, Loader2 } from 'lucide-react';
import { SwipeHint } from '@/components/reels/SwipeHint';
import { SwipeHintSubtle } from '@/components/reels/SwipeHintSubtle';
import { ReelSocialActionsTikTok } from '@/components/reels/ReelSocialActionsTikTok';
import { ReelUsername } from '@/components/reels/ReelUsername';
import { ReelCaption } from '@/components/reels/ReelCaption';
import { ReelAudioTag } from '@/components/reels/ReelAudioTag';
import { TextElement } from '@/components/builder/elements/TextElement';
import { ImageElement } from '@/components/builder/elements/ImageElement';
import { AudioElement } from '@/components/builder/elements/AudioElement';
import { TimerElement } from '@/components/builder/elements/TimerElement';
import { ButtonElement } from '@/components/builder/elements/ButtonElement';
import { AccordionElement } from '@/components/builder/elements/AccordionElement';
import { DashElement } from '@/components/builder/elements/DashElement';
import { SpacingElement } from '@/components/builder/elements/SpacingElement';
import { CarouselElement } from '@/components/builder/elements/CarouselElement';
import { ChartElement } from '@/components/builder/elements/ChartElement';
import { ScoreElement } from '@/components/builder/elements/ScoreElement';
import { ReelVideo } from '@/components/reels/elements/ReelVideo';
import { ReelComparativo } from '@/components/reels/elements/ReelComparativo';
import { ReelPrice } from '@/components/reels/elements/ReelPrice';
import { ReelPlans } from '@/components/reels/elements/ReelPlans';
import { ReelQuestionnaire } from '@/components/reels/elements/ReelQuestionnaire';
import { ReelQuestionGrid } from '@/components/reels/elements/ReelQuestionGrid';
import { ReelProgress } from '@/components/reels/elements/ReelProgress';
import { ReelForm, ReelFormRef } from '@/components/reels/elements/ReelForm';
import { ReelFeedback } from '@/components/reels/elements/ReelFeedback';
import { ReelQuestion } from '@/components/reels/ReelQuestion';

// Slug do reel para exibir no preview
const PREVIEW_REEL_SLUG = '33v3j02j';

// Helper para normalizar uiConfig
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

// Helper para agrupar elementos (similar ao PublicQuiz)
const groupElements = (elements: any[]): any[] => {
  if (!elements || elements.length === 0) return [];
  
  const grouped: any[] = [];
  let currentGroup: any[] = [];

  elements.forEach((element, index) => {
    const config = normalizeUiConfig(element.uiConfig);
    const isColumnButton = element.elementType === 'BUTTON' && config.columnMode === true;

    if (isColumnButton) {
      currentGroup.push({ ...element, index });
    } else {
      if (currentGroup.length > 0) {
        grouped.push({ type: 'button-group', elements: currentGroup });
        currentGroup = [];
      }
      grouped.push({ type: 'single', element, index });
    }
  });

  if (currentGroup.length > 0) {
    grouped.push({ type: 'button-group', elements: currentGroup });
  }

  return grouped;
};

// Proporção 9:16 (1080x1920)
const PREVIEW_WIDTH = 360; // Proporcional a 1080
const PREVIEW_HEIGHT = 640; // Proporcional a 1920
const MIN_CONTENT_SCALE = 0.5; // Escala mínima para manter legibilidade

export function SwipperPreview() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, string[]>>({});
  const [progressStates, setProgressStates] = useState<Record<string, number>>({});
  const [completedProgressElements, setCompletedProgressElements] = useState<Set<string>>(new Set());
  const [formValidStates, setFormValidStates] = useState<Record<string, boolean>>({});
  const [contentScale, setContentScale] = useState(1);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [showSwipeHintOnUnlock, setShowSwipeHintOnUnlock] = useState(false);
  const [elementsHidingSocial, setElementsHidingSocial] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const formRefs = useRef<Record<string, ReelFormRef>>({});
  
  const MIN_SCALE = 0.7;

  // Carregar reel via API
  const { data: reel, isLoading, error } = useQuery({
    queryKey: ['preview-reel', PREVIEW_REEL_SLUG],
    queryFn: async () => {
      const response = await api.publicGet(`/reels/public/${PREVIEW_REEL_SLUG}`);
      const reelData = (response as any).data || response;
      
      // Normalizar slides e elementos
      if (reelData.slides) {
        reelData.slides = reelData.slides.map((slide: any) => ({
          ...slide,
          backgroundConfig: slide.backgroundConfig || slide.uiConfig?.backgroundConfig,
          elements: (slide.elements || []).map((element: any) => ({
            ...element,
            uiConfig: normalizeUiConfig(element.uiConfig),
          })),
        }));
      }
      
      return reelData;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
  });

  const slides = reel?.slides || [];
  const totalSlides = slides.length;

  // Agrupar elementos por slide
  const groupedElementsBySlide = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    slides.forEach((slide: any) => {
      grouped[slide.id] = groupElements(slide.elements || []);
    });
    return grouped;
  }, [slides]);

  // Calcular config do slide atual
  const currentSlideData = slides[currentSlide];
  const slideConfig = useMemo(() => {
    if (!currentSlideData) return null;
    
    const bgConfig = currentSlideData.backgroundConfig || currentSlideData.uiConfig?.backgroundConfig;
    
    return {
      backgroundColor: currentSlideData.backgroundColor || '#000000',
      backgroundConfig: bgConfig,
    };
  }, [currentSlideData]);

  // Handler para seleção de opção
  const handleOptionSelect = useCallback((slideId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [slideId]: optionId }));
    
    // Avançar para próximo slide após delay
    setTimeout(() => {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide((prev) => prev + 1);
      } else {
        // Loop: voltar ao primeiro slide
        setCurrentSlide(0);
        setSelectedAnswers({});
      }
    }, 800);
  }, [currentSlide, totalSlides]);

  // Calcular scale para conteúdo caber sem scroll
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content || !slides.length) return;

    const updateScale = () => {
      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const containerStyle = window.getComputedStyle(container);
        const paddingTop = parseFloat(containerStyle.paddingTop) || 16;
        const paddingBottom = parseFloat(containerStyle.paddingBottom) || 16;
        
        // Altura disponível
        const availableHeight = containerRect.height - paddingTop - paddingBottom;
        
        // Altura do conteúdo
        const contentHeight = content.scrollHeight;
        
        if (availableHeight > 0 && contentHeight > 0) {
          const rawScale = availableHeight / contentHeight;
          const newScale = Math.max(MIN_SCALE, Math.min(1, rawScale));
          setContentScale(newScale);
        }
      });
    };

    // Atualizar scale quando mudar slide ou conteúdo
    updateScale();
    
    // Observer para mudanças no conteúdo
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(content);
    
    // Atualizar quando mudar slide
    const timeoutId = setTimeout(updateScale, 100);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [currentSlide, slides, groupedElementsBySlide]);

  // Handler para scroll (simplificado)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !slides.length) return;

    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;

    const handleWheel = (e: WheelEvent) => {
      if (isScrollingRef.current) return;
      
      e.preventDefault();
      isScrollingRef.current = true;

      if (e.deltaY > 0 && currentSlide < totalSlides - 1) {
        // Scroll down - próximo slide
        setCurrentSlide((prev) => prev + 1);
      } else if (e.deltaY < 0 && currentSlide > 0) {
        // Scroll up - slide anterior
        setCurrentSlide((prev) => prev - 1);
      }

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].clientY;
      const distance = touchStartY - touchEndY;

      if (Math.abs(distance) > minSwipeDistance) {
        if (distance > 0 && currentSlide < totalSlides - 1) {
          // Swipe up - próximo slide
          setCurrentSlide((prev) => prev + 1);
        } else if (distance < 0 && currentSlide > 0) {
          // Swipe down - slide anterior
          setCurrentSlide((prev) => prev - 1);
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentSlide, totalSlides, slides.length]);

  // Handler para botões
  const handleButtonClick = useCallback((dest: string, url: string, openInNewTab: boolean, elementId: string) => {
    // No preview, apenas avançar slide se for next-slide
    if (dest === 'next-slide' && currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (url) {
      // Não abrir URLs no preview (apenas visualização)
      // Em produção, abriria a URL normalmente
    }
  }, [currentSlide, totalSlides]);

  // Handler para progress complete
  const handleProgressComplete = useCallback((dest: string, url: string, openInNewTab: boolean, elementId: string) => {
    setCompletedProgressElements((prev) => new Set(prev).add(elementId));
    if (dest === 'next-slide' && currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  // Handler para questionnaire next
  const handleQuestionnaireNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  // Handler para form submit
  const handleFormSubmit = useCallback((elementId: string, data: any) => {
    // No preview, apenas avançar slide
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  // Handler para form validation
  const handleFormValidationChange = useCallback((elementId: string, isValid: boolean) => {
    setFormValidStates((prev) => ({ ...prev, [elementId]: isValid }));
  }, []);

  // Handler para item action (questionnaire)
  const handleItemAction = useCallback(() => {
    // No preview, não fazer nada
  }, []);

  // Handler para visibility change
  const handleElementVisibilityChange = useCallback((elementId: string, isVisible: boolean) => {
    setElementsHidingSocial((prev) => {
      const next = new Set(prev);
      if (isVisible) {
        next.delete(elementId);
      } else {
        next.add(elementId);
      }
      return next;
    });
  }, []);

  // Renderizar elemento
  const renderElement = (element: any, isActive: boolean) => {
    const elementWithConfig = {
      ...element,
      uiConfig: normalizeUiConfig(element.uiConfig),
    };

    switch (element.elementType) {
      case 'TEXT':
        return <TextElement key={element.id} element={elementWithConfig} />;
      case 'IMAGE':
        return <ImageElement key={element.id} element={elementWithConfig} />;
      case 'AUDIO':
        return <AudioElement key={element.id} element={elementWithConfig} />;
      case 'VIDEO':
        return (
          <ReelVideo
            key={element.id}
            src={elementWithConfig.uiConfig?.videoUrl}
            youtubeUrl={elementWithConfig.uiConfig?.youtubeUrl}
            thumbnailUrl={elementWithConfig.uiConfig?.thumbnailUrl}
            autoplay={elementWithConfig.uiConfig?.autoplay !== false}
            loop={elementWithConfig.uiConfig?.loop !== false}
            muted={elementWithConfig.uiConfig?.muted !== false}
            controls={elementWithConfig.uiConfig?.controls === true}
            orientation={elementWithConfig.uiConfig?.orientation || 'vertical'}
            borderRadius={elementWithConfig.uiConfig?.borderRadius || 0}
            className="w-full"
            isActive={isActive}
          />
        );
      case 'TIMER':
        return <TimerElement key={element.id} element={elementWithConfig} reelId={reel?.id} />;
      case 'CAROUSEL':
        return <CarouselElement key={element.id} element={elementWithConfig} />;
      case 'BUTTON':
        return (
          <ButtonElement
            key={element.id}
            element={elementWithConfig}
            onButtonClick={(dest, url, openInNewTab) => handleButtonClick(dest, url, openInNewTab, element.id)}
            onVisibilityChange={handleElementVisibilityChange}
            isActive={isActive}
          />
        );
      case 'ACCORDION':
        return <AccordionElement key={element.id} element={elementWithConfig} />;
      case 'BENEFITS':
      case 'COMPARATIVO':
        return <ReelComparativo key={element.id} element={elementWithConfig} />;
      case 'PRICE':
        return (
          <ReelPrice
            key={element.id}
            element={elementWithConfig}
            onButtonClick={(url, openInNewTab) => {
              // No preview, apenas avançar slide
              if (currentSlide < totalSlides - 1) {
                setCurrentSlide((prev) => prev + 1);
              }
            }}
          />
        );
      case 'PLANS':
        return (
          <ReelPlans
            key={element.id}
            element={elementWithConfig}
            onButtonClick={(url, openInNewTab) => {
              // No preview, apenas avançar slide
              if (currentSlide < totalSlides - 1) {
                setCurrentSlide((prev) => prev + 1);
              }
            }}
          />
        );
      case 'QUESTIONNAIRE':
        return (
          <ReelQuestionnaire
            key={element.id}
            element={elementWithConfig}
            isActive={isActive}
            onNextSlide={handleQuestionnaireNext}
            onItemAction={handleItemAction}
            onVisibilityChange={handleElementVisibilityChange}
            onSelectionChange={(selectedIds) => {
              setQuestionnaireResponses((prev) => ({
                ...prev,
                [element.id]: selectedIds,
              }));
            }}
          />
        );
      case 'QUESTION_GRID':
        return (
          <ReelQuestionGrid
            key={element.id}
            element={elementWithConfig}
            isActive={isActive}
            onNextSlide={handleQuestionnaireNext}
            onItemAction={handleItemAction}
            onVisibilityChange={handleElementVisibilityChange}
            onSelectionChange={(selectedIds) => {
              setQuestionnaireResponses((prev) => ({
                ...prev,
                [element.id]: selectedIds,
              }));
            }}
          />
        );
      case 'PROGRESS':
        return (
          <ReelProgress
            key={element.id}
            element={elementWithConfig}
            isActive={isActive}
            onComplete={() => {
              const config = normalizeUiConfig(elementWithConfig.uiConfig);
              handleProgressComplete(
                config.destination || 'next-slide',
                config.url,
                config.openInNewTab !== false,
                element.id
              );
            }}
            isCompleted={completedProgressElements.has(element.id)}
            onProgressChange={(progress) => {
              setProgressStates((prev) => ({
                ...prev,
                [element.id]: progress,
              }));
            }}
          />
        );
      case 'FORM':
        return (
          <ReelForm
            key={element.id}
            ref={(ref) => {
              if (ref) {
                formRefs.current[element.id] = ref;
              } else {
                delete formRefs.current[element.id];
              }
            }}
            element={elementWithConfig}
            onNextSlide={() => {
              if (currentSlide < totalSlides - 1) {
                setCurrentSlide((prev) => prev + 1);
              }
            }}
            onFormSubmit={(data) => handleFormSubmit(element.id, data)}
            onValidationChange={(isValid) => handleFormValidationChange(element.id, isValid)}
            isActive={isActive}
            reelId={reel?.id}
            slideId={currentSlideElement?.id}
          />
        );
      case 'FEEDBACK':
        return (
          <ReelFeedback
            key={element.id}
            element={elementWithConfig}
          />
        );
      case 'CIRCULAR':
        return <DashElement key={element.id} element={elementWithConfig} isActive={isActive} />;
      case 'CHART':
        return <ChartElement key={element.id} element={elementWithConfig} />;
      case 'SCORE':
        return <ScoreElement key={element.id} element={elementWithConfig} isActive={isActive} />;
      case 'SPACING':
        return <SpacingElement key={element.id} element={elementWithConfig} />;
      default:
        return (
          <div key={element.id} className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-white/80">
              Elemento {element.elementType} - Não implementado ainda
            </p>
          </div>
        );
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full max-w-sm mx-auto">
        <div className="relative mx-auto w-[320px] h-[640px] rounded-[3rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 shadow-2xl">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-10" />
          <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-gray-950 to-gray-900 relative flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Error state - mostrar fallback mockado
  if (error || !reel || !slides.length) {
    return (
      <div className="relative w-full max-w-sm mx-auto">
        <div className="relative mx-auto w-[320px] h-[640px] rounded-[3rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 shadow-2xl">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-10" />
          <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-gray-950 to-gray-900 relative flex items-center justify-center">
            <p className="text-white/60 text-sm text-center px-4">
              Preview não disponível
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentSlideElement = slides[currentSlide];
  const hasOptions = currentSlideElement?.options && currentSlideElement.options.length > 0;
  const selectedOptionId = selectedAnswers[currentSlideElement?.id || ''];

  // Proporção 9:16 (1080x1920) - Tamanho real do preview
  // Para desktop, usar um tamanho proporcional mas visível
  const PHONE_WIDTH = 405; // Proporcional a 1080 (9:16)
  const PHONE_HEIGHT = 720; // Proporcional a 1920 (9:16)
  const PHONE_ASPECT_RATIO = 9 / 16;

  return (
    <div className="relative w-full max-w-sm mx-auto flex justify-center items-center">
      {/* Phone Frame - Proporção 9:16 (1080x1920) */}
      <div 
        className="relative rounded-[3rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 shadow-2xl"
        style={{
          width: `${PHONE_WIDTH}px`,
          height: `${PHONE_HEIGHT}px`,
          aspectRatio: `${PHONE_ASPECT_RATIO}`,
          margin: '0 auto',
        }}
      >
        {/* Notch */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-10" />
        
        {/* Screen */}
        <div 
          ref={containerRef}
          className="w-full h-full rounded-[2.5rem] overflow-hidden relative"
          style={{
            backgroundColor: slideConfig?.backgroundColor || '#000000',
            backgroundImage: slideConfig?.backgroundConfig?.type === 'image' && slideConfig.backgroundConfig.image?.url
              ? `url(${slideConfig.backgroundConfig.image.url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Progress Bar */}
          {reel?.showProgressBar && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800/50 z-20">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
              />
            </div>
          )}

          {/* Video Background */}
          {slideConfig?.backgroundConfig?.type === 'video' && slideConfig.backgroundConfig.video?.url && (
            <video
              className="absolute inset-0 w-full h-full object-cover z-0"
              src={slideConfig.backgroundConfig.video.url}
              autoPlay={slideConfig.backgroundConfig.video.autoplay !== false}
              loop={slideConfig.backgroundConfig.video.loop !== false}
              muted={slideConfig.backgroundConfig.video.muted !== false}
              playsInline
            />
          )}

          {/* Content - Sem scroll, conteúdo ajustado */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pt-12 relative z-10 overflow-hidden">
            {/* Slide Counter */}
            {totalSlides > 1 && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium z-30">
                {currentSlide + 1} de {totalSlides}
              </div>
            )}

            {/* Elements - Container sem scroll, com scale automático */}
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 overflow-hidden">
              <div 
                ref={contentRef}
                className="w-full flex flex-col items-center justify-center gap-3"
                style={{
                  transform: `scale(${contentScale})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  maxWidth: '100%',
                  willChange: 'transform',
                }}
              >
                {currentSlideElement && (
                  <>
                    {(() => {
                      const grouped = groupedElementsBySlide[currentSlideElement.id] || [];
                      
                      if (grouped.length === 0) {
                        return (
                          <div className="text-center text-white/60 py-8">
                            <p className="text-sm">Nenhum elemento neste slide</p>
                          </div>
                        );
                      }

                      return grouped.map((group, groupIndex) => {
                        if (group.type === 'button-group') {
                          return (
                            <div key={`button-group-${groupIndex}`} className="flex gap-2 flex-wrap justify-center w-full">
                              {group.elements.map((element: any) => renderElement(element, true))}
                            </div>
                          );
                        } else {
                          const element = group.element;
                          // Elementos que não precisam de wrapper (já têm espaçamento próprio)
                          const elementsWithoutWrapper = ['TEXT', 'IMAGE', 'VIDEO', 'SPACING'];
                          
                          if (elementsWithoutWrapper.includes(element.elementType)) {
                            return renderElement(element, true);
                          }
                          
                          // Outros elementos precisam de wrapper para espaçamento
                          return (
                            <div key={`element-${element.id}`} className="w-full">
                              {renderElement(element, true)}
                            </div>
                          );
                        }
                      });
                    })()}
                  </>
                )}
              </div>
            </div>

            {/* Question Overlay */}
            {hasOptions && currentSlideElement && (
              <ReelQuestion
                question={currentSlideElement.question}
                options={(currentSlideElement.options || []).map((opt: any) => ({
                  id: opt.id,
                  text: opt.text,
                  emoji: opt.emoji,
                }))}
                selectedOptionId={selectedOptionId}
                onOptionSelect={(optionId) => handleOptionSelect(currentSlideElement.id, optionId)}
                className="!p-2 !pb-4"
              />
            )}

          </div>

          {/* Username - Fora do container de conteúdo */}
          {reel?.socialConfig?.enabled && currentSlideElement && !currentSlideElement.hideSocialElements && (
            <ReelUsername socialConfig={reel.socialConfig} />
          )}

          {/* Caption - Fora do container de conteúdo */}
          {reel?.socialConfig?.enabled && currentSlideElement && !currentSlideElement.hideSocialElements && (
            <ReelCaption slide={currentSlideElement} socialConfig={reel.socialConfig} />
          )}

          {/* Audio Tag - Fora do container de conteúdo */}
          {(currentSlideElement?.backgroundConfig?.type === 'video' || currentSlideElement?.uiConfig?.backgroundConfig?.type === 'video') && (
            <ReelAudioTag slide={currentSlideElement} />
          )}

          {/* Swipe Hint - Only on first slide */}
          {showSwipeHint && currentSlide === 0 && (
            <SwipeHint onDismiss={() => setShowSwipeHint(false)} autoHideAfter={3000} />
          )}
          
          {/* Swipe Hint Subtle - When slide unlocks */}
          {showSwipeHintOnUnlock && (
            <SwipeHintSubtle 
              onDismiss={() => setShowSwipeHintOnUnlock(false)} 
              autoHideAfter={3000} 
            />
          )}

          {/* Elementos Sociais - renderizados uma vez para manter estado entre slides */}
          {reel?.socialConfig?.enabled && (
            <div style={{ visibility: (currentSlideElement?.hideSocialElements || elementsHidingSocial.size > 0) ? 'hidden' : 'visible' }}>
              <ReelSocialActionsTikTok
                reelId={reel.id}
                socialConfig={reel.socialConfig}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Stats */}
      <div className="absolute -left-8 top-1/4 hidden lg:block">
        <div className="glass-card rounded-2xl p-4 w-40 animate-float">
          <div className="text-xs text-muted-foreground mb-1">Taxa de Conclusão</div>
          <div className="text-2xl font-bold gradient-text">95%</div>
        </div>
      </div>

      <div className="absolute -right-8 top-1/3 hidden lg:block">
        <div className="glass-card rounded-2xl p-4 w-40 animate-float" style={{ animationDelay: '1s' }}>
          <div className="text-xs text-muted-foreground mb-1">Engajamento</div>
          <div className="text-2xl font-bold text-primary">5.2x</div>
        </div>
      </div>
    </div>
  );
}
