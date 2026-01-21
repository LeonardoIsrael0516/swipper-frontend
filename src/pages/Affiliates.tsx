import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Gift,
  Users,
  CreditCard,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

// Formatar valor monetário
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Formatar data
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export default function Affiliates() {
  const [linkCopied, setLinkCopied] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [withdrawalType, setWithdrawalType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const queryClient = useQueryClient();

  // Buscar estatísticas
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['affiliate-stats'],
    queryFn: async () => {
      const response = await api.get('/affiliates/stats');
      return (response as any).data || response;
    },
  });

  // Buscar histórico de saques
  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['affiliate-withdrawals'],
    queryFn: async () => {
      const response = await api.get('/affiliates/withdrawal-history');
      return (response as any).data || response;
    },
  });

  // Buscar indicados
  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['affiliate-referrals'],
    queryFn: async () => {
      const response = await api.get('/affiliates/referrals');
      return (response as any).data || response;
    },
  });

  // Gerar link
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/affiliates/generate-link');
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
      toast.success('Link gerado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao gerar link');
    },
  });

  // Solicitar saque
  const requestWithdrawalMutation = useMutation({
    mutationFn: async (data: { pixKey: string; withdrawalType: 'CPF' | 'CNPJ' }) => {
      const response = await api.post('/affiliates/withdrawal', data);
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-withdrawals'] });
      toast.success('Solicitação de saque enviada com sucesso!');
      setWithdrawalOpen(false);
      setPixKey('');
      setWithdrawalType('CPF');
      setAcceptedTerms(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao solicitar saque');
    },
  });

  const handleCopyLink = () => {
    if (stats?.affiliateLink) {
      navigator.clipboard.writeText(stats.affiliateLink);
      setLinkCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleRequestWithdrawal = () => {
    if (!pixKey.trim()) {
      toast.error('Por favor, informe a chave PIX');
      return;
    }

    if (!acceptedTerms) {
      toast.error('Você deve aceitar os termos para solicitar saque');
      return;
    }

    requestWithdrawalMutation.mutate({
      pixKey: pixKey.trim(),
      withdrawalType,
    });
  };

  // Buscar informações do programa
  const { data: programInfo } = useQuery({
    queryKey: ['affiliate-program-info'],
    queryFn: async () => {
      try {
        const response = await api.get('/affiliates/program-info');
        return (response as any).data || response;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // Buscar configurações para valor mínimo (fallback)
  const { data: settings } = useQuery({
    queryKey: ['affiliate-settings'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/affiliates/settings');
        return (response as any).data || response;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const hasLink = !!stats?.affiliateLink;
  const availableBalance = stats?.availableBalance || 0;
  const minWithdrawal = programInfo?.minWithdrawal || settings?.minWithdrawal ? Number(programInfo?.minWithdrawal || settings?.minWithdrawal) : 50;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Indique e Ganhe</h1>
            <p className="text-muted-foreground">
              Compartilhe o Swipper e ganhe comissões sobre cada assinatura
            </p>
          </div>
          {!hasLink && (
            <Button
              onClick={() => generateLinkMutation.mutate()}
              disabled={generateLinkMutation.isPending}
              className="mt-4 md:mt-0"
            >
              <Gift className="w-4 h-4 mr-2" />
              {generateLinkMutation.isPending ? 'Gerando...' : 'Gerar Link'}
            </Button>
          )}
        </div>

        {/* Seção: Como Funciona */}
        {programInfo && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Como Funciona o Programa
              </CardTitle>
              <CardDescription>
                Entenda como você pode ganhar indicando o Swipper
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Comissão</h3>
                      <p className="text-sm text-muted-foreground">
                        Você recebe <span className="font-bold text-primary">{stats?.commissionPercentage || programInfo?.commissionPercentage || 10}%</span> de comissão sobre cada assinatura ativa
                        {stats?.hasCustomCommission && (
                          <span className="block text-xs text-primary mt-1">(Comissão personalizada)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Duração</h3>
                      <p className="text-sm text-muted-foreground">
                        Receba comissões por <span className="font-bold text-primary">{programInfo.commissionMonths} meses</span> sobre cada assinatura ativa
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Liberação</h3>
                      <p className="text-sm text-muted-foreground">
                        Comissões são liberadas após <span className="font-bold text-primary">{programInfo.releasePeriod} dias</span> do pagamento
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Saque Mínimo</h3>
                      <p className="text-sm text-muted-foreground">
                        Valor mínimo para solicitar saque: <span className="font-bold text-primary">{formatCurrency(programInfo.minWithdrawal)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Como funciona:</strong> Compartilhe seu link único de afiliado. Quando alguém se cadastrar através do seu link e assinar um plano, você receberá {stats?.commissionPercentage || programInfo?.commissionPercentage || 10}% de comissão sobre o valor da assinatura mensal por {programInfo?.commissionMonths || 6} meses. As comissões ficam pendentes por {programInfo?.releasePeriod || 33} dias e depois ficam disponíveis para saque.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Link de Afiliado */}
        {hasLink && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Seu Link de Afiliado</CardTitle>
              <CardDescription>
                Compartilhe este link e ganhe comissões quando alguém se cadastrar e assinar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={stats.affiliateLink}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cadastros Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '...' : stats?.activeReferrals || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Pessoas que se cadastraram via seu link
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '...' : stats?.activeSubscriptions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Indicados com assinatura ativa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo a Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '...' : formatCurrency(stats?.pendingBalance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando liberação (33 dias)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponível para Saque</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '...' : formatCurrency(stats?.availableBalance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pronto para solicitar saque
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Solicitar Saque - Sempre visível */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Solicitar Saque</CardTitle>
            <CardDescription>
              {availableBalance >= minWithdrawal
                ? `Você tem ${formatCurrency(availableBalance)} disponível para saque`
                : `Valor mínimo para saque: ${formatCurrency(minWithdrawal)}. Você tem ${formatCurrency(availableBalance)} disponível.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Sheet open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
              <SheetTrigger asChild>
                <Button disabled={availableBalance < minWithdrawal}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </Button>
              </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Solicitar Saque</SheetTitle>
                    <SheetDescription>
                      Preencha os dados abaixo para solicitar o saque do seu saldo disponível
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="pixKey">Chave PIX</Label>
                      <Input
                        id="pixKey"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="CPF, e-mail, telefone ou chave aleatória"
                      />
                    </div>
                    <div>
                      <Label htmlFor="withdrawalType">Tipo de Saque</Label>
                      <select
                        id="withdrawalType"
                        value={withdrawalType}
                        onChange={(e) => setWithdrawalType(e.target.value as 'CPF' | 'CNPJ')}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="CPF">CPF (Pessoa Física)</option>
                        <option value="CNPJ">CNPJ (Pessoa Jurídica)</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        Confirmo que as informações estão corretas
                      </Label>
                    </div>
                    <Button
                      onClick={handleRequestWithdrawal}
                      disabled={requestWithdrawalMutation.isPending}
                      className="w-full"
                    >
                      {requestWithdrawalMutation.isPending ? 'Processando...' : 'Solicitar Saque'}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>

        {/* Histórico de Saques */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Histórico de Saques</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWithdrawals ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !withdrawals || withdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum saque realizado ainda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal: any) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                      <TableCell>{formatCurrency(Number(withdrawal.amount))}</TableCell>
                      <TableCell>{withdrawal.withdrawalType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            withdrawal.status === 'COMPLETED'
                              ? 'default'
                              : withdrawal.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {withdrawal.status === 'COMPLETED'
                            ? 'Concluído'
                            : withdrawal.status === 'PENDING'
                            ? 'Pendente'
                            : withdrawal.status === 'PROCESSING'
                            ? 'Processando'
                            : 'Falhou'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Lista de Indicados */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Indicados</CardTitle>
            <CardDescription>
              Últimos 10 cadastros realizados através do seu link (dados mascarados por segurança)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReferrals ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !referrals || referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum indicado ainda. Compartilhe seu link para começar!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral: any) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        {referral.referredUser?.maskedName || 'Sem nome'}
                      </TableCell>
                      <TableCell>{referral.referredUser?.maskedEmail || '***@***.***'}</TableCell>
                      <TableCell>{formatDate(referral.createdAt)}</TableCell>
                      <TableCell>
                        {referral.hasActiveSubscription ? (
                          <Badge variant="default">Assinatura Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Sem Assinatura</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Link para Regulamento */}
        <div className="mt-8 text-center">
          <a
            href="/affiliate-terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Ver regulamento completo
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

