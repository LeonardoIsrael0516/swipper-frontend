import { useMemo, useRef, useEffect, useLayoutEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBuilder, BackgroundConfig } from '@/contexts/BuilderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReelProgressBar } from '@/components/reels/ReelProgressBar';
import { TextElement } from '@/components/builder/elements/TextElement';
import { ImageElement } from '@/components/builder/elements/ImageElement';
import { VideoElement } from '@/components/builder/elements/VideoElement';
import { AudioElement } from '@/components/builder/elements/AudioElement';
import { TimerElement } from '@/components/builder/elements/TimerElement';
import { CarouselElement } from '@/components/builder/elements/CarouselElement';
import { ButtonElement } from '@/components/builder/elements/ButtonElement';
import { AccordionElement } from '@/components/builder/elements/AccordionElement';
import { ComparativoElement } from '@/components/builder/elements/ComparativoElement';
import { PriceElement } from '@/components/builder/elements/PriceElement';
import { PlansElement } from '@/components/builder/elements/PlansElement';
import { QuestionnaireElement } from '@/components/builder/elements/QuestionnaireElement';
import { QuestionGridElement } from '@/components/builder/elements/QuestionGridElement';
import { ProgressElement } from '@/components/builder/elements/ProgressElement';
import { FormElement } from '@/components/builder/elements/FormElement';
import { FeedbackElement } from '@/components/builder/elements/FeedbackElement';
import { DashElement } from '@/components/builder/elements/DashElement';
import { ChartElement } from '@/components/builder/elements/ChartElement';
import { ScoreElement } from '@/components/builder/elements/ScoreElement';
import { SpacingElement } from '@/components/builder/elements/SpacingElement';
import { InteractiveElement } from '@/components/builder/elements/InteractiveElement';
import { SlideElement } from '@/contexts/BuilderContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ReelVideoBackground } from '@/components/reels/ReelVideoBackground';
import { ReelSoundProvider } from '@/contexts/ReelSoundContext';
import { ReelSocialActionsTikTok } from '@/components/reels/ReelSocialActionsTikTok';
import { ReelUsername } from '@/components/reels/ReelUsername';
import { ReelCaption } from '@/components/reels/ReelCaption';
import { ReelAudioTag } from '@/components/reels/ReelAudioTag';

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

// Função helper para agrupar botões coluna consecutivos
const groupElements = (elements: any[]) => {
  const grouped: any[] = [];
  let currentGroup: any[] = [];

  elements.forEach((element, index) => {
    const config = normalizeUiConfig(element.uiConfig);
    const isColumnButton = element.elementType === 'BUTTON' && config.columnMode === true;

    if (isColumnButton) {
      // Adicionar ao grupo atual
      currentGroup.push({ ...element, index });
    } else {
      // Se há grupo pendente, adicionar ao grouped e limpar
      if (currentGroup.length > 0) {
        grouped.push({ type: 'button-group', elements: currentGroup });
        currentGroup = [];
      }
      // Adicionar elemento normal
      grouped.push({ type: 'single', element, index });
    }
  });

  // Adicionar grupo pendente se houver
  if (currentGroup.length > 0) {
    grouped.push({ type: 'button-group', elements: currentGroup });
  }

  return grouped;
};

