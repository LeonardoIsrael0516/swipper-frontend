import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, TestTube, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface EmailProvider {
  id: string;
  provider: 'SMTP' | 'SENDGRID';
  name: string;
  isActive: boolean;
  config: any;
  createdAt: string;
  updatedAt: string;
}

interface EmailProviderListProps {
  providers: EmailProvider[];
  onRefresh: () => void;
  onEdit: (provider: EmailProvider) => void;
}

export function EmailProviderList({ providers, onRefresh, onEdit }: EmailProviderListProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState<string>('seckodb@gmail.com');

  const handleTest = async (id: string, email?: string) => {
    setTestingId(id);
    setTestDialogOpen(null);
    
    // Usar email informado ou padrão
    const emailToTest = email || testEmail || 'seckodb@gmail.com';
    
    try {
      const response = await api.testEmailProvider<any>(id, emailToTest);
      
      // Tratar diferentes formatos de resposta
      const result = response?.data || response;
      
      if (result && typeof result === 'object') {
        if (result.success === true) {
          toast.success('Teste de conexão bem-sucedido!', {
            description: result.message || `Email de teste enviado para ${emailToTest}`,
          });
        } else {
          toast.error('Teste de conexão falhou', {
            description: result.message || 'Erro desconhecido ao testar conexão',
          });
        }
      } else {
        // Se não tem formato esperado, assumir sucesso se status foi 200/201
        toast.success('Teste de conexão realizado', {
          description: `Email de teste enviado para ${emailToTest}`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão', {
        description: error.message || error.error || 'Erro desconhecido',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteEmailProvider(id);
      toast.success('Provedor de email removido com sucesso');
      onRefresh();
    } catch (error: any) {
      toast.error('Erro ao remover provedor', {
        description: error.message || 'Erro desconhecido',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    setTogglingId(id);
    try {
      await api.toggleEmailProviderActive(id);
      toast.success('Status do provedor atualizado');
      onRefresh();
    } catch (error: any) {
      toast.error('Erro ao atualizar status', {
        description: error.message || 'Erro desconhecido',
      });
    } finally {
      setTogglingId(null);
    }
  };

  if (providers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhum provedor de email configurado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <Card key={provider.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{provider.name}</CardTitle>
                <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                  {provider.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Inativo
                    </>
                  )}
                </Badge>
                <Badge variant="outline">{provider.provider}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={testDialogOpen === provider.id} onOpenChange={(open) => setTestDialogOpen(open ? provider.id : null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={testingId === provider.id}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      {testingId === provider.id ? 'Testando...' : 'Testar'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar email de teste</DialogTitle>
                      <DialogDescription>
                        Digite o endereço de email para onde deseja enviar o email de teste.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="test-email">Email de destino</Label>
                      <Input
                        id="test-email"
                        type="email"
                        placeholder="seckodb@gmail.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setTestDialogOpen(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => handleTest(provider.id, testEmail)}
                        disabled={testingId === provider.id || !testEmail}
                      >
                        {testingId === provider.id ? 'Enviando...' : 'Enviar teste'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(provider)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant={provider.isActive ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => handleToggleActive(provider.id)}
                  disabled={togglingId === provider.id}
                >
                  {togglingId === provider.id
                    ? 'Atualizando...'
                    : provider.isActive
                    ? 'Desativar'
                    : 'Ativar'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === provider.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover o provedor "{provider.name}"?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(provider.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <CardDescription>
              Criado em {new Date(provider.createdAt).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {provider.provider === 'SMTP' && (
                <div className="space-y-1">
                  <p>
                    <strong>Host:</strong> {provider.config.host}
                  </p>
                  <p>
                    <strong>Porta:</strong> {provider.config.port}
                  </p>
                  <p>
                    <strong>Usuário:</strong> {provider.config.user}
                  </p>
                  {provider.config.fromEmail && (
                    <p>
                      <strong>Email de origem:</strong> {provider.config.fromEmail}
                    </p>
                  )}
                </div>
              )}
              {provider.provider === 'SENDGRID' && (
                <div className="space-y-1">
                  <p>
                    <strong>API Key:</strong> ••••••••••••••••
                  </p>
                  {provider.config.fromEmail && (
                    <p>
                      <strong>Email de origem:</strong> {provider.config.fromEmail}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

