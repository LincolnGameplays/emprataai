/**
 * AdminModal Component - Advanced Control Panel
 * God mode for admin users with credit management and plan switching
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, RotateCcw, Shield, Zap, Crown, AlertCircle } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAppStore, UserPlan } from '../store/useAppStore';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function AdminModal({ isOpen, onClose, userId }: AdminModalProps) {
  const [creditsToModify, setCreditsToModify] = useState(10);
  const [selectedPlan, setSelectedPlan] = useState<UserPlan>('FREE');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { credits, setCredits, plan, setPlan } = useAppStore();

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleModifyCredits = async () => {
    if (creditsToModify === 0) return;

    try {
      setIsLoading(true);

      // Update Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        credits: increment(creditsToModify)
      });

      // Update local state
      const newCredits = credits + creditsToModify;
      setCredits(newCredits);

      const action = creditsToModify > 0 ? 'adicionados' : 'removidos';
      showMessage('success', `✅ ${Math.abs(creditsToModify)} créditos ${action}!`);

    } catch (error: any) {
      console.error('Error modifying credits:', error);
      showMessage('error', '❌ Erro ao modificar créditos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePlan = async () => {
    try {
      setIsLoading(true);

      // Update Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        plan: selectedPlan
      });

      // Update local state
      setPlan(selectedPlan);

      showMessage('success', `🎭 Modo de simulação: Plano alterado para ${selectedPlan}`);

    } catch (error: any) {
      console.error('Error changing plan:', error);
      showMessage('error', '❌ Erro ao alterar plano');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetHistory = () => {
    useAppStore.getState().resetEditor();
    showMessage('success', '✅ Histórico resetado!');
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border-2 border-primary/30 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-orange-600/20 p-6 border-b border-white/10 sticky top-0 z-10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase italic">Admin Control Panel</h2>
                    <p className="text-xs text-white/50 font-bold">God Mode Activated</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Current Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/60">Créditos Atuais</span>
                    <Zap className="w-5 h-5 text-primary fill-current" />
                  </div>
                  <p className="text-3xl font-black text-white mt-2">{credits}</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white/60">Plano Atual</span>
                    <Crown className="w-5 h-5 text-amber-500 fill-current" />
                  </div>
                  <p className="text-3xl font-black text-white mt-2">{plan}</p>
                </div>
              </div>

              {/* Section 1: Credit Management */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase">Gestão de Créditos</h3>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-white/80 uppercase tracking-wider block mb-2">
                      Quantidade (Positivo = Adicionar, Negativo = Remover)
                    </label>
                    
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={creditsToModify}
                        onChange={(e) => setCreditsToModify(parseInt(e.target.value) || 0)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="Ex: 10 ou -5"
                      />
                      
                      <button
                        onClick={handleModifyCredits}
                        disabled={isLoading || creditsToModify === 0}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creditsToModify >= 0 ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                        Aplicar
                      </button>
                    </div>

                    {/* Quick Modify Buttons */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {[-10, -5, 5, 10, 50, 100].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setCreditsToModify(amount)}
                          className={`py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-colors ${
                            amount < 0 ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          {amount > 0 ? '+' : ''}{amount}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Plan Switcher */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase">Simulação de Plano</h3>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 font-bold">
                      Modo de teste: Altera o plano apenas para você testar features PRO/STARTER sem afetar outros usuários.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value as UserPlan)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="FREE">FREE - Grátis</option>
                      <option value="STARTER">STARTER - R$ 97/mês</option>
                      <option value="PRO">PRO - R$ 197/mês</option>
                    </select>
                    
                    <button
                      onClick={handleChangePlan}
                      disabled={isLoading || selectedPlan === plan}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Forçar Mudança
                    </button>
                  </div>

                  {/* Plan Preview */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['FREE', 'STARTER', 'PRO'] as UserPlan[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPlan(p)}
                        className={`py-2 px-3 rounded-lg text-xs font-black uppercase transition-all ${
                          selectedPlan === p
                            ? 'bg-primary text-white border-2 border-primary'
                            : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Utilities */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <RotateCcw className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase">Utilitários</h3>
                </div>

                <button
                  onClick={handleResetHistory}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Resetar Histórico de Edição
                </button>
              </div>

              {/* Message Display */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-xl p-4 text-center border ${
                      message.type === 'success'
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-red-500/20 border-red-500/50'
                    }`}
                  >
                    <p className="text-sm font-bold text-white">{message.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info */}
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-xs text-white/30 font-bold uppercase tracking-wider">
                  User ID: {userId.slice(0, 12)}...
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
