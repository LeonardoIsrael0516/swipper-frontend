import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift,
  Settings,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Percent,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export default function AdminAffiliates() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [affiliatesPage, setAffiliatesPage] = useState(1);
  const [referralsPage, setReferralsPage] = useState(1);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<string>('');
  const [editingCommissionAffiliate, setEditingCommissionAffiliate] = useState<string | null>(null);
  const [customCommissionValue, setCustomCommissionValue] = useState<string>('');
  const queryClient = useQueryClient();

  // Buscar configurações
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin-affiliate-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/affiliates/settings');
      return (response as any).data || response;
    },
  });

  // Buscar afiliados
  const { data: affiliatesData, isLoading: isLoadingAffiliates, error: affiliatesError } = useQuery({
    queryKey: ['admin-affiliates', searchTerm, affiliatesPage],
    queryFn: async () => {
      const response = await api.get(`/admin/affiliates?search=${searchTerm || ''}&page=${affiliatesPage}&limit=10`);
      // api.get já extrai o data automaticamente, então response já é o objeto { data, total, page, ... }
      return response;
    },
  });

  // Buscar referrals
  const { data: referralsData, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['admin-affiliate-referrals', referralsPage],
    queryFn: async () => {
      const response = await api.get(`/admin/affiliates/referrals/all?page=${referralsPage}&limit=10`);
      // api.get já extrai o data automaticamente
      return response;
    },
  });

  // Buscar saques
  const { data: withdrawalsData, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['admin-affiliate-withdrawals', withdrawalsPage, withdrawalStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: withdrawalsPage.toString(),
        limit: '10',
      });
      if (withdrawalStatusFilter) {
        params.append('status', withdrawalStatusFilter);
      }
      const response = await api.get(`/admin/affiliates/withdrawals/all?${params.toString()}`);
      // api.get já extrai o data automaticamente
      return response;
    },
  });

  // Atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/admin/affiliates/settings', data);
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-settings'] });
      toast.success('Configurações atualizadas com sucesso!');
      setSettingsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar configurações');
    },
  });

  // Processar saque
  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, invoiceUrl }: { id: string; invoiceUrl?: string }) => {
      const response = await api.put(`/admin/affiliates/withdrawals/${id}/process`, {
        invoiceUrl,
      });
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-withdrawals'] });
      toast.success('Saque processado com sucesso!');
      setProcessingWithdrawal(null);
      setInvoiceUrl('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao processar saque');
    },
  });

  // Toggle status do afiliado
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/admin/affiliates/${id}/toggle`);
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      toast.success('Status do afiliado atualizado!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar status');
    },
  });

  // Atualizar comissão do afiliado
  const updateCommissionMutation = useMutation({
    mutationFn: async ({ id, commission }: { id: string; commission: number | null }) => {
      const response = await api.put(`/admin/affiliates/${id}/commission`, {
        customCommissionPercentage: commission,
      });
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
      toast.success('Comissão atualizada com sucesso!');
      setEditingCommissionAffiliate(null);
      setCustomCommissionValue('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar comissão');
    },
  });

  const handleOpenEditCommission = (affiliate: any) => {
    setEditingCommissionAffiliate(affiliate.id);
    if (affiliate.customCommissionPercentage !== null && affiliate.customCommissionPercentage !== undefined) {
      setCustomCommissionValue(Number(affiliate.customCommissionPercentage).toString());
    } else {
      setCustomCommissionValue('');
    }
  };

  const handleSaveCommission = () => {
    if (!editingCommissionAffiliate) return;

    const commissionValue = customCommissionValue.trim() === '' ? null : parseFloat(customCommissionValue);
    if (commissionValue !== null && (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100)) {
      toast.error('Comissão deve ser um número entre 0 e 100');
      return;
    }

    updateCommissionMutation.mutate({
      id: editingCommissionAffiliate,
      commission: commissionValue,
    });
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = {};

    if (formData.get('commissionPercentage')) {
      data.commissionPercentage = parseFloat(formData.get('commissionPercentage') as string);
    }
    if (formData.get('commissionMonths')) {
      data.commissionMonths = parseInt(formData.get('commissionMonths') as string);
    }
    if (formData.get('cookieDuration')) {
      data.cookieDuration = parseInt(formData.get('cookieDuration') as string);
    }
    if (formData.get('releasePeriod')) {
      data.releasePeriod = parseInt(formData.get('releasePeriod') as string);
    }
    if (formData.get('minWithdrawal')) {
      data.minWithdrawal = parseFloat(formData.get('minWithdrawal') as string);
    }
    if (formData.get('maxWithdrawalPF')) {
      data.maxWithdrawalPF = parseFloat(formData.get('maxWithdrawalPF') as string);
    }
    if (formData.get('isActive') !== null) {
      data.isActive = formData.get('isActive') === 'on';
    }

    // Validar e parsear bonusConfig
    const bonusConfigText = formData.get('bonusConfig') as string;
    if (bonusConfigText && bonusConfigText.trim()) {
      try {
        const parsed = JSON.parse(bonusConfigText);
        data.bonusConfig = parsed;
      } catch (error) {
        toast.error('JSON de configuração de bônus inválido');
        return;
      }
    }

    updateSettingsMutation.mutate(data);
  };

  const handleProcessWithdrawal = (id: string, withdrawalType: string) => {
    if (withdrawalType === 'CNPJ' && !invoiceUrl.trim()) {
      toast.error('Para saques CNPJ, é necessário informar a URL da nota fiscal');
      return;
    }

    processWithdrawalMutation.mutate({
      id,
      invoiceUrl: withdrawalType === 'CNPJ' ? invoiceUrl.trim() : undefined,
    });
  };

  // api.get já extrai o data, então affiliatesData já é { data, total, page, ... }
  const affiliates = (affiliatesData as any)?.data || [];
  const referrals = (referralsData as any)?.data || [];
  const withdrawals = (withdrawalsData as any)?.data || [];

  // Estatísticas gerais
  const totalAffiliates = affiliates.length;
  const totalCommissions = affiliates.reduce(
    (sum: number, aff: any) => sum + (aff.stats?.totalEarned || 0),
    0,
  );
  const totalWithdrawals = withdrawals
    .filter((w: any) => w.status === 'COMPLETED')
    .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Afiliados</h1>
          <p className="text-muted-foreground">
            Configure e gerencie o programa de afiliados
          </p>
        </div>
        <Button onClick={() => setSettingsOpen(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Afiliados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAffiliates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saques Processados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalWithdrawals)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
          <TabsTrigger value="referrals">Cadastros</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
        </TabsList>

        {/* Tab: Afiliados */}
        <TabsContent value="affiliates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Afiliados</CardTitle>
                  <CardDescription>
                    Todos os usuários cadastrados no programa de afiliados
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAffiliates ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !affiliates || affiliates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum afiliado encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cadastros</TableHead>
                      <TableHead>Assinaturas</TableHead>
                      <TableHead>Total Ganho</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate: any) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>
                          <Link
                            to={`/ananindeua/affiliates/${affiliate.id}`}
                            className="text-primary hover:underline"
                          >
                            {affiliate.user?.name || 'Sem nome'}
                          </Link>
                        </TableCell>
                        <TableCell>{affiliate.user?.email}</TableCell>
                        <TableCell>{affiliate.stats?.activeReferrals || 0}</TableCell>
                        <TableCell>{affiliate.stats?.activeSubscriptions || 0}</TableCell>
                        <TableCell>
                          {formatCurrency(affiliate.stats?.totalEarned || 0)}
                        </TableCell>
                        <TableCell>
                          {affiliate.customCommissionPercentage !== null && affiliate.customCommissionPercentage !== undefined
                            ? `${Number(affiliate.customCommissionPercentage)}% (Personalizada)`
                            : `${settings?.commissionPercentage || 10}% (Padrão)`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={affiliate.isActive ? 'default' : 'secondary'}>
                            {affiliate.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditCommission(affiliate)}
                              title="Editar comissão"
                            >
                              <Percent className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleStatusMutation.mutate(affiliate.id)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {affiliate.isActive ? 'Desativar' : 'Ativar'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cadastros */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cadastros via Afiliados</CardTitle>
              <CardDescription>
                Todos os usuários que se cadastraram através de links de afiliados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReferrals ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cadastro via afiliado encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Afiliado</TableHead>
                      <TableHead>Indicado</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral: any) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          {referral.affiliate?.user?.name || referral.affiliate?.user?.email}
                        </TableCell>
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
              {(referralsData as any) && (referralsData as any).totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {(referralsData as any).page} de {(referralsData as any).totalPages} ({(referralsData as any).total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReferralsPage((p) => Math.max(1, p - 1))}
                      disabled={referralsPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReferralsPage((p) => Math.min((referralsData as any).totalPages, p + 1))}
                      disabled={referralsPage >= (referralsData as any).totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Saques */}
        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Solicitações de Saque</CardTitle>
                  <CardDescription>
                    Gerencie as solicitações de saque dos afiliados
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <select
                    value={withdrawalStatusFilter}
                    onChange={(e) => {
                      setWithdrawalStatusFilter(e.target.value);
                      setWithdrawalsPage(1);
                    }}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Todos os status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="PROCESSING">Processando</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="FAILED">Falhou</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingWithdrawals ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação de saque encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Afiliado</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal: any) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          {withdrawal.affiliate?.user?.name || withdrawal.affiliate?.user?.email}
                        </TableCell>
                        <TableCell>{formatCurrency(Number(withdrawal.amount))}</TableCell>
                        <TableCell>{withdrawal.withdrawalType}</TableCell>
                        <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
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
                          {withdrawal.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => setProcessingWithdrawal(withdrawal.id)}
                            >
                              Processar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {(withdrawalsData as any) && (withdrawalsData as any).totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {(withdrawalsData as any).page} de {(withdrawalsData as any).totalPages} ({(withdrawalsData as any).total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawalsPage((p) => Math.max(1, p - 1))}
                      disabled={withdrawalsPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawalsPage((p) => Math.min((withdrawalsData as any).totalPages, p + 1))}
                      disabled={withdrawalsPage >= (withdrawalsData as any).totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Configurações */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações do Programa de Afiliados</DialogTitle>
            <DialogDescription>
              Configure as regras e parâmetros do programa de afiliados
            </DialogDescription>
          </DialogHeader>
          {isLoadingSettings ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commissionPercentage">Porcentagem de Comissão (%)</Label>
                  <Input
                    id="commissionPercentage"
                    name="commissionPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={Number(settings?.commissionPercentage) || 10}
                  />
                </div>
                <div>
                  <Label htmlFor="commissionMonths">Meses de Comissão</Label>
                  <Input
                    id="commissionMonths"
                    name="commissionMonths"
                    type="number"
                    min="1"
                    max="12"
                    defaultValue={settings?.commissionMonths || 6}
                  />
                </div>
                <div>
                  <Label htmlFor="cookieDuration">Duração do Cookie (dias)</Label>
                  <Input
                    id="cookieDuration"
                    name="cookieDuration"
                    type="number"
                    min="1"
                    max="365"
                    defaultValue={settings?.cookieDuration || 30}
                  />
                </div>
                <div>
                  <Label htmlFor="releasePeriod">Período de Liberação (dias)</Label>
                  <Input
                    id="releasePeriod"
                    name="releasePeriod"
                    type="number"
                    min="1"
                    max="365"
                    defaultValue={settings?.releasePeriod || 33}
                  />
                </div>
                <div>
                  <Label htmlFor="minWithdrawal">Valor Mínimo de Saque (R$)</Label>
                  <Input
                    id="minWithdrawal"
                    name="minWithdrawal"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={Number(settings?.minWithdrawal) || 50}
                  />
                </div>
                <div>
                  <Label htmlFor="maxWithdrawalPF">Valor Máximo PF (R$)</Label>
                  <Input
                    id="maxWithdrawalPF"
                    name="maxWithdrawalPF"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={Number(settings?.maxWithdrawalPF) || 1900}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={settings?.isActive !== false}
                />
                <Label htmlFor="isActive">Programa Ativo</Label>
              </div>
              <div>
                <Label htmlFor="bonusConfig">Configuração de Bônus (JSON)</Label>
                <Textarea
                  id="bonusConfig"
                  name="bonusConfig"
                  rows={6}
                  defaultValue={JSON.stringify(settings?.bonusConfig || {}, null, 2)}
                  className="font-mono text-sm"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettingsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Comissão */}
      <Dialog
        open={!!editingCommissionAffiliate}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCommissionAffiliate(null);
            setCustomCommissionValue('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Comissão do Afiliado</DialogTitle>
            <DialogDescription>
              Defina uma comissão personalizada para este afiliado. Deixe vazio para usar a comissão padrão do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customCommission">Comissão Personalizada (%)</Label>
              <Input
                id="customCommission"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={customCommissionValue}
                onChange={(e) => setCustomCommissionValue(e.target.value)}
                placeholder={`Padrão: ${settings?.commissionPercentage || 10}%`}
                disabled={updateCommissionMutation.isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Valor entre 0 e 100. Deixe vazio para usar a comissão padrão ({settings?.commissionPercentage || 10}%).
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCommissionAffiliate(null);
                  setCustomCommissionValue('');
                }}
                disabled={updateCommissionMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveCommission}
                disabled={updateCommissionMutation.isPending}
              >
                {updateCommissionMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Processar Saque */}
      <Dialog
        open={!!processingWithdrawal}
        onOpenChange={(open) => {
          if (!open) {
            setProcessingWithdrawal(null);
            setInvoiceUrl('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Saque</DialogTitle>
            <DialogDescription>
              Confirme o processamento do saque. Para CNPJ, informe a URL da nota fiscal.
            </DialogDescription>
          </DialogHeader>
          {processingWithdrawal && (
            <>
              {withdrawals.find((w: any) => w.id === processingWithdrawal)?.withdrawalType ===
                'CNPJ' && (
                <div>
                  <Label htmlFor="invoiceUrl">URL da Nota Fiscal</Label>
                  <Input
                    id="invoiceUrl"
                    value={invoiceUrl}
                    onChange={(e) => setInvoiceUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setProcessingWithdrawal(null);
                    setInvoiceUrl('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    handleProcessWithdrawal(
                      processingWithdrawal,
                      withdrawals.find((w: any) => w.id === processingWithdrawal)?.withdrawalType,
                    )
                  }
                  disabled={processWithdrawalMutation.isPending}
                >
                  {processWithdrawalMutation.isPending ? 'Processando...' : 'Processar Saque'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

