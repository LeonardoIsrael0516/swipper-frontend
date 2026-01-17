import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBuilder } from '@/contexts/BuilderContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Webhook,
  WEBHOOK_EVENTS,
} from '@/types/webhook';
import {
  MoreVertical,
  Edit,
  Trash2,
  Play,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { WebhookForm } from './WebhookForm';
import { WebhookLogs } from './WebhookLogs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WebhookListProps {
  onAddNew: () => void;
}

export function WebhookList({ onAddNew }: WebhookListProps) {
  const { reel } = useBuilder();
  const queryClient = useQueryClient();
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<Webhook | null>(null);
  const [viewingLogs, setViewingLogs] = useState<Webhook | null>(null);

  const { data: webhooks, isLoading } = useQuery<Webhook[]>({
    queryKey: ['webhooks', reel?.id],
    queryFn: async () => {
      if (!reel?.id) return [];
      const response = await api.getWebhooks(reel.id);
      return (response as any).data || response;
    },
    enabled: !!reel?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return api.updateWebhook(id, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', reel?.id] });
      toast.success('Webhook atualizado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar webhook');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteWebhook(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', reel?.id] });
      toast.success('Webhook deletado');
      setDeletingWebhook(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar webhook');
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.testWebhook(id);
    },
    onSuccess: () => {
      toast.success('Teste do webhook enviado! Verifique os logs.');
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao testar webhook');
    },
  });

  const handleToggle = (webhook: Webhook) => {
    toggleMutation.mutate({ id: webhook.id, enabled: !webhook.enabled });
  };

  const handleDelete = () => {
    if (deletingWebhook) {
      deleteMutation.mutate(deletingWebhook.id);
    }
  };

  const handleTest = (webhook: Webhook) => {
    testMutation.mutate(webhook.id);
  };

  const getEventLabels = (events: string[]) => {
    return events
      .map((event) => WEBHOOK_EVENTS.find((e) => e.value === event)?.label || event)
      .join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!webhooks || webhooks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum webhook configurado</p>
          <Button onClick={onAddNew}>Criar Primeiro Webhook</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{webhook.name}</CardTitle>
                    {webhook.enabled ? (
                      <Badge variant="default" className="bg-green-500">
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
                  <CardDescription className="text-sm">
                    {webhook.url}
                  </CardDescription>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{webhook.method}</Badge>
                    {webhook.authType && webhook.authType !== 'none' && (
                      <Badge variant="outline">{webhook.authType}</Badge>
                    )}
                    <Badge variant="outline">{webhook.events.length} evento(s)</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhook.enabled}
                    onCheckedChange={() => handleToggle(webhook)}
                    disabled={toggleMutation.isPending}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingWebhook(webhook)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTest(webhook)}>
                        <Play className="w-4 h-4 mr-2" />
                        Testar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewingLogs(webhook)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingWebhook(webhook)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Eventos:</p>
                  <p className="text-sm text-muted-foreground">
                    {getEventLabels(webhook.events)}
                  </p>
                </div>
                {webhook.conditions && (
                  <div>
                    <p className="text-sm font-medium">Condições:</p>
                    <p className="text-sm text-muted-foreground">Configuradas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={!!editingWebhook} onOpenChange={(open) => !open && setEditingWebhook(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
          </DialogHeader>
          {editingWebhook && (
            <WebhookForm
              webhook={editingWebhook}
              onSuccess={() => {
                setEditingWebhook(null);
                queryClient.invalidateQueries({ queryKey: ['webhooks', reel?.id] });
              }}
              onCancel={() => setEditingWebhook(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Logs */}
      <Dialog open={!!viewingLogs} onOpenChange={(open) => !open && setViewingLogs(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logs do Webhook</DialogTitle>
          </DialogHeader>
          {viewingLogs && <WebhookLogs webhookId={viewingLogs.id} />}
        </DialogContent>
      </Dialog>

      {/* Alert de Confirmação de Deleção */}
      <AlertDialog open={!!deletingWebhook} onOpenChange={(open) => !open && setDeletingWebhook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o webhook "{deletingWebhook?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

