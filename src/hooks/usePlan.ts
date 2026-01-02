/**
 * usePlan Hook - Feature Access Control (Legacy Wrapper)
 * 
 * This is now a wrapper around the new useSubscription hook
 * for backwards compatibility with existing code.
 */

import { useSubscription } from './useSubscription';
import { FEATURE_GATES, PlanTier, PLANS } from '../types/subscription';

export interface UsePlanReturn {
  currentPlan: PlanTier;
  planDetails: typeof PLANS[PlanTier];
  canAccess: (featureKey: string) => boolean;
  isLoading: boolean;
  isPro: boolean;
  isBlack: boolean;
}

export function usePlan(): UsePlanReturn {
  const { 
    currentPlan, 
    planDetails, 
    checkAccess, 
    isLoading, 
    isGrowthOrHigher, 
    isBlack 
  } = useSubscription();
  
  /**
   * Check if user can access a specific feature
   * Wraps the new checkAccess with fallback for unknown features
   */
  const canAccess = (featureKey: string): boolean => {
    const requiredTier = FEATURE_GATES[featureKey];
    
    // Unknown feature = allow (fallback for legacy code)
    if (!requiredTier) return true;
    
    return checkAccess(featureKey as any);
  };

  return {
    currentPlan,
    planDetails,
    canAccess,
    isLoading,
    isPro: isGrowthOrHigher,
    isBlack
  };
}
