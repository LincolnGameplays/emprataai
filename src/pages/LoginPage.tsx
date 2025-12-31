/**
 * ⚡ LOGIN PAGE - Multi-Role Auth with Pending Plan Auto-Subscription ⚡
 * Handles pending plan flow: detects saved plan → auto-creates Asaas subscription
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, ShoppingBag, ArrowRight, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { signInAnonymously } from 'firebase/auth';
import { functions, auth } from '../config/firebase';

// ══════════════════════════════════════════════════════════════════
// PLAN CONFIG
// ══════════════════════════════════════════════════════════════════

const PLAN_LABELS: Record<string, string> = {
  starter: 'STARTER',
  pro: 'GROWTH'
};

type UserRole = 'owner' | 'consumer';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  
  // Detect intent from URL (?role=consumer for Marketplace)
  const initialRole = searchParams.get('role') === 'consumer' ? 'consumer' : 'owner';
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Check for pending plan
  const pendingPlan = typeof window !== 'undefined' 
    ? sessionStorage.getItem('pending_plan') as 'starter' | 'pro' | null 
    : null;

  // ════════════════════════════════════════════════════════════════
  // POST-LOGIN HANDLER: Check for pending plan & auto-subscribe
  // ════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!authLoading && user) {
      handlePostLoginRedirect();
    }
  }, [user, authLoading]);

  const handlePostLoginRedirect = async () => {
    const pendingPlanValue = sessionStorage.getItem('pending_plan') as 'starter' | 'pro' | null;

    if (pendingPlanValue) {
      console.log(`🛒 [LoginPage] Resuming purchase for plan: ${pendingPlanValue}`);
      setProcessingPayment(true);
      
      try {
        toast.loading('Gerando seu pagamento seguro...');

        // Call Asaas subscription API
        const createSub = httpsCallable(functions, 'createSubscription');
        
        const result = await createSub({
          plan: PLAN_LABELS[pendingPlanValue],
          billingType: 'PIX'
        });

        const data = result.data as { success: boolean; invoiceUrl?: string };

        // Clear pending state
        sessionStorage.removeItem('pending_plan');
        sessionStorage.removeItem('purchase_intent_value');

        if (data.success && data.invoiceUrl) {
          // Redirect to Asaas payment page
          window.location.href = data.invoiceUrl;
        } else {
          throw new Error('Falha ao gerar assinatura');
        }

      } catch (error) {
        console.error('Error resuming purchase:', error);
        toast.dismiss();
        toast.error('Erro ao gerar assinatura. Tente novamente.');
        setProcessingPayment(false);
        navigate('/dashboard', { replace: true });
      }
    } else {
      // Normal flow (no pending purchase)
      const userRole = userData?.role || role;
      
      if (userRole === 'consumer') {
        navigate('/marketplace', { replace: true });
      } else if (userRole === 'waiter' || userRole === 'staff') {
        navigate('/waiter-mode', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  // ════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ════════════════════════════════════════════════════════════════

  if (authLoading || processingPayment) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">
          {processingPayment ? 'Preparando seu ambiente...' : 'Conectando...'}
        </h2>
        {processingPayment && (
          <p className="text-white/40 text-sm mt-2">
            Estamos gerando sua assinatura Asaas.
          </p>
        )}
      </div>
    );
  }

  const handleSuccess = () => {
    // Redirect will happen via useEffect
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

      {/* Back Button */}
      <header className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">Voltar</span>
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter mb-2">
            Emprata<span className="text-primary">.ai</span>
          </h1>
          <p className="text-white/40 font-medium">
            {pendingPlan 
              ? 'Complete seu login para ativar o plano'
              : role === 'consumer' 
                ? 'O melhor da gastronomia na sua porta.' 
                : 'O Sistema Operacional do seu Delivery.'}
          </p>
        </div>

        {/* Pending Plan Alert */}
        {pendingPlan && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8 p-4 bg-primary/10 border border-primary/30 rounded-2xl text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-primary text-xs font-black uppercase tracking-wider">
                Quase lá!
              </span>
            </div>
            <p className="text-white/80 text-sm font-medium">
              Faça login para concluir a assinatura do plano{' '}
              <span className="text-white font-black">{pendingPlan.toUpperCase()}</span>
            </p>
          </motion.div>
        )}

        {/* Role Selector Tabs (only show if no pending plan) */}
        {!pendingPlan && (
          <div className="bg-white/5 p-1 rounded-2xl flex mb-8 border border-white/10">
            <button 
              onClick={() => setRole('owner')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                role === 'owner' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4" /> Restaurante
            </button>
            <button 
              onClick={() => setRole('consumer')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                role === 'consumer' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Cliente
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-all duration-1000" />
          
          <h2 className="text-2xl font-bold mb-2 relative z-10">
            {pendingPlan 
              ? 'Login Rápido'
              : role === 'consumer' 
                ? 'Fome de quê?' 
                : 'Gerencie seu Negócio'}
          </h2>
          <p className="text-white/40 text-sm mb-8 relative z-10 leading-relaxed">
            {pendingPlan 
              ? 'Após o login, você será redirecionado automaticamente para o pagamento.'
              : role === 'consumer' 
                ? 'Entre para acompanhar seus pedidos, salvar endereços e descobrir novos sabores.'
                : 'Acesse sua dashboard, KDS e ferramentas de gestão com inteligência artificial.'}
          </p>

          <button 
            onClick={() => setIsAuthOpen(true)}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
              pendingPlan || role === 'owner'
                ? 'bg-primary text-white hover:bg-orange-600' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {pendingPlan ? 'Entrar e Assinar' : role === 'consumer' ? 'Entrar / Cadastrar' : 'Acessar Painel'} 
            <ArrowRight className="w-4 h-4" />
          </button>

          {role === 'owner' && !pendingPlan && (
            <Link 
              to="/waiter-login" 
              className="block text-center mt-4 text-xs font-bold text-white/30 hover:text-white transition-colors"
            >
              Sou Garçom / Staff
            </Link>
          )}

          {/* Guest Access - Zero Friction Onboarding */}
          {role === 'consumer' && !pendingPlan && (
            <button 
              onClick={async () => {
                try {
                  await signInAnonymously(auth);
                  navigate('/marketplace');
                  toast.success("Modo Visitante Ativado! 👀");
                } catch (e) {
                  toast.error("Erro ao entrar como visitante");
                }
              }}
              className="block w-full text-center mt-4 text-sm text-white/40 hover:text-white transition-colors underline underline-offset-4"
            >
              Só estou dando uma olhadinha (Entrar sem cadastro)
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-[10px] font-bold text-white/20 uppercase tracking-widest">
          Emprata Inc. © 2025
        </div>
      </motion.div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
