import { useState, useRef, useEffect, useCallback, useMemo, memo, useReducer } from 'react';
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
import { isCustomDomain, normalizeDomain } from '@/lib/utils';
import DOMPurify from 'dompurify';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const formRefs = useRef<Record<string, ReelFormRef>>({});
  const prevIsSlideLockedRef = useRef<boolean>(false);
  const visitIdRef = useRef<string | null>(null);
  const slideStartTimeRef = useRef<Record<number, number>>({});
  const prevSlideRef = useRef<number | null>(null);
  const { queueEvent } = useAnalyticsBatch();
  const slideRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isProgrammaticScrollRef = useRef<boolean>(false);
  
  // Detectar se é domínio personalizado e normalizar o domínio
  const customDomain = isCustomDomain() ? normalizeDomain(window.location.hostname) : null;

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
      document.title = reel.seoTitle || reel.title || 'Quiz';
      
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

  // Injetar Meta Pixel
  useEffect(() => {
    if (reel?.pixelsConfig?.metaPixel?.enabled && reel.pixelsConfig.metaPixel.pixelId) {
      const pixelId = reel.pixelsConfig.metaPixel.pixelId;
      const noscriptId = `meta-pixel-noscript-${reel.id}`;
      
      // Verificar se o pixel já foi injetado
      if ((window as any).fbq && (window as any).fbq.queue) {
        return;
      }

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

      return () => {
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
  }, [reel?.pixelsConfig?.metaPixel]);

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
      // IMPORTANTE: Marcar ANTES de qualquer operação de scroll
      // Se já está marcado (ex: botão clicado), não remarcar
      if (!isProgrammaticScrollRef.current) {
        isProgrammaticScrollRef.current = true;
      }
      
      // Verificar se o slide destino está travado
      const targetSlideIsLocked = checkIfSlideIsLocked(slideIndex);
      
      // No mobile, sempre usar scroll instantâneo para evitar conflitos com touch events
      // No desktop, usar smooth apenas se o slide destino não estiver travado
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const scrollBehavior = (isMobile || targetSlideIsLocked) ? 'auto' : 'smooth';
      
      const targetScrollTop = slideIndex * container.clientHeight;
      
      // No mobile, usar scrollTop direto para ser mais rápido e evitar conflitos
      if (isMobile) {
        // Forçar scroll imediatamente
        container.scrollTop = targetScrollTop;
        // Garantir que o scroll foi aplicado em múltiplos frames para evitar interferência do monitor
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
      } else {
        container.scrollTo({
          top: targetScrollTop,
          behavior: scrollBehavior,
        });
      }
      
      // Aumentar tempo para cobrir toda a transição (smooth pode levar até 800ms)
      // No mobile, usar tempo maior para garantir que o monitor não interfira
      // Dar tempo suficiente para o estado atualizar e o monitor parar completamente
      const timeoutDuration = isMobile ? 400 : (targetSlideIsLocked ? 200 : 800);
      
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, timeoutDuration);
    }
  }, [reel, currentSlide, checkIfSlideIsLocked]);


  // Throttle scroll handler com requestAnimationFrame
  const scrollHandlerRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !reel?.slides) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Cancelar frame anterior se existir
      if (scrollHandlerRef.current !== null) {
        cancelAnimationFrame(scrollHandlerRef.current);
      }

      // Usar requestAnimationFrame para throttling
      scrollHandlerRef.current = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const slideHeight = container.clientHeight;
        
        // Evitar processar se scrollTop não mudou significativamente
        if (Math.abs(scrollTop - lastScrollTopRef.current) < slideHeight * 0.1) {
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
      }
    };

    if (prevSlideRef.current !== currentSlide) {
      registerSlideChange();
      prevSlideRef.current = currentSlide;
    }
  }, [currentSlide, reel]);

  // Verificar se o slide atual está travado por algum botão
  useEffect(() => {
    if (!reel?.slides || currentSlide >= reel.slides.length) {
      const newIsLocked = false;
      prevIsSlideLockedRef.current = newIsLocked;
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: newIsLocked });
      return;
    }

    const currentSlideData = reel.slides[currentSlide];
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
        
        // Bloquear imediatamente qualquer scroll para baixo (avançar) sem tolerância
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
      // Verificar se o toque está em um elemento interativo (botão, link, etc)
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, [role="button"], input, select, textarea, [onclick]');
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
      // Se o toque está em um elemento interativo, não bloquear (permitir clique)
      if (isTouchOnInteractiveElement) {
        return;
      }
      
      // Só bloquear se realmente estiver no slide travado (usar currentSlide do estado)
      if (isSlideLocked && !isProgrammaticScrollRef.current && reel?.slides) {
        const expectedScrollTop = currentSlide * slideHeight;
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        const deltaY = touchY - touchStartY;
        const deltaX = touchX - touchStartX;
        const deltaTime = Date.now() - touchStartTime;
        
        // Se o movimento é principalmente horizontal ou muito rápido (tap), não bloquear
        // Permitir taps e movimentos horizontais
        if (Math.abs(deltaX) > Math.abs(deltaY) || deltaTime < 100) {
          return;
        }
        
        // Bloquear apenas movimentos verticais significativos para baixo (swipe down = avançar)
        // Usar uma tolerância mínima para evitar bloquear taps acidentais
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
      if (isSlideLocked && !isProgrammaticScrollRef.current) {
        // Bloquear apenas teclas que avançam para frente
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }
        // Permitir ArrowUp e PageUp para voltar
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
  }, [isSlideLocked, currentSlide, reel?.slides]);

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
  }, [reel, currentSlide, queueEvent]);

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
      scrollToSlide(nextIndex);
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
        scrollToSlide(targetSlideIndex);
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
    const nextIndex = getNextSlideIndex(currentSlideData.id, elementId, undefined, itemId);
    
    if (nextIndex !== null) {
      // Há conexão no fluxo - usar ela
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
      scrollToSlide(nextIndex);
    } else {
      // Não há conexão - usar comportamento padrão (próximo slide)
      dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
      if (currentSlide < reel.slides.length - 1) {
        scrollToSlide(currentSlide + 1);
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
            style={{ overflowY: isSlideLocked ? 'hidden' : 'scroll' }}
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
                                    dispatchSlide({ type: 'SET_IS_LOCKED', payload: false });
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
                              const questionnaireConfig = getNormalizedUiConfig(elementWithConfig.uiConfig);
                              const showQuestionnaireAnimation = blockedScrollAttempt && 
                                                                 questionnaireConfig.lockSlide === true && 
                                                                 isElementVisible(element, index);
                              return (
                                <ReelQuestionnaire
                                  key={element.id}
                                  element={elementWithConfig}
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
                                    setQuestionnaireResponses((prev) => ({
                                      ...prev,
                                      [element.id]: selectedIds,
                                    }));
                                  }}
                                />
                              );
                            case 'QUESTION_GRID':
                              const questionGridConfig = getNormalizedUiConfig(elementWithConfig.uiConfig);
                              const showQuestionGridAnimation = blockedScrollAttempt && 
                                                                questionGridConfig.lockSlide === true && 
                                                                isElementVisible(element, index);
                              return (
                                <ReelQuestionGrid
                                  key={element.id}
                                  element={elementWithConfig}
                                  isActive={index === currentSlide}
                                  onNextSlide={handleQuestionnaireNext}
                                  onItemAction={handleItemAction}
                                  onVisibilityChange={handleElementVisibilityChange}
                                  showBlockedAnimation={showQuestionGridAnimation}
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
    </ReelSoundProvider>
  );
}

