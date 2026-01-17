import { Link, useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, ChevronDown, FileText, GitBranch, Palette, BarChart3, Settings } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';

export function ResultsHeader() {
  const { theme } = useTheme();
  const { reelId } = useParams<{ reelId: string }>();
  const isMobile = useIsMobile();

  // Header Mobile
  if (isMobile) {
    return (
      <header className="h-12 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center gap-2 px-3">
          {/* Left: Back Button */}
          <Link to={reelId ? `/builder/${reelId}` : '/dashboard'}>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-surface-hover hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          {/* Dropdown de Abas - ao lado da seta */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs px-3 hover:bg-surface-hover hover:text-foreground">
                <BarChart3 className="w-3 h-3 mr-1.5" />
                Resultados
                <ChevronDown className="w-3 h-3 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem asChild>
                <Link to={reelId ? `/builder/${reelId}` : '#'}>
                  <FileText className="w-4 h-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={reelId ? `/builder/${reelId}/results` : '#'}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Resultados
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={reelId ? `/builder/${reelId}?tab=flow` : '#'}>
                  <GitBranch className="w-4 h-4 mr-2" />
                  Fluxo
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={reelId ? `/builder/${reelId}?tab=settings` : '#'}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    );
  }

  // Header Desktop
  return (
    <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left: Logo + Back Button */}
        <div className="flex items-center gap-3">
          <Link to={reelId ? `/builder/${reelId}` : '/dashboard'}>
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-surface-hover hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={theme === 'dark' ? '/logo-dark.png' : '/logo-white.png'}
              alt="ReelQuiz"
              className="h-8 transition-all duration-300 group-hover:opacity-80"
            />
          </Link>
        </div>

        {/* Center: Tabs */}
        <div className="flex-1 flex justify-center">
          <Tabs value="results" className="w-auto">
            <TabsList>
              <TabsTrigger value="edit" asChild>
                <Link to={reelId ? `/builder/${reelId}` : '#'}>Editar Swipper</Link>
              </TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="flow" asChild>
                <Link to={reelId ? `/builder/${reelId}?tab=flow` : '#'}>Fluxo</Link>
              </TabsTrigger>
              <TabsTrigger value="settings" asChild>
                <Link to={reelId ? `/builder/${reelId}?tab=settings` : '#'}>Configurações</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Right: Empty space for balance */}
        <div className="w-32" />
      </div>
    </header>
  );
}

