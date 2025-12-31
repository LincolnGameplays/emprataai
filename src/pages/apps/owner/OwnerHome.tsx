import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, ArrowRight, AlertTriangle, CloudRain, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerHome() {
  // Mock dos dados que viriam do EmprataBrain
  const insights = [
    { type: 'URGENT', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', title: 'Estoque Crítico', desc: 'Coca-Cola Lata deve acabar em 2h.' },
    { type: 'OPPORTUNITY', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', title: 'Pico de Demanda', desc: 'Sexta-feira chuvosa prevista. Sugiro ativar "Modo Chuva".' },
    { type: 'INFO', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Cliente VIP', desc: 'João (Top 10) acabou de fazer o 50º pedido!' },
  ];

  const handleRainMode = () => {
    toast.success("☔ Modo Chuva ativado! Taxa de entrega +R$3");
  };

  const handleExtendTime = () => {
    toast.success("⏰ Prazo estendido em +15min para novos pedidos");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
       
       {/* 1. FATURAMENTO LIVE */}
       <div className="bg-[#1a1a1a] rounded-[2rem] p-6 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-24 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Vendas Hoje</p>
          <div className="flex items-end gap-3">
             <h2 className="text-5xl font-black text-white">R$ 1.450</h2>
             <span className="text-green-400 text-sm font-bold mb-2 flex items-center">
                <TrendingUp size={14} className="mr-1" /> +12%
             </span>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-bold text-white/50">
             <span>📦 24 Pedidos</span>
             <span>🛵 34min média</span>
          </div>
       </div>

       {/* 2. FEED NEURAL (Onde a IA fala com o dono) */}
       <div>
          <h3 className="text-sm font-bold text-white/40 uppercase mb-4 ml-2">Insights da IA</h3>
          <div className="space-y-3">
             {insights.map((card, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-5 rounded-2xl border border-white/5 flex gap-4 ${card.type === 'URGENT' ? 'bg-red-900/10 border-red-500/20' : 'bg-[#121212]'}`}
                >
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}>
                      <card.icon size={24} />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-white">{card.title}</h4>
                      <p className="text-sm text-white/60 leading-tight mt-1">{card.desc}</p>
                   </div>
                   <button className="self-center bg-white/5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                      <ArrowRight size={16} />
                   </button>
                </motion.div>
             ))}
          </div>
       </div>

       {/* 3. AÇÕES RÁPIDAS (Controles de Emergência) */}
       <div>
          <h3 className="text-sm font-bold text-white/40 uppercase mb-4 ml-2">Controle Operacional</h3>
          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={handleRainMode}
               className="bg-[#121212] border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-blue-500/50 transition-colors group active:scale-95"
             >
                <CloudRain size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Modo Chuva</span>
             </button>
             <button 
               onClick={handleExtendTime}
               className="bg-[#121212] border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-orange-500/50 transition-colors group active:scale-95"
             >
                <Clock size={24} className="text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">+15min Prazo</span>
             </button>
          </div>
       </div>

    </motion.div>
  );
}
