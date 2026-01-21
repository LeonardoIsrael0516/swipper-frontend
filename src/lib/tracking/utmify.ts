interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

const UTM_COOKIE_NAME = 'swipper_utm_params';
const UTM_COOKIE_EXPIRY_DAYS = 30;

/**
 * Salva UTMs em cookie
 */
function saveUtmToCookie(utmData: UtmData): void {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + UTM_COOKIE_EXPIRY_DAYS);

  const cookieValue = JSON.stringify(utmData);
  document.cookie = `${UTM_COOKIE_NAME}=${encodeURIComponent(cookieValue)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Recupera UTMs do cookie
 */
function getUtmFromCookie(): UtmData | null {
  const cookies = document.cookie.split(';');
  const utmCookie = cookies.find((cookie) => cookie.trim().startsWith(`${UTM_COOKIE_NAME}=`));

  if (!utmCookie) {
    return null;
  }

  try {
    const cookieValue = utmCookie.split('=')[1];
    return JSON.parse(decodeURIComponent(cookieValue)) as UtmData;
  } catch (error) {
    console.error('Error parsing UTM cookie:', error);
    return null;
  }
}

/**
 * Captura UTMs da URL
 */
export function captureUTM(): UtmData {
  const urlParams = new URLSearchParams(window.location.search);
  const utmData: UtmData = {};

  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  utmParams.forEach((param) => {
    const value = urlParams.get(param);
    if (value) {
      utmData[param as keyof UtmData] = value;
    }
  });

  // Se encontrou UTMs na URL, salvar no cookie
  if (Object.keys(utmData).length > 0) {
    saveUtmToCookie(utmData);
    return utmData;
  }

  // Se não encontrou na URL, tentar recuperar do cookie
  const savedUtm = getUtmFromCookie();
  return savedUtm || {};
}

/**
 * Salva UTMs manualmente
 */
export function saveUTM(utmData: UtmData): void {
  saveUtmToCookie(utmData);
}

/**
 * Recupera UTMs salvos
 */
export function getUTM(): UtmData {
  return getUtmFromCookie() || {};
}

/**
 * Limpa UTMs salvos
 */
export function clearUTM(): void {
  document.cookie = `${UTM_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Carrega o script do UTMify
 */
function loadUtmifyScript(apiKey?: string): void {
  // Verificar se o script já foi carregado
  if (document.querySelector('script[src*="utmify.com.br"]')) {
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://cdn.utmify.com.br/scripts/utms/latest.js';
  script.setAttribute('data-utmify-prevent-xcod-sck', '');
  script.setAttribute('data-utmify-prevent-subids', '');
  script.async = true;
  script.defer = true;

  // Se tiver API key, adicionar como atributo
  if (apiKey) {
    script.setAttribute('data-utmify-api-key', apiKey);
  }

  document.head.appendChild(script);
}

/**
 * Envia evento de conversão para UTMify via pixel/beacon
 * Como o UTMify não tem API pública documentada, usamos múltiplos métodos
 */
export function sendUtmifyConversion(
  transactionId: string,
  value: number,
  currency: string = 'BRL',
  utmData?: UtmData,
): void {
  if (typeof window === 'undefined') {
    console.warn('UTMify: window is undefined, cannot send event');
    return;
  }

  console.log('UTMify: Attempting to send conversion event', { transactionId, value, currency, utmData });

  try {
    // Construir URL com parâmetros
    const params = new URLSearchParams();
    params.append('event', 'purchase');
    params.append('transaction_id', transactionId);
    params.append('value', value.toString());
    params.append('currency', currency);

    // Adicionar UTMs se disponíveis
    if (utmData) {
      if (utmData.utm_source) params.append('utm_source', utmData.utm_source);
      if (utmData.utm_medium) params.append('utm_medium', utmData.utm_medium);
      if (utmData.utm_campaign) params.append('utm_campaign', utmData.utm_campaign);
      if (utmData.utm_term) params.append('utm_term', utmData.utm_term);
      if (utmData.utm_content) params.append('utm_content', utmData.utm_content);
    }

    // Construir URL final
    const pixelUrl = `https://cdn.utmify.com.br/track/conversion?${params.toString()}`;
    console.log('UTMify: Sending to URL:', pixelUrl);
    
    // Método 1: Usar Image beacon (aparece no Network tab)
    const img = new Image();
    img.onload = () => console.log('UTMify: Image beacon loaded successfully');
    img.onerror = (err) => console.error('UTMify: Image beacon error', err);
    img.src = pixelUrl;
    img.style.display = 'none';
    img.style.width = '1px';
    img.style.height = '1px';
    document.body.appendChild(img);
    
    // Método 2: Tentar via fetch (aparece no Network tab)
    fetch(pixelUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      keepalive: true,
    }).then(() => {
      console.log('UTMify: Fetch request sent');
    }).catch((err) => {
      console.warn('UTMify: Fetch error (expected with no-cors):', err);
    });

    // Método 3: Tentar via navigator.sendBeacon (mais confiável, mas pode não aparecer no Network tab)
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(pixelUrl);
      console.log('UTMify: sendBeacon result:', sent);
    } else {
      console.warn('UTMify: navigator.sendBeacon not available');
    }
    
    console.log('✅ UTMify conversion event sent via multiple methods:', { transactionId, value, currency });
  } catch (error) {
    console.error('❌ Error sending UTMify conversion event:', error);
  }
}

/**
 * Inicializa UTMify (captura UTMs na primeira carga e carrega script)
 */
export function initUtmify(apiKey?: string): UtmData {
  // Carregar script do UTMify
  loadUtmifyScript(apiKey);
  
  // Capturar UTMs
  return captureUTM();
}

