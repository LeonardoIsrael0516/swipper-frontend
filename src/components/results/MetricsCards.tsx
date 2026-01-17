import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle2, TrendingUp, MousePointerClick, Target, UserCheck } from 'lucide-react';

interface MetricsCardsProps {
  metrics: {
    totalVisitors: number;
    totalVisits: number;
    completedFirstStep: number;
    reached50Percent: number;
    interactionRate: number;
    completedFunnel: number;
    totalLeads: number;
  };
  isLoading?: boolean;
}

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  const cards = [
    {
      title: 'Total de Visitantes',
      value: metrics.totalVisitors,
      icon: Users,
      description: `${metrics.totalVisits} visitas totais`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Concluíram 1ª Etapa',
      value: metrics.completedFirstStep,
      icon: CheckCircle2,
      description: `${metrics.totalVisitors > 0 ? Math.round((metrics.completedFirstStep / metrics.totalVisitors) * 100) : 0}% dos visitantes`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Chegaram a 50%',
      value: metrics.reached50Percent,
      icon: TrendingUp,
      description: `${metrics.totalVisitors > 0 ? Math.round((metrics.reached50Percent / metrics.totalVisitors) * 100) : 0}% dos visitantes`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Taxa de Interação',
      value: `${metrics.interactionRate.toFixed(1)}%`,
      icon: MousePointerClick,
      description: 'Visitas com interações',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: 'Finalizaram o Funil',
      value: metrics.completedFunnel,
      icon: Target,
      description: `${metrics.totalVisitors > 0 ? Math.round((metrics.completedFunnel / metrics.totalVisitors) * 100) : 0}% dos visitantes`,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950',
    },
    {
      title: 'Total de Leads',
      value: metrics.totalLeads,
      icon: UserCheck,
      description: 'Formulários preenchidos',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} ${card.color} p-2 rounded-lg flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

