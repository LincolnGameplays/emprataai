/**
 * Crypto Service - AES-256 Client-Side Encryption
 * 
 * Military-grade encryption for sensitive data (CPF, Phone, Address).
 * Data is encrypted BEFORE leaving the device.
 */

import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';

// ATENÇÃO: Em produção, esta chave DEVE vir de uma variável de ambiente (.env)
// VITE_ENCRYPTION_KEY=SuaChaveSuperSecretaDe32Caracteres
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'emprata_dev_key_change_me_now_32c';

export const CryptoService = {
  /**
   * Criptografa dados antes de salvar no Firestore
   * Transforma "123.456.789-00" em "U2FsdGVkX1+abc123..."
   */
  encrypt: (data: string): string => {
    if (!data) return '';
    try {
      return AES.encrypt(data, SECRET_KEY).toString();
    } catch (e) {
      console.error('[CryptoService] Encrypt error:', e);
      return '';
    }
  },

  /**
   * Descriptografa apenas para quem tem a chave (O Dono/Sistema)
   */
  decrypt: (cipherText: string): string => {
    if (!cipherText) return '';
    try {
      const bytes = AES.decrypt(cipherText, SECRET_KEY);
      return bytes.toString(encUtf8);
    } catch (e) {
      console.error('[CryptoService] Decrypt error:', e);
      return ''; // Falha na descriptografia (Chave errada ou dados corrompidos)
    }
  },

  /**
   * Máscara para exibição segura
   * Ex: "123.456.789-00" → "***.***.***-00"
   */
  maskSensitive: (text: string, visibleChars = 4): string => {
    if (!text || text.length <= visibleChars) return text;
    const visible = text.slice(-visibleChars);
    return '*'.repeat(text.length - visibleChars) + visible;
  },

  /**
   * Verifica se um dado parece estar criptografado
   * (útil para migração de dados antigos)
   */
  isEncrypted: (data: string): boolean => {
    if (!data) return false;
    // Dados criptografados por AES começam com "U2FsdGVkX1" (base64 de "Salted__")
    return data.startsWith('U2FsdGVkX1');
  }
};
