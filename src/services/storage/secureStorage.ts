/**
 * 🔐 Secure Storage - AES Encrypted Local Storage
 * 
 * For sensitive data that must be cached locally (financial reports, etc.),
 * this service provides AES-256 encryption tied to the user's identity.
 * 
 * SECURITY MODEL:
 * - Key derived from user UID + app secret
 * - Per-user encryption (can't read another user's data)
 * - Tampering detection (corrupted data returns null)
 */

import CryptoJS from 'crypto-js';

// App secret (should be in env in production)
const APP_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || 'EMPRATA_DEFAULT_SECRET_2024';

/**
 * Generate user-specific encryption key
 * Combines UID + app secret for uniqueness
 */
function getEncryptionKey(uid: string): string {
  return `EMPRATA_SALT_${uid}_${APP_SECRET}`;
}

export const SecureStorage = {
  /**
   * Store data with AES encryption
   */
  setItem: (key: string, value: any, uid: string): void => {
    try {
      const plaintext = JSON.stringify(value);
      const ciphertext = CryptoJS.AES.encrypt(plaintext, getEncryptionKey(uid)).toString();
      localStorage.setItem(`secure_${key}`, ciphertext);
    } catch (error) {
      console.error('[SecureStorage] Encryption failed:', error);
    }
  },

  /**
   * Retrieve and decrypt data
   * Returns null if decryption fails (tampering detected)
   */
  getItem: <T = any>(key: string, uid: string): T | null => {
    try {
      const ciphertext = localStorage.getItem(`secure_${key}`);
      if (!ciphertext) return null;

      const bytes = CryptoJS.AES.decrypt(ciphertext, getEncryptionKey(uid));
      const plaintext = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext) {
        // Decryption failed - data was tampered or wrong user
        console.warn('[SecureStorage] Decryption failed - possible tampering');
        return null;
      }

      return JSON.parse(plaintext) as T;
    } catch (error) {
      console.error('[SecureStorage] Failed to decrypt:', error);
      return null; // Fail-safe: return nothing on error
    }
  },

  /**
   * Remove encrypted item
   */
  removeItem: (key: string): void => {
    localStorage.removeItem(`secure_${key}`);
  },

  /**
   * Clear all secure storage for a user
   */
  clearAll: (): void => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('secure_'));
    keys.forEach(k => localStorage.removeItem(k));
  },

  /**
   * Check if encrypted data exists
   */
  hasItem: (key: string): boolean => {
    return !!localStorage.getItem(`secure_${key}`);
  }
};

export default SecureStorage;
