import { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ReelSlide, ReelSlideConfig } from '@/components/reels/ReelSlide';
import { ReelContent } from '@/components/reels/ReelContent';
import { ReelQuestion } from '@/components/reels/ReelQuestion';
import { ReelProgressBar } from '@/components/reels/ReelProgressBar';
import { SwipeHint } from '@/components/reels/SwipeHint';
import { SwipeHintSubtle } from '@/components/reels/SwipeHintSubtle';
import { DesktopNavigationArrows } from '@/components/reels/DesktopNavigationArrows';
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
import { GamificationOverlay } from '@/components/builder/GamificationOverlay';
import { usePoints } from '@/contexts/PointsContext';
import { useGamificationTrigger } from '@/contexts/GamificationTriggerContext';
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
import { removeUtmParamsIfNeeded } from '@/lib/utils';

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
  const [isTransitioning, setIsTransitioning] = useState(false); // Flag para indicar transição programática em andamento
  const containerRef = useRef<HTMLDivElement>(null);
  const formRefs = useRef<Record<string, ReelFormRef>>({});
  const prevIsSlideLockedRef = useRef<boolean>(false);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  
  const { addPoints, config: pointsConfig } = usePoints();
  const { trigger: triggerGamification } = useGamificationTrigger();

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
    // Verificar se o elemento tem gamificação habilitada
    if (elementId && reel?.slides?.[currentSlide]) {
      const element = reel.slides[currentSlide].elements?.find((el: any) => el.id === elementId);
      const elementGamificationConfig = element?.gamificationConfig || element?.uiConfig?.gamificationConfig;
      
      // Só disparar se o elemento tiver gamificação habilitada
      const hasGamification = elementGamificationConfig?.enabled === true ||
        elementGamificationConfig?.enablePointsBadge === true ||
        elementGamificationConfig?.enableSuccessSound === true ||
        elementGamificationConfig?.enableConfetti === true ||
        elementGamificationConfig?.enableParticles === true ||
        elementGamificationConfig?.enablePointsProgress === true ||
        elementGamificationConfig?.enableAchievement === true;
      
      if (hasGamification) {
        // Adicionar pontos por formulário completo
        const pointsToAdd = pointsConfig.pointsPerFormComplete || 50;
        // Mover addPoints para setTimeout para evitar erro de renderização
        setTimeout(() => {
          addPoints(pointsToAdd, 'Formulário completo');
          // Trigger gamification
          triggerGamification('onFormComplete', { points: pointsToAdd, reason: 'Formulário completo', elementId });
        }, 0);
      }
    }
  }, [reel, currentSlide, pointsConfig, addPoints, triggerGamification]);

  // Função helper para verificar se um slide específico está travado pelo background
  const isLockedByBackground = useCallback((slideIndex: number): boolean => {
    if (!reel?.slides || slideIndex >= reel.slides.length || slideIndex < 0) {
      return false;
    }
    
    const slideData = reel.slides[slideIndex];
    const backgroundConfig = slideData?.backgroundConfig || slideData?.uiConfig?.backgroundConfig;
    
    return backgroundConfig?.lockSlide === true;
  }, [reel?.slides]);

  // Função helper para verificar se um slide específico está travado
  const checkIfSlideIsLocked = useCallback((slideIndex: number): boolean => {
    if (!reel?.slides || slideIndex >= reel.slides.length || slideIndex < 0) {
      return false;
    }
    
    const slideData = reel.slides[slideIndex];
    
    // Verificar primeiro se está travado pelo background
    const backgroundConfig = slideData?.backgroundConfig || slideData?.uiConfig?.backgroundConfig;
    if (backgroundConfig?.lockSlide === true) {
      return true;
    }
    
    // Se não tiver elementos, não está travado por elementos
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

  const scrollToSlide = useCallback(async (slideIndex: number, isDirectJump?: boolean) => {
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
      // IMPORTANTE: Marcar ANTES de qualquer operação de scroll
      // Se já está marcado (ex: botão clicado), não remarcar
      if (!isProgrammaticScrollRef.current) {
        isProgrammaticScrollRef.current = true;
      }
      
      // Verificar se o slide destino está travado
      const targetSlideIsLocked = checkIfSlideIsLocked(slideIndex);
      
      // Detectar se é pulo direto (diferença > 1 entre slide atual e destino)
      const slideDifference = Math.abs(slideIndex - currentSlide);
      const isJump = isDirectJump !== undefined ? isDirectJump : slideDifference > 1;
      
      // Melhorar detecção de mobile - incluir todos os dispositivos iOS e Safari iOS
      const userAgent = navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
      const isSafariIOS = /iPhone|iPad|iPod/i.test(userAgent) && /Safari/i.test(userAgent) && !/CriOS|FxiOS|OPiOS/i.test(userAgent);
      const isAndroid = /Android/i.test(userAgent);
      const isMobile = isIOS || isSafariIOS || isAndroid || (window.innerWidth && window.innerWidth <= 768);
      
      const scrollBehavior = (isMobile || targetSlideIsLocked || isJump) ? 'auto' : 'smooth';
      
      const targetScrollTop = slideIndex * container.clientHeight;
      
      // CRÍTICO: Sempre atualizar currentSlide ANTES do scroll
      // Isso garante que os elementos sejam renderizados antes do scroll
      // Usar flushSync para forçar renderização síncrona
      flushSync(() => {
        setCurrentSlide(slideIndex);
      });
      
      // Marcar como em transição apenas para pulos diretos
      if (isJump) {
        setIsTransitioning(true);
      }
      
      // Adicionar classe CSS temporária para desabilitar scroll suave durante transição
      if (isJump || isMobile) {
        container.style.scrollBehavior = 'auto';
        // Adicionar will-change durante transição para melhor performance
        container.style.willChange = 'scroll-position';
      }
      
      // Função auxiliar para aplicar scroll e resetar estados
      const applyScroll = () => {
        container.scrollTop = targetScrollTop;
        
        // Resetar isTransitioning imediatamente para garantir que elementos apareçam
        if (isJump) {
          setIsTransitioning(false);
        }
        
        // Múltiplas tentativas de scrollTop para garantir no iOS (especialmente iPhone)
        requestAnimationFrame(() => {
          if (container.scrollTop !== targetScrollTop) {
            container.scrollTop = targetScrollTop;
          }
        });
        requestAnimationFrame(() => {
          if (container.scrollTop !== targetScrollTop) {
            container.scrollTop = targetScrollTop;
          }
        });
        requestAnimationFrame(() => {
          if (container.scrollTop !== targetScrollTop) {
            container.scrollTop = targetScrollTop;
          }
        });
        setTimeout(() => {
          if (container.scrollTop !== targetScrollTop) {
            container.scrollTop = targetScrollTop;
          }
          // Garantir reset final
          if (isJump) {
            setIsTransitioning(false);
          }
        }, 50);
      };
      
      // Para pulos diretos ou mobile, usar scrollTop direto para ser instantâneo
      if (isMobile || isJump) {
        // Aguardar dois frames para garantir que o DOM foi completamente atualizado
        // Isso é especialmente importante no modo mobile do navegador
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            applyScroll();
          });
        });
      } else {
        // Para scroll suave, aguardar um frame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          container.scrollTo({
            top: targetScrollTop,
            behavior: scrollBehavior,
          });
        });
      }
      
      // Aumentar tempo para cobrir toda a transição (smooth pode levar até 800ms)
      // No mobile ou pulos diretos, usar tempo maior para garantir que o handler de scroll não interfira
      // iOS pode precisar de mais tempo para processar o scroll
      const timeoutDuration = isMobile || isJump ? (isIOS ? 300 : 200) : (targetSlideIsLocked ? 200 : 800);
      
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        // Remover classe CSS temporária e estados de transição
        if (isJump || isMobile) {
          container.style.scrollBehavior = '';
          container.style.willChange = '';
        }
        // isTransitioning já foi resetado no applyScroll acima para pulos diretos
        // Apenas garantir reset se não foi resetado ainda (para scrolls suaves)
        if (!isJump) {
          setIsTransitioning(false);
        }
      }, timeoutDuration);
    }
  }, [reel, currentSlide, checkIfSlideIsLocked]);

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

  // Throttle scroll handler com requestAnimationFrame
  const scrollHandlerRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !reel?.slides) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // CRÍTICO: Ignorar completamente eventos de scroll se isProgrammaticScrollRef estiver ativo
      // Isso previne interferência durante transições programáticas (botões, questionários, etc)
      if (isProgrammaticScrollRef.current) {
        return;
      }

      // Cancelar frame anterior se existir
      if (scrollHandlerRef.current !== null) {
        cancelAnimationFrame(scrollHandlerRef.current);
      }

      // Usar requestAnimationFrame para throttling
      scrollHandlerRef.current = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const slideHeight = container.clientHeight;
        
        // Detectar direção do scroll
        const scrollDiff = scrollTop - lastScrollTopRef.current;
        if (Math.abs(scrollDiff) > 0) {
          scrollDirectionRef.current = scrollDiff > 0 ? 'down' : 'up';
        }
        
        // Aumentar threshold de detecção de mudança (de 10% para 30%)
        // Isso previne detecções incorretas durante scroll suave ou transições
        const threshold = slideHeight * 0.3;
        if (Math.abs(scrollTop - lastScrollTopRef.current) < threshold) {
          return;
        }
        
        lastScrollTopRef.current = scrollTop;
        const newSlide = Math.round(scrollTop / slideHeight);

        // Limpar timeout anterior
        clearTimeout(scrollTimeout);

        if (newSlide !== currentSlide && newSlide < reel.slides.length && newSlide >= 0) {
          // Verificar se o slide atual está travado e o usuário está tentando sair
          // MAS apenas se o scroll não for programático (feito pelo botão)
          const currentSlideIsLocked = checkIfSlideIsLocked(currentSlide);
          const isProgrammatic = isProgrammaticScrollRef.current;
          
          // Se o scroll é programático, ignorar completamente (já retornamos no início, mas garantir)
          if (isProgrammatic) {
            return;
          }
          
          // Se o slide atual está travado, o usuário está tentando ir para frente
          // E o scroll NÃO é programático (é manual), bloquear
          if (currentSlideIsLocked && newSlide > currentSlide && !isProgrammatic) {
            // Reverter scroll para o slide atual (não permitir sair do slide travado)
            scrollTimeout = setTimeout(() => {
              scrollToSlide(currentSlide, false);
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
                    scrollToSlide(currentSlide, false);
                  }, 50);
                  return;
                }
              
                // Redirecionar para o slide conectado
                const isDirectJump = Math.abs(targetIndex - currentSlide) > 1;
                scrollTimeout = setTimeout(() => {
                  scrollToSlide(targetIndex, isDirectJump);
                }, 50);
                return;
              }
            }
          }

          // Scroll normal - permitir mudança de slide
          setCurrentSlide(newSlide);
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      if (scrollHandlerRef.current !== null) {
        cancelAnimationFrame(scrollHandlerRef.current);
      }
    };
  }, [currentSlide, reel, scrollToSlide, checkIfSlideIsLocked]);

  // Verificar se o slide atual está travado por algum botão ou background
  useEffect(() => {
    if (!reel?.slides || currentSlide >= reel.slides.length) {
      const newIsLocked = false;
      prevIsSlideLockedRef.current = newIsLocked;
      setIsSlideLocked(newIsLocked);
      return;
    }

    const currentSlideData = reel.slides[currentSlide];
    
    // Verificar primeiro se está travado pelo background
    const backgroundConfig = currentSlideData?.backgroundConfig || currentSlideData?.uiConfig?.backgroundConfig;
    if (backgroundConfig?.lockSlide === true) {
      const newIsLocked = true;
      prevIsSlideLockedRef.current = newIsLocked;
      setIsSlideLocked(newIsLocked);
      return;
    }
    
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

    const slideHeight = container.clientHeight;

    // Handler de wheel para garantir que scroll funcione mesmo quando mouse está sobre elementos filhos
    // Este handler sempre aplica o scroll no container principal quando não está travado
    const handleWheel = (e: WheelEvent) => {
      // Se está travado, não fazer nada aqui (preventWheel vai lidar)
      if (isSlideLocked && !isProgrammaticScrollRef.current) {
        return;
      }
      
      // Se o evento não está dentro do container, ignorar
      const target = e.target as HTMLElement;
      if (!container.contains(target)) {
        return;
      }
      
      // Se o evento já está no container, deixar comportamento padrão
      if (target === container) {
        return;
      }
      
      // Se o evento está em um elemento filho, verificar se ele tem overflow próprio
      let element = target;
      while (element && element !== container) {
        const computedStyle = window.getComputedStyle(element);
        const overflowY = computedStyle.overflowY || computedStyle.overflow;
        const hasOverflow = (overflowY === 'scroll' || overflowY === 'auto') && 
                           computedStyle.overflow !== 'hidden';
        
        // Se encontrou um elemento com overflow próprio, deixar ele scrollar normalmente
        if (hasOverflow) {
          return;
        }
        
        element = element.parentElement as HTMLElement;
      }
      
      // Se chegou aqui, o elemento filho não tem overflow próprio
      // Aplicar scroll no container principal e prevenir no elemento filho
      e.preventDefault();
      e.stopPropagation();
      const currentScrollTop = container.scrollTop;
      const scrollAmount = e.deltaY;
      container.scrollTop = currentScrollTop + scrollAmount;
    };

    // Monitor contínuo para manter scroll travado - usar múltiplos monitores para garantir
    let lockMonitor: number | null = null;
    let lockInterval: NodeJS.Timeout | null = null;
    
    const monitorLock = () => {
      // Só monitorar se realmente estiver no slide travado (usar currentSlide do estado)
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        const currentScrollTop = container.scrollTop;
        const expectedScrollTop = currentSlide * slideHeight;
        
        // Bloquear qualquer movimento além da posição exata (sem tolerância)
        // Também impedir scroll para trás além da posição quando travado
        if (currentScrollTop !== expectedScrollTop) {
          // Forçar diretamente sem animação para precisão máxima
          container.scrollTop = expectedScrollTop;
        }
        
        // Continuar monitorando
        lockMonitor = requestAnimationFrame(monitorLock);
      }
    };
    
    // Monitor adicional com setInterval para ser ainda mais agressivo
    const monitorLockInterval = () => {
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        const currentScrollTop = container.scrollTop;
        const expectedScrollTop = currentSlide * slideHeight;
        
        // Bloquear qualquer movimento além da posição exata
        // Também impedir scroll para trás além da posição quando travado
        if (currentScrollTop !== expectedScrollTop) {
          // Forçar diretamente sem animação para precisão máxima
          container.scrollTop = expectedScrollTop;
        }
      }
    };

    const preventWheel = (e: WheelEvent) => {
      // Só bloquear se realmente estiver no slide travado (usar currentSlide do estado)
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        const expectedScrollTop = currentSlide * slideHeight;
        const lockedByBackground = isLockedByBackground(currentSlide);
        
        // Se travado pelo background, bloquear ambos os lados (cima e baixo)
        if (lockedByBackground) {
          // Bloquear qualquer movimento (para cima ou para baixo)
          if (e.deltaY !== 0) {
            e.preventDefault();
            e.stopImmediatePropagation();
            // Forçar scrollTop de volta imediatamente
            container.scrollTop = expectedScrollTop;
            return false;
          }
        } else {
          // Se travado por elementos, bloquear apenas para baixo (avançar)
          if (e.deltaY > 0) {
            e.preventDefault();
            e.stopImmediatePropagation();
            // Forçar scrollTop de volta imediatamente
            container.scrollTop = expectedScrollTop;
            return false;
          }
        }
        
        // Também garantir que o scrollTop esteja exatamente na posição esperada
        const currentScrollTop = container.scrollTop;
        if (currentScrollTop !== expectedScrollTop) {
          container.scrollTop = expectedScrollTop;
        }
      }
    };

    // Para touch, precisamos verificar a direção do swipe
    let touchStartY = 0;
    let touchStartScrollTop = 0;
    let isScrollingForward = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        touchStartY = e.touches[0].clientY;
        touchStartScrollTop = currentSlide * slideHeight;
        isScrollingForward = false;
      }
    };

    const preventTouch = (e: TouchEvent) => {
      // Só bloquear se realmente estiver no slide travado (usar currentSlide do estado)
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        const expectedScrollTop = currentSlide * slideHeight;
        const lockedByBackground = isLockedByBackground(currentSlide);
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        
        // Se travado pelo background, bloquear ambos os lados (cima e baixo)
        if (lockedByBackground) {
          // Bloquear qualquer movimento vertical significativo
          if (Math.abs(deltaY) > 5) {
            isScrollingForward = deltaY > 0;
            e.preventDefault();
            e.stopImmediatePropagation();
            // Forçar scrollTop de volta imediatamente
            container.scrollTop = expectedScrollTop;
            return false;
          }
        } else {
          // Se travado por elementos, bloquear apenas para baixo (swipe down = avançar)
          if (deltaY > 0) {
            isScrollingForward = true;
            e.preventDefault();
            e.stopImmediatePropagation();
            // Forçar scrollTop de volta imediatamente
            container.scrollTop = expectedScrollTop;
            return false;
          }
        }
        
        // Também garantir que o scrollTop esteja exatamente na posição esperada
        const currentScrollTop = container.scrollTop;
        if (currentScrollTop !== expectedScrollTop) {
          container.scrollTop = expectedScrollTop;
        }
      }
    };

    const handleTouchEnd = () => {
      if (isSlideLocked && isScrollingForward && reel?.slides) {
        // Garantir que voltou para a posição inicial
        container.scrollTop = currentSlide * slideHeight;
        isScrollingForward = false;
      }
    };

    const preventScroll = () => {
      // Só bloquear se realmente estiver no slide travado (usar currentSlide do estado)
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        const expectedScrollTop = currentSlide * slideHeight;
        const currentScrollTop = container.scrollTop;
        
        // Bloquear qualquer movimento além da posição exata (sem tolerância)
        // Usar atribuição direta para máxima precisão
        if (currentScrollTop !== expectedScrollTop) {
          container.scrollTop = expectedScrollTop;
        }
      }
    };

    const preventKeys = (e: KeyboardEvent) => {
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        const lockedByBackground = isLockedByBackground(currentSlide);
        
        // Se travado pelo background, bloquear ambos os lados (cima e baixo)
        if (lockedByBackground) {
          if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || 
              e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
          }
        } else {
          // Se travado por elementos, bloquear apenas teclas que avançam para frente
          if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
          }
          // Permitir ArrowUp e PageUp para voltar
        }
      }
    };

    // Sempre adicionar listener de wheel para garantir que scroll funcione sobre elementos filhos
    // Usar capture: true para capturar antes que elementos filhos interceptem
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    
    if (isSlideLocked) {
      // Iniciar monitor contínuo (requestAnimationFrame - ~60fps)
      lockMonitor = requestAnimationFrame(monitorLock);
      
      // Monitor adicional com setInterval (mais rápido - ~120fps)
      lockInterval = setInterval(monitorLockInterval, 8); // ~120fps
      
      container.addEventListener('wheel', preventWheel, { passive: false, capture: true });
      container.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
      container.addEventListener('touchmove', preventTouch, { passive: false, capture: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });
      container.addEventListener('scroll', preventScroll, { passive: false, capture: true });
      document.addEventListener('keydown', preventKeys, { capture: true });
    }

    return () => {
      if (lockMonitor !== null) {
        cancelAnimationFrame(lockMonitor);
      }
      if (lockInterval !== null) {
        clearInterval(lockInterval);
      }
      container.removeEventListener('wheel', handleWheel, { capture: true } as EventListenerOptions);
      container.removeEventListener('wheel', preventWheel, { capture: true } as EventListenerOptions);
      container.removeEventListener('touchstart', handleTouchStart, { capture: true } as EventListenerOptions);
      container.removeEventListener('touchmove', preventTouch, { capture: true } as EventListenerOptions);
      container.removeEventListener('touchend', handleTouchEnd, { capture: true } as EventListenerOptions);
      container.removeEventListener('scroll', preventScroll, { capture: true } as EventListenerOptions);
      document.removeEventListener('keydown', preventKeys, { capture: true } as EventListenerOptions);
    };
  }, [isSlideLocked, currentSlide, reel?.slides, isLockedByBackground]);

  // Função helper para obter o próximo slide baseado em logicNext
  // Função para verificar apenas conexões do fluxo (sem fallback)
  const hasFlowConnection = useCallback((slideId: string, elementId?: string, itemId?: string): number | null => {
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
    
    // Não há conexão no fluxo - retornar null (sem fallback)
    return null;
  }, [reel]);

  const getNextSlideIndex = useCallback((slideId: string, elementId?: string, optionId?: string, itemId?: string): { index: number; isDirectJump: boolean } | null => {
    if (!reel?.slides) return null;
    
    const slide = reel.slides.find((s) => s.id === slideId);
    if (!slide) return null;

    const logicNext = slide.logicNext || {};
    const currentIndex = reel.slides.findIndex((s) => s.id === slideId);
    
    // PRIORIDADE 1: Se há conexão de elemento específico com item (para Question/QuestionGrid)
    if (elementId && itemId) {
      const elementItemKey = `${elementId}-item-${itemId}`;
      if (logicNext.elements?.[elementItemKey]) {
        const targetSlideId = logicNext.elements[elementItemKey];
        const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
        if (targetIndex >= 0) {
          const isDirectJump = Math.abs(targetIndex - currentIndex) > 1;
          return { index: targetIndex, isDirectJump };
        }
      }
    }
    
    // PRIORIDADE 2: Se há conexão de elemento específico (sem item)
    if (elementId && logicNext.elements?.[elementId]) {
      const targetSlideId = logicNext.elements[elementId];
      const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
      if (targetIndex >= 0) {
        const isDirectJump = Math.abs(targetIndex - currentIndex) > 1;
        return { index: targetIndex, isDirectJump };
      }
    }
    
    // PRIORIDADE 3: Se há conexão de opção específica
    if (optionId && logicNext.options?.[optionId]) {
      const targetSlideId = logicNext.options[optionId];
      const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
      if (targetIndex >= 0) {
        const isDirectJump = Math.abs(targetIndex - currentIndex) > 1;
        return { index: targetIndex, isDirectJump };
      }
    }
    
    // PRIORIDADE 4: Se há conexão padrão (defaultNext)
    if (logicNext.defaultNext) {
      const targetSlideId = logicNext.defaultNext;
      const targetIndex = reel.slides.findIndex((s) => s.id === targetSlideId);
      if (targetIndex >= 0) {
        const isDirectJump = Math.abs(targetIndex - currentIndex) > 1;
        return { index: targetIndex, isDirectJump };
      }
    }
    
    // Fallback: próxima na ordem
    if (currentIndex >= 0 && currentIndex < reel.slides.length - 1) {
      return { index: currentIndex + 1, isDirectJump: false };
    }
    
    return null;
  }, [reel]);

  const handleButtonClick = useCallback((destination: 'next-slide' | 'url', url?: string, openInNewTab?: boolean, elementId?: string) => {
    // Verificar se o elemento tem gamificação habilitada antes de disparar
    if (elementId && reel?.slides?.[currentSlide]) {
      const element = reel.slides[currentSlide].elements?.find((el: any) => el.id === elementId);
      
      // Normalizar uiConfig se for string JSON
      let normalizedUiConfig = element?.uiConfig;
      if (typeof normalizedUiConfig === 'string') {
        try {
          normalizedUiConfig = JSON.parse(normalizedUiConfig);
        } catch {
          normalizedUiConfig = {};
        }
      }
      
      const elementGamificationConfig = element?.gamificationConfig || normalizedUiConfig?.gamificationConfig;
      
      // Só disparar trigger se o elemento tiver gamificação habilitada
      // IMPORTANTE: Se não há configuração de gamificação no elemento, NÃO disparar trigger
      // Cada elemento de gamificação (confetti, som, etc) vai verificar individualmente se está habilitado
      if (!elementGamificationConfig) {
        // Continuar com a ação do botão mesmo sem gamificação (não retornar aqui)
      } else {
        // Verificar se há um campo 'enabled' que habilita tudo, ou se pelo menos um elemento está habilitado
        const hasGamification = (
          elementGamificationConfig.enabled === true ||
          elementGamificationConfig.enablePointsBadge === true ||
          elementGamificationConfig.enableSuccessSound === true ||
          elementGamificationConfig.enableConfetti === true ||
          elementGamificationConfig.enableParticles === true ||
          elementGamificationConfig.enablePointsProgress === true ||
          elementGamificationConfig.enableAchievement === true
        );
        
        if (hasGamification) {
          triggerGamification('onButtonClick', { reason: 'Botão clicado', elementId });
        }
      }
    }
    
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
        const nextSlide = getNextSlideIndex(currentSlideData.id, elementId);
        
        if (nextSlide !== null) {
          // Há conexão no fluxo - usar ela (ignorar configuração do botão)
          scrollToSlide(nextSlide.index, nextSlide.isDirectJump);
          return; // IMPORTANTE: retornar aqui para não executar lógica padrão
        }
      }
      
      // PRIORIDADE 2: Se não há conexão no fluxo, usar comportamento padrão (próximo slide)
      if (currentSlide < reel.slides.length - 1) {
        scrollToSlide(currentSlide + 1, false);
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
        // Remover UTMs apenas se estivermos no builder/preview
        // Nas páginas reais, manter UTMs (importantes para tracking)
        const cleanUrl = removeUtmParamsIfNeeded(urlObj.href);
        
        if (openInNewTab !== false) { // default true
          window.open(cleanUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = cleanUrl;
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
    
    // PRIORIDADE 1: Verificar conexão no fluxo primeiro (sem fallback)
    const nextIndex = hasFlowConnection(currentSlideData.id, elementId, itemId);
    
    if (nextIndex !== null) {
      // Há conexão no fluxo - usar ela (ignorar ação do item)
      setIsSlideLocked(false);
      const isDirectJump = Math.abs(nextIndex - currentSlide) > 1;
      scrollToSlide(nextIndex, isDirectJump);
      return;
    }
    
    // PRIORIDADE 2: Usar ação configurada do item (se não houver conexão no fluxo)
    setIsSlideLocked(false);
    
    if (actionType === 'slide' && slideId) {
      // Navegar para slide específico configurado no item
      const targetSlideIndex = reel.slides.findIndex((s: any) => s.id === slideId);
      if (targetSlideIndex !== -1) {
        const isDirectJump = Math.abs(targetSlideIndex - currentSlide) > 1;
        scrollToSlide(targetSlideIndex, isDirectJump);
      }
    } else if (actionType === 'url' && url) {
      // Abrir URL
      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      
      try {
        const urlObj = new URL(finalUrl);
        // Remover UTMs apenas se estivermos no builder/preview
        // Nas páginas reais, manter UTMs (importantes para tracking)
        const cleanUrl = removeUtmParamsIfNeeded(urlObj.href);
        
        if (openInNewTab !== false) {
          window.open(cleanUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = cleanUrl;
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
  }, [reel, currentSlide, hasFlowConnection, scrollToSlide]);

  const handleQuestionnaireNext = useCallback((elementId: string, itemId: string) => {
    if (!reel?.slides || currentSlide >= reel.slides.length) return;
    
    const currentSlideData = reel.slides[currentSlide];
    
    // Verificar conexão no fluxo primeiro
    const nextSlide = getNextSlideIndex(currentSlideData.id, elementId, undefined, itemId);
    
    if (nextSlide !== null) {
      // Há conexão no fluxo - usar ela
      setIsSlideLocked(false);
      scrollToSlide(nextSlide.index, nextSlide.isDirectJump);
    } else {
      // Não há conexão - usar comportamento padrão (próximo slide)
      setIsSlideLocked(false);
      if (currentSlide < reel.slides.length - 1) {
        scrollToSlide(currentSlide + 1, false);
      }
    }
  }, [reel, currentSlide, getNextSlideIndex, scrollToSlide]);

  const handleOptionSelect = async (slideId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [slideId]: optionId }));

    // Auto-scroll to next slide after selection usando logicNext
    setTimeout(() => {
      if (!reel?.slides || currentSlide >= reel.slides.length) return;
      
      const currentSlideData = reel.slides[currentSlide];
      const nextSlide = getNextSlideIndex(currentSlideData.id, undefined, optionId);
      
      if (nextSlide !== null) {
        scrollToSlide(nextSlide.index, nextSlide.isDirectJump);
      } else if (currentSlide < reel.slides.length - 1) {
        scrollToSlide(currentSlide + 1, false);
      }
    }, 500);
  };

  const handleProgressComplete = (destination: 'next-slide' | 'url', url?: string, openInNewTab?: boolean) => {
    // Desbloquear slide ao completar progresso
    setIsSlideLocked(false);

    if (destination === 'next-slide') {
      if (currentSlide < (reel?.slides?.length || 0) - 1) {
        scrollToSlide(currentSlide + 1, false);
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
        // Remover UTMs apenas se estivermos no builder/preview
        // Nas páginas reais, manter UTMs (importantes para tracking)
        const cleanUrl = removeUtmParamsIfNeeded(urlObj.href);
        
        if (openInNewTab !== false) { // default true
          window.open(cleanUrl, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = cleanUrl;
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

          {/* Setas de Navegação Desktop */}
          <DesktopNavigationArrows
            currentSlide={currentSlide}
            totalSlides={slides.length}
            canGoUp={currentSlide > 0}
            canGoDown={
              currentSlide < slides.length - 1 && 
              !checkIfSlideIsLocked(currentSlide)
            }
            onNavigateUp={() => {
              if (currentSlide > 0) {
                scrollToSlide(currentSlide - 1);
              }
            }}
            onNavigateDown={() => {
              if (currentSlide < slides.length - 1 && !checkIfSlideIsLocked(currentSlide)) {
                scrollToSlide(currentSlide + 1);
              }
            }}
          />

          {/* Main Scrollable Container */}
          <div 
            ref={containerRef} 
            className="reels-container-card hide-scrollbar"
            style={{ 
              overflowY: isSlideLocked ? 'hidden' : 'scroll',
              // Otimizar performance durante transições
              willChange: isTransitioning ? 'scroll-position' : 'auto',
            }}
          >
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
                      // Garantir que o slide atual sempre seja visível, mesmo durante transições
                      visibility: index === currentSlide ? 'visible' : 'hidden',
                      pointerEvents: index === currentSlide ? 'auto' : 'none',
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
                          // Extrair gamificationConfig do uiConfig se existir
                          gamificationConfig: element.gamificationConfig || normalizeUiConfig(element.uiConfig)?.gamificationConfig,
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
                                  onButtonClick={(dest, url, openInNewTab) => handleButtonClick(dest, url, openInNewTab, element.id)}
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
                                      // Remover UTMs apenas se estivermos no builder/preview
                                      // Nas páginas reais, manter UTMs (importantes para tracking)
                                      const cleanUrl = removeUtmParamsIfNeeded(urlObj.href);
                                      
                                      if (openInNewTab) {
                                        window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                                      } else {
                                        window.location.href = cleanUrl;
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
                                      // Remover UTMs apenas se estivermos no builder/preview
                                      // Nas páginas reais, manter UTMs (importantes para tracking)
                                      const cleanUrl = removeUtmParamsIfNeeded(urlObj.href);
                                      
                                      if (openInNewTab) {
                                        window.open(cleanUrl, '_blank', 'noopener,noreferrer');
                                      } else {
                                        window.location.href = cleanUrl;
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
                              // Normalizar uiConfig para garantir que gamificationConfig seja extraído corretamente
                              const normalizedQuestionnaireUiConfig = normalizeUiConfig(elementWithConfig.uiConfig);
                              const questionnaireElementWithGamification = {
                                ...elementWithConfig,
                                uiConfig: normalizedQuestionnaireUiConfig, // Usar uiConfig normalizado
                                gamificationConfig: elementWithConfig.gamificationConfig || normalizedQuestionnaireUiConfig?.gamificationConfig,
                              };
                              return (
                                <ReelQuestionnaire
                                  key={element.id}
                                  element={questionnaireElementWithGamification}
                                  isActive={index === currentSlide}
                                  onNextSlide={handleQuestionnaireNext}
                                  onItemAction={handleItemAction}
                                  onSelectionChange={(selectedIds) => {
                                    // Atualizar estado de respostas do questionário
                                    setQuestionnaireResponses((prev) => {
                                      const prevResponses = prev[element.id] || [];
                                      const isNewResponse = selectedIds.length > prevResponses.length;
                                      
                                      if (isNewResponse) {
                                        // Verificar se o elemento tem gamificação habilitada
                                        const elementGamificationConfig = questionnaireElementWithGamification.gamificationConfig;
                                        
                                        // Só disparar se o elemento tiver gamificação habilitada
                                        const shouldTriggerGamification = elementGamificationConfig && (
                                          elementGamificationConfig.enabled === true ||
                                          elementGamificationConfig.enablePointsBadge === true ||
                                          elementGamificationConfig.enableSuccessSound === true ||
                                          elementGamificationConfig.enableConfetti === true ||
                                          elementGamificationConfig.enableParticles === true ||
                                          elementGamificationConfig.enablePointsProgress === true ||
                                          elementGamificationConfig.enableAchievement === true
                                        );
                                        
                                        if (shouldTriggerGamification) {
                                          // Adicionar pontos por resposta de questionário
                                          const newSelectedIds = selectedIds.filter((id: string) => !prevResponses.includes(id));
                                          let totalPoints = 0;
                                          
                                          newSelectedIds.forEach((itemId: string) => {
                                            const item = questionnaireElementWithGamification.uiConfig?.items?.find((it: any) => it.id === itemId);
                                            // Se o item tiver pointsEnabled explicitamente como false, não adicionar pontos
                                            // Caso contrário, adicionar pontos (padrão ou do item)
                                            if (item?.pointsEnabled === false) {
                                              // Não adicionar pontos se explicitamente desabilitado
                                            } else {
                                              // Adicionar pontos: usar pontos do item, ou pontos padrão da configuração
                                              const itemPoints = item?.points || reel?.gamificationConfig?.pointsConfig?.pointsPerAnswer || pointsConfig.pointsPerAnswer || 10;
                                              totalPoints += itemPoints;
                                            }
                                          });
                                          
                                          // Mover addPoints para setTimeout para evitar erro de renderização
                                          if (totalPoints > 0) {
                                            setTimeout(() => {
                                              addPoints(totalPoints, 'Resposta de questionário');
                                              triggerGamification('onQuestionAnswer', { points: totalPoints, reason: 'Resposta de questionário', elementId: element.id });
                                            }, 0);
                                          } else {
                                            // Mesmo sem pontos, disparar trigger se gamificação estiver habilitada
                                            setTimeout(() => {
                                              triggerGamification('onQuestionAnswer', { points: 0, reason: 'Resposta de questionário', elementId: element.id });
                                            }, 0);
                                          }
                                        }
                                      }
                                      
                                      return {
                                        ...prev,
                                        [element.id]: selectedIds,
                                      };
                                    });
                                  }}
                                />
                              );
                            case 'QUESTION_GRID':
                              // Normalizar uiConfig para garantir que gamificationConfig seja extraído corretamente
                              const normalizedQuestionGridUiConfig = normalizeUiConfig(elementWithConfig.uiConfig);
                              const questionGridElementWithGamification = {
                                ...elementWithConfig,
                                uiConfig: normalizedQuestionGridUiConfig, // Usar uiConfig normalizado
                                gamificationConfig: elementWithConfig.gamificationConfig || normalizedQuestionGridUiConfig?.gamificationConfig,
                              };
                              return (
                                <ReelQuestionGrid
                                  key={element.id}
                                  element={questionGridElementWithGamification}
                                  isActive={index === currentSlide}
                                  onNextSlide={handleQuestionnaireNext}
                                  onItemAction={handleItemAction}
                                  onSelectionChange={(selectedIds) => {
                                    // Atualizar estado de respostas do question grid
                                    setQuestionnaireResponses((prev) => {
                                      const prevResponses = prev[element.id] || [];
                                      const isNewResponse = selectedIds.length > prevResponses.length;
                                      
                                      if (isNewResponse) {
                                        // Verificar se o elemento tem gamificação habilitada
                                        const elementGamificationConfig = questionGridElementWithGamification.gamificationConfig;
                                        
                                        // Só disparar se o elemento tiver gamificação habilitada
                                        const shouldTriggerGamification = elementGamificationConfig && (
                                          elementGamificationConfig.enabled === true ||
                                          elementGamificationConfig.enablePointsBadge === true ||
                                          elementGamificationConfig.enableSuccessSound === true ||
                                          elementGamificationConfig.enableConfetti === true ||
                                          elementGamificationConfig.enableParticles === true ||
                                          elementGamificationConfig.enablePointsProgress === true ||
                                          elementGamificationConfig.enableAchievement === true
                                        );
                                        
                                        if (shouldTriggerGamification) {
                                          // Adicionar pontos por resposta de question grid
                                          const newSelectedIds = selectedIds.filter((id: string) => !prevResponses.includes(id));
                                          let totalPoints = 0;
                                          
                                          newSelectedIds.forEach((itemId: string) => {
                                            const item = questionGridElementWithGamification.uiConfig?.items?.find((it: any) => it.id === itemId);
                                            // Se o item tiver pointsEnabled explicitamente como false, não adicionar pontos
                                            // Caso contrário, adicionar pontos (padrão ou do item)
                                            if (item?.pointsEnabled === false) {
                                              // Não adicionar pontos se explicitamente desabilitado
                                            } else {
                                              // Adicionar pontos: usar pontos do item, ou pontos padrão da configuração
                                              const itemPoints = item?.points || reel?.gamificationConfig?.pointsConfig?.pointsPerAnswer || pointsConfig.pointsPerAnswer || 10;
                                              totalPoints += itemPoints;
                                            }
                                          });
                                          
                                          // Mover addPoints para setTimeout para evitar erro de renderização
                                          if (totalPoints > 0) {
                                            setTimeout(() => {
                                              addPoints(totalPoints, 'Resposta de question grid');
                                              triggerGamification('onQuestionAnswer', { points: totalPoints, reason: 'Resposta de question grid', elementId: element.id });
                                            }, 0);
                                          } else {
                                            // Mesmo sem pontos, disparar trigger se gamificação estiver habilitada
                                            setTimeout(() => {
                                              triggerGamification('onQuestionAnswer', { points: 0, reason: 'Resposta de question grid', elementId: element.id });
                                            }, 0);
                                          }
                                        }
                                      }
                                      
                                      return {
                                        ...prev,
                                        [element.id]: selectedIds,
                                      };
                                    });
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

      {/* Gamification Elements */}
      {reel?.slides && reel.slides[currentSlide] && (
        <GamificationOverlay isInBuilder={false} reel={reel} selectedSlide={reel.slides[currentSlide]} currentSlide={currentSlide} />
      )}
    </ReelSoundProvider>
  );
}

