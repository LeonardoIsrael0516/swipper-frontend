import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ReelSlide, ReelSlideConfig } from '@/components/reels/ReelSlide';
import { ReelContent } from '@/components/reels/ReelContent';
import { ReelQuestion } from '@/components/reels/ReelQuestion';
import { ReelProgressBar } from '@/components/reels/ReelProgressBar';
import { SwipeHint } from '@/components/reels/SwipeHint';
import { SwipeHintSubtle } from '@/components/reels/SwipeHintSubtle';
import { TextElement } from '@/components/builder/elements/TextElement';
import { ImageElement } from '@/components/builder/elements/ImageElement';
import { AudioElement } from '@/components/builder/elements/AudioElement';
import { TimerElement } from '@/components/builder/elements/TimerElement';
import { CarouselElement } from '@/components/builder/elements/CarouselElement';
import { ButtonElement } from '@/components/builder/elements/ButtonElement';
import { AccordionElement } from '@/components/builder/elements/AccordionElement';
import { DashElement } from '@/components/builder/elements/DashElement';
import { ChartElement } from '@/components/builder/elements/ChartElement';
import { SpacingElement } from '@/components/builder/elements/SpacingElement';
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
import { ReelSocialActionsTikTok } from '@/components/reels/ReelSocialActionsTikTok';
import { ReelUsername } from '@/components/reels/ReelUsername';
import { ReelCaption } from '@/components/reels/ReelCaption';
import { ReelAudioTag } from '@/components/reels/ReelAudioTag';
import { BackgroundConfig } from '@/contexts/BuilderContext';
import { ReelSoundProvider } from '@/contexts/ReelSoundContext';
import { Loader2 } from 'lucide-react';

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

