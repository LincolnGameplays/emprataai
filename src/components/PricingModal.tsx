import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle2, Star, Sparkles, Crown, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, Link } from 'react-router-dom';
import CheckoutModal from './CheckoutModal';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const user = useAppStore((state) => state.userId);
  const navigate = useNavigate();
  
  // Estado local para abrir o checkout SE O USUÁRIO JÁ ESTIVER LOGADO
  const [localCheckout, setLocalCheckout] = useState<{
    plan: 'STARTER' | 'GROWTH';
    price: number;
  } | null>(null);

  const handleSelectPlan = (plan: 'STARTER' | 'GROWTH') => {
    // 1. Salva a intenção SEMPRE (para recuperar após login)
    sessionStorage.setItem('pending_plan', plan);

    if (!user) {
      // 2a. Se NÃO logado: Vai pro login
      navigate('/auth');
      onClose();
    } else {
      // 2b. Se JÁ logado: Abre o checkout aqui mesmo
      // NÃO chamamos onClose() para não desmontar o modal pai bruscamente
      setLocalCheckout({
        plan,
        price: plan === 'STARTER' ? 97.00 : 197.00
      });
      
      // Limpa do storage já que vamos usar agora
      sessionStorage.removeItem('pending_plan');
    }
  };
  
  return (
    <>
      <AnimatePresence>
        {isOpen && !localCheckout && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(255,94,0,0.3)] max-h-[90vh] overflow-y-auto"
            >
              <button 
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 p-3 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 md:p-12 pt-20 relative z-10">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/40 rotate-12 mx-auto">
                    <Zap className="w-10 h-10 text-white fill-current" />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-4">
                    Escolha Seu <span className="text-primary">Arsenal</span>
                  </h2>
                  <p className="text-white/50 font-medium text-lg max-w-2xl mx-auto">
                    Domine o delivery com inteligência artificial.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  
                  {/* FREE */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col">
                    <div className="mb-6">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Teste Grátis</span>
                      <h3 className="text-2xl font-black mt-2 mb-1 italic uppercase">Degustação</h3>
                    </div>
                    <div className="mb-6">
                      <div className="text-5xl font-black tracking-tight mb-1 italic">R$ 0</div>
                      <p className="text-xs font-bold text-white/40">Sem cartão • Sem compromisso</p>
                    </div>
                    <ul className="space-y-2 mb-8 flex-grow text-sm font-medium text-white/50">
                      <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-white/20"/> 1 Crédito</li>
                      <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-white/20"/> Baixa Resolução</li>
                    </ul>
                    <Link to="/app" onClick={onClose} className="mt-auto">
                      <button 
                        type="button"
                        className="w-full py-4 rounded-2xl border-2 border-white/10 font-black hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
                      >
                        Testar Agora
                      </button>
                    </Link>
                  </div>

                  {/* STARTER */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-500/30 rounded-3xl p-8 flex flex-col relative">
                    <div className="mb-6 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Assinatura Mensal</span>
                      <h3 className="text-2xl font-black mt-2 mb-1 italic uppercase">Pack Delivery</h3>
                    </div>
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-5xl font-black tracking-tight italic">R$ 97</span>
                        <span className="text-lg font-bold text-white/40">/mês</span>
                      </div>
                      <p className="text-sm font-bold text-blue-400">50 Créditos Mensais</p>
                    </div>
                    <ul className="space-y-2 mb-8 flex-grow text-sm font-medium">
                      <li className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-blue-400"/> 50 Créditos</li>
                      <li className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-blue-400"/> Full HD</li>
                    </ul>
                    <button 
                      type="button"
                      onClick={() => handleSelectPlan('STARTER')}
                      className="w-full py-5 rounded-2xl bg-blue-500 hover:bg-blue-600 font-black text-white shadow-xl shadow-blue-500/30 uppercase tracking-tighter text-base transition-all hover:scale-[1.02] active:scale-95 mt-auto flex items-center justify-center gap-2"
                    >
                      Comprar Pack
                    </button>
                  </div>

                  {/* PRO */}
                  <div className="bg-gradient-to-br from-primary/20 to-orange-600/10 border-2 border-primary rounded-3xl p-8 flex flex-col relative overflow-hidden transform scale-105">
                    <div className="mb-6 mt-6 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Emprata Neural Engine™</span>
                      <h3 className="text-2xl font-black mt-2 mb-1 italic uppercase">Franquia / Pro</h3>
                    </div>
                    <div className="mb-6 relative z-10">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-5xl font-black tracking-tight italic">R$ 197</span>
                        <span className="text-lg font-bold text-white/40">/mês</span>
                      </div>
                      <p className="text-sm font-bold text-primary">200 Créditos + Vibes PRO</p>
                    </div>
                    <ul className="space-y-2 mb-8 flex-grow text-sm font-medium relative z-10">
                      <li className="flex gap-2 items-start"><Crown className="w-4 h-4 text-primary"/> 200 Créditos</li>
                      <li className="flex gap-2 items-start"><Crown className="w-4 h-4 text-primary"/> 4K Ultra HD</li>
                      <li className="flex gap-2 items-start"><Crown className="w-4 h-4 text-primary"/> Sem Marca d'água</li>
                    </ul>
                    <button 
                      type="button"
                      onClick={() => handleSelectPlan('GROWTH')}
                      className="w-full py-5 rounded-2xl bg-primary hover:bg-orange-600 font-black text-white shadow-xl shadow-primary/40 uppercase tracking-tighter text-base transition-all hover:scale-[1.02] active:scale-95 mt-auto relative z-10 flex items-center justify-center gap-2"
                    >
                      <Star className="w-5 h-5 inline-block mr-2 fill-current" />
                      Quero Lucro Máximo
                    </button>
                  </div>

                </div>
                <p className="text-center text-xs font-black uppercase tracking-widest text-white/20 mt-8">
                  Pagamento 100% Seguro • Processado pela Asaas
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDERIZA O CHECKOUT POR CIMA SE ESTIVER LOGADO E CLICOU AGORA */}
      {localCheckout && (
        <CheckoutModal
          isOpen={!!localCheckout}
          onClose={() => {
            setLocalCheckout(null);
            onClose(); // Fecha tudo quando o checkout é fechado
          }}
          plan={localCheckout.plan}
          price={localCheckout.price}
        />
      )}
    </>
  );
}

