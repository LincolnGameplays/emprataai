/**
 * 🚀 JourneyWidget - Barra de Progresso da Emprata Journey
 * 
 * Widget compacto para o Dashboard que exibe:
 * - Nível atual do dono
 * - Barra de progresso animada com shimmer
 * - XP verificado (apenas pagamentos online)
 * - Tooltip educativo sobre como ganhar XP
 * 
 * SEGURANÇA: Este componente APENAS LÊ o campo verifiedRevenue.
 * A escrita acontece exclusivamente no webhook do Asaas.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  OWNER_JOURNEY, 
  getOwnerLevel, 
  getNextOwnerLevel 
} from '../../types/journey';
import { Lock, HelpCircle, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function JourneyWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [verifiedRevenue, setVerifiedRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Escuta APENAS o campo seguro do banco (read-only no frontend)
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      // Pega 'verifiedRevenue' (apenas pagamentos online processados pelo Asaas)
      const data = docSnap.data();
      setVerifiedRevenue(data?.stats?.verifiedRevenue || 0);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="h-36 bg-gradient-to-r from-[#0a0a0a] to-[#121212] rounded-[2rem] animate-pulse border border-white/5" />
    );
  }

  // Cálculos da Jornada usando funções existentes do journey.ts
  const currentLvl = getOwnerLevel(verifiedRevenue);
  const nextLvl = getNextOwnerLevel(verifiedRevenue);

  // Calcular threshold do nível atual
  const currentIndex = OWNER_JOURNEY.findIndex(lvl => lvl.id === currentLvl.id);
  const prevThreshold = currentLvl.threshold;
  const nextThreshold = nextLvl?.threshold || prevThreshold * 2;
  
  // Porcentagem da Barra (com limite 0 a 100)
  const totalRange = nextThreshold - prevThreshold;
  const currentProgress = verifiedRevenue - prevThreshold;
  const percentage = totalRange > 0 
    ? Math.min(100, Math.max(0, (currentProgress / totalRange) * 100))
    : 100;

  // Cor dinâmica baseada no nível (extrair o nome da cor do Tailwind)
  const colorClass = currentLvl.color; // ex: 'text-yellow-400'
  const bgColor = colorClass.replace('text-', 'bg-'); // ex: 'bg-yellow-400'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#0a0a0a] to-[#121212] rounded-[2rem] p-6 border border-white/10 relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all"
      onClick={() => navigate('/owner/journey')}
    >
      {/* Background Glow Effect */}
      <div 
        className={`absolute top-0 right-0 w-40 h-40 ${bgColor}/5 blur-[80px] rounded-full pointer-events-none transition-all duration-1000`} 
      />
       
      <div className="relative z-10">
        {/* Header: Nível e Ícone */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-4">
            {/* Ícone do Nível */}
            <div className={`w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-2xl shadow-lg`}>
              {currentLvl.icon}
            </div>
            
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                Sua Patente <ShieldCheck size={10} className="text-green-500"/>
              </p>
              <h2 className={`text-xl font-black ${colorClass} tracking-tight`}>
                {currentLvl.label}
              </h2>
            </div>
          </div>

          {/* Badge de Próxima Recompensa (Desktop) */}
          {nextLvl && (
            <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-right hidden md:block">
              <p className="text-[9px] text-white/40 uppercase font-bold mb-0.5">Próxima Conquista</p>
              <p className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                <span className="truncate max-w-[120px]">{nextLvl.benefits[0]}</span>
                <Lock size={10} className="text-white/30 shrink-0"/>
              </p>
            </div>
          )}
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase">
            <span>XP Verificado: R$ {verifiedRevenue.toLocaleString('pt-BR')}</span>
            <span>Meta: R$ {nextThreshold.toLocaleString('pt-BR')}</span>
          </div>
          
          {/* O Trilho da Barra */}
          <div className="h-5 bg-[#050505] rounded-full border border-white/5 relative overflow-hidden shadow-inner">
            {/* O Enchimento Animado */}
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`h-full relative overflow-hidden flex items-center justify-end pr-2 ${bgColor}`}
            >
              {/* Efeito de Brilho (Shimmer) */}
              <div className="absolute top-0 left-0 w-full h-full shimmer" />
              
              {/* Indicador de % dentro da barra */}
              {percentage > 10 && (
                <span className="text-[9px] font-black text-black/60 relative z-10">
                  {percentage.toFixed(0)}%
                </span>
              )}
            </motion.div>
          </div>
        </div>

        {/* Footer: Tooltip Educativo + CTA */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] text-white/30">
            <HelpCircle size={12} className="shrink-0" />
            <p>
              Vendas via <strong className="text-white/50">Checkout Online</strong> contam para evolução
            </p>
          </div>
          
          <div className="flex items-center gap-1 text-[10px] font-bold text-white/50 group-hover:text-primary transition-colors">
            <Sparkles size={12} />
            <span>Ver Jornada</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