export default function PreviewQuiz() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, string[]>>({});
  const [progressStates, setProgressStates] = useState<Record<string, number>>({}); // elementId -> progress %
  const [formValidStates, setFormValidStates] = useState<Record<string, boolean>>({}); // elementId -> isValid
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [showSwipeHintOnUnlock, setShowSwipeHintOnUnlock] = useState(false);
  const [renderedSlides, setRenderedSlides] = useState(2);
  const [isSlideLocked, setIsSlideLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRefs = useRef<Record<string, ReelFormRef>>({});
  const prevIsSlideLockedRef = useRef<boolean>(false);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  const { data: reel, isLoading, error } = useQuery({
    queryKey: ['preview-reel', slug],
    queryFn: async () => {
      // Sempre adicionar timestamp para forçar bypass de cache do navegador
      // Isso garante que sempre busque dados atualizados
      const cacheBuster = `?t=${Date.now()}`;
      const response = await api.get(`/reels/preview/${slug}${cacheBuster}`);
      const reelData = (response as any).data || response;
      
      // Extrair backgroundConfig do uiConfig para cada slide
      if (reelData.slides) {
        reelData.slides = reelData.slides.map((slide: any) => ({
          ...slide,
          backgroundConfig: slide.backgroundConfig || slide.uiConfig?.backgroundConfig,
          // Garantir que elements existe e está no formato correto
          elements: (slide.elements || []).map((element: any) => ({
            ...element,
            uiConfig: normalizeUiConfig(element.uiConfig),
          })),
        }));
      }
      
      // Debug em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('PreviewQuiz - Reel data:', reelData);
        if (reelData.slides) {
          reelData.slides.forEach((slide: any, index: number) => {
            console.log(`Preview Slide ${index}:`, {
              id: slide.id,
              order: slide.order,
              elementsCount: slide.elements?.length || 0,
            });
            if (slide.elements && slide.elements.length > 0) {
              slide.elements.forEach((el: any) => {
                console.log(`  - Element ${el.id}:`, {
                  elementType: el.elementType,
                  order: el.order,
                  uiConfig: el.uiConfig,
                  hasImageUrl: !!el.uiConfig?.imageUrl,
                });
              });
            }
          });
        }
      }
      
      return reelData;
    },
    enabled: !!slug,
    staleTime: 0, // Sempre considerar dados como stale - sempre buscar dados frescos
    gcTime: 0, // Não manter em cache - sempre buscar do servidor
    refetchOnWindowFocus: true, // Refazer ao focar na janela
    refetchOnMount: true, // Sempre refazer ao montar para garantir dados atualizados
    refetchOnReconnect: true, // Refazer ao reconectar
    refetchInterval: false, // Desabilitar refetch automático completamente
  });

  // Atualizar título da página e meta tags
  useEffect(() => {
    if (reel) {
      document.title = reel.seoTitle || reel.title || 'Preview - Quiz';
      
      // Atualizar meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', reel.seoDescription || reel.description || '');
      
      // Atualizar favicon
      let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.setAttribute('rel', 'icon');
        document.head.appendChild(faviconLink);
      }
      if (reel.faviconUrl) {
        faviconLink.setAttribute('href', reel.faviconUrl);
      }
    }
    
    return () => {
      // Resetar título ao sair
      document.title = 'Quizz Reels';
    };
  }, [reel]);

  // Handler para mudança de validação do formulário
  const handleFormValidationChange = useCallback((elementId: string, isValid: boolean) => {
    setFormValidStates((prev) => ({ ...prev, [elementId]: isValid }));
  }, []);

  // Handler para submit do formulário
  const handleFormSubmit = useCallback((elementId: string, data: Record<string, any>) => {
    // Formulário já foi submetido pelo próprio componente, apenas atualizar estado se necessário
  }, []);

  const scrollToSlide = useCallback(async (slideIndex: number) => {
    // Enviar formulários completos antes de avançar
    if (reel?.slides && currentSlide < reel.slides.length) {
      const currentSlideData = reel.slides[currentSlide];
      if (currentSlideData?.elements) {
        for (const element of currentSlideData.elements) {
          if (element.elementType === 'FORM') {
            const formRef = formRefs.current[element.id];
            
            if (formRef && formRef.isFormValid()) {
              // Sempre enviar formulários válidos automaticamente
              await formRef.submitForm();
            }
          }
        }
      }
    }

    const container = containerRef.current;
    if (container) {
      // Marcar que o scroll é programático (não deve ser bloqueado)
      isProgrammaticScrollRef.current = true;
      
      container.scrollTo({
        top: slideIndex * container.clientHeight,
        behavior: 'smooth',
      });
      
      // Limpar a flag após a animação de scroll completar (assumindo ~500ms para smooth scroll)
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 600);
    }
  }, [reel, currentSlide]);

  // Função helper para verificar se um slide específico está travado
  const checkIfSlideIsLocked = useCallback((slideIndex: number): boolean => {
    if (!reel?.slides || slideIndex >= reel.slides.length || slideIndex < 0) {
      return false;
    }
    
    const slideData = reel.slides[slideIndex];
    if (!slideData?.elements) {
      return false;
    }
    
    // Verificar elementos travados (mesma lógica do useEffect de lock)
    let hasLocked = false;
    let questionnaireLocked = false;
    let progressLocked = false;
    let formLocked = false;
    
    slideData.elements.forEach((element: any) => {
      const config = normalizeUiConfig(element.uiConfig);
      
      if (element.elementType === 'BUTTON' && config.lockSlide === true) {
        hasLocked = true;
      }
      
      if (element.elementType === 'QUESTIONNAIRE' && config.lockSlide === true) {
        const elementId = element.id;
        const responses = questionnaireResponses[elementId] || [];
        if (responses.length === 0) {
          questionnaireLocked = true;
        }
      }
      
      if (element.elementType === 'QUESTION_GRID' && config.lockSlide === true) {
        const elementId = element.id;
        const responses = questionnaireResponses[elementId] || [];
        if (responses.length === 0) {
          questionnaireLocked = true;
        }
      }
      
      if (element.elementType === 'PROGRESS') {
        const elementId = element.id;
        const currentProgress = progressStates[elementId] || 0;
        const targetProgress = config.progress ?? 100;
        if (currentProgress < targetProgress) {
          progressLocked = true;
        }
      }
      
      if (element.elementType === 'FORM' && config.lockSlide === true) {
        const elementId = element.id;
        const isFormValid = formValidStates[elementId] || false;
        if (!isFormValid) {
          formLocked = true;
        }
      }
    });
    
    return hasLocked || questionnaireLocked || progressLocked || formLocked;
  }, [reel?.slides, questionnaireResponses, progressStates, formValidStates]);

  // Inicializar renderedSlides quando os slides carregarem
  useEffect(() => {
    if (reel?.slides && reel.slides.length > 0) {
      setRenderedSlides(Math.min(2, reel.slides.length));
    }
  }, [reel?.slides]);

  // Carregar mais slides quando o usuário se aproximar do último renderizado
  useEffect(() => {
    if (!reel?.slides || renderedSlides >= reel.slides.length) return;

    // Quando o usuário chegar no penúltimo slide renderizado, carregar mais
    if (currentSlide >= renderedSlides - 1) {
      // Carregar mais 2 slides ou até o final
      const newRenderedSlides = Math.min(renderedSlides + 2, reel.slides.length);
      setRenderedSlides(newRenderedSlides);
    }
  }, [currentSlide, renderedSlides, reel?.slides]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !reel?.slides) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const slideHeight = container.clientHeight;
      const newSlide = Math.round(scrollTop / slideHeight);

      // Limpar timeout anterior
      clearTimeout(scrollTimeout);

      if (newSlide !== currentSlide && newSlide < reel.slides.length && newSlide >= 0) {
        // Verificar se o slide atual está travado e o usuário está tentando sair
        // MAS apenas se o scroll não for programático (feito pelo botão)
        const currentSlideIsLocked = checkIfSlideIsLocked(currentSlide);
        const isProgrammatic = isProgrammaticScrollRef.current;
        
        // Se o slide atual está travado, o usuário está tentando ir para frente
        // E o scroll NÃO é programático (é manual), bloquear
        if (currentSlideIsLocked && newSlide > currentSlide && !isProgrammatic) {
          // Reverter scroll para o slide atual (não permitir sair do slide travado)
          scrollTimeout = setTimeout(() => {
            scrollToSlide(currentSlide);
          }, 50);
          return; // Não atualizar currentSlide
        }
        
        // Verificar se há uma conexão defaultNext no slide atual
        const currentSlideData = reel.slides[currentSlide];
        if (currentSlideData && newSlide === currentSlide + 1) {
          // Usuário está tentando ir para o próximo slide sequencial
          const logicNext = currentSlideData.logicNext || {};
          if (logicNext.defaultNext) {
            // Encontrar o índice do slide conectado
            const targetSlideId = logicNext.defaultNext;
            const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
              if (targetIndex >= 0 && targetIndex !== newSlide) {
                // Verificar se o slide atual está travado antes de permitir redirecionamento
                // Mas apenas se o scroll não for programático
                const isProgrammatic = isProgrammaticScrollRef.current;
                if (currentSlideIsLocked && !isProgrammatic) {
                  // Reverter scroll para o slide atual
                  scrollTimeout = setTimeout(() => {
                    scrollToSlide(currentSlide);
                  }, 50);
                  return;
                }
              
              // Redirecionar para o slide conectado
              scrollTimeout = setTimeout(() => {
                scrollToSlide(targetIndex);
              }, 50);
              return;
            }
          }
        }

        // Scroll normal - permitir mudança de slide
        setCurrentSlide(newSlide);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentSlide, reel, scrollToSlide, checkIfSlideIsLocked]);

  // Verificar se o slide atual está travado por algum botão
  useEffect(() => {
    if (!reel?.slides || currentSlide >= reel.slides.length) {
      const newIsLocked = false;
      prevIsSlideLockedRef.current = newIsLocked;
      setIsSlideLocked(newIsLocked);
      return;
    }

    const currentSlideData = reel.slides[currentSlide];
    if (!currentSlideData?.elements) {
      const newIsLocked = false;
      prevIsSlideLockedRef.current = newIsLocked;
      setIsSlideLocked(newIsLocked);
      return;
    }

    // Verificar se algum botão ou questionário tem lockSlide habilitado
    let hasLocked = false;
    let questionnaireLocked = false;
    let progressLocked = false;
    let formLocked = false;

    currentSlideData.elements.forEach((element: any) => {
      const config = normalizeUiConfig(element.uiConfig);
      
      if (element.elementType === 'BUTTON' && config.lockSlide === true) {
        hasLocked = true;
      }
      
      if (element.elementType === 'QUESTIONNAIRE' && config.lockSlide === true) {
        // Verificar se há pelo menos uma resposta selecionada
        const elementId = element.id;
        const responses = questionnaireResponses[elementId] || [];
        if (responses.length === 0) {
          questionnaireLocked = true;
        }
      }
      
      if (element.elementType === 'QUESTION_GRID' && config.lockSlide === true) {
        // Verificar se há pelo menos uma resposta selecionada
        const elementId = element.id;
        const responses = questionnaireResponses[elementId] || [];
        if (responses.length === 0) {
          questionnaireLocked = true;
        }
      }
      
      if (element.elementType === 'PROGRESS') {
        // Verificar se o progresso ainda não completou (menor que o target)
        const elementId = element.id;
        const currentProgress = progressStates[elementId] || 0;
        const targetProgress = config.progress ?? 100;
        if (currentProgress < targetProgress) {
          progressLocked = true;
        }
      }
      
      if (element.elementType === 'FORM' && config.lockSlide === true) {
        // Verificar se o formulário está válido
        const elementId = element.id;
        const isFormValid = formValidStates[elementId] || false;
        if (!isFormValid) {
          formLocked = true;
        }
      }
    });

    const newIsLocked = hasLocked || questionnaireLocked || progressLocked || formLocked;
    
    // Detectar quando o slide destrava (muda de true para false)
    if (prevIsSlideLockedRef.current && !newIsLocked) {
      // Slide acabou de destravar - mostrar swipe hint
      setShowSwipeHintOnUnlock(true);
      // Auto esconder após 3 segundos
      setTimeout(() => {
        setShowSwipeHintOnUnlock(false);
      }, 3000);
    }
    
    prevIsSlideLockedRef.current = newIsLocked;
    setIsSlideLocked(newIsLocked);
  }, [currentSlide, reel?.slides, questionnaireResponses, progressStates, formValidStates]);

  // Resetar showSwipeHintOnUnlock quando mudar de slide
  useEffect(() => {
    setShowSwipeHintOnUnlock(false);
    // Não resetar prevIsSlideLockedRef aqui, deixar que o useEffect acima faça isso
  }, [currentSlide]);

  // Bloquear scroll quando slide está travado (apenas para frente)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventWheel = (e: WheelEvent) => {
      if (isSlideLocked) {
        // Permitir scroll para cima (voltar), bloquear apenas para baixo (avançar)
        if (e.deltaY > 0) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // Para touch, precisamos verificar a direção do swipe
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const preventTouch = (e: TouchEvent) => {
      if (isSlideLocked) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        
        // Se está tentando deslizar para baixo (deltaY positivo = swipe down = avançar), bloquear
        // Se está tentando deslizar para cima (deltaY negativo = swipe up = voltar), permitir
        if (deltaY > 0) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    const preventKeys = (e: KeyboardEvent) => {
      if (isSlideLocked) {
        // Bloquear apenas teclas que avançam para frente
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        // Permitir ArrowUp e PageUp para voltar
      }
    };

    if (isSlideLocked) {
      container.addEventListener('wheel', preventWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', preventTouch, { passive: false });
      document.addEventListener('keydown', preventKeys);
      // Não alterar overflow - deixar scroll funcionar para voltar
    }

    return () => {
      container.removeEventListener('wheel', preventWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', preventTouch);
      document.removeEventListener('keydown', preventKeys);
    };
  }, [isSlideLocked]);

  // Função helper para obter o próximo slide baseado em logicNext
  const getNextSlideIndex = useCallback((slideId: string, elementId?: string, optionId?: string, itemId?: string): number | null => {
    if (!reel?.slides) return null;
    
    const slide = reel.slides.find((s) => s.id === slideId);
    if (!slide) return null;

    const logicNext = slide.logicNext || {};
    
    // PRIORIDADE 1: Se há conexão de elemento específico com item (para Question/QuestionGrid)
    if (elementId && itemId) {
      const elementItemKey = `${elementId}-item-${itemId}`;
      if (logicNext.elements?.[elementItemKey]) {
        const targetSlideId = logicNext.elements[elementItemKey];
        const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
        return targetIndex >= 0 ? targetIndex : null;
      }
    }
    
    // PRIORIDADE 2: Se há conexão de elemento específico (sem item)
    if (elementId && logicNext.elements?.[elementId]) {
      const targetSlideId = logicNext.elements[elementId];
      const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
      return targetIndex >= 0 ? targetIndex : null;
    }
    
    // PRIORIDADE 3: Se há conexão de opção específica
    if (optionId && logicNext.options?.[optionId]) {
      const targetSlideId = logicNext.options[optionId];
      const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
      return targetIndex >= 0 ? targetIndex : null;
    }
    
    // PRIORIDADE 4: Se há conexão padrão (defaultNext)
    if (logicNext.defaultNext) {
      const targetSlideId = logicNext.defaultNext;
      const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
      return targetIndex >= 0 ? targetIndex : null;
    }
    
    // Fallback: próxima na ordem
    const currentIndex = reel.slides.findIndex((s) => s.id === slideId);
    if (currentIndex >= 0 && currentIndex < reel.slides.length - 1) {
      return currentIndex + 1;
    }
    
    return null;
  }, [reel]);

  const handleButtonClick = useCallback((destination: 'next-slide' | 'url', url?: string, openInNewTab?: boolean, elementId?: string) => {
    // Enviar formulários completos antes de avançar
    if (reel?.slides && currentSlide < reel.slides.length) {
      const currentSlideData = reel.slides[currentSlide];
      if (currentSlideData?.elements) {
        for (const element of currentSlideData.elements) {
          if (element.elementType === 'FORM') {
            const formRef = formRefs.current[element.id];
            
            if (formRef && formRef.isFormValid()) {
              // Sempre enviar formulários válidos automaticamente
              formRef.submitForm();
            }
          }
        }
      }
    }

    // Desbloquear slide ao clicar no botão
    setIsSlideLocked(false);

    if (destination === 'next-slide') {
      if (!reel?.slides || currentSlide >= reel.slides.length) return;
      
      const currentSlideData = reel.slides[currentSlide];
      
      // PRIORIDADE 1: Verificar se há conexão no fluxo (sempre verificar primeiro)
      if (elementId) {
        const nextIndex = getNextSlideIndex(currentSlideData.id, elementId);
        
        if (nextIndex !== null) {
          // Há conexão no fluxo - usar ela (ignorar configuração do botão)
          scrollToSlide(nextIndex);
          return; // IMPORTANTE: retornar aqui para não executar lógica padrão
        }
      }
      
      // PRIORIDADE 2: Se não há conexão no fluxo, usar comportamento padrão (próximo slide)
      if (currentSlide < reel.slides.length - 1) {
        scrollToSlide(currentSlide + 1);
      }
    } else if (destination === 'url' && url) {
      // Validar e preparar URL
      let finalUrl = url.trim();
      
      // Adicionar protocolo se não tiver
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      
      // Validar URL antes de abrir
      try {
        const urlObj = new URL(finalUrl);
        if (openInNewTab !== false) { // default true
          window.open(urlObj.href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = urlObj.href;
        }
      } catch (error) {
        console.error('URL inválida:', error);
        // Tentar abrir mesmo assim se for uma URL simples
        if (openInNewTab !== false) {
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = finalUrl;
        }
      }
    }
  }, [reel, currentSlide, getNextSlideIndex, scrollToSlide]);

  // Handler para ações de item (slide ou URL)
  const handleItemAction = useCallback((itemId: string, actionType: 'none' | 'slide' | 'url', slideId?: string, url?: string, openInNewTab?: boolean) => {
    if (!reel?.slides || currentSlide >= reel.slides.length) return;
    
    const currentSlideData = reel.slides[currentSlide];
    
    // Encontrar o elemento do questionário/question grid atual
    const questionnaireElement = currentSlideData.elements?.find((el: any) => {
      const config = normalizeUiConfig(el.uiConfig);
      const items = config.items || [];
      return items.some((item: any) => item.id === itemId);
    });
    
    if (!questionnaireElement) return;
    
    const elementId = questionnaireElement.id;
    
    // PRIORIDADE 1: Verificar conexão no fluxo primeiro
    const nextIndex = getNextSlideIndex(currentSlideData.id, elementId, undefined, itemId);
    
    if (nextIndex !== null) {
      // Há conexão no fluxo - usar ela (ignorar ação do item)
      setIsSlideLocked(false);
      scrollToSlide(nextIndex);
      return;
    }
    
    // PRIORIDADE 2: Usar ação configurada do item
    setIsSlideLocked(false);
    
    if (actionType === 'slide' && slideId) {
      // Navegar para slide específico
      const targetSlideIndex = reel.slides.findIndex((s: any) => s.id === slideId);
      if (targetSlideIndex !== -1) {
        scrollToSlide(targetSlideIndex);
      }
    } else if (actionType === 'url' && url) {
      // Abrir URL
      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      
      try {
        const urlObj = new URL(finalUrl);
        if (openInNewTab !== false) {
          window.open(urlObj.href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = urlObj.href;
        }
      } catch (error) {
        console.error('URL inválida:', error);
        if (openInNewTab !== false) {
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = finalUrl;
        }
      }
    }
    // Se actionType === 'none', não fazer nada (apenas selecionou)
  }, [reel, currentSlide, getNextSlideIndex, scrollToSlide]);

  const handleQuestionnaireNext = useCallback((elementId: string, itemId: string) => {
    if (!reel?.slides || currentSlide >= reel.slides.length) return;
    
    const currentSlideData = reel.slides[currentSlide];
    
    // Verificar conexão no fluxo primeiro
    const nextIndex = getNextSlideIndex(currentSlideData.id, elementId, undefined, itemId);
    
    if (nextIndex !== null) {
      // Há conexão no fluxo - usar ela
      setIsSlideLocked(false);
      scrollToSlide(nextIndex);
    } else {
      // Não há conexão - usar comportamento padrão (próximo slide)
      setIsSlideLocked(false);
      if (currentSlide < reel.slides.length - 1) {
        scrollToSlide(currentSlide + 1);
      }
    }
  }, [reel, currentSlide, getNextSlideIndex, scrollToSlide]);

  const handleOptionSelect = async (slideId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [slideId]: optionId }));

    // Auto-scroll to next slide after selection usando logicNext
    setTimeout(() => {
      if (!reel?.slides || currentSlide >= reel.slides.length) return;
      
      const currentSlideData = reel.slides[currentSlide];
      const nextIndex = getNextSlideIndex(currentSlideData.id, undefined, optionId);
      
      if (nextIndex !== null) {
        scrollToSlide(nextIndex);
      } else if (currentSlide < reel.slides.length - 1) {
        scrollToSlide(currentSlide + 1);
      }
    }, 500);
  };

  const handleProgressComplete = (destination: 'next-slide' | 'url', url?: string, openInNewTab?: boolean) => {
    // Desbloquear slide ao completar progresso
    setIsSlideLocked(false);

    if (destination === 'next-slide') {
      if (currentSlide < (reel?.slides?.length || 0) - 1) {
        scrollToSlide(currentSlide + 1);
      }
    } else if (destination === 'url' && url) {
      // Validar e preparar URL
      let finalUrl = url.trim();
      
      // Adicionar protocolo se não tiver
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      
      // Validar URL antes de abrir
      try {
        const urlObj = new URL(finalUrl);
        if (openInNewTab !== false) { // default true
          window.open(urlObj.href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = urlObj.href;
        }
      } catch (error) {
        console.error('URL inválida:', error);
        // Tentar abrir mesmo assim se for uma URL simples
        if (openInNewTab !== false) {
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = finalUrl;
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Preview não encontrado</h1>
          <p className="text-white/60 mb-6">Você precisa estar logado para visualizar o preview.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  const slides = reel.slides || [];

  return (
    <ReelSoundProvider>
      <div className="fixed inset-0 bg-transparent reel-quiz-fullscreen">
      {/* Container centralizador para conteúdo */}
      <div className="flex items-center justify-center w-full h-full reel-quiz-wrapper">
        {/* Card do quiz - adapta-se ao conteúdo */}
        <div 
          className="relative overflow-hidden reel-quiz-container"
          style={{ 
            width: '100%', 
            height: '100%',
            maxWidth: '100vw',
            maxHeight: '100vh',
          }}
        >
          {/* Progress Bar - apenas se habilitada */}
          {reel?.showProgressBar && slides.length > 1 && (
            <ReelProgressBar
              currentSlide={currentSlide}
              totalSlides={slides.length}
            />
          )}
          
          {/* Banner de Preview (apenas se for DRAFT) */}
          {reel.status === 'DRAFT' && (
            <div className="absolute top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-2 px-4 text-sm font-medium">
              🚧 PREVIEW - Este quiz ainda não está publicado
            </div>
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
            <div style={{ visibility: slides[currentSlide]?.hideSocialElements ? 'hidden' : 'visible' }}>
              <ReelSocialActionsTikTok
                reelId={reel.id}
                socialConfig={reel.socialConfig}
              />
            </div>
          )}

          {/* Main Scrollable Container */}
          <div ref={containerRef} className="reels-container-card hide-scrollbar">
        {slides.map((slide: any, index: number) => {
          // Renderizar apenas os slides até renderedSlides
          const shouldRender = index < renderedSlides;

          // Extrair backgroundConfig de múltiplos lugares
          const backgroundConfig: BackgroundConfig | undefined = 
            slide.backgroundConfig || 
            slide.uiConfig?.backgroundConfig ||
            (slide.backgroundColor ? {
              type: 'color',
              color: slide.backgroundColor,
            } : undefined);

          const slideConfig: ReelSlideConfig = {
            backgroundColor: slide.backgroundColor || undefined,
            backgroundConfig: backgroundConfig,
            // Manter compatibilidade com formato antigo
            backgroundGradient: slide.uiConfig?.background
              ? {
                  type: slide.uiConfig.background.type || 'linear',
                  direction: slide.uiConfig.background.direction || 'to bottom right',
                  colors: slide.uiConfig.background.colors || [],
                }
              : undefined,
          };

          // Placeholder vazio para slides não renderizados (mantém a altura do scroll)
          if (!shouldRender) {
            return <div key={slide.id} className="reel-slide" style={{ height: '100%', width: '100%' }} />;
          }

          return (
            <ReelSlide key={slide.id} config={slideConfig} isActive={index === currentSlide}>
              {/* Content Area */}
              <ReelContent>
                <div 
                  className="w-full h-full p-4"
                  style={{
                    overflow: 'hidden',
                    // Garantir que o último elemento não fique colado no home indicator (iOS)
                    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      gap: '16px', // Espaçamento entre elementos
                    }}
                  >
                  {(() => {
                    // CRÍTICO: Só renderizar elementos se este for o slide atual
                    // Isso previne elementos de outros slides aparecerem no desktop
                    if (index !== currentSlide) {
                      return null;
                    }
                    
                    const elements = slide.elements || [];
                    
                    // Verificar se há background configurado (vídeo ou imagem)
                    const hasBackground = slide.backgroundConfig?.type === 'video' || 
                                          slide.backgroundConfig?.type === 'image' ||
                                          slide.uiConfig?.backgroundConfig?.type === 'video' ||
                                          slide.uiConfig?.backgroundConfig?.type === 'image';
                    
                    // Agrupar elementos (botões coluna consecutivos)
                    const grouped = groupElements(elements);
                    
                    // Se não há elementos mas tem background, não mostrar mensagem
                    if (grouped.length === 0 && hasBackground) {
                      return null;
                    }
                    
                    // Se não há elementos e não tem background, mostrar mensagem
                    if (grouped.length === 0 && !hasBackground) {
                      return (
                        <div className="text-center text-white/60 py-8">
                          <p className="text-sm">Nenhum elemento neste slide</p>
                        </div>
                      );
                    }
                    
                    return grouped.map((group, groupIndex) => {
                      if (group.type === 'button-group') {
                        // Renderizar grupo de botões coluna lado a lado
                        return (
                          <div key={`button-group-${groupIndex}`} className="flex gap-2 flex-wrap justify-center">
                            {group.elements.map((element: any) => {
                              const elementWithConfig = {
                                ...element,
                                uiConfig: normalizeUiConfig(element.uiConfig),
                              };
                              return (
                                <ButtonElement
                                  key={element.id}
                                  element={elementWithConfig}
                                  onButtonClick={(dest, url, openInNewTab) => handleButtonClick(dest, url, openInNewTab, element.id)}
                                  isActive={index === currentSlide}
                                />
                              );
                            })}
                          </div>
                        );
                      } else {
                        // Renderizar elemento único com wrapper para espaçamento
                        const element = group.element;
                        // Garantir que elementType existe
                        if (!element.elementType) {
                          console.warn('Element without elementType:', element);
                          return null;
                        }
                        
                        // Garantir que uiConfig existe
                        const elementWithConfig = {
                          ...element,
                          uiConfig: normalizeUiConfig(element.uiConfig),
                        };
                        
                        // Wrapper para elementos que precisam de espaçamento
                        const renderElement = () => {
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
                                  isActive={index === currentSlide}
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
                                  onButtonClick={handleButtonClick}
                                  isActive={index === currentSlide}
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
                                    // Desbloquear slide ao clicar no botão
                                    setIsSlideLocked(false);
                                    // Abrir URL
                                    let finalUrl = url.trim();
                                    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                                      finalUrl = `https://${finalUrl}`;
                                    }
                                    try {
                                      const urlObj = new URL(finalUrl);
                                      if (openInNewTab) {
                                        window.open(urlObj.href, '_blank', 'noopener,noreferrer');
                                      } else {
                                        window.location.href = urlObj.href;
                                      }
                                    } catch (error) {
                                      console.error('URL inválida:', error);
                                      if (openInNewTab) {
                                        window.open(finalUrl, '_blank', 'noopener,noreferrer');
                                      } else {
                                        window.location.href = finalUrl;
                                      }
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
                                    // Desbloquear slide ao clicar no botão
                                    setIsSlideLocked(false);
                                    // Abrir URL
                                    let finalUrl = url.trim();
                                    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                                      finalUrl = `https://${finalUrl}`;
                                    }
                                    try {
                                      const urlObj = new URL(finalUrl);
                                      if (openInNewTab) {
                                        window.open(urlObj.href, '_blank', 'noopener,noreferrer');
                                      } else {
                                        window.location.href = urlObj.href;
                                      }
                                    } catch (error) {
                                      console.error('URL inválida:', error);
                                      if (openInNewTab) {
                                        window.open(finalUrl, '_blank', 'noopener,noreferrer');
                                      } else {
                                        window.location.href = finalUrl;
                                      }
                                    }
                                  }}
                                />
                              );
                            case 'QUESTIONNAIRE':
                              return (
                                <ReelQuestionnaire
                                  key={element.id}
                                  element={elementWithConfig}
                                  isActive={index === currentSlide}
                                  onNextSlide={handleQuestionnaireNext}
                                  onItemAction={handleItemAction}
                                  onSelectionChange={(selectedIds) => {
                                    // Atualizar estado de respostas do questionário
                                    // O useEffect que verifica lockSlide será acionado automaticamente
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
                                  isActive={index === currentSlide}
                                  onNextSlide={handleQuestionnaireNext}
                                  onItemAction={handleItemAction}
                                  onSelectionChange={(selectedIds) => {
                                    // Atualizar estado de respostas do question grid
                                    // O useEffect que verifica lockSlide será acionado automaticamente
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
                                  isActive={index === currentSlide}
                                  onComplete={() => {
                                    const config = normalizeUiConfig(elementWithConfig.uiConfig);
                                    handleProgressComplete(
                                      config.destination || 'next-slide',
                                      config.url,
                                      config.openInNewTab !== false
                                    );
                                  }}
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
                                    setIsSlideLocked(false);
                                    if (currentSlide < (reel?.slides?.length || 0) - 1) {
                                      scrollToSlide(currentSlide + 1);
                                    }
                                  }}
                                  onFormSubmit={(data) => handleFormSubmit(element.id, data)}
                                  onValidationChange={(isValid) => handleFormValidationChange(element.id, isValid)}
                                  isActive={index === currentSlide}
                                  reelId={reel?.id}
                                  slideId={slide.id}
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
                              return <DashElement key={element.id} element={elementWithConfig} isActive={index === currentSlide} />;
                            case 'CHART':
                              return <ChartElement key={element.id} element={elementWithConfig} />;
                            case 'SCORE':
                              return <ScoreElement key={element.id} element={elementWithConfig} isActive={index === currentSlide} />;
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

                        // Elementos que não precisam de wrapper (já têm espaçamento próprio)
                        const elementsWithoutWrapper = ['TEXT', 'IMAGE', 'VIDEO', 'SPACING'];
                        
                        if (elementsWithoutWrapper.includes(element.elementType)) {
                          return renderElement();
                        }
                        
                        // Outros elementos precisam de wrapper para espaçamento
                        return (
                          <div key={element.id} style={{ width: '100%' }}>
                            {renderElement()}
                          </div>
                        );
                      }
                    });
                  })()}
                  </div>
                </div>
              </ReelContent>

              {/* Question Overlay - renderizado apenas no slide atual */}
              {index === currentSlide && slide.options && slide.options.length > 0 && (
                <ReelQuestion
                  question={slide.question}
                  options={(slide.options || []).map((opt: any) => ({
                    id: opt.id,
                    text: opt.text,
                    emoji: opt.emoji,
                  }))}
                  selectedOptionId={selectedAnswers[slide.id]}
                  onOptionSelect={(optionId) => handleOptionSelect(slide.id, optionId)}
                />
              )}

              {/* Elementos Sociais - renderizados apenas no slide atual */}
              {reel?.socialConfig?.enabled && index === currentSlide && !slide.hideSocialElements && (
                <>
                  <ReelUsername socialConfig={reel.socialConfig} />
                  {reel.socialConfig.showCaptions && (
                    <ReelCaption slide={slide} socialConfig={reel.socialConfig} />
                  )}
                  {(slide.backgroundConfig?.type === 'video' || slide.uiConfig?.backgroundConfig?.type === 'video') && (
                    <ReelAudioTag slide={slide} />
                  )}
                </>
              )}
            </ReelSlide>
          );
        })}
          </div>
        </div>
      </div>
      </div>
    </ReelSoundProvider>
  );
}

