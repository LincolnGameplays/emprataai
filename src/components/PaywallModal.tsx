import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle2, Star, Sparkles, Crown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Link, useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const userId = useAppStore((state) => state.userId);
  const navigate = useNavigate();
  
  /**
   * Handle checkout process
   * @param planType - 'starter' or 'pro'
   */
  const handleCheckout = (planType: 'starter' | 'pro') => {
    // Ensure user is authenticated
    if (!userId) {
      navigate('/auth');
      return;
    }
    
    // Define checkout URLs
    let checkoutUrl: string;
    
    if (planType === 'starter') {
      checkoutUrl = 'https://pay.kirvano.com/30cef9d1-c08e-49ed-b361-2862f182485f';
    } else {
      checkoutUrl = 'https://pay.kirvano.com/b26facd0-9585-4b17-8b68-d58aaf659939';
    }
    
    // Append external_id for webhook automation
    const finalUrl = `${checkoutUrl}?external_id=${userId}`;
    
    // Open checkout in new tab
    window.open(finalUrl, '_blank');
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
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
            className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(255,94,0,0.3)] max-h-[90vh] overflow-y-auto"
          >
            {/* Header Gradient */}
            <div className="absolute top-0 inset-x-0 h-60 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none" />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8 md:p-12 pt-20 relative z-10">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/40 rotate-12 mx-auto">
                  <Zap className="w-10 h-10 text-white fill-current" />
                </div>
                
                <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-4">
                  Escolha Seu <span className="text-primary">Arsenal</span>
                </h2>
                
                <p className="text-white/50 font-medium text-lg max-w-2xl mx-auto">
                  De teste gratuito a domínio total do delivery. Você escolhe o ritmo.
                </p>
              </div>

              {/* 3-Tier Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                
                {/* TIER 1: FREE */}
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
                    <li className="flex gap-2 items-start">
                      <CheckCircle2 className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                      <span><span className="text-white font-bold">1 Crédito</span> para testar</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <CheckCircle2 className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                      Baixa Resolução (720p)
                    </li>
                    <li className="flex gap-2 items-start">
                      <CheckCircle2 className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                      Com Marca d'água
                    </li>
                    <li className="flex gap-2 items-start">
                      <CheckCircle2 className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                      1 Estilo disponível
                    </li>
                  </ul>
                  
                  <Link to="/app" onClick={onClose} className="mt-auto">
                    <button className="w-full py-4 rounded-2xl border-2 border-white/10 font-black hover:bg-white/5 transition-all uppercase tracking-widest text-xs">
                      Testar Agora
                    </button>
                  </Link>
                </div>

                {/* TIER 2: STARTER */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-500/30 rounded-3xl p-8 flex flex-col relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full font-black text-[10px] tracking-widest uppercase">
                    Ideal Cardápios Pequenos
                  </div>
                  
                  <div className="mb-6 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Pagamento Único</span>
                    <h3 className="text-2xl font-black mt-2 mb-1 italic uppercase">Pack Delivery</h3>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-5xl font-black tracking-tight italic">R$ 97</span>
                      <span className="text-lg font-bold text-white/40">/mês</span>
                    </div>
                    <p className="text-sm font-bold text-blue-400">15 Créditos Mensais</p>
                    <p className="text-xs font-black text-white/30 mt-1">(Acumulativos) • R$ 6,40/foto</p>
                  </div>
                  
                  <ul className="space-y-2 mb-8 flex-grow text-sm font-medium">
                    <li className="flex gap-2 items-start">
                      <Sparkles className="w-4 h-4 text-blue-400 fill-current shrink-0 mt-0.5" />
                      <span className="text-white font-bold">15 Créditos</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <Sparkles className="w-4 h-4 text-blue-400 fill-current shrink-0 mt-0.5" />
                      Full HD (1080p)
                    </li>
                    <li className="flex gap-2 items-start">
                      <Sparkles className="w-4 h-4 text-blue-400 fill-current shrink-0 mt-0.5" />
                      Sem Marca d'água
                    </li>
                    <li className="flex gap-2 items-start">
                      <Sparkles className="w-4 h-4 text-blue-400 fill-current shrink-0 mt-0.5" />
                      Todos os Estilos Pro
                    </li>
                    <li className="flex gap-2 items-start">
                      <Sparkles className="w-4 h-4 text-blue-400 fill-current shrink-0 mt-0.5" />
                      Suporte via Email
                    </li>
                  </ul>
                  
                  <button 
                    onClick={() => handleCheckout('starter')}
                    className="w-full py-5 rounded-2xl bg-blue-500 hover:bg-blue-600 font-black text-white shadow-xl shadow-blue-500/30 uppercase tracking-tighter text-base transition-all hover:scale-[1.02] active:scale-95 mt-auto"
                  >
                    Comprar Pack
                  </button>
                </div>

                {/* TIER 3: PRO */}
                <div className="bg-gradient-to-br from-primary/20 to-orange-600/10 border-2 border-primary rounded-3xl p-8 flex flex-col relative overflow-hidden transform scale-105">
                  <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] tracking-widest uppercase italic">
                    MAIS VENDIDO
                  </div>
                  
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                  
                  <div className="mb-6 mt-6 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Emprata Neural Engine™</span>
                    <h3 className="text-2xl font-black mt-2 mb-1 italic uppercase">Franquia / Pro</h3>
                  </div>
                  
                  <div className="mb-6 relative z-10">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-5xl font-black tracking-tight italic">R$ 197</span>
                      <span className="text-lg font-bold text-white/40">/mês</span>
                    </div>
                    <p className="text-sm font-bold text-primary">50 Créditos Mensais + Vibes PRO</p>
                    <p className="text-xs font-black text-white/30 mt-1">(Acumulativos) • R$ 3,90/foto 🔥</p>
                  </div>
                  
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-6 relative z-10">
                    <p className="text-xs font-black text-primary uppercase tracking-wide text-center">
                      💡 Recomendado para Dark Kitchens
                    </p>
                  </div>
                  
                  <ul className="space-y-2 mb-8 flex-grow text-sm font-medium relative z-10">
                    <li className="flex gap-2 items-start">
                      <Crown className="w-4 h-4 text-primary fill-current shrink-0 mt-0.5" />
                      <span className="text-white font-bold">50 Créditos Premium</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <Crown className="w-4 h-4 text-primary fill-current shrink-0 mt-0.5" />
                      4K Ultra HD
                    </li>
                    <li className="flex gap-2 items-start">
                      <Crown className="w-4 h-4 text-primary fill-current shrink-0 mt-0.5" />
                      Sem Marca d'água
                    </li>
                    <li className="flex gap-2 items-start">
                      <Crown className="w-4 h-4 text-primary fill-current shrink-0 mt-0.5" />
                      Estilos Exclusivos
                    </li>
                    <li className="flex gap-2 items-start">
                      <Crown className="w-4 h-4 text-primary fill-current shrink-0 mt-0.5" />
                      Suporte WhatsApp
                    </li>
                    <li className="flex gap-2 items-start">
                      <Crown className="w-4 h-4 text-primary fill-current shrink-0 mt-0.5" />
                      Processamento Rápido
                    </li>
                  </ul>
                  
                  <button 
                    onClick={() => handleCheckout('pro')}
                    className="w-full py-5 rounded-2xl bg-primary hover:bg-orange-600 font-black text-white shadow-xl shadow-primary/40 uppercase tracking-tighter text-base transition-all hover:scale-[1.02] active:scale-95 mt-auto relative z-10"
                  >
                    <Star className="w-5 h-5 inline-block mr-2 fill-current" />
                    Quero Lucro Máximo
                  </button>
                </div>

              </div>

              {/* Footer Note */}
              <p className="text-center text-xs font-black uppercase tracking-widest text-white/20 mt-8">
                Pagamento 100% Seguro • Processado pela Kirvano
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
