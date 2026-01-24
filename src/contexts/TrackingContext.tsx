import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { initTracking, TrackingEvents, getUTM, trackMetaPixelEvent, trackGoogleTagEvent, sendUtmifyConversion } from '@/lib/tracking';
import type { TrackingSettings } from '@/lib/tracking';

interface TrackingContextType {
  settings: TrackingSettings | null;
  isInitialized: boolean;
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  sendCapiEvent: (eventName: string, userData?: any, customData?: any) => Promise<void>;
  sendUtmifyEvent: (transactionId: string, value: number, currency?: string) => void;
  getUtmParams: () => Record<string, string | undefined>;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar settings do backend
  // Em páginas públicas (sem autenticação), isso vai falhar com 401, mas tratamos silenciosamente
  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      try {
        const response = await api.getSettings();
        return (response as any).data || response;
      } catch (error: any) {
        // Em páginas públicas (401), retornar configurações padrão (tracking desabilitado)
        if (error?.statusCode === 401 || error?.status === 401) {
          return {
            trackingEnabled: false,
            metaPixelId: null,
            googleTagId: null,
            utmifyApiKey: null,
          };
        }
        // Para outros erros, re-lançar
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: false, // Não tentar novamente em caso de erro 401
  });

  // Inicializar tracking quando settings estiverem disponíveis
  useEffect(() => {
    if (settings && !isInitialized) {
      const trackingSettings: TrackingSettings = {
        trackingEnabled: settings.trackingEnabled || false,
        metaPixelId: settings.metaPixelId,
        googleTagId: settings.googleTagId,
        utmifyApiKey: settings.utmifyApiKey,
      };

      initTracking(trackingSettings);
      setIsInitialized(true);
    }
  }, [settings, isInitialized]);

  // Função para disparar eventos
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (!settings?.trackingEnabled || !isInitialized) {
      return;
    }

    try {
      // Disparar no Meta Pixel
      if (settings.metaPixelId) {
        const metaEvent = TrackingEvents.meta[eventName as keyof typeof TrackingEvents.meta];
        if (metaEvent) {
          (metaEvent as any)(params);
        } else {
          trackMetaPixelEvent(eventName, params);
        }
      }

      // Disparar no Google Tag
      if (settings.googleTagId) {
        const googleEvent = TrackingEvents.google[eventName as keyof typeof TrackingEvents.google];
        if (googleEvent) {
          (googleEvent as any)(params);
        } else {
          trackGoogleTagEvent(eventName, params);
        }
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  // Função para enviar eventos CAPI via backend
  const sendCapiEvent = async (
    eventName: string,
    userData?: any,
    customData?: any
  ): Promise<void> => {
    if (!settings?.trackingEnabled) {
      return;
    }

    try {
      const utmParams = getUTM();
      
      // Preparar custom_data no formato correto
      const formattedCustomData = customData ? {
        value: customData.value,
        currency: customData.currency,
        content_ids: customData.planId ? [customData.planId] : customData.content_ids,
        content_name: customData.planName || customData.content_name,
        content_type: customData.content_type || 'subscription',
      } : undefined;

      await api.sendTrackingEvent({
        event_name: eventName,
        user_data: userData,
        custom_data: formattedCustomData,
        utm_data: utmParams,
        event_source_url: window.location.href,
        event_id: customData?.event_id,
      });
    } catch (error) {
      console.error('Error sending CAPI event:', error);
    }
  };

  // Função para obter UTMs
  const getUtmParams = (): Record<string, string | undefined> => {
    const utmData = getUTM();
    return {
      utm_source: utmData.utm_source,
      utm_medium: utmData.utm_medium,
      utm_campaign: utmData.utm_campaign,
      utm_term: utmData.utm_term,
      utm_content: utmData.utm_content,
    };
  };

  // Função para enviar evento UTMify
  const sendUtmifyEvent = (transactionId: string, value: number, currency: string = 'BRL') => {
    console.log('sendUtmifyEvent called', { transactionId, value, currency, trackingEnabled: settings?.trackingEnabled, isInitialized });
    
    if (!settings?.trackingEnabled) {
      console.warn('UTMify: Tracking is disabled');
      return;
    }

    if (!isInitialized) {
      console.warn('UTMify: Tracking not initialized yet');
      return;
    }

    try {
      const utmParams = getUTM();
      console.log('UTMify: Calling sendUtmifyConversion with UTMs:', utmParams);
      sendUtmifyConversion(transactionId, value, currency, utmParams);
    } catch (error) {
      console.error('Error sending UTMify event:', error);
    }
  };

  return (
    <TrackingContext.Provider
      value={{
        settings: settings || null,
        isInitialized,
        trackEvent,
        sendCapiEvent,
        sendUtmifyEvent,
        getUtmParams,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}

