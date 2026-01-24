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

  // Verificar se há token de autenticação antes de fazer requisição
  // Em páginas públicas, não há token, então não fazemos a requisição
  const hasAuthToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  // Carregar settings do backend apenas se houver autenticação
  // Em páginas públicas, usar configurações padrão (tracking desabilitado)
  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const response = await api.getSettings();
      return (response as any).data || response;
    },
    enabled: hasAuthToken, // Só fazer requisição se houver token
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Se não houver autenticação, usar configurações padrão
  const finalSettings = hasAuthToken ? settings : {
    trackingEnabled: false,
    metaPixelId: null,
    googleTagId: null,
    utmifyApiKey: null,
  };

  // Inicializar tracking quando settings estiverem disponíveis
  useEffect(() => {
    if (finalSettings && !isInitialized) {
      const trackingSettings: TrackingSettings = {
        trackingEnabled: finalSettings.trackingEnabled || false,
        metaPixelId: finalSettings.metaPixelId,
        googleTagId: finalSettings.googleTagId,
        utmifyApiKey: finalSettings.utmifyApiKey,
      };

      initTracking(trackingSettings);
      setIsInitialized(true);
    }
  }, [finalSettings, isInitialized]);

  // Função para disparar eventos
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    if (!finalSettings?.trackingEnabled || !isInitialized) {
      return;
    }

    try {
      // Disparar no Meta Pixel
      if (finalSettings.metaPixelId) {
        const metaEvent = TrackingEvents.meta[eventName as keyof typeof TrackingEvents.meta];
        if (metaEvent) {
          (metaEvent as any)(params);
        } else {
          trackMetaPixelEvent(eventName, params);
        }
      }

      // Disparar no Google Tag
      if (finalSettings.googleTagId) {
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
    if (!finalSettings?.trackingEnabled) {
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
    console.log('sendUtmifyEvent called', { transactionId, value, currency, trackingEnabled: finalSettings?.trackingEnabled, isInitialized });
    
    if (!finalSettings?.trackingEnabled) {
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
        settings: finalSettings || null,
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

