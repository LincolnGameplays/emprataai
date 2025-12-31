
import { cpf, cnpj } from 'cpf-cnpj-validator';

// ══════════════════════════════════════════════════════════════════
// VALIDADOR NATIVO DE CPF (Algoritmo Mod 11 - Zero Dependência)
// ══════════════════════════════════════════════════════════════════
export function validateCPFNative(cpfInput: string): boolean {
  const cpfClean = cpfInput.replace(/[^\d]+/g, '');
  
  // Verifica tamanho e sequências repetidas
  if (cpfClean.length !== 11 || !!cpfClean.match(/(\d)\1{10}/)) return false;

  const cpfArray = cpfClean.split('').map(Number);
  
  const rest = (count: number) =>
    ((cpfArray.slice(0, count - 12).reduce((s, n, i) => s + n * (count - i), 0) * 10) % 11) % 10;

  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
}

// ══════════════════════════════════════════════════════════════════
// MÁSCARAS DE INPUT (UX em Tempo Real)
// ══════════════════════════════════════════════════════════════════
export const maskCPF = (v: string): string => {
  return v
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (v: string): string => {
  return v
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2');
};

export const validateDocument = (doc: string): { isValid: boolean; type: 'CPF' | 'CNPJ' | null } => {
  const cleanDoc = doc.replace(/\D/g, '');

  if (cleanDoc.length === 11) {
    return { isValid: cpf.isValid(cleanDoc), type: 'CPF' };
  }
  
  if (cleanDoc.length === 14) {
    return { isValid: cnpj.isValid(cleanDoc), type: 'CNPJ' };
  }

  return { isValid: false, type: null };
};

export const sanitizeInput = (input: string): string => {
  // Remove scripts e tags HTML para evitar XSS (Cross-Site Scripting)
  return input.replace(/[<>]/g, '').trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Brazilian phone: 10-11 digits (with DDD)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (cnpj: string): string => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};
