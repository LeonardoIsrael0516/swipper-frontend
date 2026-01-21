import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useBuilder } from '@/contexts/BuilderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DnsRecord {
  type: string;
  name: string;
  value: string | { rank?: number; value?: string };
  ttl?: number;
}

interface CustomDomain {
  id: string;
  reelId: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  dnsRecords?: DnsRecord[];
  nameservers?: string[];
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function CustomDomainsSettings() {
  const { reel } = useBuilder();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [domainInput, setDomainInput] = useState('');

  // Query para buscar domínios
  const { data: domains = [], isLoading } = useQuery<CustomDomain[]>({
    queryKey: ['customDomains', reel?.id],
    queryFn: async () => {
      if (!reel?.id) return [];
      const response = await api.getCustomDomains(reel.id);
      return (response as any).data || response;
    },
    enabled: !!reel?.id,
    // Refetch automático a cada 5 minutos se houver domínio pendente
    refetchInterval: (query) => {
      const domains = query.state.data || [];
      const hasPendingDomain = domains.some((d) => d.status === 'pending');
      return hasPendingDomain ? 300000 : false; // 5 minutos se pendente, desabilitado se não
    },
  });

  // Verificar limite de domínios customizados do plano
  const { data: domainLimitCheck } = useQuery({
    queryKey: ['custom-domain-limit-check'],
    queryFn: async () => {
      const response = await api.checkCustomDomainLimit<any>();
      return (response as any).data || response;
    },
  });

  const canCreateDomains = domainLimitCheck?.allowed !== false;

  // Mutation para adicionar domínio
  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      if (!reel?.id) throw new Error('Reel não encontrado');
      const response = await api.addCustomDomain(reel.id, domain);
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDomains', reel?.id] });
      setDomainInput('');
      toast.success('Domínio adicionado com sucesso!');
    },
    onError: (error: any) => {
      // Verificar se é erro de limite de plano (403)
      if (error.statusCode === 403 && error.message) {
        toast.error(
          <div className="flex flex-col items-start gap-2">
            <span>{error.message}</span>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                navigate('/plans');
              }}
            >
              Fazer Upgrade
            </Button>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(error.message || 'Erro ao adicionar domínio');
      }
    },
  });

  // Mutation para verificar domínio
  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      if (!reel?.id) throw new Error('Reel não encontrado');
      const response = await api.verifyCustomDomain(reel.id, domainId);
      return (response as any).data || response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customDomains', reel?.id] });
      const domain = Array.isArray(data) ? data[0] : data;
      // Só mostrar toast se o domínio foi verificado (mudou de status)
      if (domain?.status === 'verified') {
        toast.success('Domínio verificado com sucesso!');
      }
      // Não mostrar toast para verificações automáticas quando ainda está pendente
    },
    onError: (error: any) => {
      // Se o domínio não foi encontrado (404), apenas invalidar a query silenciosamente
      // Isso pode acontecer se o domínio foi removido enquanto estava sendo verificado
      if (error?.response?.status === 404 || error?.status === 404) {
        queryClient.invalidateQueries({ queryKey: ['customDomains', reel?.id] });
        return; // Não mostrar erro para 404
      }
      toast.error(error.message || 'Erro ao verificar domínio');
    },
  });

  // Mutation para remover domínio
  const removeDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      if (!reel?.id) throw new Error('Reel não encontrado');
      await api.removeCustomDomain(reel.id, domainId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDomains', reel?.id] });
      toast.success('Domínio removido com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover domínio');
    },
  });

  const handleAddDomain = () => {
    if (!domainInput.trim()) {
      toast.error('Digite um domínio válido');
      return;
    }

    addDomainMutation.mutate(domainInput.trim());
  };

  const handleVerify = (domainId: string) => {
    verifyDomainMutation.mutate(domainId);
  };

  const handleRemove = (domainId: string, domain: string) => {
    if (confirm(`Tem certeza que deseja remover o domínio ${domain}?`)) {
      removeDomainMutation.mutate(domainId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verificado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pendente
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const currentDomain = domains[0]; // Limite de 1 domínio por reel

  // Debug: verificar se nameservers estão sendo recebidos
  useEffect(() => {
    if (currentDomain) {
      console.log('🔍 Current domain data:', {
        domain: currentDomain.domain,
        nameservers: currentDomain.nameservers,
        nameserversLength: currentDomain.nameservers?.length,
        hasNameservers: currentDomain.nameservers && currentDomain.nameservers.length > 0,
        fullDomain: currentDomain,
      });
    }
  }, [currentDomain]);

  // Verificação automática quando domínio pendente é adicionado ou quando refetch acontece
  useEffect(() => {
    // Só verificar se:
    // 1. Existe um domínio atual
    // 2. O domínio está pendente
    // 3. Não há verificação em andamento
    // 4. O domínio ainda existe na lista (não foi removido)
    if (
      currentDomain?.id &&
      currentDomain?.status === 'pending' &&
      !verifyDomainMutation.isPending &&
      reel?.id &&
      domains.some((d) => d.id === currentDomain.id)
    ) {
      // Verificar automaticamente quando domínio pendente é detectado
      // Isso será chamado quando o refetchInterval atualizar os dados
      const timer = setTimeout(() => {
        // Verificar novamente se o domínio ainda existe antes de verificar
        const stillExists = domains.some((d) => d.id === currentDomain.id && d.status === 'pending');
        if (stillExists) {
          handleVerify(currentDomain.id);
        }
      }, 2000); // Aguardar 2 segundos antes de verificar

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDomain?.id, currentDomain?.status, domains]);

  return (
    <div className={cn('space-y-6', !isMobile && 'space-y-8')}>
      <div>
        <h3 className={cn('font-semibold mb-2', isMobile ? 'text-xl' : 'text-2xl')}>
          Domínios Personalizados
        </h3>
        <p className="text-muted-foreground">
          Configure um domínio personalizado para seu Swipper usando a Vercel
        </p>
      </div>

      {/* Card: Adicionar Domínio */}
      {!currentDomain && (
        <Card className={cn(canCreateDomains ? '' : 'opacity-50')}>
          <CardHeader>
            <CardTitle>Adicionar Domínio</CardTitle>
            <CardDescription>
              Digite o domínio que deseja usar (ex: exemplo.com ou www.exemplo.com)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canCreateDomains ? (
              <div className="space-y-2">
                <Label htmlFor="domain">Domínio</Label>
                <div className="flex gap-2">
                  <Input
                    id="domain"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="exemplo.com"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddDomain();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddDomain}
                    disabled={addDomainMutation.isPending || !domainInput.trim()}
                  >
                    {addDomainMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Adicionar'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">
                  {domainLimitCheck?.message || 'Seu plano não permite domínios customizados.'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => navigate('/plans')}
                >
                  Fazer Upgrade
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card: Domínio Configurado */}
      {currentDomain && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {currentDomain.domain}
                </CardTitle>
                <div className="mt-2">
                  {getStatusBadge(currentDomain.status)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleVerify(currentDomain.id)}
                  disabled={verifyDomainMutation.isPending}
                  title="Verificar status"
                >
                  <RefreshCw
                    className={cn('w-4 h-4', verifyDomainMutation.isPending && 'animate-spin')}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemove(currentDomain.id, currentDomain.domain)}
                  disabled={removeDomainMutation.isPending}
                  title="Remover domínio"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status e Informações */}
            {currentDomain.status === 'pending' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Configure os registros DNS abaixo no seu provedor de domínio para verificar e conectar seu domínio.
                </AlertDescription>
              </Alert>
            )}

            {currentDomain.status === 'verified' && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Domínio verificado e conectado com sucesso! Seu Swipper está disponível em{' '}
                  <strong>https://{currentDomain.domain}</strong>
                </AlertDescription>
              </Alert>
            )}

            {currentDomain.status === 'failed' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Falha na verificação. Verifique se os registros DNS estão configurados
                  corretamente e tente verificar novamente.
                </AlertDescription>
              </Alert>
            )}

            {/* Instruções DNS - Só mostrar se estiver pendente ou falhou */}
            {((currentDomain.dnsRecords && currentDomain.dnsRecords.length > 0) || 
              (currentDomain.nameservers && currentDomain.nameservers.length > 0)) && 
             (currentDomain.status === 'pending' || currentDomain.status === 'failed') && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Configuração do Domínio</h4>
                  <p className="text-sm text-muted-foreground">
                    Escolha uma das opções abaixo para configurar seu domínio. Você pode usar registros DNS individuais ou configurar via nameservers.
                  </p>
                </div>

                <Tabs defaultValue="dns" className="w-full">
                  <TabsList className={cn(
                    "grid w-full",
                    currentDomain.nameservers && currentDomain.nameservers.length > 0 ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    <TabsTrigger value="dns">Registros DNS</TabsTrigger>
                    {currentDomain.nameservers && currentDomain.nameservers.length > 0 && (
                      <TabsTrigger value="nameservers" title="Configurar via Nameservers">
                        Nameservers
                        <span className="ml-1 text-xs">({currentDomain.nameservers.length})</span>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Aba: Registros DNS */}
                  <TabsContent value="dns" className="space-y-4 mt-4">
                    {currentDomain.dnsRecords && currentDomain.dnsRecords.length > 0 ? (
                      <>
                        <div className="border rounded-lg overflow-hidden bg-background">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[100px]">Tipo</TableHead>
                                <TableHead className="w-[120px]">Nome</TableHead>
                                <TableHead>Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentDomain.dnsRecords.map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {record.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-mono">
                                        {record.name === '@' ? '@' : record.name}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-60 hover:opacity-100"
                                        onClick={() => copyToClipboard(record.name === '@' ? '@' : record.name)}
                                        title="Copiar nome"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-mono break-all flex-1">
                                        {String(record.value || '')}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-60 hover:opacity-100"
                                        onClick={() => copyToClipboard(String(record.value || ''))}
                                        title="Copiar valor"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Aviso sobre Cloudflare para CNAME */}
                        {currentDomain.dnsRecords.some((r) => r.type === 'CNAME') && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              <strong>Importante para Cloudflare:</strong> Se você estiver usando Cloudflare como provedor de DNS, certifique-se de que o <strong>Proxy (ícone de nuvem laranja) está desativado</strong> para o registro CNAME. O proxy deve estar <strong>cinza (DNS only)</strong> para que a verificação funcione corretamente.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Nenhum registro DNS disponível. Use a aba "Nameservers" se disponível.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  {/* Aba: Nameservers */}
                  <TabsContent value="nameservers" className="space-y-4 mt-4">
                    {currentDomain.nameservers && currentDomain.nameservers.length > 0 ? (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Configure os seguintes nameservers no seu provedor de domínio. Isso permitirá que a Vercel gerencie todos os registros DNS automaticamente.
                          </p>
                        </div>

                        <div className="border rounded-lg overflow-hidden bg-background">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">#</TableHead>
                                <TableHead>Nameserver</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentDomain.nameservers.map((ns, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <span className="text-sm font-medium">{index + 1}</span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-mono break-all flex-1">
                                        {ns}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-60 hover:opacity-100"
                                        onClick={() => copyToClipboard(ns)}
                                        title="Copiar nameserver"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Como configurar:</strong> Acesse as configurações de DNS do seu provedor de domínio e altere os nameservers para os valores listados acima. Isso pode levar algumas horas para propagar.
                          </AlertDescription>
                        </Alert>
                      </>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Nameservers não estão disponíveis para este domínio. Use a aba "Registros DNS" para configurar.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>

                <p className="text-sm text-muted-foreground">
                  Pode levar algum tempo para os registros DNS ou nameservers serem aplicados. O sistema verifica automaticamente a cada 5 minutos se o domínio foi configurado corretamente. Você também pode verificar manualmente clicando no botão de atualizar acima.
                </p>
              </div>
            )}

            {/* Link do domínio quando verificado */}
            {currentDomain.status === 'verified' && (
              <div className="space-y-2">
                <Label>URL do Swipper</Label>
                <div className="flex gap-2">
                  <Input
                    value={`https://${currentDomain.domain}`}
                    readOnly
                    className="bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`https://${currentDomain.domain}`)}
                    title="Copiar URL"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`https://${currentDomain.domain}`, '_blank')}
                    title="Abrir em nova aba"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

