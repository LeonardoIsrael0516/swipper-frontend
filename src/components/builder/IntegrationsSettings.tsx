import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBuilder } from '@/contexts/BuilderContext';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Plus, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookList } from './WebhookList';
import { WebhookForm } from './WebhookForm';
import { api } from '@/lib/api';

type IntegrationType = 'webhook' | 'n8n' | 'evolution' | 'zapi' | null;

export function IntegrationsSettings() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { reel } = useBuilder();
  const [openSheet, setOpenSheet] = useState<IntegrationType>(null);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Verificar se há webhooks configurados
  const { data: webhooks } = useQuery({
    queryKey: ['webhooks', reel?.id],
    queryFn: async () => {
      if (!reel?.id) return [];
      const response = await api.getWebhooks(reel.id);
      return (response as any).data || response;
    },
    enabled: !!reel?.id,
  });

  // Verificar limite de webhooks do plano
  const { data: webhookLimitCheck, isLoading: isLoadingWebhookLimit } = useQuery({
    queryKey: ['webhook-limit-check'],
    queryFn: async () => {
      const response = await api.checkWebhookLimit<any>();
      return (response as any).data || response;
    },
  });

  const isWebhookConfigured = webhooks && webhooks.length > 0;
  // canCreateWebhooks só é true se explicitamente allowed for true
  // Se ainda estiver carregando, assumir false para não permitir criar antes da verificação
  const canCreateWebhooks = isLoadingWebhookLimit ? false : (webhookLimitCheck?.allowed === true);
  const isN8nConfigured = false;
  const isEvolutionConfigured = false;
  const isZapiConfigured = false;

  // Componente do Card
  const IntegrationCard = ({ 
    type, 
    title, 
    description, 
    logo, 
    isConfigured,
    isDisabled,
    upgradeMessage,
  }: { 
    type: IntegrationType; 
    title: string; 
    description: string; 
    logo: string; 
    isConfigured: boolean;
    isDisabled?: boolean;
    upgradeMessage?: string;
  }) => (
    <Card
      className={cn(
        'transition-all relative group',
        isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:shadow-md hover:border-gray-400'
      )}
      onClick={() => !isDisabled && setOpenSheet(type)}
    >
      {isConfigured && (
        <div className="absolute -top-2 -right-2 z-20 pointer-events-none">
          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img 
              src={logo} 
              alt={title}
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {isConfigured && (
            <Badge variant="secondary" className="mt-2">
              Configurado
            </Badge>
          )}
          {isDisabled && upgradeMessage && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">{upgradeMessage}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/plans');
                }}
              >
                Fazer Upgrade
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('space-y-6', !isMobile && 'space-y-8')}>
      <div>
        <h3 className={cn('font-semibold mb-2', isMobile ? 'text-xl' : 'text-2xl')}>Integrações</h3>
        <p className="text-muted-foreground">
          Conecte seu Swipper com outras ferramentas e serviços.
        </p>
      </div>

      {/* Grid de Cards */}
      <div className={cn(
        'grid gap-4',
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
      )}>
        <IntegrationCard
          type="webhook"
          title="Webhooks"
          description="Configure webhooks para receber notificações de eventos"
          logo="/webhook.png"
          isConfigured={isWebhookConfigured}
          isDisabled={false}
        />
        <IntegrationCard
          type="n8n"
          title="n8n"
          description="Conecte com n8n para automações e workflows"
          logo="/n8n.png"
          isConfigured={isN8nConfigured}
        />
        <IntegrationCard
          type="evolution"
          title="Evolution API"
          description="Integre com Evolution API para WhatsApp"
          logo="/evoapi.png"
          isConfigured={isEvolutionConfigured}
        />
        <IntegrationCard
          type="zapi"
          title="Z-API"
          description="Conecte com Z-API para WhatsApp"
          logo="/z_api_logo.png"
          isConfigured={isZapiConfigured}
        />
      </div>

      {/* Overlay Webhooks */}
      <Sheet open={openSheet === 'webhook'} onOpenChange={(open) => {
        if (!open) {
          setOpenSheet(null);
          setActiveTab('list');
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Webhooks</SheetTitle>
            <SheetDescription>
              Configure webhooks para receber notificações de eventos do seu quiz
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={(value) => {
              // Só permitir mudar para 'create' se canCreateWebhooks for true
              if (value === 'create' && !canCreateWebhooks) {
                return;
              }
              setActiveTab(value as 'list' | 'create');
            }}>
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="list">Lista</TabsTrigger>
                  <TabsTrigger value="create" disabled={!canCreateWebhooks}>
                    Criar Novo
                  </TabsTrigger>
                </TabsList>
                {activeTab === 'list' && canCreateWebhooks && (
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Webhook
                  </Button>
                )}
                {activeTab === 'list' && !canCreateWebhooks && webhookLimitCheck?.message && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-2">
                      {webhookLimitCheck.message}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/plans')}
                    >
                      Fazer Upgrade
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
              <TabsContent value="list" className="mt-4">
                <WebhookList
                  onAddNew={() => canCreateWebhooks && setActiveTab('create')}
                  canCreate={canCreateWebhooks}
                />
              </TabsContent>
              <TabsContent value="create" className="mt-4">
                {!canCreateWebhooks ? (
                  <div className="space-y-4 py-8 text-center">
                    <p className="text-muted-foreground">
                      {webhookLimitCheck?.message || 'Seu plano não permite criar mais webhooks. Faça upgrade para usar esta funcionalidade.'}
                    </p>
                    <Button
                      onClick={() => navigate('/plans')}
                      className="mt-4"
                    >
                      Fazer Upgrade
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <WebhookForm
                    onSuccess={() => {
                      setActiveTab('list');
                      setShowWebhookForm(false);
                    }}
                    onCancel={() => {
                      setActiveTab('list');
                      setShowWebhookForm(false);
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Overlay n8n */}
      <Sheet open={openSheet === 'n8n'} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>n8n</SheetTitle>
            <SheetDescription>
              Conecte com n8n para automações e workflows personalizados
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>Integração com n8n estará disponível em breve</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Overlay Evolution API */}
      <Sheet open={openSheet === 'evolution'} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Evolution API</SheetTitle>
            <SheetDescription>
              Integre com Evolution API para enviar mensagens via WhatsApp
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>Integração com Evolution API estará disponível em breve</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Overlay Z-API */}
      <Sheet open={openSheet === 'zapi'} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Z-API</SheetTitle>
            <SheetDescription>
              Conecte com Z-API para enviar mensagens via WhatsApp
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>Integração com Z-API estará disponível em breve</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

