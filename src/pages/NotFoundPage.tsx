import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    // Smart redirect: /app if logged in, / if not
    navigate(isAuthenticated ? '/app' : '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            {/* Pulsing background */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl"
            />
            
            {/* Alert icon */}
            <div className="relative bg-red-500/20 border-2 border-red-500/30 rounded-full p-6">
              <AlertCircle className="w-16 h-16 text-red-500" strokeWidth={2} />
            </div>
          </div>
        </motion.div>

        {/* 404 Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-8xl md:text-9xl font-black text-white mb-4 tracking-tighter"
        >
          404
        </motion.h1>

        {/* Message */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-3xl font-bold text-white mb-3"
        >
          Página não encontrada
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-white/60 text-lg mb-8"
        >
          A página que você está procurando não existe ou foi movida.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoHome}
          className="px-8 py-4 rounded-2xl bg-primary hover:bg-orange-600 font-black text-white shadow-xl shadow-primary/40 uppercase tracking-wider text-sm transition-all"
        >
          Voltar para o Início
        </motion.button>
      </motion.div>
    </div>
  );
}
