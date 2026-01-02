/**
 * 🔥 DAILY MISSIONS - Motor de Engajamento
 * 
 * Missões diárias que resetam a cada 24h
 * Mantém o usuário voltando todos os dias (Streak)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Flame, Gift, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface Quest {
  id: string;
  label: string;
  xp: number;
  path: string;
  keywords: string[];
}

// Missões que resetam a cada 24h
const DAILY_QUESTS: Quest[] = [
  { id: 'share', label: 'Divulgar Link no WhatsApp', xp: 50, path: '/marketing', keywords: ['marketing', 'whatsapp'] },
  { id: 'stock', label: 'Verificar Estoque', xp: 30, path: '/menu-builder', keywords: ['menu', 'estoque'] },
  { id: 'reviews', label: 'Responder Avaliações', xp: 40, path: '/reviews', keywords: ['avaliações', 'clientes'] },
  { id: 'brain', label: 'Consultar o EmprataBrain', xp: 25, path: '/owner', keywords: ['ia', 'brain'] },
];

interface DailyMissionsProps {
  userId?: string;
}

export default function DailyMissions({ userId }: DailyMissionsProps) {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);

  // Carregar streak e missões completadas do localStorage (simplificado)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('emprata_missions_date');
    const savedCompleted = localStorage.getItem('emprata_missions_completed');
    const savedStreak = localStorage.getItem('emprata_streak');
    
    // Se é um novo dia, resetar missões
    if (savedDate !== today) {
      localStorage.setItem('emprata_missions_date', today);
      localStorage.setItem('emprata_missions_completed', '[]');
      
      // Verificar streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (savedDate === yesterdayStr && savedCompleted && JSON.parse(savedCompleted).length > 0) {
        // Manteve o streak
        const newStreak = (parseInt(savedStreak || '0') || 0) + 1;
        setStreak(newStreak);
        localStorage.setItem('emprata_streak', newStreak.toString());
      } else if (savedDate !== yesterdayStr) {
        // Perdeu o streak
        setStreak(1);
        localStorage.setItem('emprata_streak', '1');
      }
      
      setCompleted([]);
    } else {
      setCompleted(savedCompleted ? JSON.parse(savedCompleted) : []);
      setStreak(parseInt(savedStreak || '0') || 1);
    }
  }, []);

  // Progresso da Barra
  const progress = (completed.length / DAILY_QUESTS.length) * 100;
  const totalXP = completed.reduce((sum, id) => {
    const quest = DAILY_QUESTS.find(q => q.id === id);
    return sum + (quest?.xp || 0);
  }, 0);

  const handleQuestClick = (quest: Quest) => {
    if (completed.includes(quest.id)) {
      // Já completou, só navega
      navigate(quest.path);
      return;
    }
    
    // Marca como completado
    const newCompleted = [...completed, quest.id];
    setCompleted(newCompleted);
    localStorage.setItem('emprata_missions_completed', JSON.stringify(newCompleted));
    
    toast.success(`+${quest.xp} XP! Missão cumprida!`, { icon: '🎯' });

    // Se completou tudo
    if (newCompleted.length === DAILY_QUESTS.length) {
      setTimeout(() => {
        setShowReward(true);
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#fbbf24', '#f97316']
        });
        toast.success('🏆 Todas as missões completas! Boost de Visibilidade ativado!');
      }, 500);
    }

    // Navega para a página
    navigate(quest.path);
  };

  return (
    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-6 border border-white/10 relative overflow-hidden shadow-2xl">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/5 blur-[60px] rounded-full pointer-events-none" />

      <div className="flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Lado Esquerdo: Status & Streak */}
        <div className="lg:w-1/3 space-y-4">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-orange-500/20 p-3 rounded-xl text-orange-500 border border-orange-500/30"
            >
              <Flame size={28} fill="currentColor" />
            </motion.div>
            <div>
              <h3 className="font-black text-white text-2xl">{streak} {streak === 1 ? 'Dia' : 'Dias'}</h3>
              <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Ofensiva Implacável</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white/60">
              <span>Metas de Hoje</span>
              <span className="text-primary">{totalXP} XP</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"
              />
            </div>
            <p className="text-[10px] text-white/30">
              {completed.length === DAILY_QUESTS.length 
                ? '🎉 Todas completas! Você é incrível!' 
                : `Complete ${DAILY_QUESTS.length - completed.length} missões para ganhar Boost.`
              }
            </p>
          </div>

          {/* Reward Badge */}
          {showReward && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 rounded-xl border border-yellow-500/30 flex items-center gap-2"
            >
              <Gift size={18} className="text-yellow-400" />
              <span className="text-xs text-yellow-200 font-bold">Boost de Visibilidade Ativo!</span>
            </motion.div>
          )}
        </div>

        {/* Lado Direito: As Missões */}
        <div className="lg:w-2/3 grid gap-2">
          {DAILY_QUESTS.map((quest) => {
            const isDone = completed.includes(quest.id);
            return (
              <motion.button
                key={quest.id}
                onClick={() => handleQuestClick(quest)}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                  isDone 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 size={20} className="text-green-400" />
                  ) : (
                    <Circle size={20} className="text-white/20" />
                  )}
                  <span className={`font-bold text-sm ${isDone ? 'line-through text-white/40' : 'text-white'}`}>
                    {quest.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-1 rounded ${isDone ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}`}>
                    +{quest.xp} XP
                  </span>
                  {!isDone && <ArrowRight size={14} className="text-white/20" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
