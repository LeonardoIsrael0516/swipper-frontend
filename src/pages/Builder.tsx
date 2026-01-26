import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BuilderProvider, useBuilder } from '@/contexts/BuilderContext';
import { BuilderHeader } from '@/components/builder/BuilderHeader';
import { BuilderSidebar } from '@/components/builder/BuilderSidebar';
import { ElementsPalette } from '@/components/builder/ElementsPalette';
import { MobilePreview } from '@/components/builder/MobilePreview';
import { ElementConfigPanel } from '@/components/builder/ElementConfigPanel';
import { FlowPage } from '@/components/builder/FlowPage';
import { SettingsPage } from '@/components/builder/SettingsPage';
import { MobileBuilderControls } from '@/components/builder/MobileBuilderControls';
import { MobileThemeEditorOverlay } from '@/components/builder/MobileThemeEditorOverlay';
import { MobileSettingsOverlay } from '@/components/builder/MobileSettingsOverlay';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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

// Função helper para normalizar backgroundConfig e gamificationConfig (podem estar dentro de uiConfig como string JSON)
const normalizeBackgroundConfig = (slide: any): any => {
  // Normalizar uiConfig primeiro
  const normalizedUiConfig = normalizeUiConfig(slide.uiConfig);
  
  // Se backgroundConfig dentro de uiConfig for string, parsear
  if (normalizedUiConfig.backgroundConfig && typeof normalizedUiConfig.backgroundConfig === 'string') {
    try {
      normalizedUiConfig.backgroundConfig = JSON.parse(normalizedUiConfig.backgroundConfig);
    } catch {
      // Se falhar o parse, manter como está
    }
  }
  
  // Se gamificationConfig dentro de uiConfig for string, parsear
  if (normalizedUiConfig.gamificationConfig && typeof normalizedUiConfig.gamificationConfig === 'string') {
    try {
      normalizedUiConfig.gamificationConfig = JSON.parse(normalizedUiConfig.gamificationConfig);
    } catch {
      // Se falhar o parse, manter como está
    }
  }
  
  // Retornar slide com uiConfig normalizado e backgroundConfig/gamificationConfig extraídos
  return {
    ...slide,
    uiConfig: normalizedUiConfig,
    backgroundConfig: slide.backgroundConfig || normalizedUiConfig.backgroundConfig,
    gamificationConfig: slide.gamificationConfig || normalizedUiConfig.gamificationConfig,
  };
};

