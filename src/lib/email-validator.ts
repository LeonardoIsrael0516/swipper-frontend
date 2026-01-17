/**
 * Lista de domínios de emails temporários/disposable conhecidos
 * Mesma lista do backend para consistência
 * Nota: Backend é a fonte da verdade, esta validação é apenas para UX
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'tempr-mail.org',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'guerrillamail.info',
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  'throwaway.email',
  'temp-mail.org',
  'temp-mail.io',
  'temp-mail.ru',
  'tempmail.com',
  'tempmail.net',
  'tempmail.org',
  'tempmail.co',
  'trashmail.com',
  'trashmail.net',
  'getnada.com',
  'mohmal.com',
  'fakemail.net',
  'fakemailgenerator.com',
  'yopmail.com',
  'yopmail.net',
  'jetable.org',
  'maildrop.cc',
  'sharklasers.com',
  'grr.la',
  'guerrillamail.de',
  'guerrillamail.fr',
  'meltmail.com',
  'emailondeck.com',
  'fakeinbox.com',
  'fakemail.fr',
  'melt.li',
  'spamgourmet.com',
  'spamhole.com',
  'spambox.us',
  'spamfree24.org',
  'tempmailaddress.com',
  'mytrashmail.com',
  'mintemail.com',
  'moburl.com',
  'spamday.com',
  'throwawaymail.com',
  'tmpmail.org',
  'tmpx.email',
  'tempail.com',
  'tempinbox.com',
  'throwam.com',
  'getairmail.com',
  'inboxkitten.com',
  'mailnesia.com',
  'nada.email',
  'spam4.me',
  'tempr.email',
  'tmpmail.net',
  'trash-mail.com',
  'trashmail.de',
  'trashmail.me',
  'trashmailer.com',
  'yopmail.fr',
  'zippymail.info',
]);

/**
 * Verifica se um email pertence a um domínio de email temporário/disposable
 * @param email - Endereço de email a ser verificado
 * @returns true se o email for temporário, false caso contrário
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Extrair domínio do email (parte após @)
  const parts = email.toLowerCase().trim().split('@');
  
  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1];

  // Verificar se o domínio está na lista de bloqueados
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Valida formato de email básico
 * @param email - Endereço de email a ser verificado
 * @returns true se o formato for válido, false caso contrário
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Regex básico para formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida email completo (formato + não temporário)
 * @param email - Endereço de email a ser verificado
 * @returns objeto com resultado da validação
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email é obrigatório',
    };
  }

  const trimmedEmail = email.trim();

  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      valid: false,
      error: 'Formato de email inválido',
    };
  }

  if (isDisposableEmail(trimmedEmail)) {
    return {
      valid: false,
      error: 'Emails temporários não são permitidos. Por favor, use um email pessoal ou corporativo.',
    };
  }

  return {
    valid: true,
  };
}

