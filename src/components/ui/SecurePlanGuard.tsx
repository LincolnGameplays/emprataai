/**
 * 🛡️ Secure Plan Guard - Cryptographically Protected Feature Gate
 * 
 * DIFFERS FROM PlanGuard:
 * - Uses JWT-verified license (useSecurePlan) instead of raw userData
 * - Detects and blocks tampering attempts
 * - Shows security error on corruption
 * 
 * Use this for HIGH-VALUE features where security is critical.
 */

import { ReactNode } from 'react';
import { useSecurePlan } from '../../hooks/useSecurePlan';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Shield, Sparkles, AlertTriangle, Zap } from 'lucide-react';

interface SecurePlanGuardProps {
  children: ReactNode;
  requiredPlan?: 'STARTER' | 'GROWTH' | 'BLACK';
  requiredFeature?: string;
  fallback?: 'hidden' | 'blur' | 'card';
  lockedMessage?: string;
}

export function SecurePlanGuard({ 
  children, 
  requiredPlan = 'GROWTH',
  requiredFeature,
  fallback = 'card',
  lockedMessage
}: SecurePlanGuardProps) {
  const navigate = useNavigate();
  const { plan, isVerified, isTampered, isLoading, hasMinPlan, hasFeature, isOffline } = useSecurePlan();

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-[#121212] rounded-2xl p-8 flex items-center justify-center min-h-[200px] border border-white/5">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Shield className="text-white/20" size={32} />
          <p className="text-white/30 text-sm">Verificando licença...</p>
        </div>
      </div>
    );
  }

  // TAMPERED LICENSE - Maximum security: show error
  if (isTampered) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-red-950/50 to-red-900/30 rounded-2xl p-8 border border-red-500/30"
      >
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-500/20 p-4 rounded-full mb-4 border border-red-500/30">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h3 className="font-bold text-red-400 text-lg">Erro de Segurança</h3>
          <p className="text-red-200/60 text-sm mt-2 max-w-xs">
            Dados de licença corrompidos ou adulterados. Faça login novamente.
          </p>
          <button 
            onClick={() => navigate('/auth')}
            className="mt-4 bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-400 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </motion.div>
    );
  }

  // Check access
  const hasAccess = requiredFeature 
    ? hasFeature(requiredFeature)
    : hasMinPlan(requiredPlan);

  // Has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // No access - Hidden mode
  if (fallback === 'hidden') {
    return null;
  }

  // No access - Blur mode
  if (fallback === 'blur') {
    return (
      <div className="relative group cursor-not-allowed overflow-hidden rounded-xl">
        <div className="filter blur-md opacity-50 pointer-events-none select-none grayscale scale-[1.02]">
          {children}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/30 backdrop-blur-[2px]"
        >
          <div className="flex flex-col items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center border border-white/10">
              <Lock className="text-white/80" size={20} />
            </div>
            
            <p className="text-white/60 text-sm text-center max-w-[200px]">
              {lockedMessage || `Recurso exclusivo do plano ${requiredPlan}`}
            </p>

            {isOffline && !isVerified && (
              <p className="text-yellow-500/80 text-xs flex items-center gap-1">
                <AlertTriangle size={12} />
                Conecte-se para verificar
              </p>
            )}
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/subscription')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2"
            >
              <Zap size={14} /> Desbloquear
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // No access - Card mode (default)
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-white/10 bg-[#121212] p-8 flex flex-col items-center justify-center min-h-[200px] overflow-hidden"
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.05) 10px,
            rgba(255,255,255,0.05) 20px
          )`
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-2xl mb-4 border border-white/10">
          <Lock size={28} className="text-white/60" />
        </div>
        
        <h3 className="font-bold text-white text-lg">
          {lockedMessage || 'Recurso Premium'}
        </h3>
        <p className="text-white/50 text-sm mt-2 max-w-xs">
          Esta funcionalidade requer licença{' '}
          <span className="text-purple-400 font-bold">{requiredPlan}</span>.
        </p>

        {isOffline && !isVerified && (
          <p className="text-yellow-500/80 text-xs mt-3 flex items-center gap-1">
            <AlertTriangle size={12} />
            Conecte-se para verificar sua licença
          </p>
        )}

        <button 
          onClick={() => navigate('/subscription')}
          className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
        >
          <Sparkles size={16} />
          Fazer Upgrade
        </button>
      </div>
    </motion.div>
  );
}

export default SecurePlanGuard;