function BuilderContent() {
  const { reelId } = useParams<{ reelId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reel, setReel, setSelectedSlide, selectedTab, setSelectedTab } = useBuilder();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadReel = async () => {
      if (!reelId) {
        // Create new reel
        try {
          const newReel = await api.post('/reels', {
            title: 'Novo Quiz',
            description: '',
            status: 'DRAFT',
            slides: [
              {
                question: '',
                options: [],
                elements: [],
                uiConfig: {
                  backgroundConfig: {
                    type: 'color',
                    color: '#ffffff',
                  },
                },
              },
            ],
          });

          const data = (newReel as any).data || newReel;
          
          // Normalizar slides com backgroundConfig corretamente
          if (data.slides) {
            data.slides = data.slides.map((slide: any) => {
              const normalizedSlide = normalizeBackgroundConfig(slide);
              return {
                ...normalizedSlide,
                // Garantir que elements existe e está no formato correto
                elements: (normalizedSlide.elements || []).map((element: any) => {
                  const normalizedElementUiConfig = normalizeUiConfig(element.uiConfig);
                  return {
                    ...element,
                    uiConfig: normalizedElementUiConfig,
                    gamificationConfig: element.gamificationConfig || normalizedElementUiConfig.gamificationConfig,
                  };
                }),
              };
            });
          }
          
          setReel(data);
          if (data.slides && data.slides.length > 0) {
            setSelectedSlide(data.slides[0]);
          }
        } catch (error: any) {
          toast.error('Erro ao criar swipper: ' + (error.message || 'Erro desconhecido'));
          navigate('/dashboard');
        }
        } else {
        // Load existing reel
        try {
          const data = await api.get(`/reels/${reelId}`);
          const reelData = (data as any).data || data;
          
          // Normalizar slides com backgroundConfig corretamente
          if (reelData.slides) {
            reelData.slides = reelData.slides.map((slide: any) => {
              const normalizedSlide = normalizeBackgroundConfig(slide);
              return {
                ...normalizedSlide,
                // Garantir que elements existe e está no formato correto
                elements: (normalizedSlide.elements || []).map((element: any) => {
                  const normalizedElementUiConfig = normalizeUiConfig(element.uiConfig);
                  return {
                    ...element,
                    uiConfig: normalizedElementUiConfig,
                    gamificationConfig: element.gamificationConfig || normalizedElementUiConfig.gamificationConfig,
                  };
                }),
              };
            });
          }
          
          // Debug em desenvolvimento
          if (import.meta.env.DEV) {
            console.log('Builder - Reel data loaded:', {
              reelId: reelData.id,
              slidesCount: reelData.slides?.length || 0,
              elements: reelData.slides?.flatMap((s: any) => s.elements || []).map((e: any) => ({
                id: e.id,
                elementType: e.elementType,
                hasUiConfig: !!e.uiConfig,
                uiConfigType: typeof e.uiConfig,
                imageUrl: e.uiConfig?.imageUrl,
              })),
            });
          }
          
          setReel(reelData);
          if (reelData.slides && reelData.slides.length > 0) {
            setSelectedSlide(reelData.slides[0]);
          }
        } catch (error: any) {
          toast.error('Erro ao carregar quiz: ' + (error.message || 'Erro desconhecido'));
          navigate('/dashboard');
        }
      }
    };

    loadReel();
  }, [reelId, setReel, setSelectedSlide, navigate, searchParams]);

  // Ler query parameter 'tab' da URL e atualizar selectedTab após o reel ser carregado
  useEffect(() => {
    if (reel) {
      const tabParam = searchParams.get('tab');
      if (tabParam && (tabParam === 'flow' || tabParam === 'settings' || tabParam === 'theme')) {
        setSelectedTab(tabParam as 'flow' | 'settings' | 'theme');
      }
    }
  }, [reel, searchParams, setSelectedTab]);

  if (!reel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderizar FlowPage quando aba flow estiver ativa (apenas desktop)
  if (selectedTab === 'flow' && !isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <BuilderHeader />
        <FlowPage />
      </div>
    );
  }

  // Layout Mobile (CapCut style)
  if (isMobile) {
    // Se estiver na aba Tema, mostrar overlay de tela inteira
    if (selectedTab === 'theme') {
      return (
        <div className="flex flex-col h-screen bg-background relative overflow-hidden">
          <BuilderHeader />
          <MobileThemeEditorOverlay
            onClose={() => {
              // O overlay vai limpar os estados no handleClose
            }}
          />
        </div>
      );
    }

    // Se estiver na aba Configurações, mostrar overlay de tela inteira
    if (selectedTab === 'settings') {
      return (
        <div className="flex flex-col h-screen bg-background relative overflow-hidden">
          <BuilderHeader />
          <MobileSettingsOverlay
            onClose={() => {
              // O overlay vai limpar os estados no handleClose
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-background relative overflow-hidden">
        <BuilderHeader />
        {/* Preview - ocupa espaço restante */}
        <div className="flex-1 overflow-hidden bg-background min-h-0">
          <MobilePreview />
        </div>
        {/* Controles - altura baseada no conteúdo */}
        <div className="flex-shrink-0 bg-background border-t border-border/50">
          <MobileBuilderControls />
        </div>
      </div>
    );
  }

  // Renderizar SettingsPage quando aba settings estiver ativa (apenas desktop)
  if (selectedTab === 'settings' && !isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <BuilderHeader />
        <SettingsPage />
      </div>
    );
  }

  // Layout Desktop (mantém layout atual)
  return (
    <div className="flex flex-col h-screen bg-background">
      <BuilderHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Slides + Elements */}
        <div className="flex">
          <BuilderSidebar />
          <ElementsPalette />
        </div>
        {/* Center: Preview */}
        <div className="flex-1 min-w-0 flex-shrink-0 overflow-auto flex items-center justify-center">
          <MobilePreview />
        </div>
        {/* Right: Config Panel */}
        <ElementConfigPanel />
      </div>
    </div>
  );
}

export default function Builder() {
  return (
    <BuilderProvider>
      <BuilderContent />
    </BuilderProvider>
  );
}

