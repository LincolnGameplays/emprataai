/**
 * AiPulse Component - Visual AI Status Indicator
 * 
 * Shows the "breathing" pulse effect when AI is active,
 * learning, or processing. Uses Glassmorphism design.
 */

import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, Activity } from 'lucide-react';

interface AiPulseProps {
  label?: string;
  state?: 'idle' | 'learning' | 'working' | 'error';
  compact?: boolean;
}

export function AiPulse({ 
  label = "EmprataBrain", 
  state = "idle",
  compact = false 
}: AiPulseProps) {
  const stateConfig = {
    idle: { color: 'bg-green-500', textColor: 'text-green-400', label: 'Ativo' },
    learning: { color: 'bg-purple-500', textColor: 'text-purple-400', label: 'Aprendendo' },
    working: { color: 'bg-blue-500', textColor: 'text-blue-400', label: 'Processando' },
    error: { color: 'bg-red-500', textColor: 'text-red-400', label: 'Erro' }
  };

  const config = stateConfig[state];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <BrainCircuit size={14} className={`relative z-10 ${config.textColor}`} />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-full blur-sm ${config.color}`}
          />
        </div>
        <span className={`text-[10px] font-bold uppercase ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full w-fit shadow-[0_0_15px_rgba(0,0,0,0.2)]">
      <div className="relative">
        <BrainCircuit size={18} className={`relative z-10 ${config.textColor}`} />
        {/* AI Pulse Effect */}
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full blur-md ${config.color}`}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
          {label}
        </span>
        {state === 'learning' && (
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-[9px] text-purple-300 font-bold"
          >
            Calibrando algoritmos...
          </motion.span>
        )}
        {state === 'working' && (
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-[9px] text-blue-300 font-bold"
          >
            Analisando dados...
          </motion.span>
        )}
      </div>
    </div>
  );
}

/**
 * BrainStatsCard Component - Display AI learning stats
 */
interface BrainStatsCardProps {
  avgDelay: number;
  accuracyPercent: number;
  performance: 'FAST' | 'NORMAL' | 'SLOW';
  totalDeliveries: number;
  onForceLearn?: () => void;
  isLearning?: boolean;
}

export function BrainStatsCard({
  avgDelay,
  accuracyPercent,
  performance,
  totalDeliveries,
  onForceLearn,
  isLearning
}: BrainStatsCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl">
      <div className="flex items-center gap-2 mb-4 text-white/40 text-xs font-black uppercase tracking-widest">
        <BrainCircuit size={14} /> Insights Neurais
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Precisão Temporal</span>
          <span className={`font-bold ${
            accuracyPercent >= 90 ? 'text-green-400' : 
            accuracyPercent >= 70 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {accuracyPercent}%
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Viés de Atraso</span>
          <span className={`font-bold ${
            avgDelay <= 0 ? 'text-green-400' : 
            avgDelay <= 5 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {avgDelay > 0 ? '+' : ''}{avgDelay} min
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Performance Cozinha</span>
          <span className={`font-bold ${
            performance === 'FAST' ? 'text-green-400' : 
            performance === 'NORMAL' ? 'text-blue-400' : 'text-orange-400'
          }`}>
            {performance === 'FAST' ? '⚡ Rápida' : 
             performance === 'NORMAL' ? '✓ Normal' : '🐌 Lenta'}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Base de Dados</span>
          <span className="font-bold text-white">{totalDeliveries} entregas</span>
        </div>
        
        {onForceLearn && (
          <button 
            onClick={onForceLearn}
            disabled={isLearning}
            className="w-full mt-2 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLearning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={14} />
                </motion.div>
                Recalibrando...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Forçar Aprendizado
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