function SortableElement({ element, reelId }: { element: SlideElement; reelId?: string }) {
  // Garantir que o elemento tem uiConfig normalizado
  const normalizedElement = useMemo(() => ({
    ...element,
    uiConfig: normalizeUiConfig(element.uiConfig),
  }), [element]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: element.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderElement = () => {
    switch (normalizedElement.elementType) {
      case 'TEXT':
        return <TextElement element={normalizedElement} />;
      case 'IMAGE':
        return <ImageElement element={normalizedElement} />;
      case 'VIDEO':
        return <VideoElement element={normalizedElement} />;
      case 'AUDIO':
        return <AudioElement element={normalizedElement} />;
      case 'TIMER':
        return <TimerElement element={normalizedElement} reelId={reelId} />;
      case 'CAROUSEL':
        return <CarouselElement element={normalizedElement} />;
      case 'BUTTON':
        return <ButtonElement element={normalizedElement} isInBuilder={true} />;
      case 'ACCORDION':
        return <AccordionElement element={normalizedElement} />;
      case 'BENEFITS':
      case 'COMPARATIVO':
        return <ComparativoElement element={normalizedElement} />;
      case 'PRICE':
        return <PriceElement element={normalizedElement} isInBuilder={true} />;
      case 'PLANS':
        return <PlansElement element={normalizedElement} isInBuilder={true} />;
      case 'QUESTIONNAIRE':
        return <QuestionnaireElement element={normalizedElement} />;
      case 'QUESTION_GRID':
        return <QuestionGridElement element={normalizedElement} />;
      case 'PROGRESS':
        return <ProgressElement element={normalizedElement} />;
      case 'FORM':
        return <FormElement element={normalizedElement} />;
      case 'FEEDBACK':
        return <FeedbackElement element={normalizedElement} />;
      case 'CIRCULAR':
        return <DashElement element={normalizedElement} />;
      case 'CHART':
        return <ChartElement element={normalizedElement} />;
      case 'SCORE':
        return <ScoreElement element={normalizedElement} isActive={true} />;
      case 'SPACING':
        return <SpacingElement element={normalizedElement} isInBuilder={true} />;
      default:
        return (
          <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
            <p className="text-sm text-white/80">
              Elemento {normalizedElement.elementType} - Não implementado ainda
            </p>
          </div>
        );
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <InteractiveElement
        element={normalizedElement}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        {renderElement()}
      </InteractiveElement>
    </div>
  );
}

// Constantes para cálculo de altura
const PREVIEW_HEIGHT = 819; // altura total do preview (480 * 15.35 / 9 = proporção 9:15.35)
const PADDING_TOP = 16; // padding do container (p-4 = 16px)
const PADDING_BOTTOM = 16; // padding do container
const ELEMENT_MARGIN = 16; // margin-bottom entre elementos (mb-4 = 16px)
const AVAILABLE_HEIGHT = PREVIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM; // ~787px

export function MobilePreview() {
  const { selectedSlide, reel, setReel, setSelectedSlide, setHasUnsavedChanges, setLastSavedAt, setHasAvailableSpace } = useBuilder();
  const isMobile = useIsMobile();
  const elementsContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [spaceUsage, setSpaceUsage] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(AVAILABLE_HEIGHT);
  const [previewSize, setPreviewSize] = useState({ width: 480, height: 819 });
  
  // Calcular índice do slide atual para a barra de progresso
  const currentPreviewSlide = useMemo(() => {
    if (!selectedSlide || !reel?.slides) return 0;
    return reel.slides.findIndex(s => s.id === selectedSlide.id);
  }, [selectedSlide, reel?.slides]);
  const measurementRef = useRef<{
    lastHeight: number;
    lastHasSpace: boolean;
    lastUsage: number;
    timeoutId: NodeJS.Timeout | null;
  }>({
    lastHeight: 0,
    lastHasSpace: true,
    lastUsage: 0,
    timeoutId: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ordenar elementos por order e normalizar uiConfig
  const sortedElements = useMemo(() => {
    if (!selectedSlide?.elements) return [];
    return [...selectedSlide.elements]
      .map((el) => ({
        ...el,
        uiConfig: normalizeUiConfig(el.uiConfig),
      }))
      .sort((a, b) => a.order - b.order);
  }, [selectedSlide?.elements]);

  // Calcular altura disponível no mobile baseado no container
  useEffect(() => {
    if (!isMobile || !containerRef.current) {
      setAvailableHeight(AVAILABLE_HEIGHT);
      return;
    }

    const updateAvailableHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const padding = 16; // p-4 = 16px
        const calculatedHeight = containerHeight - (padding * 2);
        setAvailableHeight(Math.max(calculatedHeight, 400)); // Mínimo de 400px
      }
    };

    updateAvailableHeight();
    const resizeObserver = new ResizeObserver(updateAvailableHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [isMobile]);

  // Calcular tamanho do preview no desktop baseado no espaço disponível
  useEffect(() => {
    if (isMobile || !containerRef.current) {
      return;
    }

    const updatePreviewSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Proporção do preview: 9:15.35
        const aspectRatio = 9 / 15.35;
        
        // Calcular largura máxima baseada na altura disponível
        const maxWidthFromHeight = containerHeight * aspectRatio;
        
        // Calcular altura máxima baseada na largura disponível
        const maxHeightFromWidth = containerWidth / aspectRatio;
        
        // Usar o menor dos dois para manter a proporção
        let width = Math.min(480, containerWidth, maxWidthFromHeight);
        let height = width / aspectRatio;
        
        // Se a altura calculada for maior que o disponível, ajustar pela altura
        if (height > containerHeight) {
          height = containerHeight;
          width = height * aspectRatio;
        }
        
        setPreviewSize({ width, height });
      }
    };

    updatePreviewSize();
    const resizeObserver = new ResizeObserver(updatePreviewSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Também observar mudanças na janela
    window.addEventListener('resize', updatePreviewSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePreviewSize);
    };
  }, [isMobile]);

  // Medir altura do conteúdo e atualizar disponibilidade de espaço
  useLayoutEffect(() => {
    if (!elementsContainerRef.current || !setHasAvailableSpace || !selectedSlide) {
      // Resetar estado quando não há slide selecionado
      if (!selectedSlide) {
        setHasAvailableSpace(true);
        setSpaceUsage(0);
        measurementRef.current.lastHeight = 0;
        measurementRef.current.lastHasSpace = true;
        measurementRef.current.lastUsage = 0;
      }
      return;
    }

    const measureHeight = () => {
      const container = elementsContainerRef.current;
      if (!container) return;

      // Medir altura real do conteúdo (scrollHeight inclui todo o conteúdo, mesmo que não visível)
      // Como o container tem maxHeight e overflow:hidden, scrollHeight nos dá a altura total do conteúdo
      const contentHeight = container.scrollHeight;
      const availableSpace = availableHeight;

      // Não medir se ainda não há conteúdo
      if (contentHeight === 0) {
        return;
      }

      // Só atualizar se a altura mudou significativamente (pelo menos 25px para evitar flickering)
      const heightDiff = Math.abs(contentHeight - measurementRef.current.lastHeight);
      if (heightDiff < 25 && measurementRef.current.lastHeight > 0) {
        return;
      }

      measurementRef.current.lastHeight = contentHeight;

      // Verificar se há espaço disponível (deixar margem de segurança de 25px para evitar flickering)
      // Usar < em vez de <= para ter margem extra
      const hasSpace = contentHeight < availableSpace - 25;
      
      // Só atualizar estado se realmente mudou
      if (hasSpace !== measurementRef.current.lastHasSpace) {
        measurementRef.current.lastHasSpace = hasSpace;
        setHasAvailableSpace(hasSpace);
      }

      // Calcular porcentagem de uso do espaço
      const usage = Math.min((contentHeight / availableSpace) * 100, 100);
      
      // Só atualizar se a porcentagem mudou significativamente (pelo menos 5% para evitar flickering)
      if (Math.abs(usage - measurementRef.current.lastUsage) >= 5) {
        measurementRef.current.lastUsage = usage;
        setSpaceUsage(usage);
      }
    };

    // Função com debounce para evitar atualizações muito frequentes (aumentado para 250ms)
    const debouncedMeasure = () => {
      if (measurementRef.current.timeoutId) {
        clearTimeout(measurementRef.current.timeoutId);
      }
      measurementRef.current.timeoutId = setTimeout(() => {
        measureHeight();
      }, 250);
    };

    // Resetar estado inicialmente quando slide muda
    setHasAvailableSpace(true);
    setSpaceUsage(0);
    measurementRef.current.lastHeight = 0;
    measurementRef.current.lastHasSpace = true;
    measurementRef.current.lastUsage = 0;

    // Medir após um delay para garantir que DOM foi totalmente atualizado
    const initialTimeout = setTimeout(() => {
      measureHeight();
    }, 250);

    // Criar ResizeObserver para medir quando elementos mudarem
    const resizeObserver = new ResizeObserver(() => {
      debouncedMeasure();
    });

    if (elementsContainerRef.current) {
      resizeObserver.observe(elementsContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      clearTimeout(initialTimeout);
      if (measurementRef.current.timeoutId) {
        clearTimeout(measurementRef.current.timeoutId);
      }
    };
  }, [selectedSlide?.id, setHasAvailableSpace, availableHeight]);

  // Medir novamente quando elementos mudarem (mas com debounce maior)
  useEffect(() => {
    if (!elementsContainerRef.current || !selectedSlide) return;

    // Aguardar um pouco mais para garantir que o DOM foi totalmente renderizado
    const timeoutId = setTimeout(() => {
      const container = elementsContainerRef.current;
      if (!container) return;

      const contentHeight = container.scrollHeight;
      const availableSpace = availableHeight;
      
      if (contentHeight === 0) return;
      
      // Atualizar apenas se houve mudança significativa (25px)
      const heightDiff = Math.abs(contentHeight - measurementRef.current.lastHeight);
      if (heightDiff >= 25) {
        measurementRef.current.lastHeight = contentHeight;
        
        const hasSpace = contentHeight < availableSpace - 25;
        if (hasSpace !== measurementRef.current.lastHasSpace) {
          measurementRef.current.lastHasSpace = hasSpace;
          setHasAvailableSpace(hasSpace);
        }

        const usage = Math.min((contentHeight / availableSpace) * 100, 100);
        if (Math.abs(usage - measurementRef.current.lastUsage) >= 5) {
          measurementRef.current.lastUsage = usage;
          setSpaceUsage(usage);
        }
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [sortedElements.length, selectedSlide?.id, setHasAvailableSpace, availableHeight]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !reel || !selectedSlide) {
      return;
    }

    const oldIndex = sortedElements.findIndex((el) => el.id === active.id);
    const newIndex = sortedElements.findIndex((el) => el.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newElements = arrayMove(sortedElements, oldIndex, newIndex);

    // Atualizar ordem localmente
    const updatedElements = newElements.map((el, index) => ({
      ...el,
      order: index + 1,
    }));

    const updatedSlide = {
      ...selectedSlide,
      elements: updatedElements,
    };

    const updatedReel = {
      ...reel,
      slides: reel.slides.map((s) => (s.id === selectedSlide.id ? updatedSlide : s)),
    };

    // Manter status ACTIVE - não mudar para DRAFT para que continue visível publicamente
    setReel(updatedReel);
    setSelectedSlide(updatedSlide);

    // Atualizar ordem de TODOS os elementos que mudaram no backend
    try {
      // Atualizar todos os elementos que mudaram de posição
      const updatePromises = updatedElements.map((element) =>
        api.patch(
          `/reels/${reel.id}/slides/${selectedSlide.id}/elements/${element.id}`,
          {
            order: element.order,
          }
        )
      );

      await Promise.all(updatePromises);
      
      // Se estiver em DRAFT, marcar como salvo após salvar no backend
      // Se estiver ACTIVE, manter hasUnsavedChanges = true para indicar mudanças não publicadas
      if (updatedReel.status === 'DRAFT') {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
      } else {
        setHasUnsavedChanges(true);
      }
    } catch (error: any) {
      toast.error('Erro ao atualizar ordem: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // Função para normalizar backgroundConfig (pode vir como string JSON)
  const normalizeBackgroundConfig = (bgConfig: any): BackgroundConfig | undefined => {
    if (!bgConfig) return undefined;
    
    // Se for string, tentar fazer parse
    if (typeof bgConfig === 'string') {
      try {
        bgConfig = JSON.parse(bgConfig);
      } catch {
        return undefined;
      }
    }
    
    // Se for objeto, retornar como está
    if (typeof bgConfig === 'object' && bgConfig !== null) {
      return bgConfig as BackgroundConfig;
    }
    
    return undefined;
  };

  // Renderizar background baseado no backgroundConfig
  const renderBackground = () => {
    // Usar o backgroundConfig normalizado memoizado
    let bgConfig = normalizedBgConfig;
    
    if (!bgConfig && selectedSlide?.backgroundColor) {
      bgConfig = {
        type: 'color',
        color: selectedSlide.backgroundColor,
      };
    }

    if (!bgConfig) {
      return {
        background: 'linear-gradient(to bottom right, #a855f7, #E91E63)',
      };
    }

    switch (bgConfig.type) {
      case 'color':
        return {
          backgroundColor: bgConfig.color || '#9333ea',
        };

      case 'gradient':
        if (!bgConfig.gradient) break;
        const { gradient } = bgConfig;
        const stops = gradient.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
        
        if (gradient.direction === 'linear') {
          return {
            background: `linear-gradient(${gradient.angle || 90}deg, ${stops})`,
          };
        } else if (gradient.direction === 'radial') {
          return {
            background: `radial-gradient(circle, ${stops})`,
          };
        } else {
          return {
            background: `conic-gradient(from ${gradient.angle || 0}deg, ${stops})`,
          };
        }

      case 'image':
        if (!bgConfig.image?.url) break;
        const { image } = bgConfig;
        return {
          backgroundImage: `url(${image.url})`,
          backgroundPosition: image.position || 'center',
          backgroundRepeat: image.repeat || 'no-repeat',
          backgroundSize: image.size || 'cover',
          opacity: image.opacity !== undefined ? image.opacity : 1,
        };

      case 'video':
        // Vídeo será renderizado como elemento separado
        return {};
    }

    // Fallback
    return {
      background: 'linear-gradient(to bottom right, #a855f7, #E91E63)',
    };
  };

  // Obter backgroundConfig normalizado (memoizado para evitar recalcular)
  const normalizedBgConfig = useMemo(() => {
    let bgConfig: BackgroundConfig | undefined = undefined;
    
    if (selectedSlide?.backgroundConfig) {
      bgConfig = normalizeBackgroundConfig(selectedSlide.backgroundConfig);
    }
    
    if (!bgConfig && selectedSlide?.uiConfig?.backgroundConfig) {
      bgConfig = normalizeBackgroundConfig(selectedSlide.uiConfig.backgroundConfig);
    }
    
    return bgConfig;
  }, [selectedSlide?.backgroundConfig, selectedSlide?.uiConfig?.backgroundConfig]);

  const getBackgroundStyle = () => renderBackground();
  
  // Renderizar vídeo de fundo se necessário usando ReelVideoBackground
  const renderBackgroundVideo = () => {
    if (normalizedBgConfig?.type === 'video' && normalizedBgConfig.video?.url) {
      const { video } = normalizedBgConfig;
      return (
        <div className={`absolute inset-0 z-0 pointer-events-none ${!isMobile ? 'rounded-2xl overflow-hidden' : ''}`}>
          <ReelVideoBackground
            src={video.url}
            autoplay={video.autoplay !== false}
            loop={true} // Sempre true para vídeos de background
            muted={video.muted !== false}
            opacity={video.opacity !== undefined ? video.opacity : 1}
            isActive={true} // Sempre ativo no preview do builder
            isBlurVersion={false} // Não usar blur no preview do builder
            showProgressBar={video.showProgressBar || false}
            fakeProgress={video.fakeProgress || false}
            fakeProgressSpeed={video.fakeProgressSpeed || 1.5}
            fakeProgressSlowdownStart={video.fakeProgressSlowdownStart || 0.9}
          />
        </div>
      );
    }
    return null;
  };

  if (!selectedSlide) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Selecione um slide para visualizar</p>
        </div>
      </div>
    );
  }

  return (
    <ReelSoundProvider>
      <div ref={containerRef} className={`flex items-center justify-center h-full w-full ${isMobile ? '' : 'p-4 md:p-6'}`}>
        <div 
          className={`relative overflow-hidden ${!isMobile ? 'rounded-2xl' : ''}`}
          style={isMobile ? {
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: '9/15.35',
            overflow: 'hidden',
          } : {
            width: `${previewSize.width}px`,
            height: `${previewSize.height}px`,
            aspectRatio: '9/15.35',
          }}
        >
          {/* Outer glow effect - apenas no desktop */}
          {!isMobile && (
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 blur-2xl opacity-60" />
          )}
          {/* Main content with border */}
          <div className={`relative w-full h-full bg-white ${isMobile ? 'shadow-md' : 'rounded-2xl shadow-2xl border-2 border-gray-300 ring-2 ring-gray-100'} overflow-hidden`}>
            <div className={`relative w-full h-full overflow-hidden ${!isMobile ? 'rounded-2xl' : ''}`} style={getBackgroundStyle()}>
              {/* Vídeo de fundo */}
              {renderBackgroundVideo()}
              
              {/* Barra de Progresso - apenas se habilitada */}
              {reel?.showProgressBar && reel.slides && reel.slides.length > 1 && (
                <ReelProgressBar 
                  currentSlide={currentPreviewSlide >= 0 ? currentPreviewSlide : 0} 
                  totalSlides={reel.slides.length} 
                />
              )}

              {/* Social Elements - sempre montados para preservar estado */}
              {reel?.socialConfig?.enabled && selectedSlide && (
                <div style={{ visibility: selectedSlide.hideSocialElements ? 'hidden' : 'visible' }}>
                  <ReelSocialActionsTikTok
                    reelId={reel.id}
                    socialConfig={reel.socialConfig}
                  />
                  <ReelUsername
                    socialConfig={reel.socialConfig}
                    className="bottom-[64px]"
                  />
                </div>
              )}
              
              {/* Conteúdo com z-index para ficar acima do vídeo */}
              <div ref={contentRef} className={`relative z-10 w-full h-full flex flex-col overflow-hidden`} style={{ maxHeight: '100%', maxWidth: '100%' }}>
              {/* Indicador visual de espaço usado */}
              {spaceUsage > 90 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500/50 z-20" />
              )}
              {spaceUsage >= 100 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 z-20" />
              )}
              
              {/* Render elements */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sortedElements.map((el) => el.id)} strategy={verticalListSortingStrategy}>
                  <div ref={elementsContainerRef} className="p-4 pb-20" style={{ maxHeight: `${availableHeight}px`, overflow: 'hidden', width: '100%' }}>
                        {sortedElements.length > 0 ? (() => {
                          // Agrupar elementos (botões coluna consecutivos)
                          const grouped = groupElements(sortedElements);
                          
                          return grouped.map((group, groupIndex) => {
                            if (group.type === 'button-group') {
                              // Renderizar grupo de botões coluna lado a lado
                              return (
                                <div key={`button-group-${groupIndex}`} className="mb-4 last:mb-0 flex gap-2 flex-wrap justify-center">
                                  {group.elements.map((element: any) => {
                                    // Debug em desenvolvimento
                                    if (import.meta.env.DEV && element.elementType === 'IMAGE') {
                                      console.log('MobilePreview rendering IMAGE element:', {
                                        elementId: element.id,
                                        uiConfig: element.uiConfig,
                                        imageUrl: element.uiConfig?.imageUrl,
                                        hasImageUrl: !!element.uiConfig?.imageUrl,
                                      });
                                    }
                                    return (
                                      <div key={`${element.id}-${element.uiConfig?.imageUrl || ''}`}>
                                        <SortableElement element={element} reelId={reel?.id} />
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            } else {
                              // Renderizar elemento único
                              const element = group.element;
                              // Debug em desenvolvimento
                              if (import.meta.env.DEV && element.elementType === 'IMAGE') {
                                console.log('MobilePreview rendering IMAGE element:', {
                                  elementId: element.id,
                                  uiConfig: element.uiConfig,
                                  imageUrl: element.uiConfig?.imageUrl,
                                  hasImageUrl: !!element.uiConfig?.imageUrl,
                                });
                              }
                              return (
                                <div key={`${element.id}-${element.uiConfig?.imageUrl || ''}`} className="mb-4 last:mb-0">
                                  <SortableElement element={element} reelId={reel?.id} />
                                </div>
                              );
                            }
                          });
                        })() : (
                      <div className="flex items-center justify-center min-h-[400px] text-white/60">
                        <p className="text-sm">Adicione elementos ao card</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
              </div>

              {/* Social Elements per Slide */}
              {reel?.socialConfig?.enabled && reel.socialConfig.showCaptions && selectedSlide && (
                <ReelCaption slide={selectedSlide} socialConfig={reel.socialConfig} />
              )}
              {reel?.socialConfig?.enabled && selectedSlide && (selectedSlide.backgroundConfig?.type === 'video' || selectedSlide.uiConfig?.backgroundConfig?.type === 'video') && (
                <ReelAudioTag slide={selectedSlide} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ReelSoundProvider>
  );
}

