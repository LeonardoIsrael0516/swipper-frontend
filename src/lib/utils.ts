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