/**
 * 🔐 PlanGuard Component - Visual Feature Gating
 * 
 * Wraps components that require specific plan access.
 * Provides multiple fallback modes:
 * - hidden: Component doesn't render at all
 * - blur: Shows blurred preview with unlock CTA
 * - card: Shows locked card with upgrade button
 */

import { ReactNode } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { FeatureKey, PLANS, getRequiredPlan } from '../../types/subscription';
import { Lock, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface PlanGuardProps {
  /** Feature key to check access for */
  feature: FeatureKey;
  /** Content to render if access is granted */
  children: ReactNode;
  /**
   * Fallback mode when access is denied:
   * - hidden: Don't render anything
   * - blur: Show blurred preview with CTA
   * - card: Show locked card overlay
   */
  fallback?: 'hidden' | 'blur' | 'card';
  /** Custom locked message */
  lockedMessage?: string;
}

export function PlanGuard({ 
  feature, 
  children, 
  fallback = 'blur',
  lockedMessage 
}: PlanGuardProps) {
  const { checkAccess } = useSubscription();
  const navigate = useNavigate();
  const hasAccess = checkAccess(feature);
  const requiredPlan = getRequiredPlan(feature);
  const planDetails = PLANS[requiredPlan];

  // ✅ Has access - render children normally
  if (hasAccess) return <>{children}</>;

  // ❌ No access - handle based on fallback mode

  // HIDDEN MODE: Don't render anything
  if (fallback === 'hidden') return null;

  // BLUR MODE: Shows blurred content with upgrade overlay
  if (fallback === 'blur') {
    return (
      <div className="relative group cursor-not-allowed overflow-hidden rounded-xl">
        {/* Blurred preview (generates desire) */}
        <div className="filter blur-md opacity-50 pointer-events-none select-none grayscale scale-[1.02]">
          {children}
        </div>
        
        {/* Overlay with unlock CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/20 backdrop-blur-[2px] group-hover:bg-black/40 transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center border border-white/10">
              <Lock className="text-white/80" size={20} />
            </div>
            
            <p className="text-white/60 text-sm text-center max-w-[200px]">
              {lockedMessage || `Recurso exclusivo do plano ${planDetails.label}`}
            </p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/subscription')}
              className={`${planDetails.bgColor} text-black px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow`}
            >
              <Zap size={14} fill="currentColor" /> 
              Desbloquear
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // CARD MODE: Shows a locked card placeholder
  if (fallback === 'card') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-white/20 transition-colors group"
        onClick={() => navigate('/subscription')}
      >
        {/* Crown icon */}
        <div className={`w-16 h-16 rounded-xl ${planDetails.bgColor}/20 flex items-center justify-center mb-4`}>
          <Crown className={planDetails.color} size={28} />
        </div>
        
        <p className="text-white font-bold text-center mb-1">
          {lockedMessage || 'Recurso Premium'}
        </p>
        
        <p className="text-white/40 text-sm text-center mb-4">
          Requer plano {planDetails.label}
        </p>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`${planDetails.bgColor} text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 group-hover:shadow-lg transition-shadow`}
        >
          <Zap size={16} fill="currentColor" />
          Fazer Upgrade
        </motion.button>
      </motion.div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface LockedBadgeProps {
  feature: FeatureKey;
  className?: string;
}

/**
 * Small badge that shows lock icon for premium features
 */
export function LockedBadge({ feature, className = '' }: LockedBadgeProps) {
  const { checkAccess } = useSubscription();
  
  if (checkAccess(feature)) return null;
  
  const requiredPlan = getRequiredPlan(feature);
  const planDetails = PLANS[requiredPlan];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${planDetails.bgColor}/20 ${planDetails.color} ${className}`}>
      <Lock size={10} />
      {planDetails.label}
    </span>
  );
}
