/**
 * 🛡️ PlanProtected - Route Guard Component
 * 
 * Acts like a bouncer at the door. Wraps protected pages.
 * If user doesn't have permission, they're redirected to /subscription
 * before the component even mounts.
 * 
 * Usage in App.tsx:
 * <Route path="/intelligence" element={
 *   <PlanProtected feature="ai_insights">
 *     <BusinessIntelligence />
 *   </PlanProtected>
 * } />
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { FeatureKey, PLANS, getRequiredPlan } from '../../types/subscription';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

interface PlanProtectedProps {
  /** Feature key from PERMISSIONS matrix */
  feature: FeatureKey;
  /** Component to render if access is granted */
  children: JSX.Element;
  /** Custom redirect path (default: /subscription) */
  redirectTo?: string;
}

export default function PlanProtected({ 
  feature, 
  children, 
  redirectTo = '/subscription' 
}: PlanProtectedProps) {
  const { checkAccess, isLoading } = useSubscription();
  const location = useLocation();
  const hasAlerted = useRef(false); // Prevents toast flood in React StrictMode

  const hasPermission = checkAccess(feature);

  useEffect(() => {
    // Show toast only once per navigation attempt
    if (!hasPermission && !isLoading && !hasAlerted.current) {
      const requiredPlan = getRequiredPlan(feature);
      toast.error('Acesso Negado', {
        description: `Este recurso requer o plano ${PLANS[requiredPlan].label}`,
        duration: 5000
      });
      hasAlerted.current = true;
    }
  }, [hasPermission, isLoading, feature]);

  // Reset alert flag when location changes
  useEffect(() => {
    hasAlerted.current = false;
  }, [location.pathname]);

  // Show nothing while loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to subscription page if no permission
  // Save original location so user can return after upgrading
  if (!hasPermission) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Access granted - render the protected component
  return children;
}
