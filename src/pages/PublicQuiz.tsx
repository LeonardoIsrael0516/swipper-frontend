import { useState, useRef, useEffect, useCallback, useMemo, memo, useReducer } from 'react';
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
import { Suspense } from 'react';
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
import { BackgroundConfig } from '@/contexts/BuilderContext';
import { ReelSoundProvider } from '@/contexts/ReelSoundContext';
import { Loader2 } from 'lucide-react';
import { generateVisitorId, getUTMParams } from '@/lib/cookies';
import { useAnalyticsBatch } from '@/hooks/useAnalyticsBatch';
import { isCustomDomain, normalizeDomain, removeUtmParamsIfNeeded } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { useTracking } from '@/contexts/TrackingContext';
import { getUTM } from '@/lib/tracking';
import { useWakeLock } from '@/hooks/useWakeLock';
import { usePoints } from '@/contexts/PointsContext';
import { useGamificationTrigger } from '@/contexts/GamificationTriggerContext';
import { GamificationOverlay } from '@/components/builder/GamificationOverlay';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
// Movida para fora do componente para evitar recriação
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

// Cache para normalização de uiConfig (evita recalcular mesmo elemento)
const uiConfigCache = new WeakMap<any, any>();

const getNormalizedUiConfig = (uiConfig: any): any => {
  if (!uiConfig) return {};
  
  // Tentar usar cache se possível
  if (typeof uiConfig === 'object' && uiConfig !== null && !Array.isArray(uiConfig)) {
    if (uiConfigCache.has(uiConfig)) {
      return uiConfigCache.get(uiConfig);
    }
    const normalized = normalizeUiConfig(uiConfig);
    uiConfigCache.set(uiConfig, normalized);
    return normalized;
  }
  
  return normalizeUiConfig(uiConfig);
};

