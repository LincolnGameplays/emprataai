/**
 * 🔒 useSubscription Hook - Rigorous Access Control
 * 
 * This hook:
 * 1. Checks user's plan and payment status
 * 2. Provides feature access checking
 * 3. Can force redirect if user attempts unauthorized access
 * 
 * SECURITY: Double-layered with Firestore Rules on backend
 */

import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  PlanTier, 
  FeatureKey, 
  hasPermission, 
  PLANS, 
  getRequiredPlan 
} from '../types/subscription';

// ═══════════════════════════════════════════════════════════════════════════
// PLAN MAPPING (Legacy plan names -> New tier system)
// ═══════════════════════════════════════════════════════════════════════════

function mapPlanToTier(plan?: string): PlanTier {
  if (!plan) return 'STARTER';
  
  const normalized = plan.toUpperCase();
  
  // Map existing plan names
  if (normalized === 'BLACK' || normalized === 'PRO') return 'BLACK';
  if (normalized === 'GROWTH' || normalized === 'STARTER_PAID') return 'GROWTH';
  
  return 'STARTER';
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SUBSCRIPTION HOOK
// ═══════════════════════════════════════════════════════════════════════════

interface UseSubscriptionReturn {
  /** Current plan tier */
  currentPlan: PlanTier;
  /** Whether the subscription is active (paid or Starter) */
  isPlanActive: boolean;
  /** Plan display details */
  planDetails: typeof PLANS[PlanTier];
  /** Check if user can access a feature */
  checkAccess: (feature: FeatureKey) => boolean;
  /** Check access and show toast if denied */
  checkAccessWithFeedback: (feature: FeatureKey) => boolean;
  /** Get the plan required for a feature */
  getRequiredPlanFor: (feature: FeatureKey) => PlanTier;
  /** Helper booleans */
  isGrowthOrHigher: boolean;
  isBlack: boolean;
  isLoading: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const { userData, loading } = useAuth();
  
  // Map user's plan to tier system
  const currentPlan: PlanTier = mapPlanToTier(userData?.plan);
  
  // Check subscription status
  // STARTER is always active, paid plans need 'active' status
  const subscriptionStatus = (userData as any)?.subscription?.status || 'inactive';
  const isPlanActive = currentPlan === 'STARTER' || subscriptionStatus === 'active';

  /**
   * Check if user can access a specific feature
   * Returns false if plan is inactive (unpaid) and not Starter
   */
  const checkAccess = useCallback((feature: FeatureKey): boolean => {
    // Block delinquent users (Starter is always active per isPlanActive logic)
    if (!isPlanActive) return false;
    
    return hasPermission(currentPlan, feature);
  }, [currentPlan, isPlanActive]);

  /**
   * Check access with visual feedback (toast)
   */
  const checkAccessWithFeedback = useCallback((feature: FeatureKey): boolean => {
    const hasAccess = checkAccess(feature);
    
    if (!hasAccess) {
      const required = getRequiredPlan(feature);
      toast.error(`Recurso exclusivo do plano ${PLANS[required].label}`, {
        description: 'Faça upgrade para desbloquear',
        action: {
          label: 'Ver Planos',
          onClick: () => window.location.href = '/subscription'
        }
      });
    }
    
    return hasAccess;
  }, [checkAccess]);

  return {
    currentPlan,
    isPlanActive,
    planDetails: PLANS[currentPlan],
    checkAccess,
    checkAccessWithFeedback,
    getRequiredPlanFor: getRequiredPlan,
    isGrowthOrHigher: currentPlan === 'GROWTH' || currentPlan === 'BLACK',
    isBlack: currentPlan === 'BLACK',
    isLoading: loading
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE PROTECTION HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Protects entire routes - redirects if user lacks permission
 * Usage: useRequirePlan('ai_insights') at the top of a page component
 */
export function useRequirePlan(feature: FeatureKey, redirectTo = '/dashboard') {
  const { checkAccess, currentPlan, isLoading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Check permission after loading
    if (!checkAccess(feature)) {
      const required = getRequiredPlan(feature);
      toast.error(`Acesso Negado`, {
        description: `Esta página requer o plano ${PLANS[required].label}`,
        duration: 5000
      });
      navigate(redirectTo, { replace: true });
    }
  }, [feature, checkAccess, navigate, redirectTo, isLoading]);

  return { isAllowed: checkAccess(feature), currentPlan, isLoading };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { mapPlanToTier };
