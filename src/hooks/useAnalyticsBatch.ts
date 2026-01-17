import { useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

interface AnalyticsEvent {
  visitId: string;
  eventType: 'view' | 'interaction' | 'time_spent';
  slideId?: string;
  duration?: number;
  metadata?: any;
}

interface QueuedEvent extends AnalyticsEvent {
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const BATCH_DELAY = 2000; // 2000ms (2 segundos) para agrupar eventos - aumentado para reduzir requisições
const MAX_BATCH_SIZE = 10; // Máximo de eventos por batch

export function useAnalyticsBatch() {
  const queueRef = useRef<QueuedEvent[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const flushBatch = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const eventsToSend = [...queueRef.current];
    queueRef.current = [];

    // Agrupar eventos por visitId
    const eventsByVisit = eventsToSend.reduce((acc, event) => {
      if (!acc[event.visitId]) {
        acc[event.visitId] = [];
      }
      acc[event.visitId].push(event);
      return acc;
    }, {} as Record<string, QueuedEvent[]>);

    // Enviar batches por visitId
    const sendPromises = Object.entries(eventsByVisit).map(async ([visitId, events]) => {
      // Limitar tamanho do batch
      const batches = [];
      for (let i = 0; i < events.length; i += MAX_BATCH_SIZE) {
        batches.push(events.slice(i, i + MAX_BATCH_SIZE));
      }

      for (const batch of batches) {
        try {
          // Enviar eventos em batch usando endpoint batch
          await api.publicPost(`/analytics/visit/${visitId}/events`, {
            events: batch.map((event) => ({
              eventType: event.eventType,
              slideId: event.slideId,
              duration: event.duration,
              metadata: event.metadata,
            })),
          });
        } catch (error) {
          // Se falhar, re-adicionar eventos à fila se ainda tiver retries
          batch.forEach((event) => {
            if (event.retries < MAX_RETRIES) {
              queueRef.current.push({
                ...event,
                retries: event.retries + 1,
              });
            }
          });
        }
      }
    });

    await Promise.allSettled(sendPromises);
    isProcessingRef.current = false;

    // Se ainda houver eventos na fila, agendar próximo flush
    if (queueRef.current.length > 0) {
      batchTimeoutRef.current = setTimeout(flushBatch, BATCH_DELAY);
    }
  }, []);

  const queueEvent = useCallback(
    (event: AnalyticsEvent) => {
      queueRef.current.push({
        ...event,
        timestamp: Date.now(),
        retries: 0,
      });

      // Limpar timeout anterior
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      // Agendar flush após delay
      batchTimeoutRef.current = setTimeout(flushBatch, BATCH_DELAY);
    },
    [flushBatch]
  );

  // Flush ao desmontar ou antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Usar sendBeacon para eventos críticos
      if (queueRef.current.length > 0 && navigator.sendBeacon) {
        const events = queueRef.current;
        const data = JSON.stringify({ events });
        const blob = new Blob([data], { type: 'application/json' });
        // Enviar para endpoint de batch (se implementado) ou ignorar
        // Por enquanto, apenas limpar a fila
        queueRef.current = [];
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      // Tentar enviar eventos restantes
      if (queueRef.current.length > 0) {
        flushBatch();
      }
    };
  }, [flushBatch]);

  return { queueEvent, flushBatch };
}

