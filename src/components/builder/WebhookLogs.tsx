import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WebhookLog } from '@/types/webhook';
import { CheckCircle2, XCircle, Clock, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WebhookLogsProps {
  webhookId: string;
}

interface WebhookLogsResponse {
  logs: WebhookLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function WebhookLogs({ webhookId }: WebhookLogsProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const { data, isLoading } = useQuery<WebhookLogsResponse>({
    queryKey: ['webhook-logs', webhookId, page, statusFilter],
    queryFn: async () => {
      const query: any = { page, limit: 20 };
      if (statusFilter !== 'all') {
        query.status = statusFilter;
      }
      const response = await api.getWebhookLogs(webhookId, query);
      return (response as any).data || response;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Sucesso
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!data || data.logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum log encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Status Code</TableHead>
                <TableHead>Retry</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.eventType}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    {log.statusCode ? (
                      <Badge
                        variant={
                          log.statusCode >= 200 && log.statusCode < 300
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {log.statusCode}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.retryCount > 0 ? (
                      <Badge variant="outline">{log.retryCount}x</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {data.page} de {data.totalPages} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de Detalhes do Log */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Informações</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    {getStatusBadge(selectedLog.status)}
                  </p>
                  <p>
                    <span className="font-medium">Evento:</span> {selectedLog.eventType}
                  </p>
                  <p>
                    <span className="font-medium">Data:</span>{' '}
                    {format(new Date(selectedLog.createdAt), "dd/MM/yyyy 'às' HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </p>
                  {selectedLog.statusCode && (
                    <p>
                      <span className="font-medium">Status Code:</span> {selectedLog.statusCode}
                    </p>
                  )}
                  {selectedLog.retryCount > 0 && (
                    <p>
                      <span className="font-medium">Tentativas:</span> {selectedLog.retryCount}
                    </p>
                  )}
                  {selectedLog.error && (
                    <p>
                      <span className="font-medium">Erro:</span>{' '}
                      <span className="text-red-500">{selectedLog.error}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Payload Enviado</h4>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-xs overflow-auto">
                    <code>{JSON.stringify(selectedLog.payload, null, 2)}</code>
                  </pre>
                </div>
              </div>

              {selectedLog.response && (
                <div>
                  <h4 className="font-semibold mb-2">Resposta Recebida</h4>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-xs overflow-auto">
                      <code>
                        {typeof selectedLog.response === 'string'
                          ? selectedLog.response
                          : JSON.stringify(selectedLog.response, null, 2)}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

