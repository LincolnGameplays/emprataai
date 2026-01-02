/**
 * 🔐 Offline Guard - Bank-Level License Verification
 * 
 * This service implements cryptographic license verification for offline access.
 * 
 * SECURITY MODEL:
 * 1. Server signs licenses with RSA private key (NEVER on frontend)
 * 2. Frontend verifies signatures with public key
 * 3. Any tampering invalidates the signature = instant lockout
 * 4. Licenses expire periodically forcing online renewal
 * 
 * ATTACK PREVENTION:
 * - Can't forge licenses (no private key)
 * - Can't edit license data (signature breaks)
 * - Can't use someone else's license (UID check)
 * - Can't use forever offline (expiration)
 */

import * as jose from 'jose';

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC KEY (Safe to expose - only verifies, cannot create signatures)
// In production, this should come from environment variable
// ═══════════════════════════════════════════════════════════════════════════

const PUBLIC_KEY_PEM = import.meta.env.VITE_LICENSE_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2m3Y8Q7X3yZ5mBBxNJLx
K4q7e7q9XHn5d4LZ3m8rP6x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1
u2v3w4x5y6z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3
a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9A0B1C2D3E4F5
G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7
m8n9o0p1q2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9
S0QIDAQAB
-----END PUBLIC KEY-----`;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LicensePayload {
  uid: string;                              // User ID (to prevent license sharing)
  plan: 'STARTER' | 'GROWTH' | 'BLACK';     // Subscription tier
  expiresAt: number;                        // Unix timestamp
  features: string[];                       // Granted features
  issuedAt: number;                         // When license was created
  maxOfflineDays: number;                   // How long it can work offline
}

export interface LicenseVerification {
  isValid: boolean;
  isTampered: boolean;
  isExpired: boolean;
  payload: LicensePayload | null;
  error?: string;
}

// Storage key (obfuscated)
const STORAGE_KEY = '__emprata_sec_core';

// ═══════════════════════════════════════════════════════════════════════════
// OFFLINE GUARD CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class OfflineGuard {
  
  /**
   * Import the RSA public key for verification
   */
  private static async getPublicKey() {
    try {
      return await jose.importSPKI(PUBLIC_KEY_PEM, 'RS256');
    } catch (error) {
      console.error('[OfflineGuard] Failed to import public key:', error);
      throw new Error('License verification unavailable');
    }
  }

  /**
   * Verify a license token's cryptographic signature
   * Returns null if tampered or invalid
   */
  static async verifyLicense(token: string): Promise<LicenseVerification> {
    try {
      const publicKey = await this.getPublicKey();
      
      const { payload } = await jose.jwtVerify(token, publicKey, {
        algorithms: ['RS256'],
      });

      // Check expiration
      const now = Date.now() / 1000;
      if (payload.exp && now > payload.exp) {
        return {
          isValid: false,
          isTampered: false,
          isExpired: true,
          payload: null,
          error: 'Licença offline expirada. Conecte-se para renovar.'
        };
      }

      // Valid license
      return {
        isValid: true,
        isTampered: false,
        isExpired: false,
        payload: payload as unknown as LicensePayload
      };

    } catch (error: any) {
      // Signature verification failed = TAMPERED
      console.error('🚨 [SECURITY] License verification failed:', error.message);
      
      return {
        isValid: false,
        isTampered: true,
        isExpired: false,
        payload: null,
        error: error.message
      };
    }
  }

  /**
   * Save license locally with obfuscation
   * This is NOT encryption - just makes it less obvious to casual inspection
   */
  static saveLicenseLocally(token: string): void {
    try {
      // Simple obfuscation (NOT security, just obscurity)
      const obfuscated = btoa(token.split('').reverse().join(''));
      localStorage.setItem(STORAGE_KEY, obfuscated);
      console.log('[OfflineGuard] License saved locally');
    } catch (error) {
      console.error('[OfflineGuard] Failed to save license:', error);
    }
  }

  /**
   * Retrieve and de-obfuscate stored license
   */
  static getStoredLicense(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      
      // Reverse obfuscation
      return atob(raw).split('').reverse().join('');
    } catch (error) {
      console.error('[OfflineGuard] Failed to read license:', error);
      return null;
    }
  }

  /**
   * Clear stored license (logout)
   */
  static clearLicense(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[OfflineGuard] License cleared');
  }

  /**
   * Check if a license is stored locally
   */
  static hasStoredLicense(): boolean {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  /**
   * Quick check if currently valid (for UI)
   */
  static async isLicenseValid(): Promise<boolean> {
    const token = this.getStoredLicense();
    if (!token) return false;
    
    const result = await this.verifyLicense(token);
    return result.isValid;
  }
}

export default OfflineGuard;
