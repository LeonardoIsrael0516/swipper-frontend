declare global {
  interface Window {
    dataLayer: any[];
    gtag: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

let gtagInitialized = false;

/**
 * Inicializa o Google Tag (GA4)
 */
export function initGoogleTag(gtagId: string): void {
  if (gtagInitialized || !gtagId) {
    return;
  }

  // Verificar se já existe
  if (window.gtag) {
    gtagInitialized = true;
    return;
  }

  // Inicializar dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', gtagId);

  // Carregar script do Google Tag
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
  document.head.appendChild(script);

  gtagInitialized = true;
}

/**
 * Dispara evento do Google Tag
 */
export function trackGoogleTagEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (!window.gtag || !gtagInitialized) {
    console.warn('Google Tag not initialized');
    return;
  }

  try {
    window.gtag('event', eventName, params || {});
  } catch (error) {
    console.error('Error tracking Google Tag event:', error);
  }
}

/**
 * Eventos específicos do Google Tag
 */
export const GoogleTagEvents = {
  pageView: (params?: Record<string, any>) => {
    trackGoogleTagEvent('page_view', params);
  },
  signUp: (params?: { method?: string }) => {
    trackGoogleTagEvent('sign_up', params);
  },
  viewItem: (params?: { items?: any[]; value?: number; currency?: string }) => {
    trackGoogleTagEvent('view_item', params);
  },
  addToCart: (params?: { items?: any[]; value?: number; currency?: string }) => {
    trackGoogleTagEvent('add_to_cart', params);
  },
  beginCheckout: (params?: { items?: any[]; value?: number; currency?: string }) => {
    trackGoogleTagEvent('begin_checkout', params);
  },
  addPaymentInfo: (params?: { items?: any[]; value?: number; currency?: string }) => {
    trackGoogleTagEvent('add_payment_info', params);
  },
  purchase: (params?: { transaction_id?: string; items?: any[]; value?: number; currency?: string }) => {
    trackGoogleTagEvent('purchase', params);
  },
};