// Função helper para agrupar botões coluna consecutivos
// Movida para fora do componente para evitar recriação
const groupElements = (elements: any[]): any[] => {
  if (!elements || elements.length === 0) return [];
  
  const grouped: any[] = [];
  let currentGroup: any[] = [];

  elements.forEach((element, index) => {
    const config = getNormalizedUiConfig(element.uiConfig);
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

// Reducer para estados relacionados a slides
interface SlideState {
  currentSlide: number;
  isSlideLocked: boolean;
  showSwipeHint: boolean;
  showSwipeHintOnUnlock: boolean;
}

type SlideAction =
  | { type: 'SET_CURRENT_SLIDE'; payload: number }
  | { type: 'SET_IS_LOCKED'; payload: boolean }
  | { type: 'SET_SHOW_SWIPE_HINT'; payload: boolean }
  | { type: 'SET_SHOW_SWIPE_HINT_UNLOCK'; payload: boolean };

const slideReducer = (state: SlideState, action: SlideAction): SlideState => {
  switch (action.type) {
    case 'SET_CURRENT_SLIDE':
      return { ...state, currentSlide: action.payload };
    case 'SET_IS_LOCKED':
      return { ...state, isSlideLocked: action.payload };
    case 'SET_SHOW_SWIPE_HINT':
      return { ...state, showSwipeHint: action.payload };
    case 'SET_SHOW_SWIPE_HINT_UNLOCK':
      return { ...state, showSwipeHintOnUnlock: action.payload };
    default:
      return state;
  }
};

const initialSlideState: SlideState = {
  currentSlide: 0,
  isSlideLocked: false,
  showSwipeHint: true,
  showSwipeHintOnUnlock: false,
};

// Limite mínimo de escala para manter legibilidade
const MIN_CONTENT_SCALE = 0.72;

export default function PublicQuiz() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [slideState, dispatchSlide] = useReducer(slideReducer, initialSlideState);
  const { currentSlide, isSlideLocked, showSwipeHint, showSwipeHintOnUnlock } = slideState;
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, string[]>>({});
  const [progressStates, setProgressStates] = useState<Record<string, number>>({}); // elementId -> progress %
  const [completedProgressElements, setCompletedProgressElements] = useState<Set<string>>(new Set()); // elementId -> já foi completado
  const [formValidStates, setFormValidStates] = useState<Record<string, boolean>>({}); // elementId -> isValid
  const [elementsHidingSocial, setElementsHidingSocial] = useState<Set<string>>(new Set()); // elementId -> should hide social
  const [blockedScrollAttempt, setBlockedScrollAttempt] = useState(false); // Flag para animação quando bloqueia scroll
  const [isTransitioning, setIsTransitioning] = useState(false); // Flag para indicar transição programática em andamento
  const containerRef = useRef<HTMLDivElement>(null);
  const formRefs = useRef<Record<string, ReelFormRef>>({});
  const prevIsSlideLockedRef = useRef<boolean>(false);
  const visitIdRef = useRef<string | null>(null);
  const slideStartTimeRef = useRef<Record<number, number>>({});
  const prevSlideRef = useRef<number | null>(null);
  const { queueEvent } = useAnalyticsBatch();
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const { sendCapiEvent } = useTracking();
  const pixelBlockedRef = useRef<boolean>(false); // Flag para indicar se o pixel foi bloqueado
  const [isMediaPlaying, setIsMediaPlaying] = useState(false); // Estado para rastrear se há mídia tocando
  const { addPoints, config: pointsConfig, resetPoints } = usePoints();
  const { trigger: triggerGamification } = useGamificationTrigger();
  
  // Detectar se é domínio personalizado e normalizar o domínio
  const customDomain = isCustomDomain() ? normalizeDomain(window.location.hostname) : null;
  
  // Usar wake lock para manter tela acesa quando há mídia tocando
  useWakeLock(isMediaPlaying);

  // Em reels NÃO deve existir scroll interno no slide.
  // Quando o conteúdo não cabe no viewport real do mobile (barras do navegador + safe-area),
  // reduzimos a escala do conteúdo para caber inteiro.
  const [contentScaleBySlideId, setContentScaleBySlideId] = useState<Record<string, number>>({});
  const slideContentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const slideContentInnerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const updateScaleForSlideId = useCallback((slideId: string) => {
    const container = slideContentRefs.current.get(slideId);
    const inner = slideContentInnerRefs.current.get(slideId);
    if (!container || !inner) return;

    // Usar requestAnimationFrame para garantir que o layout está completo
    requestAnimationFrame(() => {
      // Calcular altura disponível considerando padding do container
      // O container tem p-4 (16px) em todos os lados, mas paddingBottom pode ser maior devido ao safe-area
      const containerRect = container.getBoundingClientRect();
      const containerStyle = window.getComputedStyle(container);
      const paddingTop = parseFloat(containerStyle.paddingTop) || 16;
      const paddingBottom = parseFloat(containerStyle.paddingBottom) || 16;
      
      // Altura disponível = altura total do container menos os paddings
      let availableHeight = containerRect.height - paddingTop - paddingBottom;
      
      // Fallback: se a altura calculada for muito pequena ou inválida, usar viewport height
      // No mobile, 100dvh pode ser menor que o esperado devido a safe-area
      // Usar uma altura base similar ao preview (663px) mas ajustada para o viewport real
      if (availableHeight <= 0 || availableHeight < 400) {
        // Calcular altura baseada no viewport, similar ao preview do builder
        const viewportHeight = window.innerHeight || window.visualViewport?.height || 663;
        // Descontar paddings e uma margem de segurança para safe-area
        const safeAreaBottom = typeof window !== 'undefined' && CSS.supports('padding: env(safe-area-inset-bottom)') 
          ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0
          : 0;
        availableHeight = viewportHeight - paddingTop - paddingBottom - Math.max(0, safeAreaBottom - 16);
      }
      
      // Medir altura real do conteúdo (scrollHeight é mais confiável para conteúdo que pode ser maior)
      // Aguardar um frame adicional para garantir que espaçamentos e outros elementos dinâmicos estejam renderizados
      requestAnimationFrame(() => {
        const contentHeight = inner.scrollHeight;
        
        if (!availableHeight || !contentHeight || contentHeight <= 0 || availableHeight <= 0) return;

        // Calcular escala necessária para caber todo o conteúdo
        const rawScale = availableHeight / contentHeight;
        const nextScale = Math.max(MIN_CONTENT_SCALE, Math.min(1, rawScale));

        setContentScaleBySlideId((prev) => {
          const current = prev[slideId] ?? 1;
          // Só atualizar se a diferença for significativa (mais de 1%)
          if (Math.abs(current - nextScale) < 0.01) return prev;
          return { ...prev, [slideId]: nextScale };
        });
      });
    });
  }, []);

  // Forçar tema light na página pública para evitar interferência do tema dark do dispositivo
  useEffect(() => {
    const root = window.document.documentElement;
    // Remover classe dark e garantir que light esteja aplicada
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Não é necessário restaurar ao desmontar pois outras páginas gerenciam seu próprio tema
  }, []); // Executar apenas uma vez ao montar

  const { data: reel, isLoading, error } = useQuery({
    queryKey: ['public-reel', customDomain || slug],
    queryFn: async () => {
      let response: any;
      
      // Se for domínio personalizado, buscar pelo domínio
      if (customDomain) {
        // Log de debug em desenvolvimento
        if (import.meta.env.DEV) {
          console.log('[PublicQuiz] Buscando reel por domínio personalizado:', customDomain);
        }
        try {
          // O cacheBuster será adicionado automaticamente pelo método getReelByDomain se necessário
          response = await api.getReelByDomain(customDomain);
        } catch (err: any) {
          // Log de erro mais detalhado
          if (import.meta.env.DEV) {
            console.error('[PublicQuiz] Erro ao buscar reel por domínio:', {
              domain: customDomain,
              error: err,
              message: err?.message,
              statusCode: err?.statusCode,
            });
          }
          throw err;
        }
      } else {
        // Caso contrário, buscar pelo slug (comportamento normal)
        if (!slug) {
          throw new Error('Slug is required');
        }
        const cacheBuster = `?t=${Date.now()}`;
        response = await api.publicGet(`/reels/public/${slug}${cacheBuster}`);
      }
      
      const reelData = (response as any).data || response;
      
      // Extrair backgroundConfig do uiConfig para cada slide
      if (reelData.slides) {
        reelData.slides = reelData.slides.map((slide: any) => ({
          ...slide,
          backgroundConfig: slide.backgroundConfig || slide.uiConfig?.backgroundConfig,
          // Garantir que elements existe e está no formato correto
          elements: (slide.elements || []).map((element: any) => ({
            ...element,
            uiConfig: getNormalizedUiConfig(element.uiConfig),
          })),
        }));
      }
      
      // Debug em desenvolvimento (apenas se necessário)
      // Removido logs verbosos - não aparecem em produção mesmo assim
      
      return reelData;
    },
    enabled: !!(customDomain || slug),
    staleTime: 0, // Sempre considerar dados como stale - sempre buscar dados frescos
    gcTime: 0, // Não manter em cache - sempre buscar do servidor
    refetchOnWindowFocus: true, // Refazer ao focar na janela
    refetchOnMount: true, // Sempre refazer ao montar para garantir dados atualizados
    refetchOnReconnect: true, // Refazer ao reconectar
    refetchInterval: false, // Desabilitar refetch automático completamente
  });

  // Recalcular escala quando mudar de slide, ou quando os dados do reel mudarem
  useEffect(() => {
    if (!reel?.slides || reel.slides.length === 0) return;
    const slideId = reel.slides[currentSlide]?.id;
    if (!slideId) return;

    // Aguardar múltiplos frames para garantir que todos os elementos (incluindo espaçamentos) estejam renderizados
    // Espaçamentos grandes podem precisar de mais tempo para serem medidos corretamente
    let raf1: number;
    let raf2: number;
    let raf3: number;
    let timeout: NodeJS.Timeout;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        raf3 = requestAnimationFrame(() => {
          // Adicionar um delay adicional para garantir que espaçamentos e outros elementos dinâmicos estejam prontos
          // Para espaçamentos grandes, pode precisar de mais tempo
          timeout = setTimeout(() => {
            updateScaleForSlideId(slideId);
            // Recalcular novamente após um pequeno delay para garantir precisão
            setTimeout(() => {
              updateScaleForSlideId(slideId);
            }, 100);
          }, 100);
        });
      });
    });

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      if (raf3) cancelAnimationFrame(raf3);
      if (timeout) clearTimeout(timeout);
    };
  }, [reel?.slides, currentSlide, updateScaleForSlideId]);

  // Usar ResizeObserver para recalcular escala quando o conteúdo mudar de tamanho
  useEffect(() => {
    if (!reel?.slides || reel.slides.length === 0) return;
    const slideId = reel.slides[currentSlide]?.id;
    if (!slideId) return;

    const inner = slideContentInnerRefs.current.get(slideId);
    if (!inner) return;

    let timeout: NodeJS.Timeout;
    let lastHeight = 0;
    
    const observer = new ResizeObserver((entries) => {
      // Verificar se a altura realmente mudou
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        // Só recalcular se a altura mudou significativamente (mais de 10px)
        if (Math.abs(newHeight - lastHeight) > 10) {
          lastHeight = newHeight;
          // Debounce para evitar recálculos excessivos
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            updateScaleForSlideId(slideId);
            // Recalcular novamente após um delay para garantir precisão
            setTimeout(() => {
              updateScaleForSlideId(slideId);
            }, 150);
          }, 150);
        }
      }
    });

    observer.observe(inner);
    
    // Inicializar lastHeight
    lastHeight = inner.scrollHeight;

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [reel?.slides, currentSlide, updateScaleForSlideId]);

  // Memoizar slideConfigs e groupedElements ANTES dos returns condicionais
  // para garantir que hooks sejam chamados na mesma ordem sempre
  const slides = reel?.slides || [];
  
  const slideConfigs = useMemo(() => {
    if (!reel || !slides.length) return [];
    return slides.map((slide: any) => {
      const backgroundConfig: BackgroundConfig | undefined = 
        slide.backgroundConfig || 
        slide.uiConfig?.backgroundConfig ||
        (slide.backgroundColor ? {
          type: 'color',
          color: slide.backgroundColor,
        } : undefined);

      return {
        slideId: slide.id,
        config: {
          backgroundColor: slide.backgroundColor || undefined,
          backgroundConfig: backgroundConfig,
          backgroundGradient: slide.uiConfig?.background
            ? {
                type: slide.uiConfig.background.type || 'linear',
                direction: slide.uiConfig.background.direction || 'to bottom right',
                colors: slide.uiConfig.background.colors || [],
              }
            : undefined,
        } as ReelSlideConfig,
      };
    });
  }, [reel, slides]);

  const groupedElementsBySlide = useMemo(() => {
    if (!reel || !slides.length) return {};
    const grouped: Record<string, any[]> = {};
    slides.forEach((slide: any) => {
      if (slide.elements && slide.elements.length > 0) {
        grouped[slide.id] = groupElements(slide.elements);
      } else {
        grouped[slide.id] = [];
      }
    });
    return grouped;
  }, [reel, slides]);

  // Registrar visita quando o reel carregar
  useEffect(() => {
    if (reel && !visitIdRef.current) {
      const registerVisit = async () => {
        try {
          const visitorId = generateVisitorId();
          const utmParams = getUTMParams();
          const referrer = document.referrer || null;

          const response = await api.publicPost('/analytics/visit', {
            reelId: reel.id,
            visitorId,
            referrer,
            utmParams,
            language: navigator.language || null,
          });

          const visitData = (response as any).data || response;
          visitIdRef.current = visitData.id;

          // Registrar view do primeiro slide
          if (reel.slides && reel.slides.length > 0) {
            const firstSlide = reel.slides[0];
            slideStartTimeRef.current[0] = Date.now();
            queueEvent({
              visitId: visitData.id,
              eventType: 'view',
              slideId: firstSlide.id,
            });
          }
        } catch (error) {
          // Silently fail - não bloquear a experiência do usuário
          if (import.meta.env.DEV) {
            console.error('Error registering visit:', error);
          }
        }
      };

      registerVisit();
    }
  }, [reel]);

  // Atualizar título da página e meta tags
  useEffect(() => {
    if (reel) {
      const seoTitle = reel.seoTitle || reel.title || 'Quiz';
      const seoDescription = reel.seoDescription || reel.description || '';
      const currentUrl = window.location.href;
      
      // Atualizar título da página
      document.title = seoTitle;
      
      // Helper para atualizar ou criar meta tag
      const updateOrCreateMeta = (property: string, content: string, isProperty = true) => {
        const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
        let metaTag = document.querySelector(selector);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          if (isProperty) {
            metaTag.setAttribute('property', property);
          } else {
            metaTag.setAttribute('name', property);
          }
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
        return metaTag;
      };

      // Atualizar meta description
      updateOrCreateMeta('description', seoDescription, false);
      
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

      // Atualizar Open Graph meta tags
      updateOrCreateMeta('og:title', seoTitle);
      updateOrCreateMeta('og:description', seoDescription);
      updateOrCreateMeta('og:url', currentUrl);
      updateOrCreateMeta('og:type', 'website');
      
      // Helper para garantir URL absoluta
      const ensureAbsoluteUrl = (url: string): string => {
        // Se já é uma URL absoluta (http:// ou https://), retornar como está
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        // Se começa com /, adicionar origin
        if (url.startsWith('/')) {
          return `${window.location.origin}${url}`;
        }
        // Caso contrário, adicionar origin e /
        return `${window.location.origin}/${url}`;
      };

      // Atualizar og:image com favicon (garantir URL absoluta)
      if (reel.faviconUrl) {
        const ogImageUrl = ensureAbsoluteUrl(reel.faviconUrl);
        updateOrCreateMeta('og:image', ogImageUrl);
      } else {
        // Se não houver favicon, usar imagem padrão
        const defaultImage = `${window.location.origin}/meta.png`;
        updateOrCreateMeta('og:image', defaultImage);
      }

      // Atualizar Twitter Card meta tags
      updateOrCreateMeta('twitter:card', 'summary_large_image', false);
      updateOrCreateMeta('twitter:title', seoTitle, false);
      updateOrCreateMeta('twitter:description', seoDescription, false);
      
      if (reel.faviconUrl) {
        const twitterImageUrl = ensureAbsoluteUrl(reel.faviconUrl);
        updateOrCreateMeta('twitter:image', twitterImageUrl, false);
      } else {
        // Se não houver favicon, usar imagem padrão
        const defaultImage = `${window.location.origin}/meta.png`;
        updateOrCreateMeta('twitter:image', defaultImage, false);
      }
    }
    
    return () => {
      // Resetar título ao sair
      document.title = 'Swipper - Reels Sales';
      
      // Restaurar meta tags padrão
      const defaultTitle = 'Swipper';
      const defaultDescription = 'Crie e compartilhe quizzes interativos estilo reels com Swipper';
      const defaultImage = `${window.location.origin}/meta.png`;
      const defaultUrl = window.location.origin;

      const updateOrCreateMeta = (property: string, content: string, isProperty = true) => {
        const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
        let metaTag = document.querySelector(selector);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          if (isProperty) {
            metaTag.setAttribute('property', property);
          } else {
            metaTag.setAttribute('name', property);
          }
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
      };

      updateOrCreateMeta('description', defaultDescription, false);
      updateOrCreateMeta('og:title', defaultTitle);
      updateOrCreateMeta('og:description', defaultDescription);
      updateOrCreateMeta('og:image', defaultImage);
      updateOrCreateMeta('og:url', defaultUrl);
      updateOrCreateMeta('twitter:title', defaultTitle, false);
      updateOrCreateMeta('twitter:description', defaultDescription, false);
      updateOrCreateMeta('twitter:image', defaultImage, false);
    };
  }, [reel]);

  // Injetar Meta Pixel e detectar bloqueio
  useEffect(() => {
    if (reel?.pixelsConfig?.metaPixel?.enabled && reel.pixelsConfig.metaPixel.pixelId) {
      const pixelId = reel.pixelsConfig.metaPixel.pixelId;
      const noscriptId = `meta-pixel-noscript-${reel.id}`;
      
      // Verificar se o pixel já foi injetado
      if ((window as any).fbq && (window as any).fbq.queue) {
        pixelBlockedRef.current = false;
        return;
      }

      // Resetar flag de bloqueio
      pixelBlockedRef.current = false;

      // Injetar código oficial do Meta Pixel no head
      // Usar textContent em vez de innerHTML para segurança e performance
      const script = document.createElement('script');
      script.id = `meta-pixel-script-${reel.id}`;
      script.async = true; // Não bloquear renderização
      script.textContent = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      // Injetar noscript tag no body
      const noscript = document.createElement('noscript');
      noscript.id = noscriptId;
      const img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.body.appendChild(noscript);

      // Sempre enviar PageView via CAPI também (dual tracking para garantir rastreamento)
      // Isso garante que mesmo se o pixel for bloqueado, o evento será rastreado
      // CAPI usa configurações globais do app, não do reel específico
      const utmParams = getUTM();
      sendCapiEvent('PageView', {
        ipAddress: undefined, // Será preenchido pelo backend
        userAgent: navigator.userAgent,
      }, undefined).catch((error) => {
        // Silenciosamente falhar se CAPI não estiver configurado (normal em páginas públicas)
        // O pixel do reel ainda funcionará se não estiver bloqueado
        if (import.meta.env.DEV) {
          console.debug('[PublicQuiz] CAPI não disponível ou não configurado (normal em páginas públicas)');
        }
      });

      // Detectar se o pixel foi bloqueado após alguns segundos
      // Verificar se window.fbq foi carregado corretamente
      const checkPixelBlocked = () => {
        const fbq = (window as any).fbq;
        if (!fbq || typeof fbq !== 'function') {
          // Pixel foi bloqueado
          if (!pixelBlockedRef.current) {
            pixelBlockedRef.current = true;
            
            if (import.meta.env.DEV) {
              console.log('[PublicQuiz] Meta Pixel bloqueado detectado - eventos serão enviados apenas via CAPI');
            }
          }
        } else {
          pixelBlockedRef.current = false;
          if (import.meta.env.DEV) {
            console.log('[PublicQuiz] Meta Pixel carregado com sucesso');
          }
        }
      };

      // Verificar após alguns segundos se o pixel carregou
      const checkPixelBlockedTimeout = setTimeout(() => {
        checkPixelBlocked();
      }, 5000); // Aguardar 5 segundos para verificar se o pixel carregou

      return () => {
        clearTimeout(checkPixelBlockedTimeout);
        // Cleanup: remover script e noscript
        const scriptElement = document.getElementById(`meta-pixel-script-${reel.id}`);
        if (scriptElement) {
          scriptElement.remove();
        }
        const noscriptElement = document.getElementById(noscriptId);
        if (noscriptElement) {
          noscriptElement.remove();
        }
      };
    }
  }, [reel?.pixelsConfig?.metaPixel, sendCapiEvent]);

  // Injetar Scripts Personalizados
  useEffect(() => {
    if (reel?.pixelsConfig?.customScripts) {
      const { head, body, footer } = reel.pixelsConfig.customScripts;
      const scriptIds: string[] = [];

      // Scripts personalizados serão injetados abaixo

      // Helper para criar e injetar script
      const injectScript = (content: string | undefined, parent: HTMLElement, idPrefix: string) => {
        if (!content || !content.trim()) return;

        const baseScriptId = `${idPrefix}-${reel.id}`;

        // Remover scripts existentes com o mesmo prefixo
        const existingScripts = document.querySelectorAll(`[id^="${baseScriptId}"]`);
        existingScripts.forEach((script) => script.remove());

        // Extrair conteúdo JavaScript (pode vir com ou sem tags <script>)
        let scriptContent = content.trim();
        
        // Remover comentários HTML (<!-- ... -->) mas manter o conteúdo
        scriptContent = scriptContent.replace(/<!--[\s\S]*?-->/g, '');
        
        // Se o conteúdo contém tags <script>, extrair apenas o conteúdo interno
        // Mas manter múltiplos scripts se houver (como Meta Pixel que pode ter vários)
        const scriptTagMatches = scriptContent.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        const matchesArray = Array.from(scriptTagMatches);
        
        if (matchesArray.length > 0) {
          // Se há tags <script>, injetar cada uma separadamente
          matchesArray.forEach((match, index) => {
            const extractedContent = match[1].trim();
            if (!extractedContent) return;

            const uniqueScriptId = `${baseScriptId}-${index}`;
            scriptIds.push(uniqueScriptId);

            // Criar script element
            const script = document.createElement('script');
            script.id = uniqueScriptId;
            // Para scripts que carregam recursos externos (como Meta Pixel), usar async
            // Para scripts inline que precisam executar imediatamente, não usar async
            const needsAsync = extractedContent.includes('src=') || extractedContent.includes('createElement');
            script.async = needsAsync;
            script.textContent = extractedContent;
            parent.appendChild(script);
          });
        } else {
          // Se não há tags <script>, tratar como código JavaScript puro
          // Criar script element
          const script = document.createElement('script');
          script.id = baseScriptId;
          // Para scripts que carregam recursos externos, usar async
          // Para scripts inline que precisam executar imediatamente, não usar async
          const needsAsync = scriptContent.includes('src=') || scriptContent.includes('createElement');
          script.async = needsAsync;
          script.textContent = scriptContent;
          parent.appendChild(script);
          scriptIds.push(baseScriptId);
        }
      };

      // Injetar scripts no head
      if (head) {
        injectScript(head, document.head, 'custom-head-script');
      }

      // Injetar scripts no body (início)
      if (body) {
        injectScript(body, document.body, 'custom-body-script');
      }

      // Injetar scripts no footer (final do body)
      if (footer) {
        injectScript(footer, document.body, 'custom-footer-script');
      }

      return () => {
        // Cleanup: remover todos os scripts injetados
        scriptIds.forEach((scriptId) => {
          const scriptElement = document.getElementById(scriptId);
          if (scriptElement) {
            scriptElement.remove();
          }
        });
      };
    }
  }, [reel?.pixelsConfig?.customScripts, reel?.id]);

  // Detectar quando há vídeo ou áudio tocando para manter tela acesa
  useEffect(() => {
    const checkMediaPlaying = () => {
      // Buscar todos os elementos de vídeo e áudio na página
      const videos = document.querySelectorAll('video');
      const audios = document.querySelectorAll('audio');
      
      // Verificar se algum vídeo ou áudio está tocando
      let hasPlayingMedia = false;
      
      videos.forEach((video) => {
        if (!video.paused && !video.ended && video.readyState >= 2) {
          hasPlayingMedia = true;
        }
      });
      
      audios.forEach((audio) => {
        if (!audio.paused && !audio.ended && audio.readyState >= 2) {
          hasPlayingMedia = true;
        }
      });
      
      setIsMediaPlaying(hasPlayingMedia);
    };

    // Verificar imediatamente
    checkMediaPlaying();

    // Adicionar listeners para eventos de play/pause em todos os vídeos e áudios
    const handleMediaPlay = () => {
      checkMediaPlaying();
    };

    const handleMediaPause = () => {
      checkMediaPlaying();
    };

    const handleMediaEnded = () => {
      checkMediaPlaying();
    };

    // Adicionar listeners a todos os elementos de mídia existentes
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');
    
    videos.forEach((video) => {
      video.addEventListener('play', handleMediaPlay);
      video.addEventListener('pause', handleMediaPause);
      video.addEventListener('ended', handleMediaEnded);
      video.addEventListener('loadeddata', checkMediaPlaying);
    });
    
    audios.forEach((audio) => {
      audio.addEventListener('play', handleMediaPlay);
      audio.addEventListener('pause', handleMediaPause);
      audio.addEventListener('ended', handleMediaEnded);
      audio.addEventListener('loadeddata', checkMediaPlaying);
    });

    // Usar MutationObserver para detectar quando novos elementos de mídia são adicionados
    const observer = new MutationObserver(() => {
      checkMediaPlaying();
      
      // Adicionar listeners aos novos elementos
      const newVideos = document.querySelectorAll('video');
      const newAudios = document.querySelectorAll('audio');
      
      newVideos.forEach((video) => {
        if (!video.hasAttribute('data-wakelock-listener')) {
          video.setAttribute('data-wakelock-listener', 'true');
          video.addEventListener('play', handleMediaPlay);
          video.addEventListener('pause', handleMediaPause);
          video.addEventListener('ended', handleMediaEnded);
          video.addEventListener('loadeddata', checkMediaPlaying);
        }
      });
      
      newAudios.forEach((audio) => {
        if (!audio.hasAttribute('data-wakelock-listener')) {
          audio.setAttribute('data-wakelock-listener', 'true');
          audio.addEventListener('play', handleMediaPlay);
          audio.addEventListener('pause', handleMediaPause);
          audio.addEventListener('ended', handleMediaEnded);
          audio.addEventListener('loadeddata', checkMediaPlaying);
        }
      });
    });

    // Observar mudanças no DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Verificar periodicamente (fallback caso eventos não sejam disparados)
    const intervalId = setInterval(checkMediaPlaying, 1000);

    return () => {
      // Remover listeners
      videos.forEach((video) => {
        video.removeEventListener('play', handleMediaPlay);
        video.removeEventListener('pause', handleMediaPause);
        video.removeEventListener('ended', handleMediaEnded);
        video.removeEventListener('loadeddata', checkMediaPlaying);
      });
      
      audios.forEach((audio) => {
        audio.removeEventListener('play', handleMediaPlay);
        audio.removeEventListener('pause', handleMediaPause);
        audio.removeEventListener('ended', handleMediaEnded);
        audio.removeEventListener('loadeddata', checkMediaPlaying);
      });
      
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, [reel]); // Re-executar quando reel mudar

  // Atualizar visita quando sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (visitIdRef.current && reel) {
        const completed = currentSlide === (reel.slides?.length || 0) - 1;
        // Usar sendBeacon para garantir que a requisição seja enviada
        const data = JSON.stringify({ completed });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/analytics/visit/${visitIdRef.current}/end`,
          blob
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Também tentar atualizar ao desmontar o componente
      if (visitIdRef.current && reel) {
        const completed = currentSlide === (reel.slides?.length || 0) - 1;
        api.publicPost(`/analytics/visit/${visitIdRef.current}/end`, { completed }).catch(() => {
          // Silently fail
        });
      }
    };
  }, [reel, currentSlide]);

  // Função helper para verificar se um elemento está visível (considerando delay)
  const isElementVisible = useCallback((element: any, slideIndex: number): boolean => {
    // Se não é o slide atual, não está visível
    if (slideIndex !== currentSlide) {
      return false;
    }
    
    const config = getNormalizedUiConfig(element.uiConfig);
    const delay = config.delay || 0;
    
    // Se não tem delay, está visível imediatamente
    if (delay === 0) {
      return true;
    }
    
    // Verificar se já passou o tempo desde que o slide foi exibido
    const slideStartTime = slideStartTimeRef.current[slideIndex];
    if (!slideStartTime) {
      return false;
    }
    
    const elapsed = Date.now() - slideStartTime;
    return elapsed >= delay;
  }, [currentSlide]);

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
        dispatchSlide({ type: 'SET_CURRENT_SLIDE', payload: slideIndex });
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
        // isTransitioning já foi resetado no requestAnimationFrame acima para pulos diretos
        // Apenas garantir reset se não foi resetado ainda (para scrolls suaves)
        if (!isJump) {
          setIsTransitioning(false);
        }
      }, timeoutDuration);
    }
  }, [reel, currentSlide, checkIfSlideIsLocked, dispatchSlide]);


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
          dispatchSlide({ type: 'SET_CURRENT_SLIDE', payload: newSlide });
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

  // Registrar eventos quando mudar de slide
  useEffect(() => {
    if (!reel || !visitIdRef.current || prevSlideRef.current === null) {
      prevSlideRef.current = currentSlide;
      return;
    }

    const registerSlideChange = () => {
      if (!visitIdRef.current) return;

      const prevSlide = prevSlideRef.current;
      const currentSlideData = reel.slides?.[currentSlide];
      const prevSlideData = reel.slides?.[prevSlide];

      // Registrar tempo gasto no slide anterior
      if (prevSlideData && slideStartTimeRef.current[prevSlide] !== undefined) {
        const timeSpent = Math.floor((Date.now() - slideStartTimeRef.current[prevSlide]) / 1000);
        if (timeSpent > 0) {
          queueEvent({
            visitId: visitIdRef.current,
            eventType: 'time_spent',
            slideId: prevSlideData.id,
            duration: timeSpent,
          });
        }
      }

      // Registrar view do novo slide
      if (currentSlideData) {
        slideStartTimeRef.current[currentSlide] = Date.now();
        queueEvent({
          visitId: visitIdRef.current,
          eventType: 'view',
          slideId: currentSlideData.id,
        });

        // Verificar se gamificação está habilitada e se algum elemento do slide tem gamificação habilitada
        // onSlideChange não deve disparar gamificação automaticamente
        // Apenas elementos específicos (botões, questions, etc.) devem disparar
        // Removido trigger onSlideChange automático
      }
    };

    if (prevSlideRef.current !== currentSlide) {
      registerSlideChange();
      prevSlideRef.current = currentSlide;
    }
  }, [currentSlide, reel]);

  // Verificar se o slide atual está travado por algum botão ou background
  useEffect(() => {
    if (!reel?.slides || currentSlide >= reel.slides.length) {
      const newIsLocked = false;
      prevIsSlideLockedRef.current = newIsLocked;
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: newIsLocked });
      return;
    }

    const currentSlideData = reel.slides[currentSlide];
    
    // Verificar primeiro se está travado pelo background
    const backgroundConfig = currentSlideData?.backgroundConfig || currentSlideData?.uiConfig?.backgroundConfig;
    if (backgroundConfig?.lockSlide === true) {
      const newIsLocked = true;
      prevIsSlideLockedRef.current = newIsLocked;
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: newIsLocked });
      return;
    }
    
    if (!currentSlideData?.elements) {
      const newIsLocked = false;
      prevIsSlideLockedRef.current = newIsLocked;
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: newIsLocked });
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
      dispatchSlide({ type: 'SET_SHOW_SWIPE_HINT_UNLOCK', payload: true });
      // Auto esconder após 3 segundos
      setTimeout(() => {
        dispatchSlide({ type: 'SET_SHOW_SWIPE_HINT_UNLOCK', payload: false });
      }, 3000);
    }
    
    prevIsSlideLockedRef.current = newIsLocked;
    dispatchSlide({ type: 'SET_IS_LOCKED', payload: newIsLocked });
  }, [currentSlide, reel?.slides, questionnaireResponses, progressStates, formValidStates]);

  // Resetar showSwipeHintOnUnlock quando mudar de slide
  useEffect(() => {
    dispatchSlide({ type: 'SET_SHOW_SWIPE_HINT_UNLOCK', payload: false });
    // Não resetar prevIsSlideLockedRef aqui, deixar que o useEffect acima faça isso
  }, [currentSlide]);

  // Bloquear scroll quando slide está travado (apenas para frente)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Guardar scrollTop exato quando slide fica travado
    let lockedScrollTop = container.scrollTop;
    const slideHeight = container.clientHeight;
    
    // Atualizar valores quando o slide travar
    if (isSlideLocked) {
      lockedScrollTop = container.scrollTop;
    }

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
      // IMPORTANTE: Se está em scroll programático, PARAR o monitor imediatamente
      // Não continuar monitorando se o scroll é programático
      if (isProgrammaticScrollRef.current) {
        return; // Parar monitoramento
      }
      
      // Só monitorar se realmente estiver no slide travado (usar currentSlide do estado)
      if (isSlideLocked && reel?.slides) {
        const currentScrollTop = container.scrollTop;
        const expectedScrollTop = currentSlide * slideHeight;
        
        // Usar pequena tolerância para evitar conflitos com scroll programático
        // e permitir que scroll programático complete antes de forçar
        const tolerance = 5; // Aumentar para 5px de tolerância
        
        // Bloquear qualquer movimento além da posição esperada (com tolerância)
        if (Math.abs(currentScrollTop - expectedScrollTop) > tolerance) {
          // Forçar diretamente sem animação para precisão máxima
          container.scrollTop = expectedScrollTop;
        }
        
        // Continuar monitorando apenas se ainda estiver travado e não programático
        if (isSlideLocked && !isProgrammaticScrollRef.current) {
          lockMonitor = requestAnimationFrame(monitorLock);
        }
      }
    };
    
    // Monitor adicional com setInterval para ser ainda mais agressivo
    const monitorLockInterval = () => {
      // IMPORTANTE: Se está em scroll programático, não fazer nada
      if (isProgrammaticScrollRef.current) {
        return; // Parar monitoramento
      }
      
      // Verificar se não está em scroll programático antes de forçar
      if (isSlideLocked && reel?.slides) {
        const currentScrollTop = container.scrollTop;
        const expectedScrollTop = currentSlide * slideHeight;
        
        // Usar pequena tolerância para evitar conflitos
        const tolerance = 5; // Aumentar para 5px de tolerância
        
        // Bloquear qualquer movimento além da posição esperada (com tolerância)
        if (Math.abs(currentScrollTop - expectedScrollTop) > tolerance) {
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
            e.stopPropagation();
            // Forçar scrollTop de volta imediatamente
            container.scrollTop = expectedScrollTop;
            
            // Ativar animação visual por 500ms
            setBlockedScrollAttempt(true);
            setTimeout(() => {
              setBlockedScrollAttempt(false);
            }, 500);
            
            return false;
          }
        } else {
          // Se travado por elementos, bloquear apenas para baixo (avançar)
          if (e.deltaY > 0) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            // Forçar scrollTop de volta imediatamente
            container.scrollTop = expectedScrollTop;
            
            // Ativar animação visual por 500ms
            setBlockedScrollAttempt(true);
            setTimeout(() => {
              setBlockedScrollAttempt(false);
            }, 500);
            
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

    // Para touch, precisamos verificar a direção do swipe e distinguir de tap
    let touchStartY = 0;
    let touchStartScrollTop = 0;
    let touchStartTime = 0;
    let touchStartX = 0;
    let isScrollingForward = false;
    let isTouchOnInteractiveElement = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Verificar se o toque está em um elemento interativo (botão, link, question item, etc)
      const target = e.target as HTMLElement;
      // Incluir elementos de question/questionnaire/grid que são clicáveis
      const isInteractive = target.closest('button, a, [role="button"], input, select, textarea, [onclick], [data-question-item], [data-question-grid-item], [data-interactive]');
      isTouchOnInteractiveElement = !!isInteractive;
      
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
        touchStartScrollTop = currentSlide * slideHeight;
        isScrollingForward = false;
      }
    };

    const preventTouch = (e: TouchEvent) => {
      // Verificar novamente se o toque está em um elemento interativo (pode ter mudado)
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, [role="button"], input, select, textarea, [onclick], [data-question-item], [data-question-grid-item], [data-interactive]');
      
      // Se o toque está em um elemento interativo, não bloquear (permitir clique)
      if (isTouchOnInteractiveElement || isInteractive) {
        return;
      }
      
      // Só bloquear se realmente estiver no slide travado (usar currentSlide do estado)
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        const expectedScrollTop = currentSlide * slideHeight;
        const lockedByBackground = isLockedByBackground(currentSlide);
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        const deltaY = touchY - touchStartY;
        const deltaX = touchX - touchStartX;
        const deltaTime = Date.now() - touchStartTime;
        
        // Se o movimento é principalmente horizontal ou muito rápido (tap), não bloquear
        // Permitir taps e movimentos horizontais
        // Aumentar tolerância de tempo para taps (150ms) e movimento horizontal
        if (Math.abs(deltaX) > Math.abs(deltaY) || deltaTime < 150 || Math.abs(deltaY) < 5) {
          return;
        }
        
        // Se travado pelo background, bloquear ambos os lados (cima e baixo)
        if (lockedByBackground) {
          // Bloquear qualquer movimento vertical significativo
          if (Math.abs(deltaY) > 10) {
            isScrollingForward = deltaY > 0;
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            // Forçar scrollTop de volta imediatamente
            container.scrollTop = expectedScrollTop;
            
            // Ativar animação visual por 500ms
            setBlockedScrollAttempt(true);
            setTimeout(() => {
              setBlockedScrollAttempt(false);
            }, 500);
            
            return false;
          }
        } else {
          // Se travado por elementos, bloquear apenas para baixo (swipe down = avançar)
          if (deltaY > 10) {
            isScrollingForward = true;
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            // Forçar scrollTop de volta imediatamente
            container.scrollTop = expectedScrollTop;
            
            // Ativar animação visual por 500ms
            setBlockedScrollAttempt(true);
            setTimeout(() => {
              setBlockedScrollAttempt(false);
            }, 500);
            
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
      // Resetar flag de elemento interativo
      isTouchOnInteractiveElement = false;
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
    container.addEventListener('wheel', handleWheel, { passive: true, capture: true });
    
    if (isSlideLocked) {
      // Iniciar monitor contínuo (requestAnimationFrame - ~60fps)
      lockMonitor = requestAnimationFrame(monitorLock);
      
      // Monitor adicional com setInterval (mais rápido - ~120fps)
      lockInterval = setInterval(monitorLockInterval, 8); // ~120fps
      
      container.addEventListener('wheel', preventWheel, { passive: false, capture: true });
      // Usar capture: false para touch events para não interferir com cliques em botões
      container.addEventListener('touchstart', handleTouchStart, { passive: true, capture: false });
      container.addEventListener('touchmove', preventTouch, { passive: false, capture: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false, capture: false });
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
      container.removeEventListener('touchstart', handleTouchStart, { capture: false } as EventListenerOptions);
      container.removeEventListener('touchmove', preventTouch, { capture: false } as EventListenerOptions);
      container.removeEventListener('touchend', handleTouchEnd, { capture: false } as EventListenerOptions);
      container.removeEventListener('scroll', preventScroll, { capture: true } as EventListenerOptions);
      document.removeEventListener('keydown', preventKeys, { capture: true } as EventListenerOptions);
    };
  }, [isSlideLocked, currentSlide, reel?.slides, isLockedByBackground]);

  // Handler para mudança de validação do formulário
  const handleFormValidationChange = useCallback((elementId: string, isValid: boolean) => {
    setFormValidStates((prev) => ({ ...prev, [elementId]: isValid }));
  }, []);

  // Handler para submit do formulário
  const handleFormSubmit = useCallback((elementId: string, data: Record<string, any>) => {
    // Registrar interação de formulário
    if (visitIdRef.current && reel && reel.slides?.[currentSlide]) {
      queueEvent({
        visitId: visitIdRef.current,
        eventType: 'interaction',
        slideId: reel.slides[currentSlide].id,
        metadata: { type: 'form_submit', elementId },
      });
    }

    // Verificar se o elemento tem gamificação habilitada antes de adicionar pontos e disparar trigger
    if (elementId && reel?.slides?.[currentSlide]) {
      const element = reel.slides[currentSlide].elements?.find((el: any) => el.id === elementId);
      const elementGamificationConfig = element?.gamificationConfig || element?.uiConfig?.gamificationConfig;
      
      // Só disparar trigger se o elemento tiver gamificação habilitada OU se gamificação global estiver habilitada
      if (elementGamificationConfig?.enabled === true || (reel?.gamificationConfig?.enabled === true && !elementGamificationConfig)) {
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
  }, [reel, currentSlide, queueEvent, pointsConfig, addPoints]);

  // Função para enviar formulários completos quando slide avançar
  const submitCompleteForms = useCallback(async () => {
    if (!reel?.slides || currentSlide >= reel.slides.length) return;

    const currentSlideData = reel.slides[currentSlide];
    if (!currentSlideData?.elements) return;

    // Enviar formulários válidos automaticamente ao avançar slide
    for (const element of currentSlideData.elements) {
      if (element.elementType === 'FORM') {
        const formRef = formRefs.current[element.id];
        
        if (formRef && formRef.isFormValid()) {
          // Sempre enviar formulários válidos automaticamente
          await formRef.submitForm();
        }
      }
    }
  }, [reel, currentSlide]);

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

  // Callback para elementos notificarem quando ficam visíveis e devem ocultar elementos sociais
  const handleElementVisibilityChange = useCallback((elementId: string, isVisible: boolean, shouldHideSocial: boolean) => {
    setElementsHidingSocial((prev) => {
      const next = new Set(prev);
      if (isVisible && shouldHideSocial) {
        next.add(elementId);
      } else {
        next.delete(elementId);
      }
      return next;
    });
  }, []);

  // Limpar elementos ocultando sociais quando mudar de slide
  useEffect(() => {
    setElementsHidingSocial(new Set());
  }, [currentSlide]);

  const handleButtonClick = useCallback((destination: 'next-slide' | 'url', url?: string, openInNewTab?: boolean, elementId?: string) => {
    // Verificar se o elemento tem gamificação habilitada antes de disparar
    if (elementId && reel?.slides?.[currentSlide]) {
      const element = reel.slides[currentSlide].elements?.find((el: any) => el.id === elementId);
      const elementGamificationConfig = element?.gamificationConfig || element?.uiConfig?.gamificationConfig;
      
      // Debug em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('[PublicQuiz] handleButtonClick:', {
          elementId,
          hasElement: !!element,
          elementGamificationConfig,
          reelGamificationEnabled: reel?.gamificationConfig?.enabled,
        });
      }
      
      // Só disparar trigger se o elemento tiver gamificação habilitada
      // Verificar se há um campo 'enabled' que habilita tudo, ou se pelo menos um elemento está habilitado
      const hasGamification = elementGamificationConfig?.enabled === true ||
        elementGamificationConfig?.enablePointsBadge === true ||
        elementGamificationConfig?.enableSuccessSound === true ||
        elementGamificationConfig?.enableConfetti === true ||
        elementGamificationConfig?.enableParticles === true ||
        elementGamificationConfig?.enablePointsProgress === true ||
        elementGamificationConfig?.enableAchievement === true;
      
      if (import.meta.env.DEV) {
        console.log('[PublicQuiz] hasGamification:', hasGamification);
      }
      
      if (hasGamification) {
        if (import.meta.env.DEV) {
          console.log('[PublicQuiz] Disparando trigger onButtonClick com elementId:', elementId);
        }
        triggerGamification('onButtonClick', { reason: 'Botão clicado', elementId });
      }
    }
    // Registrar interação
    if (visitIdRef.current && reel && reel.slides?.[currentSlide]) {
      queueEvent({
        visitId: visitIdRef.current,
        eventType: 'interaction',
        slideId: reel.slides[currentSlide].id,
        metadata: { type: 'button_click', elementId, destination },
      });
    }

    // Enviar formulários completos antes de avançar
    submitCompleteForms();

    // IMPORTANTE: Marcar scroll como programático ANTES de desbloquear e scrollar
    // Isso previne que o monitor de lock interfira
    isProgrammaticScrollRef.current = true;

    // Desbloquear slide ao clicar no botão
    dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });

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
  }, [submitCompleteForms, reel, currentSlide, getNextSlideIndex, scrollToSlide, queueEvent]);

  // Handler para ações de item (slide ou URL)
  const handleItemAction = useCallback((itemId: string, actionType: 'none' | 'slide' | 'url', slideId?: string, url?: string, openInNewTab?: boolean) => {
    if (!reel?.slides || currentSlide >= reel.slides.length) return;
    
    // Debug
    if (import.meta.env.DEV) {
      console.log('handleItemAction chamado:', { itemId, actionType, slideId, url, openInNewTab });
    }
    
    const currentSlideData = reel.slides[currentSlide];
    
    // Encontrar o elemento do questionário/question grid atual
    const questionnaireElement = currentSlideData.elements?.find((el: any) => {
      const config = normalizeUiConfig(el.uiConfig);
      const items = config.items || [];
      return items.some((item: any) => item.id === itemId);
    });
    
    if (!questionnaireElement) {
      if (import.meta.env.DEV) {
        console.error('Elemento não encontrado para itemId:', itemId);
      }
      return;
    }
    
    const elementId = questionnaireElement.id;
    
    // PRIORIDADE 1: Verificar conexão no fluxo primeiro (sem fallback)
    const nextIndex = hasFlowConnection(currentSlideData.id, elementId, itemId);
    
    if (nextIndex !== null) {
      // Há conexão no fluxo - usar ela (ignorar ação do item)
      if (import.meta.env.DEV) {
        console.log('Fluxo encontrado, usando conexão do fluxo:', nextIndex);
      }
      // IMPORTANTE: Marcar scroll como programático ANTES de desbloquear e scrollar
      isProgrammaticScrollRef.current = true;
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
      const isDirectJump = Math.abs(nextIndex - currentSlide) > 1;
      scrollToSlide(nextIndex, isDirectJump);
      return;
    }
    
    // PRIORIDADE 2: Usar ação configurada do item (se não houver conexão no fluxo)
    // IMPORTANTE: Marcar scroll como programático ANTES de desbloquear e scrollar
    isProgrammaticScrollRef.current = true;
    dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
    
    if (actionType === 'slide' && slideId) {
      // Navegar para slide específico configurado no item
      if (import.meta.env.DEV) {
        console.log('Navegando para slide configurado no item:', slideId);
      }
      const targetSlideIndex = reel.slides.findIndex((s: any) => s.id === slideId);
      if (targetSlideIndex !== -1) {
        const isDirectJump = Math.abs(targetSlideIndex - currentSlide) > 1;
        scrollToSlide(targetSlideIndex, isDirectJump);
      } else {
        console.error('Slide não encontrado:', slideId);
      }
    } else if (actionType === 'url' && url) {
      // Abrir URL
      if (import.meta.env.DEV) {
        console.log('Abrindo URL:', url);
      }
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
    } else {
      if (import.meta.env.DEV) {
        console.log('Ação não reconhecida ou parâmetros faltando:', { actionType, slideId, url });
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
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
      scrollToSlide(nextSlide.index, nextSlide.isDirectJump);
    } else {
      // Não há conexão - usar comportamento padrão (próximo slide)
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
      if (currentSlide < reel.slides.length - 1) {
        scrollToSlide(currentSlide + 1, false);
      }
    }
  }, [reel, currentSlide, getNextSlideIndex, scrollToSlide]);

  const handleOptionSelect = async (slideId: string, optionId: string) => {
    // Registrar interação
    if (visitIdRef.current) {
      queueEvent({
        visitId: visitIdRef.current,
        eventType: 'interaction',
        slideId,
        metadata: { type: 'option_select', optionId },
      });
    }

    // Adicionar pontos por resposta - verificar se há pontos específicos configurados
    const currentSlide = reel?.slides?.find((s) => s.id === slideId);
    const option = currentSlide?.options?.find((opt: any) => opt.id === optionId);
    const pointsToAdd = option?.points || reel?.gamificationConfig?.pointsConfig?.pointsPerAnswer || pointsConfig.pointsPerAnswer || 10;
    
    setSelectedAnswers((prev) => ({ ...prev, [slideId]: optionId }));
    
    // Questões de slide (não elementos) não têm gamificationConfig individual
    // Não devem disparar gamificação - apenas elementos específicos (QUESTIONNAIRE, QUESTION_GRID) devem disparar
    // Removido trigger onQuestionAnswer para questões de slide

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

  const handleProgressComplete = useCallback((destination: 'next-slide' | 'url', url?: string, openInNewTab?: boolean, elementId?: string) => {
    // Marcar elemento como completado para evitar reiniciar ao voltar
    if (elementId) {
      setCompletedProgressElements((prev) => new Set(prev).add(elementId));
    }

    // Registrar interação de progresso completo
    if (visitIdRef.current && reel && reel.slides?.[currentSlide]) {
      queueEvent({
        visitId: visitIdRef.current,
        eventType: 'interaction',
        slideId: reel.slides[currentSlide].id,
        metadata: { type: 'progress_complete', destination },
      });
    }

    // Desbloquear slide ao completar progresso
    dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });

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
  }, [reel, currentSlide, queueEvent, dispatchSlide, scrollToSlide]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error || !reel) {
    // Log para debug
    if (import.meta.env.DEV) {
      console.error('PublicQuiz error:', {
        error,
        slug,
        customDomain,
        errorMessage: error?.message,
        errorStatusCode: (error as any)?.statusCode,
        isLoading,
      });
    }
    
    // Mensagem de erro mais específica para domínios personalizados
    const isDomainError = customDomain && error;
    const errorMessage = isDomainError 
      ? 'O domínio personalizado não foi encontrado ou não está verificado. Verifique se o domínio está configurado corretamente no painel.'
      : 'O quiz que você está procurando não existe ou não está disponível.';
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Quiz não encontrado</h1>
          <p className="text-white/60 mb-6">
            {errorMessage}
            {import.meta.env.DEV && error && (
              <span className="block mt-2 text-xs">
                Erro: {(error as any)?.message || 'Erro desconhecido'}
                {customDomain && (
                  <span className="block mt-1">
                    Domínio: {customDomain}
                  </span>
                )}
              </span>
            )}
          </p>
          <button
            onClick={() => {
              // Se for domínio personalizado, não fazer nada (não tem para onde navegar)
              // Se não for, navegar para a página inicial
              if (!customDomain) {
                navigate('/');
              }
            }}
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            {customDomain ? 'Recarregar página' : 'Voltar ao início'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReelSoundProvider>
      <div className="fixed inset-0 bg-transparent reel-quiz-fullscreen">
        {/* Container centralizador para conteúdo */}
        <div className="flex items-center justify-center w-full h-full reel-quiz-wrapper">
        {/* Card do quiz - proporção 9:15.35 (vertical mobile) - apenas conteúdo */}
        <div 
          className="relative overflow-hidden reel-quiz-container"
          style={{ 
            width: '100%', 
            height: '100%',
            aspectRatio: '9/15.35'
          }}
        >
          {/* Progress Bar - apenas se habilitada */}
          {reel?.showProgressBar && slides.length > 1 && (
            <ReelProgressBar currentSlide={currentSlide} totalSlides={slides.length} />
          )}

          {/* Swipe Hint - Only on first slide */}
          {showSwipeHint && currentSlide === 0 && (
            <SwipeHint onDismiss={() => dispatchSlide({ type: 'SET_SHOW_SWIPE_HINT', payload: false })} autoHideAfter={3000} />
          )}
          
          {/* Swipe Hint Subtle - When slide unlocks */}
          {showSwipeHintOnUnlock && (
            <SwipeHintSubtle 
              onDismiss={() => dispatchSlide({ type: 'SET_SHOW_SWIPE_HINT_UNLOCK', payload: false })} 
              autoHideAfter={3000} 
            />
          )}

          {/* Elementos Sociais - renderizados uma vez para manter estado entre slides */}
          {reel?.socialConfig?.enabled && (
            <div style={{ visibility: (slides[currentSlide]?.hideSocialElements || elementsHidingSocial.size > 0) ? 'hidden' : 'visible' }}>
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
                scrollToSlide(currentSlide - 1, false);
              }
            }}
            onNavigateDown={() => {
              if (currentSlide < slides.length - 1 && !checkIfSlideIsLocked(currentSlide)) {
                scrollToSlide(currentSlide + 1, false);
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
          // Usar slideConfig memoizado
          const slideConfigData = slideConfigs[index];
          const slideConfig = slideConfigData?.config;

          return (
            <ReelSlide 
              key={slide.id} 
              ref={(el) => {
                if (el) {
                  const slideElement = el as unknown as HTMLDivElement;
                  slideRefs.current.set(slide.id, slideElement);
                } else {
                  slideRefs.current.delete(slide.id);
                }
              }}
              config={slideConfig} 
              isActive={index === currentSlide}
              data-slide-index={index}
            >
              {/* Content Area */}
              <ReelContent>
                <div
                  ref={(el) => {
                    if (el) slideContentRefs.current.set(slide.id, el);
                    else slideContentRefs.current.delete(slide.id);
                  }}
                  className="w-full h-full p-4"
                  style={{
                    overflow: 'hidden',
                    // Garantir que o último elemento não fique colado no home indicator (iOS)
                    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                  }}
                >
                  <div
                    ref={(el) => {
                      if (el) slideContentInnerRefs.current.set(slide.id, el);
                      else slideContentInnerRefs.current.delete(slide.id);
                    }}
                    style={{
                      transform: `scale(${contentScaleBySlideId[slide.id] ?? 1})`,
                      transformOrigin: 'top center',
                      willChange: 'transform',
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
                    // Renderizar todos os elementos sempre, mas controlar visibilidade via CSS
                    // Usar elementos agrupados memoizados
                    const grouped = groupedElementsBySlide[slide.id] || [];
                    const isActive = index === currentSlide;
                    
                    // Verificar se há background configurado (vídeo ou imagem)
                    const hasBackground = slide.backgroundConfig?.type === 'video' || 
                                          slide.backgroundConfig?.type === 'image' ||
                                          slide.uiConfig?.backgroundConfig?.type === 'video' ||
                                          slide.uiConfig?.backgroundConfig?.type === 'image';
                    
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
                                uiConfig: getNormalizedUiConfig(element.uiConfig),
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
                          if (import.meta.env.DEV) {
                            console.warn('Element without elementType:', element);
                          }
                          return null;
                        }
                        
                        // Garantir que uiConfig existe
                        const elementWithConfig = {
                          ...element,
                          uiConfig: getNormalizedUiConfig(element.uiConfig),
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
                              const buttonConfig = getNormalizedUiConfig(elementWithConfig.uiConfig);
                              const showButtonAnimation = blockedScrollAttempt && 
                                                          buttonConfig.lockSlide === true && 
                                                          isElementVisible(element, index);
                              return (
                                <ButtonElement
                                  key={element.id}
                                  element={elementWithConfig}
                                  onButtonClick={(dest, url, openInNewTab) => handleButtonClick(dest, url, openInNewTab, element.id)}
                                  onVisibilityChange={handleElementVisibilityChange}
                                  isActive={index === currentSlide}
                                  showBlockedAnimation={showButtonAnimation}
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
                                    dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
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
                                    dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
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
                              const questionnaireConfig = getNormalizedUiConfig(elementWithConfig.uiConfig);
                              const showQuestionnaireAnimation = blockedScrollAttempt && 
                                                                 questionnaireConfig.lockSlide === true && 
                                                                 isElementVisible(element, index);
                              // Extrair gamificationConfig do uiConfig se existir
                              const questionnaireElementWithGamification = {
                                ...elementWithConfig,
                                gamificationConfig: elementWithConfig.gamificationConfig || elementWithConfig.uiConfig?.gamificationConfig,
                              };
                              return (
                                <ReelQuestionnaire
                                  key={element.id}
                                  element={questionnaireElementWithGamification}
                                  isActive={index === currentSlide}
                                  onNextSlide={handleQuestionnaireNext}
                                  onItemAction={handleItemAction}
                                  onVisibilityChange={handleElementVisibilityChange}
                                  showBlockedAnimation={showQuestionnaireAnimation}
                                  onSelectionChange={(selectedIds) => {
                                    // Registrar interação de questionário
                                    if (visitIdRef.current && reel && reel.slides?.[currentSlide]) {
                                      queueEvent({
                                        visitId: visitIdRef.current,
                                        eventType: 'interaction',
                                        slideId: reel.slides[currentSlide].id,
                                        metadata: { type: 'questionnaire_selection', elementId: element.id, selectedIds },
                                      });
                                    }

                                    // Atualizar estado de respostas do questionário
                                    // O useEffect que verifica lockSlide será acionado automaticamente
                                    setQuestionnaireResponses((prev) => {
                                      const prevResponses = prev[element.id] || [];
                                      const isNewResponse = selectedIds.length > prevResponses.length;
                                      
                                      if (isNewResponse) {
                                        // Verificar se o elemento tem gamificação habilitada
                                        // Extrair gamificationConfig do elemento (pode estar em uiConfig ou no nível do elemento)
                                        const elementGamificationConfig = questionnaireElementWithGamification.gamificationConfig;
                                        
                                        // Debug em desenvolvimento
                                        if (import.meta.env.DEV) {
                                          console.log('[PublicQuiz] Questionnaire onSelectionChange:', {
                                            elementId: element.id,
                                            selectedIds,
                                            prevResponses,
                                            hasGamificationConfig: !!elementGamificationConfig,
                                            elementGamificationConfig,
                                            elementFull: questionnaireElementWithGamification,
                                          });
                                        }
                                        
                                        // Só disparar se o elemento tiver gamificação habilitada
                                        // Verificar se há um campo 'enabled' que habilita tudo, ou se pelo menos um elemento está habilitado
                                        const shouldTriggerGamification = elementGamificationConfig && (
                                          elementGamificationConfig.enabled === true ||
                                          elementGamificationConfig.enablePointsBadge === true ||
                                          elementGamificationConfig.enableSuccessSound === true ||
                                          elementGamificationConfig.enableConfetti === true ||
                                          elementGamificationConfig.enableParticles === true ||
                                          elementGamificationConfig.enablePointsProgress === true ||
                                          elementGamificationConfig.enableAchievement === true
                                        );
                                        
                                        if (import.meta.env.DEV) {
                                          console.log('[PublicQuiz] Questionnaire shouldTriggerGamification:', shouldTriggerGamification);
                                        }
                                        
                                        if (shouldTriggerGamification) {
                                          // Adicionar pontos por resposta de questionário
                                          // Verificar se há pontos específicos configurados no item
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
                                          // Só adicionar pontos se houver pontos para adicionar
                                          if (totalPoints > 0) {
                                            setTimeout(() => {
                                              addPoints(totalPoints, 'Resposta de questionário');
                                              // Trigger gamification
                                              if (import.meta.env.DEV) {
                                                console.log('[PublicQuiz] Disparando trigger onQuestionAnswer para questionnaire:', {
                                                  elementId: element.id,
                                                  totalPoints,
                                                });
                                              }
                                              triggerGamification('onQuestionAnswer', { points: totalPoints, reason: 'Resposta de questionário', elementId: element.id });
                                            }, 0);
                                          } else {
                                            // Mesmo sem pontos, disparar trigger se gamificação estiver habilitada
                                            if (import.meta.env.DEV) {
                                              console.log('[PublicQuiz] Disparando trigger onQuestionAnswer sem pontos:', {
                                                elementId: element.id,
                                              });
                                            }
                                            setTimeout(() => {
                                              triggerGamification('onQuestionAnswer', { points: 0, reason: 'Resposta de questionário', elementId: element.id });
                                            }, 0);
                                          }
                                        } else {
                                          if (import.meta.env.DEV) {
                                            console.log('[PublicQuiz] Questionnaire não deve disparar gamificação:', {
                                              elementId: element.id,
                                              hasGamificationConfig: !!elementGamificationConfig,
                                            });
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
                              const questionGridConfig = getNormalizedUiConfig(elementWithConfig.uiConfig);
                              const showQuestionGridAnimation = blockedScrollAttempt && 
                                                                questionGridConfig.lockSlide === true && 
                                                                isElementVisible(element, index);
                              // Extrair gamificationConfig do uiConfig se existir
                              const questionGridElementWithGamification = {
                                ...elementWithConfig,
                                gamificationConfig: elementWithConfig.gamificationConfig || elementWithConfig.uiConfig?.gamificationConfig,
                              };
                              return (
                                <ReelQuestionGrid
                                  key={element.id}
                                  element={questionGridElementWithGamification}
                                  isActive={index === currentSlide}
                                  onNextSlide={handleQuestionnaireNext}
                                  onItemAction={handleItemAction}
                                  onVisibilityChange={handleElementVisibilityChange}
                                  showBlockedAnimation={showQuestionGridAnimation}
                                  onSelectionChange={(selectedIds) => {
                                    // Atualizar estado de respostas do question grid
                                    // O useEffect que verifica lockSlide será acionado automaticamente
                                    setQuestionnaireResponses((prev) => {
                                      const prevResponses = prev[element.id] || [];
                                      const isNewResponse = selectedIds.length > prevResponses.length;
                                      
                                      if (isNewResponse) {
                                        // Verificar se o elemento tem gamificação habilitada
                                        // Extrair gamificationConfig do elemento (pode estar em uiConfig ou no nível do elemento)
                                        const elementGamificationConfig = questionGridElementWithGamification.gamificationConfig;
                                        // Só disparar se o elemento tiver gamificação habilitada
                                        // Verificar se há um campo 'enabled' que habilita tudo, ou se pelo menos um elemento está habilitado
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
                                          // Verificar se há pontos específicos configurados no item
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
                                          // Só adicionar pontos se houver pontos para adicionar
                                          if (totalPoints > 0) {
                                            setTimeout(() => {
                                              addPoints(totalPoints, 'Resposta de question grid');
                                              // Trigger gamification
                                              if (import.meta.env.DEV) {
                                                console.log('[PublicQuiz] Disparando trigger onQuestionAnswer para question grid:', {
                                                  elementId: element.id,
                                                  totalPoints,
                                                });
                                              }
                                              triggerGamification('onQuestionAnswer', { points: totalPoints, reason: 'Resposta de question grid', elementId: element.id });
                                            }, 0);
                                          } else {
                                            // Mesmo sem pontos, disparar trigger se gamificação estiver habilitada
                                            if (import.meta.env.DEV) {
                                              console.log('[PublicQuiz] Disparando trigger onQuestionAnswer sem pontos para question grid:', {
                                                elementId: element.id,
                                              });
                                            }
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
                                    const config = getNormalizedUiConfig(elementWithConfig.uiConfig);
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
                                    dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
                                    if (currentSlide < (reel?.slides?.length || 0) - 1) {
                                      scrollToSlide(currentSlide + 1, false);
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

              {/* Question Overlay */}
              {slide.options && slide.options.length > 0 && (
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
              {reel?.socialConfig?.enabled && index === currentSlide && !slide.hideSocialElements && elementsHidingSocial.size === 0 && (
                <>
                  <ReelUsername socialConfig={reel.socialConfig} />
                  <ReelCaption slide={slide} socialConfig={reel.socialConfig} />
                  <ReelAudioTag slide={slide} />
                </>
              )}
            </ReelSlide>
          );
        })}
          </div>
          </div>
        </div>
      </div>

      {/* Gamification Elements - passar slide atual para verificar configurações */}
      {reel?.slides && reel.slides[currentSlide] && (
        <GamificationOverlay isInBuilder={false} reel={reel} selectedSlide={reel.slides[currentSlide]} currentSlide={currentSlide} />
      )}
    </ReelSoundProvider>
  );
}

