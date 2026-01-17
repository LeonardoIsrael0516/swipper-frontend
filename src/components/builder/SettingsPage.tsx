import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBuilder } from '@/contexts/BuilderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Copy, Settings, Code, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PixelsSettings } from './PixelsSettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import { CustomDomainsSettings } from './CustomDomainsSettings';

type SlugValidationState = 'idle' | 'validating' | 'available' | 'unavailable';

export function SettingsPage() {
  const { reel, setReel, setHasUnsavedChanges } = useBuilder();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<'general' | 'pixels' | 'integrations'>('general');
  
  // Estados para formulário
  const [title, setTitle] = useState(reel?.title || '');
  const [slug, setSlug] = useState(reel?.slug || '');
  
  // Estados de validação de slug
  const [slugValidation, setSlugValidation] = useState<SlugValidationState>('idle');
  const [slugMessage, setSlugMessage] = useState<string>('');
  const [isSlugValid, setIsSlugValid] = useState(false);
  
  // Refs para debounce
  const titleDebounceRef = useRef<NodeJS.Timeout>();
  const slugDebounceRef = useRef<NodeJS.Timeout>();
  const slugValidationRef = useRef<NodeJS.Timeout>();

  // Refs para controlar se estamos editando
  const isEditingTitleRef = useRef(false);
  const isEditingSlugRef = useRef(false);

  // Sincronizar estados apenas quando reel.id mudar (novo reel carregado)
  // Não sincronizar quando title/slug mudarem para não sobrescrever edições do usuário
  useEffect(() => {
    // Só sincronizar se não estiver editando
    if (!isEditingTitleRef.current) {
      setTitle(reel?.title || '');
    }
    if (!isEditingSlugRef.current) {
      setSlug(reel?.slug || '');
      setSlugValidation('idle');
      setSlugMessage('');
      setIsSlugValid(false);
    }
  }, [reel?.id]);

  // Função para validar slug
  const validateSlug = useCallback(async (slugValue: string) => {
    if (!reel) return;
    
    // Se slug está vazio, resetar validação
    if (!slugValue || slugValue.trim() === '') {
      setSlugValidation('idle');
      setSlugMessage('');
      setIsSlugValid(false);
      return;
    }

    // Normalizar slug (lowercase, trim)
    const normalizedSlug = slugValue.toLowerCase().trim();

    // Validação básica de formato no frontend
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    
    if (normalizedSlug.length < 3) {
      setSlugValidation('unavailable');
      setSlugMessage('O slug deve ter no mínimo 3 caracteres');
      setIsSlugValid(false);
      return;
    }

    if (normalizedSlug.length > 50) {
      setSlugValidation('unavailable');
      setSlugMessage('O slug deve ter no máximo 50 caracteres');
      setIsSlugValid(false);
      return;
    }

    if (!slugRegex.test(normalizedSlug)) {
      setSlugValidation('unavailable');
      setSlugMessage('Apenas letras minúsculas, números e hífens são permitidos');
      setIsSlugValid(false);
      return;
    }

    if (normalizedSlug.startsWith('-') || normalizedSlug.endsWith('-')) {
      setSlugValidation('unavailable');
      setSlugMessage('O slug não pode começar ou terminar com hífen');
      setIsSlugValid(false);
      return;
    }

    if (normalizedSlug.includes('--')) {
      setSlugValidation('unavailable');
      setSlugMessage('O slug não pode conter hífens consecutivos');
      setIsSlugValid(false);
      return;
    }

    // Se o slug não mudou em relação ao atual, considerar válido
    if (normalizedSlug === reel.slug) {
      setSlugValidation('available');
      setSlugMessage('');
      setIsSlugValid(true);
      return;
    }

    // Validar com backend
    setSlugValidation('validating');
    try {
      const response = await api.get(`/reels/validate-slug/${encodeURIComponent(normalizedSlug)}?reelId=${reel.id}`);
      const validation = (response as any).data || response;
      
      if (validation.available) {
        setSlugValidation('available');
        setSlugMessage('');
        setIsSlugValid(true);
      } else {
        setSlugValidation('unavailable');
        setSlugMessage(validation.message || 'Este slug já está em uso');
        setIsSlugValid(false);
      }
    } catch (error: any) {
      setSlugValidation('unavailable');
      setSlugMessage(error.message || 'Erro ao validar slug');
      setIsSlugValid(false);
    }
  }, [reel]);

  // Debounce para validação de slug
  useEffect(() => {
    if (slugValidationRef.current) {
      clearTimeout(slugValidationRef.current);
    }

    slugValidationRef.current = setTimeout(() => {
      if (slug && slug !== reel?.slug) {
        validateSlug(slug);
      }
    }, 500);

    return () => {
      if (slugValidationRef.current) {
        clearTimeout(slugValidationRef.current);
      }
    };
  }, [slug, validateSlug, reel?.slug]);

  // Função para atualizar título
  const updateTitle = useCallback(
    async (newTitle: string) => {
      if (!reel) return;

      try {
        const response = await api.patch(`/reels/${reel.id}`, { title: newTitle });
        const reelData = (response as any).data || response;
        
        // Atualizar reel no context sem resetar os inputs locais
        if (reel) {
          setReel({
            ...reel,
            ...reelData,
          });
        }
        setHasUnsavedChanges(true);
      } catch (error: any) {
        toast.error('Erro ao salvar título: ' + (error.message || 'Erro desconhecido'));
        // Em caso de erro, restaurar valor do reel
        setTitle(reel.title || '');
      }
    },
    [reel, setReel, setHasUnsavedChanges]
  );

  // Debounce para título
  useEffect(() => {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
    }

    // Marcar como editando quando o usuário começar a digitar
    if (title !== (reel?.title || '')) {
      isEditingTitleRef.current = true;
    }

    titleDebounceRef.current = setTimeout(() => {
      if (reel && title !== reel.title && title.trim() !== '') {
        updateTitle(title).finally(() => {
          // Após salvar, permitir sincronização novamente após um pequeno delay
          setTimeout(() => {
            isEditingTitleRef.current = false;
          }, 100);
        });
      } else if (title === reel?.title) {
        // Se voltou ao valor original, não está mais editando
        isEditingTitleRef.current = false;
      }
    }, 500);

    return () => {
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }
    };
  }, [title, reel?.id, updateTitle]);

  // Função para atualizar slug
  const updateSlug = useCallback(
    async (newSlug: string) => {
      if (!reel || !isSlugValid) return;

      const normalizedSlug = newSlug.toLowerCase().trim();

      try {
        const response = await api.patch(`/reels/${reel.id}`, { slug: normalizedSlug });
        const reelData = (response as any).data || response;
        
        setReel({
          ...reel,
          ...reelData,
        });
        setHasUnsavedChanges(true);
        toast.success('Slug atualizado com sucesso!');
      } catch (error: any) {
        toast.error('Erro ao salvar slug: ' + (error.message || 'Erro desconhecido'));
        setSlugValidation('unavailable');
        setIsSlugValid(false);
      }
    },
    [reel, setReel, setHasUnsavedChanges, isSlugValid]
  );

  // Salvar slug quando validado e mudou
  useEffect(() => {
    if (slugDebounceRef.current) {
      clearTimeout(slugDebounceRef.current);
    }

    slugDebounceRef.current = setTimeout(() => {
      if (reel && slug && isSlugValid && slug !== reel.slug) {
        updateSlug(slug);
      }
    }, 1000);

    return () => {
      if (slugDebounceRef.current) {
        clearTimeout(slugDebounceRef.current);
      }
    };
  }, [slug, isSlugValid, reel, updateSlug]);

  // Função para copiar link público
  const handleCopyPublicLink = async () => {
    const publicUrl = slug ? `${window.location.origin}/${slug}` : null;
    if (!publicUrl) {
      toast.error('Slug não disponível');
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = publicUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Link copiado para a área de transferência!');
      } catch (err) {
        toast.error('Erro ao copiar link');
      }
      document.body.removeChild(textArea);
    }
  };

  const publicUrl = slug ? `${window.location.origin}/${slug}` : null;

  // Conteúdo renderizado (compartilhado entre mobile e desktop)
  const renderContent = () => (
    <>
      {activeSection === 'general' && (
        <div className={cn('space-y-6', !isMobile && 'space-y-8')}>
          <div>
            <h3 className={cn('font-semibold mb-2', isMobile ? 'text-xl' : 'text-2xl')}>Geral</h3>
            <p className="text-muted-foreground">
              Configure as informações básicas do seu Swipper
            </p>
          </div>

          {/* Card: Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure o título e identificação do seu quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Swipper</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    isEditingTitleRef.current = true;
                    setTitle(e.target.value);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      isEditingTitleRef.current = false;
                    }, 200);
                  }}
                  placeholder="Meu Quiz Incrível"
                  className={cn(isMobile ? 'w-full' : 'max-w-md')}
                />
                <p className="text-sm text-muted-foreground">
                  O título aparece no dashboard e nos resultados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: URL e Compartilhamento */}
          <Card>
            <CardHeader>
              <CardTitle>URL e Compartilhamento</CardTitle>
              <CardDescription>
                Personalize o link público do seu quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug Personalizado</Label>
                <div className={cn('space-y-2', isMobile ? 'w-full' : 'max-w-md')}>
                  <div className="relative">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setSlug(value);
                      }}
                      placeholder="meu-quiz-incrivel"
                      className={cn(
                        'pr-10',
                        slugValidation === 'available' && 'border-green-500 focus-visible:ring-green-500',
                        slugValidation === 'unavailable' && 'border-red-500 focus-visible:ring-red-500'
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {slugValidation === 'validating' && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {slugValidation === 'available' && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {slugValidation === 'unavailable' && slug && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  {slugMessage && (
                    <p
                      className={cn(
                        'text-sm',
                        slugValidation === 'available' && 'text-green-600',
                        slugValidation === 'unavailable' && 'text-red-600'
                      )}
                    >
                      {slugMessage}
                    </p>
                  )}
                  {!slugMessage && slug && (
                    <p className="text-sm text-muted-foreground">
                      Use apenas letras minúsculas, números e hífens (3-50 caracteres)
                    </p>
                  )}
                </div>
              </div>

              {/* Preview do Link Público */}
              {slug && (
                <div className="space-y-2">
                  <Label>Link Público</Label>
                  <div className={cn('flex gap-2', isMobile ? 'flex-col' : 'max-w-md')}>
                    <Input
                      value={publicUrl || ''}
                      readOnly
                      className="bg-muted flex-1"
                    />
                    <div className={cn('flex gap-2', isMobile && 'w-full')}>
                      <Button
                        variant="outline"
                        size={isMobile ? 'default' : 'icon'}
                        onClick={handleCopyPublicLink}
                        title="Copiar link"
                        className={cn(isMobile && 'flex-1 min-h-[44px]')}
                      >
                        <Copy className={cn(isMobile ? 'w-4 h-4 mr-2' : 'w-4 h-4')} />
                        {isMobile && 'Copiar'}
                      </Button>
                      {publicUrl && (
                        <Button
                          variant="outline"
                          size={isMobile ? 'default' : 'icon'}
                          onClick={() => window.open(publicUrl, '_blank')}
                          title="Abrir link"
                          className={cn(isMobile && 'flex-1 min-h-[44px]')}
                        >
                          <ExternalLink className={cn(isMobile ? 'w-4 h-4 mr-2' : 'w-4 h-4')} />
                          {isMobile && 'Abrir'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Este é o link que será compartilhado com seus visitantes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Domínios Personalizados */}
          <CustomDomainsSettings />
        </div>
      )}

      {activeSection === 'pixels' && <PixelsSettings />}

      {activeSection === 'integrations' && <IntegrationsSettings />}
    </>
  );

  // Layout Mobile
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Tabs Horizontais para Navegação */}
        <div className="flex-shrink-0 border-b border-border/50 px-2 pt-2">
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as typeof activeSection)}>
            <TabsList className="w-full grid grid-cols-3 h-auto">
              <TabsTrigger value="general" className="flex items-center gap-1.5 text-xs py-2">
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="pixels" className="flex items-center gap-1.5 text-xs py-2">
                <Code className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pixels</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-1.5 text-xs py-2">
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Integrações</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  // Layout Desktop
  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/50 bg-background flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Configurações</h2>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection('general')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                activeSection === 'general'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Geral
              </div>
            </button>
            <button
              onClick={() => setActiveSection('pixels')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                activeSection === 'pixels'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Pixels
              </div>
            </button>
            <button
              onClick={() => setActiveSection('integrations')}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                activeSection === 'integrations'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Integrações
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

