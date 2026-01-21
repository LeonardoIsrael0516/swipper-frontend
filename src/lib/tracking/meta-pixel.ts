declare global {
  interface Window {
    fbq: (
      action: string,
      eventName: string,
      params?: Record<string, any>
    ) => void;
    _fbq: any;
  }
}

let pixelInitialized = false;

/**
 * Inicializa o Meta Pixel
 */
export function initMetaPixel(pixelId: string): void {
  if (pixelInitialized || !pixelId) {
    return;
  }

  // Verificar se já existe
  if (window.fbq) {
    pixelInitialized = true;
    return;
  }

  // Criar script do pixel
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Criar noscript fallback
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);

  pixelInitialized = true;
}

/**
 * Dispara evento do Meta Pixel
 */
export function trackMetaPixelEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (!window.fbq || !pixelInitialized) {
    console.warn('Meta Pixel not initialized');
    return;
  }

  try {
    window.fbq('track', eventName, params || {});
  } catch (error) {
    console.error('Error tracking Meta Pixel event:', error);
  }
}

/**
 * Eventos específicos do Meta Pixel
 */
export const MetaPixelEvents = {
  ViewContent: (params?: { content_ids?: string[]; content_type?: string; value?: number; currency?: string }) => {
    trackMetaPixelEvent('ViewContent', params);
  },
  Lead: (params?: Record<string, any>) => {
    trackMetaPixelEvent('Lead', params);
  },
  CompleteRegistration: (params?: Record<string, any>) => {
    trackMetaPixelEvent('CompleteRegistration', params);
  },
  SignUp: (params?: Record<string, any>) => {
    trackMetaPixelEvent('SignUp', params);
  },
  AddToCart: (params?: { content_ids?: string[]; content_type?: string; value?: number; currency?: string }) => {
    trackMetaPixelEvent('AddToCart', params);
  },
  InitiateCheckout: (params?: { content_ids?: string[]; content_type?: string; value?: number; currency?: string }) => {
    trackMetaPixelEvent('InitiateCheckout', params);
  },
  AddPaymentInfo: (params?: { content_ids?: string[]; content_type?: string; value?: number; currency?: string }) => {
    trackMetaPixelEvent('AddPaymentInfo', params);
  },
  Purchase: (params?: { content_ids?: string[]; content_type?: string; value?: number; currency?: string }) => {
    trackMetaPixelEvent('Purchase', params);
  },
};

