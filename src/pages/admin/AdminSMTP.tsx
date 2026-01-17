import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Mail, Plus } from 'lucide-react';
import { EmailProviderList, EmailProvider } from '@/components/admin/EmailProviderList';
import { SMTPConfigForm } from '@/components/admin/SMTPConfigForm';
import { SendGridConfigForm } from '@/components/admin/SendGridConfigForm';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type ViewMode = 'list' | 'create-smtp' | 'create-sendgrid' | 'edit';

export default function AdminSMTP() {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProvider, setEditingProvider] = useState<EmailProvider | undefined>();
  const [activeTab, setActiveTab] = useState<'smtp' | 'sendgrid'>('smtp');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await api.getEmailProviders<any>();
      
      // Debug: verificar formato da resposta
      if (import.meta.env.DEV) {
        console.log('Resposta da API getEmailProviders:', response);
        console.log('Tipo da resposta:', typeof response);
        console.log('É array?', Array.isArray(response));
        console.log('Keys do objeto:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      }
      
      // Tratar diferentes formatos de resposta
      let providersArray: EmailProvider[] = [];
      
      if (Array.isArray(response)) {
        providersArray = response;
      } else if (response && typeof response === 'object') {
        // Verificar se tem propriedade data que é array
        if ('data' in response && Array.isArray(response.data)) {
          providersArray = response.data;
        } 
        // Verificar se todas as propriedades são objetos EmailProvider (array de objetos)
        else if (Array.isArray(Object.values(response))) {
          const values = Object.values(response);
          if (values.length > 0 && typeof values[0] === 'object' && 'id' in values[0]) {
            providersArray = values as EmailProvider[];
          }
        }
        // Se for um objeto único com propriedades de EmailProvider
        else if ('id' in response && 'provider' in response) {
          providersArray = [response as EmailProvider];
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('Providers array final:', providersArray);
      }
      
      setProviders(providersArray);
    } catch (error: any) {
      console.error('Erro ao carregar provedores:', error);
      toast.error('Erro ao carregar provedores', {
        description: error.message || 'Erro desconhecido',
      });
      // Garantir que providers seja sempre um array mesmo em caso de erro
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await api.createEmailProvider(data);
      toast.success('Provedor de email criado com sucesso');
      setViewMode('list');
      loadProviders();
    } catch (error: any) {
      toast.error('Erro ao criar provedor', {
        description: error.message || 'Erro desconhecido',
      });
      throw error;
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingProvider) return;

    try {
      await api.updateEmailProvider(editingProvider.id, data);
      toast.success('Provedor de email atualizado com sucesso');
      setViewMode('list');
      setEditingProvider(undefined);
      loadProviders();
    } catch (error: any) {
      toast.error('Erro ao atualizar provedor', {
        description: error.message || 'Erro desconhecido',
      });
      throw error;
    }
  };

  const handleEdit = (provider: EmailProvider) => {
    setEditingProvider(provider);
    setActiveTab(provider.provider === 'SMTP' ? 'smtp' : 'sendgrid');
    setViewMode(provider.provider === 'SMTP' ? 'edit' : 'edit');
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingProvider(undefined);
  };

  // Garantir que providers seja sempre um array
  const providersArray = Array.isArray(providers) ? providers : [];
  const smtpProviders = providersArray.filter((p) => p.provider === 'SMTP');
  const sendGridProviders = providersArray.filter((p) => p.provider === 'SENDGRID');

  if (viewMode === 'create-smtp' || (viewMode === 'edit' && editingProvider?.provider === 'SMTP')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SMTP</h1>
          <p className="text-muted-foreground">Configure o servidor SMTP para envio de emails</p>
        </div>
        <SMTPConfigForm
          provider={editingProvider}
          onSubmit={editingProvider ? handleUpdate : handleCreate}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (viewMode === 'create-sendgrid' || (viewMode === 'edit' && editingProvider?.provider === 'SENDGRID')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SendGrid</h1>
          <p className="text-muted-foreground">Configure o SendGrid para envio de emails</p>
        </div>
        <SendGridConfigForm
          provider={editingProvider}
          onSubmit={editingProvider ? handleUpdate : handleCreate}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SMTP</h1>
        <p className="text-muted-foreground">Configure provedores de email para envio de emails transacionais</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'smtp' | 'sendgrid')} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="smtp">SMTP</TabsTrigger>
            <TabsTrigger value="sendgrid">SendGrid</TabsTrigger>
          </TabsList>
          <Button
            onClick={() => {
              setEditingProvider(undefined);
              setViewMode(activeTab === 'smtp' ? 'create-smtp' : 'create-sendgrid');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Provedor
          </Button>
        </div>

        <TabsContent value="smtp" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {smtpProviders.length === 0 && !loading ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Mail className="h-6 w-6" />
                      <CardTitle>Nenhum provedor SMTP configurado</CardTitle>
                    </div>
                    <CardDescription>
                      Configure um servidor SMTP para começar a enviar emails
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setViewMode('create-smtp')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Configuração SMTP
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <EmailProviderList
                  providers={smtpProviders}
                  onRefresh={loadProviders}
                  onEdit={handleEdit}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="sendgrid" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Carregando...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {sendGridProviders.length === 0 && !loading ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Mail className="h-6 w-6" />
                      <CardTitle>Nenhum provedor SendGrid configurado</CardTitle>
                    </div>
                    <CardDescription>
                      Configure o SendGrid para começar a enviar emails via API
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setViewMode('create-sendgrid')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Configuração SendGrid
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <EmailProviderList
                  providers={sendGridProviders}
                  onRefresh={loadProviders}
                  onEdit={handleEdit}
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
