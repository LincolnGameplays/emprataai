/**
 * AuthModal Component
 * Beautiful authentication modal with Google Sign-In
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { loginWithGoogle, signIn, signUp, loading, error } = useAuth();
  const [mode, setMode] = useState<'google' | 'email' | 'signup'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsProcessing(true);
      setAuthError(null);
      await loginWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao fazer login com Google');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setAuthError(null);
      await signIn(email, password);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setAuthError('Email ou senha incorretos');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      setAuthError(null);
      await signUp(email, password, name);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao criar conta');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border-2 border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>

            {/* Content */}
            <div className="p-8 pt-12">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                  <span className="text-3xl">🎨</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-2 italic uppercase">
                  Salve sua obra de arte
                </h2>
                <p className="text-white/60 font-medium">
                  Crie uma conta grátis para baixar sua imagem e ganhar <span className="text-primary font-bold">+3 créditos</span>
                </p>
              </div>

              {/* Google Sign-In (Default) */}
              {mode === 'google' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isProcessing}
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuar com Google
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-zinc-900 text-white/40 font-bold uppercase tracking-wider">ou</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setMode('email')}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/10"
                  >
                    <Mail className="w-5 h-5" />
                    Entrar com Email
                  </button>
                </motion.div>
              )}

              {/* Email Sign-In */}
              {mode === 'email' && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleEmailSignIn}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Entrar'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-sm text-white/60 hover:text-white font-bold transition-colors"
                    >
                      Não tem conta? <span className="text-primary">Criar agora</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('google')}
                    className="w-full text-sm text-white/40 hover:text-white font-bold transition-colors"
                  >
                    ← Voltar
                  </button>
                </motion.form>
              )}

              {/* Sign Up */}
              {mode === 'signup' && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSignUp}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">Nome</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="Seu nome"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Conta'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode('email')}
                      className="text-sm text-white/60 hover:text-white font-bold transition-colors"
                    >
                      Já tem conta? <span className="text-primary">Entrar</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('google')}
                    className="w-full text-sm text-white/40 hover:text-white font-bold transition-colors"
                  >
                    ← Voltar
                  </button>
                </motion.form>
              )}

              {/* Error Message */}
              {(authError || error) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-300 font-bold">{authError || error}</p>
                </motion.div>
              )}

              {/* Footer */}
              <p className="text-center text-xs text-white/30 font-bold mt-6">
                Ao continuar, você concorda com nossos Termos de Uso
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
