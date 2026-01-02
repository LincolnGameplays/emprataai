/**
 * Subscription Page - Plan Upgrade
 * 
 * Sales page for upgrading subscription plans.
 * Now integrated with Vercel Serverless API for Asaas payments.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, ArrowLeft, Loader2, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';
import { PLANS, PlanTier } from '../../types/subscription';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { currentPlan } = usePlan();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<PlanTier | null>(null);

  // Upgrade handler with Analytics + Vercel API
  const handleUpgrade = async (plan: PlanTier) => {
    if (!user) {
      toast.error("Faça login para continuar");
      return;
    }
    if (plan === currentPlan) {
      toast.info("Você já está neste plano");
      return;
    }
    
    setLoading(plan);

    try {
      // 1. Log analytics event for marketing (if available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'begin_checkout', {
          currency: 'BRL',
          value: plan === 'GROWTH' ? 149.90 : 299.90,
          items: [{ item_name: `Emprata ${plan}`, price: plan === 'GROWTH' ? 149.90 : 299.90 }]
        });
      }

      // 2. Get user's Asaas customer ID (if exists)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const customerId = userData?.finance?.asaasAccountId || null;

      // 3. Call Vercel Serverless API for payment
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerId,
          value: plan === 'GROWTH' ? 149.90 : 299.90,
          billingType: 'PIX',
          description: `Assinatura Emprata ${plan}`
        })
      });
      
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.invoiceUrl) {
        // Redirect to Asaas payment page
        window.location.href = data.invoiceUrl;
        return;
      }

      // Fallback: Direct update (demo mode)
      await updateDoc(doc(db, 'users', user.uid), {
        subscription: {
          plan: plan,
          status: 'active',
          updatedAt: new Date()
        }
      });
      
      toast.success(`🎉 Parabéns! Você agora é ${PLANS[plan].label}!`);
      setTimeout(() => navigate('/dashboard'), 1500);
      
    } catch (error) {
      console.error('[Subscription] Error:', error);
      toast.error("Erro ao processar assinatura. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="fixed top-6 left-6 bg-white/5 hover:bg-white/10 p-3 rounded-full transition-colors z-50"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crown className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">
            Escolha seu <span className="text-primary">Poder</span>
          </h1>
          <p className="text-white/50 text-lg">
            Desbloqueie o verdadeiro potencial do seu delivery com ferramentas exclusivas.
          </p>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-stretch">
        
        {/* STARTER */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-[#121212] p-8 rounded-3xl border transition-all ${
            currentPlan === 'STARTER' 
              ? 'border-gray-500/50 opacity-70' 
              : 'border-white/5 hover:border-white/20'
          }`}
        >
          <h3 className="text-xl font-bold mb-2 text-gray-400">Starter</h3>
          <p className="text-4xl font-black mb-1">Grátis</p>
          <p className="text-xs text-white/40 mb-6">para sempre</p>
          
          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-gray-400 shrink-0" /> 
              <span>Cardápio Digital</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-gray-400 shrink-0" /> 
              <span>Gestor de Pedidos</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-gray-400 shrink-0" /> 
              <span>Cozinha (KDS)</span>
            </li>
            <li className="flex gap-2 items-center text-white/30">
              <X size={16} className="shrink-0" /> 
              <span>App do Motorista</span>
            </li>
            <li className="flex gap-2 items-center text-white/30">
              <X size={16} className="shrink-0" /> 
              <span>Inteligência Artificial</span>
            </li>
          </ul>
          
          <button 
            disabled
            className="w-full py-4 border border-white/10 rounded-xl font-bold text-white/30 cursor-not-allowed"
          >
            {currentPlan === 'STARTER' ? 'Plano Atual' : 'Downgrade'}
          </button>
        </motion.div>

        {/* GROWTH */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-[#121212] p-8 rounded-3xl border relative transform hover:scale-[1.02] transition-all ${
            currentPlan === 'GROWTH' 
              ? 'border-green-500 shadow-xl shadow-green-500/10' 
              : 'border-green-500/30 hover:border-green-500/60'
          }`}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            Mais Popular
          </div>
          
          <h3 className="text-xl font-bold mb-2 text-green-400">Growth</h3>
          <p className="text-4xl font-black mb-1">
            R$ 149<span className="text-lg text-white/40">,90</span>
          </p>
          <p className="text-xs text-white/40 mb-6">por mês</p>
          
          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-green-400 shrink-0" /> 
              <span>Tudo do Starter</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-green-400 shrink-0" /> 
              <span>App do Motorista (GPS)</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-green-400 shrink-0" /> 
              <span>Terminal PDV</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-green-400 shrink-0" /> 
              <span>Modo Chuva</span>
            </li>
            <li className="flex gap-2 items-center text-white/30">
              <X size={16} className="shrink-0" /> 
              <span>Inteligência Artificial</span>
            </li>
          </ul>
          
          <button 
            onClick={() => handleUpgrade('GROWTH')}
            disabled={loading !== null || currentPlan === 'GROWTH'}
            className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-black shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'GROWTH' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentPlan === 'GROWTH' ? (
              'Plano Atual'
            ) : (
              'ASSINAR GROWTH'
            )}
          </button>
        </motion.div>

        {/* BLACK */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`bg-gradient-to-b from-[#1a1a1a] to-black p-8 rounded-3xl border relative overflow-hidden transform hover:scale-[1.02] transition-all ${
            currentPlan === 'BLACK' 
              ? 'border-purple-500 shadow-xl shadow-purple-500/20' 
              : 'border-purple-500/30 hover:border-purple-500/60'
          }`}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-purple-500/5 blur-[80px] pointer-events-none" />
          
          <h3 className="text-xl font-bold mb-2 text-purple-400 flex items-center gap-2 relative z-10">
            Emprata Black <Zap size={16} className="fill-purple-400" />
          </h3>
          <p className="text-4xl font-black mb-1 relative z-10">
            R$ 299<span className="text-lg text-white/40">,90</span>
          </p>
          <p className="text-xs text-white/40 mb-6 relative z-10">por mês</p>
          
          <ul className="space-y-3 mb-8 text-sm relative z-10">
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-purple-400 shrink-0" /> 
              <span>Tudo do Growth</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-purple-400 shrink-0" /> 
              <span>EmprataBrain (IA)</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-purple-400 shrink-0" /> 
              <span>Previsão de Demanda</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-purple-400 shrink-0" /> 
              <span>Consultoria de Lucro</span>
            </li>
            <li className="flex gap-2 items-center">
              <Check size={16} className="text-purple-400 shrink-0" /> 
              <span>Suporte VIP</span>
            </li>
          </ul>
          
          <button 
            onClick={() => handleUpgrade('BLACK')}
            disabled={loading !== null || currentPlan === 'BLACK'}
            className="w-full py-4 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-black shadow-xl relative z-10 transition-all flex items-center justify-center gap-2"
          >
            {loading === 'BLACK' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : currentPlan === 'BLACK' ? (
              'Plano Atual'
            ) : (
              <>
                <Zap size={16} className="fill-black" /> ASSINAR BLACK
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* FAQ or guarantee */}
      <div className="max-w-2xl mx-auto text-center mt-16">
        <p className="text-white/30 text-sm">
          💳 Pagamento seguro • Cancele quando quiser • Suporte em português
        </p>
      </div>
    </div>
  );
}
