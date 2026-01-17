import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatsCard } from '@/components/admin/StatsCard';
import {
  Users,
  UserPlus,
  FileText,
  Activity,
  MessageSquare,
  Eye,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.getAdminStats<any>();
      return (response as any).data || response;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Usuários"
          value={formatNumber(stats?.totalUsers || 0)}
          icon={Users}
          description="Usuários cadastrados"
        />
        <StatsCard
          title="Cadastros Hoje"
          value={stats?.usersToday || 0}
          icon={UserPlus}
          description="Novos usuários hoje"
        />
        <StatsCard
          title="Cadastros Este Mês"
          value={stats?.usersThisMonth || 0}
          icon={UserPlus}
          description="Novos usuários este mês"
        />
        <StatsCard
          title="Total de Reels"
          value={formatNumber(stats?.totalReels || 0)}
          icon={FileText}
          description="Reels criados"
        />
        <StatsCard
          title="Reels Ativos"
          value={formatNumber(stats?.activeReels || 0)}
          icon={Activity}
          description="Reels publicados"
        />
        <StatsCard
          title="Total de Respostas"
          value={formatNumber(stats?.totalResponses || 0)}
          icon={MessageSquare}
          description="Respostas coletadas"
        />
        <StatsCard
          title="Total de Visitas"
          value={formatNumber(stats?.totalVisits || 0)}
          icon={Eye}
          description="Visitas aos reels"
        />
        <StatsCard
          title="Planos Pagos"
          value={stats?.paidPlans || 0}
          icon={CreditCard}
          description="Assinantes ativos"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cadastros (30 dias)</CardTitle>
            <CardDescription>Evolução de cadastros de usuários</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.usersGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  name="Cadastros"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reels Criados (30 dias)</CardTitle>
            <CardDescription>Evolução de criação de reels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.reelsGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  name="Reels"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Respostas (30 dias)</CardTitle>
            <CardDescription>Evolução de respostas aos reels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.responsesGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  name="Respostas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

