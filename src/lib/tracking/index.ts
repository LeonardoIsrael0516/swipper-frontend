import { initMetaPixel, MetaPixelEvents, trackMetaPixelEvent } from './meta-pixel';
import { initGoogleTag, GoogleTagEvents, trackGoogleTagEvent } from './google-tag';
import { initUtmify, getUTM } from './utmify';

export interface TrackingSettings {
  trackingEnabled?: boolean;
  metaPixelId?: string;
  googleTagId?: string;
  utmifyApiKey?: string;
}

let trackingInitialized = false;

/**
 * Inicializa todos os serviços de tracking
 */
export function initTracking(settings: TrackingSettings): void {
  if (trackingInitialized) {
    return;
  }

  if (!settings.trackingEnabled) {
    console.log('Tracking is disabled');
    return;
  }

  // Inicializar UTMify (sempre, para capturar UTMs)
  initUtmify(settings.utmifyApiKey);

  // Inicializar Meta Pixel
  if (settings.metaPixelId) {
    initMetaPixel(settings.metaPixelId);
  }

  // Inicializar Google Tag
  if (settings.googleTagId) {
    initGoogleTag(settings.googleTagId);
  }

  trackingInitialized = true;
}

/**
 * Exporta todos os eventos e funções
 */
export const TrackingEvents = {
  meta: MetaPixelEvents,
  google: GoogleTagEvents,
};

// Exportar funções diretamente
export { getUTM, sendUtmifyConversion } from './utmify';
export { trackMetaPixelEvent } from './meta-pixel';
export { trackGoogleTagEvent } from './google-tag';

