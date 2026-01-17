import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBuilder } from '@/contexts/BuilderContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Code, Eye } from 'lucide-react';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  Webhook,
  WebhookAuthType,
  WebhookMethod,
  WEBHOOK_EVENTS,
} from '@/types/webhook';

const webhookSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  url: z.string().url('URL inválida').refine((url) => url.startsWith('http://') || url.startsWith('https://'), {
    message: 'URL deve usar HTTP ou HTTPS',
  }),
  method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
  authType: z.enum(['none', 'bearer', 'basic', 'custom']).default('none'),
  authToken: z.string().optional(),
  authHeader: z.string().optional(),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento'),
  enabled: z.boolean().default(true),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

interface WebhookFormProps {
  webhook?: Webhook;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WebhookForm({ webhook, onSuccess, onCancel }: WebhookFormProps) {
  const { reel } = useBuilder();
  const [showAdvancedConditions, setShowAdvancedConditions] = useState(false);
  const [conditionsJson, setConditionsJson] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: webhook
      ? {
          name: webhook.name,
          url: webhook.url,
          method: webhook.method,
          authType: webhook.authType || 'none',
          authToken: webhook.authToken || '',
          authHeader: webhook.authHeader || '',
          events: webhook.events,
          enabled: webhook.enabled,
        }
      : {
          name: '',
          url: '',
          method: 'POST',
          authType: 'none',
          authToken: '',
          authHeader: '',
          events: ['form_submit'], // Selecionar automaticamente o único evento disponível
          enabled: true,
        },
  });

  const authType = watch('authType');
  const selectedEvents = watch('events');
  const formData = watch();

  useEffect(() => {
    if (webhook?.conditions) {
      setConditionsJson(JSON.stringify(webhook.conditions, null, 2));
    }
  }, [webhook]);

  // Garantir que form_submit está sempre selecionado quando há apenas um evento
  useEffect(() => {
    if (WEBHOOK_EVENTS.length === 1 && (!selectedEvents || selectedEvents.length === 0)) {
      setValue('events', ['form_submit']);
    }
  }, [selectedEvents, setValue]);

  const onSubmit = async (data: WebhookFormData) => {
    if (!reel) {
      toast.error('Reel não encontrado');
      return;
    }

    try {
      let conditions: any = null;
      if (showAdvancedConditions && conditionsJson.trim()) {
        try {
          conditions = JSON.parse(conditionsJson);
        } catch {
          toast.error('JSON de condições inválido');
          return;
        }
      }

      const payload: CreateWebhookDto | UpdateWebhookDto = {
        reelId: reel.id,
        name: data.name,
        url: data.url,
        method: data.method,
        authType: data.authType as WebhookAuthType,
        authToken: data.authToken || undefined,
        authHeader: data.authHeader || undefined,
        events: data.events,
        conditions: conditions || undefined,
        enabled: data.enabled,
      };

      if (webhook) {
        await api.updateWebhook(webhook.id, payload);
        toast.success('Webhook atualizado com sucesso!');
      } else {
        await api.createWebhook(payload);
        toast.success('Webhook criado com sucesso!');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar webhook');
    }
  };

  const toggleEvent = (eventValue: string) => {
    const currentEvents = selectedEvents || [];
    if (currentEvents.includes(eventValue)) {
      setValue('events', currentEvents.filter((e) => e !== eventValue));
    } else {
      setValue('events', [...currentEvents, eventValue]);
    }
  };

  const generatePreview = () => {
    const samplePayload = {
      event: selectedEvents[0] || 'form_submit',
      timestamp: new Date().toISOString(),
      reel: {
        id: reel?.id || 'reel-id',
        title: reel?.title || 'Meu Quiz',
        slug: reel?.slug || 'meu-quiz',
      },
      visit: {
        id: 'visit-id',
        visitorId: 'visitor-id',
        startedAt: new Date().toISOString(),
      },
      data: {
        // Dados específicos do evento
        formData: { email: 'exemplo@email.com', nome: 'João Silva' },
      },
    };

    return JSON.stringify(samplePayload, null, 2);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Configure as informações principais do webhook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Webhook *</Label>
            <Input id="name" {...register('name')} placeholder="Meu Webhook" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              {...register('url')}
              placeholder="https://api.exemplo.com/webhook"
              type="url"
            />
            {errors.url && <p className="text-sm text-red-500">{errors.url.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Método HTTP</Label>
            <Select
              value={watch('method')}
              onValueChange={(value) => setValue('method', value as WebhookMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autenticação</CardTitle>
          <CardDescription>Configure a autenticação do webhook (opcional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authType">Tipo de Autenticação</Label>
            <Select
              value={authType || 'none'}
              onValueChange={(value) => setValue('authType', value as WebhookAuthType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="custom">Header Customizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {authType === 'bearer' && (
            <div className="space-y-2">
              <Label htmlFor="authToken">Bearer Token *</Label>
              <Input
                id="authToken"
                {...register('authToken')}
                type="password"
                placeholder="seu-token-aqui"
              />
            </div>
          )}

          {authType === 'basic' && (
            <div className="space-y-2">
              <Label htmlFor="authToken">Credenciais (Base64) *</Label>
              <Input
                id="authToken"
                {...register('authToken')}
                type="password"
                placeholder="base64(username:password)"
              />
            </div>
          )}

          {authType === 'custom' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="authHeader">Nome do Header *</Label>
                <Input
                  id="authHeader"
                  {...register('authHeader')}
                  placeholder="X-API-Key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authToken">Valor *</Label>
                <Input
                  id="authToken"
                  {...register('authToken')}
                  type="password"
                  placeholder="valor-do-header"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos</CardTitle>
          <CardDescription>Evento que dispara este webhook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {WEBHOOK_EVENTS.length === 1 ? (
            // Se houver apenas um evento, mostrar como informação (não editável)
            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <Label className="font-medium">
                    {WEBHOOK_EVENTS[0].label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {WEBHOOK_EVENTS[0].description}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Se houver múltiplos eventos, mostrar checkboxes
            <div className="space-y-3">
              {WEBHOOK_EVENTS.map((event) => (
                <div key={event.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={`event-${event.value}`}
                    checked={selectedEvents?.includes(event.value) || false}
                    onCheckedChange={() => toggleEvent(event.value)}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`event-${event.value}`}
                      className="font-medium cursor-pointer"
                    >
                      {event.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {errors.events && (
            <p className="text-sm text-red-500">{errors.events.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condições Avançadas</CardTitle>
          <CardDescription>Configure condições para quando o webhook deve ser disparado (opcional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible open={showAdvancedConditions} onOpenChange={setShowAdvancedConditions}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                {showAdvancedConditions ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ocultar Condições Avançadas
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Mostrar Condições Avançadas
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="conditions">JSON de Condições</Label>
                <Textarea
                  id="conditions"
                  value={conditionsJson}
                  onChange={(e) => setConditionsJson(e.target.value)}
                  placeholder='{"operator": "AND", "conditions": [...]}'
                  className="font-mono text-sm"
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Use JSON para definir condições complexas. Exemplo: verificar se email contém "@gmail.com" ou se duração é maior que 60 segundos.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview do Payload
          </CardTitle>
          <CardDescription>Veja como será o payload enviado</CardDescription>
        </CardHeader>
        <CardContent>
          <Collapsible open={showPreview} onOpenChange={setShowPreview}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full mb-4">
                {showPreview ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ocultar Preview
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Mostrar Preview
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-xs overflow-auto">
                  <code>{generatePreview()}</code>
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={watch('enabled')}
                onCheckedChange={(checked) => setValue('enabled', checked)}
              />
              <Label htmlFor="enabled">Webhook Habilitado</Label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : webhook ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

