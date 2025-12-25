import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../hooks/useAuth';

export default function SuccessPage() {
  const navigate = useNavigate();
  const { userData, refreshUser } = useAuth();

  useEffect(() => {
    // Refresh user data to get latest credits
    refreshUser();

    // Fire confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });

      // Fire from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Animated Check Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.2, 
            type: "spring", 
            stiffness: 200, 
            damping: 15 
          }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            {/* Pulsing background */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl"
            />
            
            {/* Check icon */}
            <div className="relative bg-green-500 rounded-full p-6 shadow-2xl shadow-green-500/50">
              <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={3} />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-6xl font-black text-center mb-4 bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent"
        >
          Pagamento Confirmado! 🚀
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center text-white/60 text-lg mb-12 font-medium"
        >
          Seus créditos já estão disponíveis para uso imediato.
        </motion.p>

        {/* Account Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/20 rounded-2xl p-3">
              <Zap className="w-6 h-6 text-primary fill-current" />
            </div>
            <h2 className="text-2xl font-black text-white">Resumo da Conta</h2>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/50 font-medium">Conta</span>
              <span className="text-white font-bold">{userData?.email || 'Carregando...'}</span>
            </div>

            {/* Credits */}
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white/50 font-medium">Créditos Disponíveis</span>
              <span className="text-primary font-black text-xl">{userData?.credits || 0}</span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center py-3">
              <span className="text-white/50 font-medium">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-500 font-black uppercase text-sm tracking-wider">Ativo</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/app')}
          className="w-full py-5 rounded-2xl bg-primary hover:bg-orange-600 font-black text-white shadow-xl shadow-primary/40 uppercase tracking-wider text-lg transition-all"
        >
          Começar a Criar Agora
        </motion.button>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/30 text-xs font-bold uppercase tracking-widest mt-6"
        >
          Obrigado por escolher Emprata.ai
        </motion.p>
      </motion.div>
    </div>
  );
}
