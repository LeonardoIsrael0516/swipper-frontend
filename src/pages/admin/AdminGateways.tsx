import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Wallet, Plus, Edit, TestTube, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const gatewaySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  pixEnabled: z.boolean().default(false),
  cardEnabled: z.boolean().default(false),
}).refine((data) => {
  // Pelo menos uma forma de pagamento deve estar habilitada
  return data.pixEnabled || data.cardEnabled;
}, {
  message: 'Selecione pelo menos uma forma de pagamento',
  path: ['pixEnabled'],
});

type GatewayFormData = z.infer<typeof gatewaySchema>;

interface Gateway {
  id: string;
  name: string;
  isActive: boolean;
  pixEnabled: boolean;
  cardEnabled: boolean;
  config: string; // '[ENCRYPTED]'
  createdAt: string;
  updatedAt: string;
}

export default function AdminGateways() {
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GatewayFormData>({
    resolver: zodResolver(gatewaySchema),
    defaultValues: {
      name: 'efi',
      pixEnabled: false,
      cardEnabled: false,
    },
  });

  const { data: gateways, isLoading } = useQuery<Gateway[]>({
    queryKey: ['admin-gateways'],
    queryFn: async () => {
      const response = await api.getGateways<any>();
      return Array.isArray(response) ? response : [];
    },
  });

  const pixEnabled = watch('pixEnabled');
  const cardEnabled = watch('cardEnabled');

  useEffect(() => {
    if (editingGateway) {
      setValue('name', editingGateway.name);
      setValue('pixEnabled', editingGateway.pixEnabled);
      setValue('cardEnabled', editingGateway.cardEnabled);
      setShowForm(true);
    }
  }, [editingGateway, setValue]);

  const onSubmit = async (data: GatewayFormData) => {
    try {
      if (editingGateway) {
        // Remover 'name' do payload de atualização (não pode ser alterado)
        const { name, ...updateData } = data;
        await api.updateGateway(editingGateway.id, updateData);
        toast.success('Gateway atualizado com sucesso!');
      } else {
        await api.createGateway(data);
        toast.success('Gateway criado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['admin-gateways'] });
      reset();
      setEditingGateway(null);
      setShowForm(false);
    } catch (error: any) {
      toast.error('Erro ao salvar gateway: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleTest = async (id: string) => {
    try {
      setTestingId(id);
      await api.testGateway(id);
      toast.success('Conexão testada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao testar conexão: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setTestingId(null);
    }
  };

  const handleEdit = (gateway: Gateway) => {
    setEditingGateway(gateway);
    setShowForm(true);
  };

  const handleCancel = () => {
    reset();
    setEditingGateway(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Gateways de Pagamento</h1>
          <p className="text-muted-foreground">Configure os gateways de pagamento da plataforma</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Gateway
          </Button>
        )}
      </div>

      {showForm && (
      <Card>
        <CardHeader>
            <CardTitle>
              {editingGateway ? 'Editar Gateway' : 'Novo Gateway'}
            </CardTitle>
          <CardDescription>
              Configure o gateway de pagamento. As credenciais devem ser configuradas no arquivo .env do backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Gateway</Label>
                <Input
                  id="name"
                  placeholder="efi"
                  {...register('name')}
                  disabled={!!editingGateway}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  As credenciais (Client ID, Client Secret, Pix Key, Payee Code, etc.) devem ser configuradas no arquivo .env do backend.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label>Formas de Pagamento Habilitadas</Label>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pixEnabled"
                    checked={pixEnabled}
                    onCheckedChange={(checked) => setValue('pixEnabled', checked)}
                  />
                  <Label htmlFor="pixEnabled" className="cursor-pointer">
                    Pix Automático
                  </Label>
                </div>

                {pixEnabled && (
                  <div className="ml-8 p-4 bg-muted/50 rounded-lg border">
                    <p className="text-xs text-muted-foreground">
                      Configure as variáveis <code className="px-1 py-0.5 bg-background rounded">EFI_PIX_KEY</code> e{' '}
                      <code className="px-1 py-0.5 bg-background rounded">EFI_PIX_CERT_PATH</code> no arquivo .env do backend.
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="cardEnabled"
                    checked={cardEnabled}
                    onCheckedChange={(checked) => setValue('cardEnabled', checked)}
                  />
                  <Label htmlFor="cardEnabled" className="cursor-pointer">
                    Cartão de Crédito
                  </Label>
                </div>

                {cardEnabled && (
                  <div className="ml-8 p-4 bg-muted/50 rounded-lg border">
                    <p className="text-xs text-muted-foreground">
                      Configure a variável <code className="px-1 py-0.5 bg-background rounded">EFI_PAYEE_CODE</code> no arquivo .env do backend.
                    </p>
                  </div>
                )}
              </div>

              {errors.pixEnabled && (
                <p className="text-sm text-destructive">{errors.pixEnabled.message}</p>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || (!pixEnabled && !cardEnabled)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Gateway'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Gateways */}
      {!showForm && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !gateways || gateways.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum gateway configurado
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Gateway
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {gateways.map((gateway) => (
                <Card key={gateway.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{gateway.name.toUpperCase()}</h3>
                          {gateway.isActive ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-4 mt-4">
                          {gateway.pixEnabled && (
                            <Badge variant="outline">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pix Habilitado
                            </Badge>
                          )}
                          {gateway.cardEnabled && (
                            <Badge variant="outline">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Cartão Habilitado
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-2">
                          Configuração criptografada - credenciais não visíveis por segurança
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(gateway.id)}
                          disabled={testingId === gateway.id}
                        >
                          {testingId === gateway.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <TestTube className="w-4 h-4 mr-2" />
                              Testar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(gateway)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </div>
        </CardContent>
      </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
