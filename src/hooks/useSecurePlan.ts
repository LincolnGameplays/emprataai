/**
 * 🔐 useSecurePlan - Cryptographically Verified Plan Access
 * 
 * This hook provides tamper-proof subscription verification.
 * 
 * SECURITY MODEL:
 * - Online: Fetches fresh license from server, saves locally
 * - Offline: Uses locally stored license, verifies signature
 * - Tampering: Instant lockout + security flag
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { OfflineGuard, LicensePayload } from '../services/security/offlineGuard';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { toast } from 'sonner';

interface SecurePlanState {
  plan: 'STARTER' | 'GROWTH' | 'BLACK';
  features: string[];
  isVerified: boolean;
  isTampered: boolean;
  isOffline: boolean;
  isLoading: boolean;
  expiresAt: Date | null;
}

export function useSecurePlan() {
  const { user, userData } = useAuth();
  const [state, setState] = useState<SecurePlanState>({
    plan: 'STARTER',
    features: [],
    isVerified: false,
    isTampered: false,
    isOffline: !navigator.onLine,
    isLoading: true,
    expiresAt: null
  });

  // Validate access on mount and when user changes
  const validateAccess = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false, plan: 'STARTER' }));
      return;
    }

    try {
      // 1. Try to get fresh license if online
      if (navigator.onLine) {
        await refreshLicense();
        return;
      }

      // 2. Offline: Use stored license
      await validateOfflineLicense();

    } catch (error) {
      console.error('[useSecurePlan] Validation error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        plan: 'STARTER',
        isVerified: false 
      }));
    }
  }, [user]);

  // Refresh license from server (when online)
  const refreshLicense = async () => {
    try {
      // Call serverless function to get signed license
      const issueLicense = httpsCallable(functions, 'securityIssueLicense');
      const result = await issueLicense({});
      const { license } = result.data as { license: string };

      // Save locally for offline use
      OfflineGuard.saveLicenseLocally(license);

      // Verify and apply
      const verification = await OfflineGuard.verifyLicense(license);
      
      if (verification.isValid && verification.payload) {
        applyLicense(verification.payload);
      } else {
        // Server issued invalid license? Fallback to basic
        console.error('[useSecurePlan] Server license invalid');
        fallbackToBasic();
      }

    } catch (error) {
      console.error('[useSecurePlan] Failed to refresh license:', error);
      // Try offline license as fallback
      await validateOfflineLicense();
    }
  };

  // Validate stored offline license
  const validateOfflineLicense = async () => {
    const token = OfflineGuard.getStoredLicense();

    if (!token) {
      // No stored license, use basic plan
      fallbackToBasic();
      return;
    }

    // CRYPTOGRAPHIC VERIFICATION
    const verification = await OfflineGuard.verifyLicense(token);

    if (verification.isTampered) {
      // CRITICAL: Someone edited the license file
      handleTampering();
      return;
    }

    if (verification.isExpired) {
      // License expired, need to go online
      toast.warning('Licença offline expirada', {
        description: 'Conecte-se à internet para renovar seu acesso.'
      });
      fallbackToBasic();
      return;
    }

    if (verification.isValid && verification.payload) {
      // Check UID matches (prevent license sharing)
      if (verification.payload.uid !== user?.uid) {
        handleTampering();
        return;
      }

      applyLicense(verification.payload);
    }
  };

  // Apply verified license
  const applyLicense = (payload: LicensePayload) => {
    setState({
      plan: payload.plan,
      features: payload.features,
      isVerified: true,
      isTampered: false,
      isOffline: !navigator.onLine,
      isLoading: false,
      expiresAt: new Date(payload.expiresAt * 1000)
    });
  };

  // Fallback to basic plan
  const fallbackToBasic = () => {
    setState(prev => ({
      ...prev,
      plan: (userData?.plan as 'STARTER' | 'GROWTH' | 'BLACK') || 'STARTER',
      features: [],
      isVerified: false,
      isTampered: false,
      isLoading: false
    }));
  };

  // Handle tampering detection
  const handleTampering = () => {
    console.error('🚨 [SECURITY] License tampering detected!');
    
    // Clear corrupted license
    OfflineGuard.clearLicense();

    // Lock out
    setState({
      plan: 'STARTER',
      features: [],
      isVerified: false,
      isTampered: true,
      isOffline: !navigator.onLine,
      isLoading: false,
      expiresAt: null
    });

    // Alert user
    toast.error('Erro de Segurança Crítico', {
      description: 'Dados de licença corrompidos. Faça login novamente.',
      duration: 10000
    });

    // TODO: Report to server when online (optional: ban user)
  };

  // Run validation on mount
  useEffect(() => {
    validateAccess();
  }, [validateAccess]);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      refreshLicense(); // Refresh when coming back online
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper: Check if user has access to a feature
  const hasFeature = (feature: string): boolean => {
    if (state.isTampered) return false;
    if (state.plan === 'BLACK') return true; // BLACK has all
    return state.features.includes(feature);
  };

  // Helper: Check if user has a minimum plan
  const hasMinPlan = (minPlan: 'STARTER' | 'GROWTH' | 'BLACK'): boolean => {
    if (state.isTampered) return false;
    
    const hierarchy = { STARTER: 0, GROWTH: 1, BLACK: 2 };
    return hierarchy[state.plan] >= hierarchy[minPlan];
  };

  return {
    ...state,
    hasFeature,
    hasMinPlan,
    refreshLicense
  };
}

export default useSecurePlan;
