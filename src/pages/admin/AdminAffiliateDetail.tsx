import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, User, Mail, Gift, DollarSign, Calendar, TrendingUp, Edit2, Save, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminAffiliateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [customCommission, setCustomCommission] = useState<string>('');

  const { data: affiliate, isLoading } = useQuery({
    queryKey: ['admin-affiliate-detail', id],
    queryFn: async () => {
      const response = await api.get(`/admin/affiliates/${id}`);
      return (response as any).data || response;
    },
    enabled: !!id,
  });

  // Inicializar valor da comissão quando dados carregarem
  useEffect(() => {
    if (affiliate?.customCommissionPercentage !== null && affiliate?.customCommissionPercentage !== undefined) {
      setCustomCommission(Number(affiliate.customCommissionPercentage).toString());
    } else {
      setCustomCommission('');
    }
  }, [affiliate]);

  const updateCommissionMutation = useMutation({
    mutationFn: async (commission: number | null) => {
      const response = await api.put(`/admin/affiliates/${id}/commission`, {
        customCommissionPercentage: commission,
      });
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-detail', id] });
      toast.success('Comissão atualizada com sucesso!');
      setIsEditingCommission(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar comissão');
    },
  });

  const handleSaveCommission = () => {
    const commissionValue = customCommission.trim() === '' ? null : parseFloat(customCommission);
    if (commissionValue !== null && (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100)) {
      toast.error('Comissão deve ser um número entre 0 e 100');
      return;
    }
    updateCommissionMutation.mutate(commissionValue);
  };

  const handleCancelEdit = () => {
    setIsEditingCommission(false);
    if (affiliate?.customCommissionPercentage !== null && affiliate?.customCommissionPercentage !== undefined) {
      setCustomCommission(Number(affiliate.customCommissionPercentage).toString());
    } else {
      setCustomCommission('');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Afiliado não encontrado</p>
          <Button onClick={() => navigate('/ananindeua/affiliates')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const activeReferrals = affiliate.referrals?.length || 0;
  const activeSubscriptions = affiliate.referrals?.filter(
    (ref: any) => ref.referredUser?.subscriptions?.length > 0,
  ).length || 0;
  const totalCommissions = affiliate.commissions?.reduce(
    (sum: number, c: any) => sum + Number(c.amount || 0),
    0,
  ) || 0;
  const paidCommissions = affiliate.commissions
    ?.filter((c: any) => c.status === 'PAID')
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0) || 0;
  const pendingCommissions = affiliate.commissions
    ?.filter((c: any) => c.status === 'PENDING')
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0) || 0;
  const availableCommissions = affiliate.commissions
    ?.filter((c: any) => c.status === 'AVAILABLE')
    .reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0) || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/ananindeua/affiliates')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold mb-2">Detalhes do Afiliado</h1>
      </div>

      {/* Informações do Afiliado */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Afiliado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{affiliate.user?.name || 'Sem nome'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{affiliate.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Token</p>
                <p className="font-mono text-sm">{affiliate.affiliateToken}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">{formatDate(affiliate.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <Badge variant={affiliate.isActive ? 'default' : 'secondary'}>
                {affiliate.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="commission" className="text-sm text-muted-foreground">
                  Comissão Personalizada
                </Label>
                {!isEditingCommission ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingCommission(true);
                      if (affiliate?.customCommissionPercentage !== null && affiliate?.customCommissionPercentage !== undefined) {
                        setCustomCommission(Number(affiliate.customCommissionPercentage).toString());
                      } else {
                        setCustomCommission('');
                      }
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={updateCommissionMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveCommission}
                      disabled={updateCommissionMutation.isPending}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              {isEditingCommission ? (
                <div className="flex gap-2">
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={customCommission}
                    onChange={(e) => setCustomCommission(e.target.value)}
                    placeholder="Ex: 15.0 (deixe vazio para usar padrão)"
                    className="flex-1"
                    disabled={updateCommissionMutation.isPending}
                  />
                  <span className="text-sm text-muted-foreground self-center">%</span>
                </div>
              ) : (
                <div>
                  <p className="font-medium">
                    {affiliate?.customCommissionPercentage !== null && affiliate?.customCommissionPercentage !== undefined
                      ? `${Number(affiliate.customCommissionPercentage)}% (Personalizada)`
                      : 'Usando comissão padrão do sistema'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {affiliate?.customCommissionPercentage !== null && affiliate?.customCommissionPercentage !== undefined
                      ? 'Este afiliado tem comissão personalizada'
                      : 'Este afiliado usa a comissão padrão configurada nas configurações'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cadastros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReferrals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingCommissions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(availableCommissions)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
          <TabsTrigger value="referrals">Indicados</TabsTrigger>
          <TabsTrigger value="bonuses">Bônus</TabsTrigger>
        </TabsList>

        {/* Tab: Comissões */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Comissões</CardTitle>
              <CardDescription>Histórico de comissões geradas</CardDescription>
            </CardHeader>
            <CardContent>
              {!affiliate.commissions || affiliate.commissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma comissão encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Mês</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Liberação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliate.commissions.map((commission: any) => (
                      <TableRow key={commission.id}>
                        <TableCell>{formatDate(commission.createdAt)}</TableCell>
                        <TableCell>{formatCurrency(Number(commission.amount))}</TableCell>
                        <TableCell>Mês {commission.periodMonth}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              commission.status === 'PAID'
                                ? 'default'
                                : commission.status === 'AVAILABLE'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {commission.status === 'PAID'
                              ? 'Pago'
                              : commission.status === 'AVAILABLE'
                              ? 'Disponível'
                              : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {commission.releasedAt
                            ? formatDate(commission.releasedAt)
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Saques */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Saques</CardTitle>
              <CardDescription>Histórico de solicitações de saque</CardDescription>
            </CardHeader>
            <CardContent>
              {!affiliate.withdrawals || affiliate.withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum saque encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliate.withdrawals.map((withdrawal: any) => (
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
                                : withdrawal.status === 'PROCESSING'
                                ? 'default'
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
                        <TableCell>
                          {withdrawal.processedAt ? formatDate(withdrawal.processedAt) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Indicados */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Indicados</CardTitle>
              <CardDescription>Usuários cadastrados através deste afiliado</CardDescription>
            </CardHeader>
            <CardContent>
              {!affiliate.referrals || affiliate.referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum indicado encontrado
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
                    {affiliate.referrals.map((referral: any) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          {referral.referredUser?.name || 'Sem nome'}
                        </TableCell>
                        <TableCell>{referral.referredUser?.email}</TableCell>
                        <TableCell>{formatDate(referral.createdAt)}</TableCell>
                        <TableCell>
                          {referral.referredUser?.subscriptions?.length > 0 ? (
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
        </TabsContent>

        {/* Tab: Bônus */}
        <TabsContent value="bonuses">
          <Card>
            <CardHeader>
              <CardTitle>Bônus</CardTitle>
              <CardDescription>Bônus concedidos ao afiliado</CardDescription>
            </CardHeader>
            <CardContent>
              {!affiliate.bonuses || affiliate.bonuses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum bônus encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plano</TableHead>
                      <TableHead>Meses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Concedido em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliate.bonuses.map((bonus: any) => (
                      <TableRow key={bonus.id}>
                        <TableCell>{bonus.plan?.name || bonus.planId}</TableCell>
                        <TableCell>{bonus.months} meses</TableCell>
                        <TableCell>
                          <Badge variant={bonus.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {bonus.status === 'ACTIVE' ? 'Ativo' : 'Expirado'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(bonus.expiresAt)}</TableCell>
                        <TableCell>{formatDate(bonus.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

