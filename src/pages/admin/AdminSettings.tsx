import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save, Settings } from 'lucide-react';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [emailVerificationProviders, setEmailVerificationProviders] = useState<string[]>(['SENDGRID']);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const response = await api.getSettings();
      return (response as any).data || response;
    },
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setRequireEmailVerification(settings.requireEmailVerification || false);
      setEmailVerificationProviders(
        (settings.emailVerificationProviders as string[]) || ['SENDGRID']
      );
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings({
        requireEmailVerification,
        emailVerificationProviders,
      });
      
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderToggle = (provider: string) => {
    setEmailVerificationProviders((prev) => {
      if (prev.includes(provider)) {
        // Se está marcado, remover (mas garantir que pelo menos um fique marcado)
        const newProviders = prev.filter((p) => p !== provider);
        return newProviders.length > 0 ? newProviders : ['SENDGRID'];
      } else {
        // Se não está marcado, adicionar
        return [...prev, provider];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações gerais da plataforma</p>
      </div>

      <Tabs defaultValue="signup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="signup">
            <Settings className="w-4 h-4 mr-2" />
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Cadastro</CardTitle>
              <CardDescription>
                Configure as opções de cadastro e verificação de email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Require Email Verification */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-verification" className="text-base">
                    Exigir confirmação de email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Se habilitado, usuários precisarão verificar o email antes de publicar swippers
                  </p>
                </div>
                <Switch
                  id="require-verification"
                  checked={requireEmailVerification}
                  onCheckedChange={setRequireEmailVerification}
                />
              </div>

              {/* Email Providers */}
              {requireEmailVerification && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-base">Provedores de email para verificação</Label>
                    <p className="text-sm text-muted-foreground">
                      Selecione quais provedores usar para envio de emails de verificação.
                      SendGrid será usado por padrão, SMTP como fallback para reenvio.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="sendgrid"
                        checked={emailVerificationProviders.includes('SENDGRID')}
                        onCheckedChange={() => handleProviderToggle('SENDGRID')}
                        disabled={emailVerificationProviders.length === 1 && emailVerificationProviders.includes('SENDGRID')}
                      />
                      <Label
                        htmlFor="sendgrid"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        SendGrid
                        {emailVerificationProviders.includes('SENDGRID') && emailVerificationProviders[0] === 'SENDGRID' && (
                          <span className="ml-2 text-xs text-muted-foreground">(Padrão)</span>
                        )}
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="smtp"
                        checked={emailVerificationProviders.includes('SMTP')}
                        onCheckedChange={() => handleProviderToggle('SMTP')}
                        disabled={emailVerificationProviders.length === 1 && emailVerificationProviders.includes('SMTP')}
                      />
                      <Label
                        htmlFor="smtp"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        SMTP
                        {emailVerificationProviders.includes('SMTP') && emailVerificationProviders.length > 1 && (
                          <span className="ml-2 text-xs text-muted-foreground">(Fallback para reenvio)</span>
                        )}
                      </Label>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground pt-2">
                    <strong>Nota:</strong> SendGrid será usado primeiro para envio inicial.
                    SMTP será usado como fallback quando o usuário solicitar reenvio do email de verificação.
                  </p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

