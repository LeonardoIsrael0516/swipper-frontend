import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, ArrowLeft, Send, CheckCircle2, Link as LinkIcon, ExternalLink, Copy, MoreVertical, Save, ChevronDown, FileText, GitBranch, Palette, BarChart3, Settings, Sun, Moon } from 'lucide-react';
import { useBuilder } from '@/contexts/BuilderContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export function BuilderHeader() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { reel, saveReel, publishReel, hasUnsavedChanges, lastSavedAt, isLoading, selectedTab, setSelectedTab } = useBuilder();
  const [isPublishing, setIsPublishing] = useState(false);
  const isMobile = useIsMobile();
  // Usar rota de preview (autenticada) para permitir ver rascunhos
  const previewUrl = reel?.slug ? `/preview/${reel.slug}` : null;
  // Link público real
  const publicUrl = reel?.slug ? `${window.location.origin}/${reel.slug}` : null;

  const handleSave = async () => {
    if (isLoading) return;
    try {
      await saveReel();
    } catch (error) {
      // Error já é tratado no saveReel
    }
  };

  const handlePublish = async () => {
    if (isPublishing || isLoading) return;
    setIsPublishing(true);
    try {
      await publishReel();
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicUrl) {
      toast.error('Link público não disponível');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      // Fallback para navegadores mais antigos
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

  const handleOpenPublicLink = () => {
    if (!publicUrl) {
      toast.error('Link público não disponível');
      return;
    }
    window.open(publicUrl, '_blank');
  };

  // Header Mobile Minimalista
  if (isMobile) {
    return (
      <header className="h-12 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center gap-2 px-3">
          {/* Left: Back Button */}
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-surface-hover hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          {/* Dropdown de Abas - ao lado da seta */}
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs px-3 hover:bg-surface-hover hover:text-foreground">
                  {selectedTab === 'edit' && (
                    <>
                      <FileText className="w-3 h-3 mr-1.5" />
                      Editar
                    </>
                  )}
                  {selectedTab === 'flow' && (
                    <>
                      <GitBranch className="w-3 h-3 mr-1.5" />
                      Fluxo
                    </>
                  )}
                  {selectedTab === 'settings' && (
                    <>
                      <Settings className="w-3 h-3 mr-1.5" />
                      Configurações
                    </>
                  )}
                  <ChevronDown className="w-3 h-3 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => setSelectedTab('edit')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={reel?.id ? `/builder/${reel.id}/results` : '#'}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Resultados
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedTab('flow')}>
                  <GitBranch className="w-4 h-4 mr-2" />
                  Fluxo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedTab('settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          {/* Right: Theme Toggle + Publicar + Dropdown - com margin-left auto para empurrar para direita */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative h-8 w-8 hover:bg-surface-hover hover:text-foreground"
            >
              <Sun className={`w-4 h-4 transition-all duration-300 ${theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
              <Moon className={`absolute w-4 h-4 transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {reel?.status === 'ACTIVE' && !hasUnsavedChanges && lastSavedAt ? (
              // Publicado
              <Button
                size="sm"
                variant="outline"
                disabled
                className="bg-green-500/10 text-green-600 border-green-500/20 h-8 text-xs px-2"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                OK
              </Button>
            ) : (
              // Publicar
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground h-8 text-xs px-2"
                onClick={handlePublish}
                disabled={!reel || isLoading || isPublishing}
              >
                <Send className="w-3 h-3 mr-1" />
                {isPublishing ? '...' : 'Publicar'}
              </Button>
            )}
            
            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-surface-hover hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {previewUrl && (
                  <DropdownMenuItem onClick={handlePreview}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                )}
                {publicUrl && (
                  <>
                    <DropdownMenuItem onClick={handleOpenPublicLink}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyPublicLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  // Header Desktop (mantém layout atual)
  return (
    <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-8">
        {/* Left: Logo + Back Button */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-surface-hover hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            <img
              src={theme === 'dark' ? '/logo-dark.png' : '/logo-white.png'}
              alt="ReelQuiz"
              className="h-8 transition-all duration-300 group-hover:opacity-80"
            />
          </Link>
        </div>

        {/* Center: Tabs */}
        <div className="flex-1 flex justify-center">
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'edit' | 'theme' | 'flow' | 'settings')} className="w-auto">
          <TabsList>
            <TabsTrigger value="edit">Editar Swipper</TabsTrigger>
            <TabsTrigger value="results" asChild>
              <Link to={reel?.id ? `/builder/${reel.id}/results` : '#'}>Resultados</Link>
            </TabsTrigger>
            <TabsTrigger value="flow">
              Fluxo
            </TabsTrigger>
            <TabsTrigger value="settings">
              Configurações
            </TabsTrigger>
          </TabsList>
        </Tabs>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-9 w-9 hover:bg-surface-hover hover:text-foreground"
          >
            <Sun className={`w-5 h-5 transition-all duration-300 ${theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
            <Moon className={`absolute w-5 h-5 transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {/* Indicador Rascunho Salvo - apenas quando está em DRAFT */}
          {reel?.status === 'DRAFT' && !hasUnsavedChanges && lastSavedAt && (
            <span className="text-xs text-muted-foreground px-2">
              Rascunho salvo
            </span>
          )}
          
          {previewUrl ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isLoading || isPublishing}
              className="hover:bg-surface-hover hover:text-foreground"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Salve o quiz primeiro para gerar o link de preview"
              className="hover:bg-surface-hover hover:text-foreground"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          {reel?.status === 'ACTIVE' && !hasUnsavedChanges && lastSavedAt ? (
            // Publicado e sem mudanças não publicadas
            <>
              <Button
                size="sm"
                variant="outline"
                disabled
                className="bg-green-500/10 text-green-600 border-green-500/20"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Publicado
              </Button>
              {publicUrl && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading || isPublishing}
                      className="hover:bg-surface-hover hover:text-foreground"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleOpenPublicLink}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyPublicLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ) : (
            // Tem mudanças não publicadas ou está em DRAFT - mostrar botão Publicar
            <>
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground"
                onClick={handlePublish}
                disabled={!reel || isLoading || isPublishing}
              >
                <Send className="w-4 h-4 mr-2" />
                {isPublishing ? 'Publicando...' : 'Publicar'}
              </Button>
              {publicUrl && reel?.status === 'ACTIVE' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading || isPublishing}
                      className="hover:bg-surface-hover hover:text-foreground"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleOpenPublicLink}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyPublicLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

