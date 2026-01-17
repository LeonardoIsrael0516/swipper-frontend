import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useBuilder } from '@/contexts/BuilderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
}

interface CustomDomain {
  id: string;
  reelId: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  dnsRecords?: DnsRecord[];
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function CustomDomainsSettings() {
  const { reel } = useBuilder();
  const isMobile = useIsMobile();
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
  });

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
      toast.error(error.message || 'Erro ao adicionar domínio');
    },
  });

  // Mutation para verificar domínio
  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      if (!reel?.id) throw new Error('Reel não encontrado');
      const response = await api.verifyCustomDomain(reel.id, domainId);
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDomains', reel?.id] });
      toast.success('Status do domínio atualizado');
    },
    onError: (error: any) => {
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
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Domínio</CardTitle>
            <CardDescription>
              Digite o domínio que deseja usar (ex: exemplo.com ou www.exemplo.com)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <CardDescription className="mt-2">
                  {getStatusBadge(currentDomain.status)}
                </CardDescription>
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
                  Configure os registros DNS abaixo no seu provedor de domínio. A propagação pode
                  levar até 24-48 horas.
                </AlertDescription>
              </Alert>
            )}

            {currentDomain.status === 'verified' && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Domínio verificado com sucesso! Seu Swipper está disponível em{' '}
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

            {/* Instruções DNS */}
            {currentDomain.dnsRecords && currentDomain.dnsRecords.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Registros DNS a Configurar</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione os seguintes registros DNS no seu provedor de domínio (GoDaddy,
                    Namecheap, Cloudflare, etc.):
                  </p>
                </div>

                {currentDomain.dnsRecords.map((record, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono">
                            {record.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(record, null, 2))}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Nome/Host</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 px-2 py-1 bg-background rounded text-sm">
                                {record.name === '@' ? 'apex (raiz)' : record.name}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(record.name)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">Valor</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 px-2 py-1 bg-background rounded text-sm break-all">
                                {record.value}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(record.value)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {record.ttl && (
                          <div>
                            <Label className="text-xs text-muted-foreground">TTL</Label>
                            <code className="block px-2 py-1 bg-background rounded text-sm mt-1">
                              {record.ttl} segundos
                            </code>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Passos para configurar:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Acesse o painel do seu provedor de domínio</li>
                      <li>Navegue até a seção de DNS ou Zone Records</li>
                      <li>Adicione os registros acima conforme o tipo (A, CNAME ou TXT)</li>
                      <li>Aguarde a propagação (pode levar até 24-48 horas)</li>
                      <li>Clique em "Verificar" para atualizar o status</li>
                    </ol>
                  </AlertDescription>
                </Alert>
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

