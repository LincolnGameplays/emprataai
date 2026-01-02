/**
 * 🚀 OwnerJourney - Página de Jornada do Dono
 * 
 * Mostra o progresso do dono baseado em FATURAMENTO VERIFICADO (só online).
 * Inclui sistema de recompensas automatizadas:
 * - Certificados digitais (custo zero)
 * - Convites para comunidade VIP (custo zero)
 * - Placas físicas (apenas R$500k+)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { 
  OWNER_JOURNEY, 
  getOwnerLevel, 
  getNextOwnerLevel, 
  getOwnerProgress 
} from '../../../types/journey';
import { Lock, Unlock, Trophy, Star, ChevronRight, Loader2, Gift, ExternalLink, MessageCircle, Award, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import CertificateGenerator from '../../../components/gamification/CertificateGenerator';

// Link do grupo VIP (substitua pelo seu)
const VIP_GROUP_LINK = 'https://chat.whatsapp.com/SEU_LINK_DE_CONVITE';

export default function OwnerJourney() {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);

  // Escuta em tempo real o faturamento VERIFICADO (só online)
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      // Usa verifiedRevenue (pagamentos online) como base da Journey
      const verifiedRev = docSnap.data()?.stats?.verifiedRevenue || 0;
      
      // Verificar se subiu de nível
      const savedLevel = localStorage.getItem('emprata_journey_level');
      const currentLevel = getOwnerLevel(verifiedRev);
      
      if (savedLevel && savedLevel !== currentLevel.id && currentLevel.threshold > 0) {
        triggerCelebration();
      }
      
      localStorage.setItem('emprata_journey_level', currentLevel.id);
      setRevenue(verifiedRev);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user?.uid]);

  const triggerCelebration = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#fbbf24', '#a855f7']
    });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  const currentLvl = getOwnerLevel(revenue);
  const nextLvl = getNextOwnerLevel(revenue);
  const { percent: progressPercent, remaining } = getOwnerProgress(revenue);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-8"
    >
      {/* ══════════════════════════════════════════════════════════════════
          HEADER DO NÍVEL ATUAL
      ══════════════════════════════════════════════════════════════════ */}
      <div className={`bg-gradient-to-br ${currentLvl.bgGradient} p-8 rounded-[2rem] relative overflow-hidden`}>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Level Icon */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-28 h-28 rounded-full border-4 border-white/20 flex items-center justify-center text-6xl shadow-2xl bg-black/30 backdrop-blur-md"
          >
            {currentLvl.icon}
          </motion.div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <p className="text-white/60 font-bold uppercase tracking-widest text-xs flex items-center justify-center md:justify-start gap-2">
              Sua Patente Atual <ShieldCheck size={12} className="text-green-400" />
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-white">{currentLvl.label}</h1>
            <p className="text-white/80">
              Faturamento verificado: <span className="font-bold text-white">R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>

          {/* Benefits Card */}
          <div className="bg-black/30 backdrop-blur-md p-4 rounded-xl border border-white/10 text-left min-w-[220px]">
            <p className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <Star size={12} fill="white"/> Benefícios Ativos
            </p>
            <ul className="space-y-1.5">
              {currentLvl.benefits.map((b, i) => (
                <li key={i} className="text-xs text-white/80 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0"/> {b}
                </li>
              ))}
              {currentLvl.feeDiscount > 0 && (
                <li className="text-xs text-green-400 font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0"/> 
                  -{(currentLvl.feeDiscount * 100).toFixed(1)}% na taxa
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Progress Bar */}
        {nextLvl && (
          <div className="mt-8 relative z-10">
            <div className="flex justify-between text-xs font-bold text-white/60 mb-2">
              <span>Progresso</span>
              <span>Próximo: {nextLvl.label} (R$ {nextLvl.threshold.toLocaleString()})</span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${progressPercent}%` }} 
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.5)]"
              />
            </div>
            <p className="text-right text-xs text-white/50 mt-2">
              Faltam <span className="text-white font-bold">R$ {remaining.toLocaleString('pt-BR')}</span> para evoluir
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RECOMPENSAS DISPONÍVEIS (Automatizadas)
      ══════════════════════════════════════════════════════════════════ */}
      {currentLvl.reward && (
        <div className="bg-gradient-to-r from-green-900/20 to-transparent p-6 rounded-2xl border border-green-500/30">
          <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Gift className="text-green-400" /> 🎉 Recompensa Disponível!
          </h3>
          
          {/* Certificado Digital */}
          {currentLvl.rewardType === 'DIGITAL_CERTIFICATE' && (
            <div className="space-y-4">
              <p className="text-white/60 text-sm">{currentLvl.rewardDescription}</p>
              {showCertificate ? (
                <CertificateGenerator level={currentLvl} revenue={revenue} />
              ) : (
                <button
                  onClick={() => setShowCertificate(true)}
                  className="bg-primary hover:bg-green-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Award size={18} /> Gerar Certificado
                </button>
              )}
            </div>
          )}

          {/* Comunidade VIP */}
          {currentLvl.rewardType === 'VIP_COMMUNITY' && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-green-400">Acesso à Comunidade VIP</h4>
                <p className="text-xs text-white/60">{currentLvl.rewardDescription}</p>
              </div>
              <a 
                href={VIP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-400 transition-colors shrink-0"
              >
                <MessageCircle size={16} /> ENTRAR AGORA
              </a>
            </div>
          )}

          {/* Feature Unlock */}
          {currentLvl.rewardType === 'FEATURE_UNLOCK' && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <p className="text-sm text-white/80">
                <span className="text-green-400 font-bold">✓ {currentLvl.reward}</span> desbloqueado automaticamente!
              </p>
              <p className="text-xs text-white/50 mt-1">{currentLvl.rewardDescription}</p>
            </div>
          )}

          {/* Placa Física */}
          {(currentLvl.rewardType === 'PHYSICAL_PLAQUE' || currentLvl.rewardType === 'TROPHY') && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-yellow-400 flex items-center gap-2">
                  <Gift size={16} /> {currentLvl.reward}
                </h4>
                <p className="text-xs text-white/60">{currentLvl.rewardDescription}</p>
              </div>
              <a 
                href="mailto:contato@emprata.ai?subject=Solicitação de Placa/Troféu"
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-yellow-400 transition-colors shrink-0"
              >
                <ExternalLink size={14} /> SOLICITAR
              </a>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TIMELINE DE CONQUISTAS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Mapa da Jornada
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {OWNER_JOURNEY.map((level) => {
            const isUnlocked = revenue >= level.threshold;
            const isNext = nextLvl?.id === level.id;
            const isCurrent = currentLvl.id === level.id;

            return (
              <motion.div 
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
                className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                  isCurrent
                    ? `bg-gradient-to-br ${level.bgGradient} border-white/30 ring-2 ring-white/20`
                    : isUnlocked 
                      ? 'bg-[#1a1a1a] border-green-500/30' 
                      : isNext 
                        ? 'bg-[#121212] border-white/20 ring-1 ring-primary/30' 
                        : 'bg-[#0a0a0a] border-white/5 opacity-50'
                }`}
              >
                {/* Glow Effect for Next Level */}
                {isNext && (
                  <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
                )}

                <div className="flex justify-between items-start mb-3 relative z-10">
                  <span className="text-3xl">{level.icon}</span>
                  {isUnlocked ? (
                    <Unlock size={16} className="text-green-400"/>
                  ) : (
                    <Lock size={16} className="text-white/20"/>
                  )}
                </div>

                <h3 className={`font-bold text-base ${isCurrent ? 'text-white' : isUnlocked ? 'text-white' : 'text-white/60'}`}>
                  {level.label}
                </h3>
                <p className="text-xs font-mono text-white/30 mb-3">
                  R$ {level.threshold.toLocaleString()}
                </p>

                <ul className="space-y-1.5 relative z-10">
                  {level.benefits.slice(0, 2).map((b, i) => (
                    <li key={i} className="text-[11px] flex items-center gap-1.5 text-white/50">
                      <ChevronRight size={10} className="shrink-0" /> 
                      <span className="truncate">{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Reward Badge */}
                {level.reward && (
                  <div className={`mt-3 pt-3 border-t border-white/10 ${isUnlocked ? 'opacity-100' : 'opacity-40'}`}>
                    <p className="text-[10px] font-bold text-white/60 uppercase flex items-center gap-1">
                      <Gift size={10} /> {level.reward}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CTA DE MOTIVAÇÃO
      ══════════════════════════════════════════════════════════════════ */}
      {nextLvl && (
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{nextLvl.icon}</div>
            <div className="flex-1">
              <p className="text-white font-bold">Próxima conquista: {nextLvl.label}</p>
              <p className="text-white/50 text-sm">
                Venda mais R$ {remaining.toLocaleString('pt-BR')} via checkout online!
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/menu-builder'}
              className="px-4 py-2 bg-primary text-black rounded-xl font-bold text-sm hover:bg-green-400 transition-colors"
            >
              Criar Promoção
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
