/**
 * Valida CPF (removendo formatação)
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validar dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

/**
 * Formata CPF: 12345678900 -> 123.456.789-00
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length <= 3) return cleanCPF;
  if (cleanCPF.length <= 6) return cleanCPF.replace(/(\d{3})(\d+)/, '$1.$2');
  if (cleanCPF.length <= 9) return cleanCPF.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
}

/**
 * Formata telefone: 11987654321 -> (11) 98765-4321
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length <= 2) return cleanPhone;
  if (cleanPhone.length <= 6) return cleanPhone.replace(/(\d{2})(\d+)/, '($1) $2');
  if (cleanPhone.length <= 10) return cleanPhone.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  return cleanPhone.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
}

/**
 * Formata CEP: 12345678 -> 12345-678
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length <= 5) return cleanCEP;
  return cleanCEP.replace(/(\d{5})(\d+)/, '$1-$2');
}

/**
 * Valida CEP (8 dígitos)
 */
export function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
}

