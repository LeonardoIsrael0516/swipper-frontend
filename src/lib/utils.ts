import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper para detectar se está sendo acessado via domínio personalizado
 * @returns true se o hostname atual não está na lista de domínios principais da plataforma
 */
export function isCustomDomain(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname.toLowerCase();
  const mainDomains = [
    'swipper.me',
    'www.swipper.me',
    'app.swipper.me',
    'localhost',
    '127.0.0.1',
  ];
  
  // Se o hostname não está na lista de domínios principais, é um domínio personalizado
  return !mainDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}

/**
 * Normaliza um domínio removendo protocolo, path e porta
 * @param domain - Domínio a ser normalizado
 * @returns Domínio normalizado (apenas hostname)
 */
export function normalizeDomain(domain: string): string {
  if (!domain) return '';
  
  let normalized = domain.toLowerCase().trim();
  // Remover protocolo se houver
  normalized = normalized.replace(/^https?:\/\//, '');
  // Remover path se houver
  normalized = normalized.replace(/\/.*$/, '');
  // Remover porta se houver
  normalized = normalized.split(':')[0];
  // Remover espaços
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Verifica se estamos no builder ou preview (onde devemos remover UTMs da plataforma)
 * @returns true se estamos no builder ou preview
 */
export function isInBuilderOrPreview(): boolean {
  if (typeof window === 'undefined') return false;
  
  const pathname = window.location.pathname.toLowerCase();
  // Verificar se está em rotas de builder ou preview
  return pathname.includes('/builder/') || pathname.includes('/preview/');
}

/**
 * Detecta se o dispositivo é iOS (iPhone, iPad, iPod)
 * @returns true se o dispositivo é iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+
}

/**
 * Detecta se o navegador é Safari (incluindo iOS Safari)
 * @returns true se o navegador é Safari
 */
export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
}

/**
 * Remove parâmetros UTM de uma URL apenas se estivermos no builder/preview
 * Nas páginas reais, mantém UTMs (importantes para tracking)
 * @param url - URL a ser processada
 * @returns URL sem UTMs se estiver no builder/preview, ou URL original se estiver em página real
 */
export function removeUtmParamsIfNeeded(url: string): string {
  if (!url) return url;
  
  // Se não estiver no builder/preview, manter UTMs (importantes para tracking)
  if (!isInBuilderOrPreview()) {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    // Remover parâmetros UTM da URL (especialmente importante no builder/preview)
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    utmParams.forEach(param => urlObj.searchParams.delete(param));
    
    return urlObj.href;
  } catch (error) {
    // Se não for uma URL válida, retornar original
    return url;
  }
}