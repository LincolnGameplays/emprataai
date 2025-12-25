/**
 * LoginPage Component
 * Dedicated login page with same design as AuthModal
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = () => {
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Voltar</span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black italic tracking-ultra-tight mb-2">
              Emprata<span className="text-primary">.ai</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm">
              Neural Food Photography
            </p>
          </div>

          {/* Auth Modal (Always Open) */}
          <AuthModal 
            isOpen={true} 
            onClose={() => navigate('/')}
            onSuccess={handleSuccess}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-white/20 font-bold uppercase tracking-wider">
          © 2025 Emprata.ai • Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
