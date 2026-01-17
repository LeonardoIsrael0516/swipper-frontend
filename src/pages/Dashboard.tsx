import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Play,
  Users, 
  TrendingUp, 
  Eye, 
  MoreVertical,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Edit,
  BarChart3,
  Copy,
  Link as LinkIcon,
  Trash2,
  List,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  Mail,
  X,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { CreateQuizModal } from '@/components/builder/CreateQuizModal';
import { ShareReelModal } from '@/components/reels/ShareReelModal';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { toast } from 'sonner';

// Função para formatar números
const formatNumber = (num: number): string => {
  if (num < 1000) {
    return num.toString();
  }
  return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
};

// Função para calcular variação percentual
const calculatePercentageChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${Math.round(change)}%`;
};

// Função para calcular variação em pontos percentuais (para taxa de conclusão)
const calculatePointChange = (current: number, previous: number): string => {
  const change = current - previous;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${Math.round(change * 100) / 100}pp`;
};

export default function Dashboard() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<{ id: string; title: string } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('dashboard-view-mode');
    return (saved === 'list' || saved === 'grid') ? saved : 'list';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('meus');
  
  // Reset pagination when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Force grid mode on mobile
  const effectiveViewMode = isMobile ? 'grid' : viewMode;

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboard-view-mode', viewMode);
  }, [viewMode]);

  // Fetch user's reels
  const { data: reelsData, isLoading: isLoadingReels } = useQuery({
    queryKey: ['user-reels'],
    queryFn: async () => {
      const response = await api.get('/reels?limit=100');
      const data = (response as any).data || response;
      return data;
    },
  });

  // Fetch user statistics
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await api.get('/analytics/me');
      return (response as any).data || response;
    },
  });


  const allReels = reelsData?.data || [];
  
  // Separar reels próprios dos compartilhados
  const myReels = allReels.filter((reel: any) => reel.userId === user?.id);
  const sharedReels = allReels.filter((reel: any) => reel.userId !== user?.id);
  
  // Usar reels da aba ativa
  const reels = activeTab === 'meus' ? myReels : sharedReels;

  // Calcular stats dinâmicos baseados nos dados da API
  const stats = userStats ? [
    {
      title: 'Swippers',
      value: formatNumber(userStats.totalReels || 0),
      change: userStats.previousMonthReels > 0
        ? `${calculatePercentageChange(userStats.totalReels || 0, userStats.previousMonthReels)} vs mês anterior`
        : userStats.totalReels > 0 ? 'Novo' : '0',
      icon: Play,
      trend: (userStats.totalReels || 0) >= (userStats.previousMonthReels || 0) ? 'up' : 'down',
    },
    {
      title: 'Respostas Totais',
      value: formatNumber(userStats.totalResponses || 0),
      change: userStats.previousMonthResponses > 0
        ? `${calculatePercentageChange(userStats.totalResponses || 0, userStats.previousMonthResponses)} vs mês anterior`
        : userStats.totalResponses > 0 ? 'Novo' : '0',
      icon: Users,
      trend: (userStats.totalResponses || 0) >= (userStats.previousMonthResponses || 0) ? 'up' : 'down',
    },
    {
      title: 'Taxa de Conclusão',
      value: `${Math.round(userStats.completionRate || 0)}%`,
      change: userStats.previousMonthCompletionRate > 0
        ? `${calculatePointChange(userStats.completionRate || 0, userStats.previousMonthCompletionRate)} vs mês anterior`
        : userStats.completionRate > 0 ? 'Novo' : '0%',
      icon: CheckCircle2,
      trend: (userStats.completionRate || 0) >= (userStats.previousMonthCompletionRate || 0) ? 'up' : 'down',
    },
    {
      title: 'Visualizações',
      value: formatNumber(userStats.totalVisits || 0),
      change: userStats.previousMonthVisits > 0
        ? `${calculatePercentageChange(userStats.totalVisits || 0, userStats.previousMonthVisits)} vs mês anterior`
        : userStats.totalVisits > 0 ? 'Novo' : '0',
      icon: Eye,
      trend: (userStats.totalVisits || 0) >= (userStats.previousMonthVisits || 0) ? 'up' : 'down',
    },
  ] : [
    {
      title: 'Swippers',
      value: '0',
      change: '0',
      icon: Play,
      trend: 'up' as const,
    },
    {
      title: 'Respostas Totais',
      value: '0',
      change: '0',
      icon: Users,
      trend: 'up' as const,
    },
    {
      title: 'Taxa de Conclusão',
      value: '0%',
      change: '0%',
      icon: CheckCircle2,
      trend: 'up' as const,
    },
    {
      title: 'Visualizações',
      value: '0',
      change: '0',
      icon: Eye,
      trend: 'up' as const,
    },
  ];

  // Pagination logic
  const itemsPerPage = effectiveViewMode === 'list' ? 10 : 20;
  const totalPages = Math.ceil(reels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedReels = reels.slice(startIndex, endIndex);

  // Reset to page 1 when view mode changes
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
    setCurrentPage(1);
  };

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleEdit = (quizId: string) => {
    navigate(`/builder/${quizId}`);
  };

  const handleShare = (quiz: any) => {
    setSelectedReel({ id: quiz.id, title: quiz.title });
    setShareModalOpen(true);
  };

  const handleDuplicate = async (quizId: string) => {
    try {
      // Buscar dados completos do reel
      const reelResponse = await api.get(`/reels/${quizId}`);
      const reelData = (reelResponse as any).data || reelResponse;
      
      // Criar novo reel com dados copiados
      const newReelResponse = await api.post('/reels', {
        title: `${reelData.title} (Cópia)`,
        description: reelData.description || '',
        status: 'DRAFT',
        slides: reelData.slides?.map((slide: any) => ({
          question: slide.question || '',
          backgroundColor: slide.backgroundColor,
          accentColor: slide.accentColor,
          type: slide.type,
          uiConfig: slide.uiConfig,
          logicNext: slide.logicNext,
          options: slide.options?.map((opt: any) => ({
            text: opt.text,
            emoji: opt.emoji,
          })) || [],
          elements: slide.elements?.map((el: any) => ({
            elementType: el.elementType,
            order: el.order,
            uiConfig: el.uiConfig,
          })) || [],
        })) || [],
      });

      const newReel = (newReelResponse as any).data || newReelResponse;
      
      queryClient.invalidateQueries({ queryKey: ['user-reels'] });
      toast.success('Swipper duplicado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao duplicar swipper: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleCopyLink = async (slug: string | null) => {
    if (!slug) {
      toast.error('Swipper ainda não possui link público');
      return;
    }

    const publicUrl = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleDelete = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${quizTitle}"?`)) {
      return;
    }

    try {
      await api.delete(`/reels/${quizId}`);
      queryClient.invalidateQueries({ queryKey: ['user-reels'] });
      toast.success('Swipper excluído com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao excluir swipper: ' + (error.message || 'Erro desconhecido'));
    }
  };
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho dos seus quizzes
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="gradient-primary text-primary-foreground gap-2 glow-primary"
            >
              <Plus className="w-4 h-4" />
              Criar Swipper
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className={isMobile ? "p-4" : "p-6"}>
                <div className={`flex items-start justify-between ${isMobile ? "mb-2" : "mb-4"}`}>
                  <div className={`${isMobile ? "w-8 h-8" : "w-12 h-12"} rounded-xl gradient-primary flex items-center justify-center`}>
                    <stat.icon className={`${isMobile ? "w-4 h-4" : "w-6 h-6"} text-primary-foreground`} />
                  </div>
                  {stat.change !== '0' && stat.change !== '0%' && stat.change !== 'Novo' && (
                    <span className={`flex items-center text-xs font-medium ${
                      stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <TrendingUp className={`w-3 h-3 mr-1 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                      {stat.change.split(' ')[0]}
                    </span>
                  )}
                </div>
                <h3 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold ${isMobile ? "mb-0.5" : "mb-1"}`}>{stat.value}</h3>
                <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Quizzes */}
        <Card className="glass-card border-border/50">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center justify-between w-full">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="meus" className="data-[state=active]:bg-background">
                    Seus Swippers
                  </TabsTrigger>
                  {sharedReels.length > 0 && (
                    <TabsTrigger value="compartilhados" className="data-[state=active]:bg-background">
                      Compartilhados com você
                    </TabsTrigger>
                  )}
                </TabsList>
                {!isMobile && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                    onClick={toggleViewMode}
                  >
                    {viewMode === 'list' ? (
                      <>
                        <Grid3x3 className="w-4 h-4 mr-1" />
                        Grade
                      </>
                    ) : (
                      <>
                        <List className="w-4 h-4 mr-1" />
                        Lista
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="meus" className="mt-0">
                <div>
            {isLoadingReels ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">Carregando quizzes...</p>
              </div>
            ) : reels.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-full max-w-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-surface border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300 group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                        <img src="/favicon.png" alt="" className="w-8 h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Swipper</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              0 respostas
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              agora
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="h-6 bg-muted/20 rounded-full w-16 hidden sm:block" />
                      <Button
                        onClick={() => setCreateModalOpen(true)}
                        className="gradient-primary text-primary-foreground gap-2 glow-primary w-full sm:w-auto"
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                        Criar novo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : effectiveViewMode === 'list' ? (
              <div className="space-y-4">
                {displayedReels.map((quiz: any, index: number) => {
                  const createdAt = new Date(quiz.createdAt);
                  const timeAgo = formatDistanceToNow(createdAt, {
                    addSuffix: true,
                    locale: ptBR,
                  });

                  return (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-hover transition-all duration-200 group"
                    >
                      <div 
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => handleEdit(quiz.id)}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <img src="/favicon.png" alt="" className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                            {quiz.title}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {quiz._count?.responses || 0} respostas
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            quiz.status === 'ACTIVE'
                              ? 'bg-green-500/10 text-green-500'
                              : quiz.status === 'DRAFT'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {quiz.status === 'ACTIVE' ? 'Ativo' : quiz.status === 'DRAFT' ? 'Rascunho' : 'Arquivado'}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-surface-hover hover:text-foreground">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(quiz.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/reels/${quiz.id}/results`)}>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Resultados
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(quiz.id)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(quiz.slug)}>
                              <LinkIcon className="w-4 h-4 mr-2" />
                              Copiar link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(quiz)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Distribuir
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(quiz.id, quiz.title)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir swipper
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedReels.map((quiz: any, index: number) => {
                  const createdAt = new Date(quiz.createdAt);
                  const timeAgo = formatDistanceToNow(createdAt, {
                    addSuffix: true,
                    locale: ptBR,
                  });

                  return (
                    <Card
                      key={quiz.id}
                      className="glass-card border-border/50 hover:border-primary/30 transition-all duration-200 group relative"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => handleEdit(quiz.id)}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                                <img src="/favicon.png" alt="" className="w-6 h-6" />
                              </div>
                              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {quiz.title}
                              </h4>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-surface-hover hover:text-foreground">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(quiz.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/reels/${quiz.id}/results`)}>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Resultados
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(quiz.id)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyLink(quiz.slug)}>
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Copiar link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(quiz)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Distribuir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(quiz.id, quiz.title)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir swipper
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleEdit(quiz.id)}
                        >
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {quiz._count?.responses || 0} respostas
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo}
                            </span>
                          </div>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              quiz.status === 'ACTIVE'
                                ? 'bg-green-500/10 text-green-500'
                                : quiz.status === 'DRAFT'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {quiz.status === 'ACTIVE' ? 'Ativo' : quiz.status === 'DRAFT' ? 'Rascunho' : 'Arquivado'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {reels.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
                </div>
              </TabsContent>
              {sharedReels.length > 0 && (
                <TabsContent value="compartilhados" className="mt-0">
                  <div>
                    {isLoadingReels ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">Carregando quizzes...</p>
                      </div>
                    ) : sharedReels.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">Nenhum swipper compartilhado com você ainda.</p>
                      </div>
                    ) : effectiveViewMode === 'list' ? (
                      <div className="space-y-4">
                        {sharedReels.slice(startIndex, endIndex).map((quiz: any, index: number) => {
                          const createdAt = new Date(quiz.createdAt);
                          const timeAgo = formatDistanceToNow(createdAt, {
                            addSuffix: true,
                            locale: ptBR,
                          });

                          return (
                            <div
                              key={quiz.id}
                              className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-hover transition-all duration-200 group"
                            >
                              <div 
                                className="flex items-center gap-4 flex-1 cursor-pointer"
                                onClick={() => handleEdit(quiz.id)}
                              >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                  <img src="/favicon.png" alt="" className="w-8 h-8" />
                                </div>
                                <div>
                                  <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                                    {quiz.title}
                                  </h4>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {quiz._count?.responses || 0} respostas
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {timeAgo}
                                    </span>
                                    {quiz.user?.name && (
                                      <span className="text-xs">
                                        por {quiz.user.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    quiz.status === 'ACTIVE'
                                      ? 'bg-green-500/10 text-green-500'
                                      : quiz.status === 'DRAFT'
                                      ? 'bg-yellow-500/10 text-yellow-500'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {quiz.status === 'ACTIVE' ? 'Ativo' : quiz.status === 'DRAFT' ? 'Rascunho' : 'Arquivado'}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-surface-hover hover:text-foreground">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(quiz.id)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/reels/${quiz.id}/results`)}>
                                      <BarChart3 className="w-4 h-4 mr-2" />
                                      Resultados
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sharedReels.slice(startIndex, endIndex).map((quiz: any, index: number) => {
                          const createdAt = new Date(quiz.createdAt);
                          const timeAgo = formatDistanceToNow(createdAt, {
                            addSuffix: true,
                            locale: ptBR,
                          });

                          return (
                            <Card
                              key={quiz.id}
                              className="glass-card border-border/50 hover:border-primary/30 transition-all duration-200 group relative"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => handleEdit(quiz.id)}
                                  >
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                                        <img src="/favicon.png" alt="" className="w-6 h-6" />
                                      </div>
                                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                        {quiz.title}
                                      </h4>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-surface-hover hover:text-foreground">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEdit(quiz.id)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => navigate(`/reels/${quiz.id}/results`)}>
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        Resultados
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div 
                                  className="cursor-pointer"
                                  onClick={() => handleEdit(quiz.id)}
                                >
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {quiz._count?.responses || 0} respostas
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {timeAgo}
                                    </span>
                                  </div>
                                  {quiz.user?.name && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      por {quiz.user.name}
                                    </p>
                                  )}
                                  <span
                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                      quiz.status === 'ACTIVE'
                                        ? 'bg-green-500/10 text-green-500'
                                        : quiz.status === 'DRAFT'
                                        ? 'bg-yellow-500/10 text-yellow-500'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {quiz.status === 'ACTIVE' ? 'Ativo' : quiz.status === 'DRAFT' ? 'Rascunho' : 'Arquivado'}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                    {sharedReels.length > 0 && Math.ceil(sharedReels.length / itemsPerPage) > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground px-4">
                          Página {currentPage} de {Math.ceil(sharedReels.length / itemsPerPage)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage >= Math.ceil(sharedReels.length / itemsPerPage)}
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <CreateQuizModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      {selectedReel && (
        <ShareReelModal
          open={shareModalOpen}
          onOpenChange={(open) => {
            setShareModalOpen(open);
            if (!open) setSelectedReel(null);
          }}
          reelId={selectedReel.id}
          reelTitle={selectedReel.title}
        />
      )}
    </DashboardLayout>
  );
}
