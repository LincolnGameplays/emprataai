/**
 * Waiter Login Page
 * PIN-based login for waiters
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { getWaiterByCode, setWaiterOnline } from '../services/staffService';
import type { WaiterSession } from '../types/staff';

export default function WaiterLogin() {
  const navigate = useNavigate();
  const [restaurantCode, setRestaurantCode] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!restaurantCode.trim() || !pin.trim()) {
      setError('Preencha o código do restaurante e seu PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const waiter = await getWaiterByCode(restaurantCode.trim(), pin);
      
      if (!waiter) {
        setError('Código ou PIN inválido');
        setIsLoading(false);
        return;
      }

      // Create session
      const session: WaiterSession = {
        waiterId: waiter.id,
        waiterName: waiter.name,
        restaurantId: waiter.restaurantId,
        ownerId: waiter.ownerId,
        loginAt: new Date(),
        currentTables: []
      };

      // Save to sessionStorage
      sessionStorage.setItem('waiterSession', JSON.stringify(session));
      
      // Set online
      await setWaiterOnline(waiter.id, true);

      toast.success(`Bem-vindo, ${waiter.name}!`);
      navigate('/waiter-mode');
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN input with keyboard
  const handlePinChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPin(cleaned);
    setError('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link 
          to="/"
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">Voltar</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Logo */}
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black italic tracking-tight">
              Modo Garçom
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Digite seu código de acesso
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Restaurant Code */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                Código do Restaurante
              </label>
              <input
                type="text"
                value={restaurantCode}
                onChange={(e) => {
                  setRestaurantCode(e.target.value);
                  setError('');
                }}
                placeholder="ID do restaurante"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center font-mono placeholder-white/20 focus:border-primary focus:outline-none"
              />
            </div>

            {/* PIN */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                Seu PIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="• • • •"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-3xl font-black tracking-[0.5em] placeholder-white/20 focus:border-primary focus:outline-none"
                maxLength={6}
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={isLoading || !pin || !restaurantCode}
              className="w-full py-4 bg-primary hover:bg-orange-600 rounded-xl font-black text-lg uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </div>

          {/* Help */}
          <p className="text-center text-xs text-white/30">
            Peça o código do restaurante e seu PIN pessoal ao gerente.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
