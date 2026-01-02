/**
 * 📍 OrderTracker - Rastreador de Pedidos Estilo Uber
 * 
 * Linha do tempo visual e animada para diminuir ansiedade do cliente.
 * Mostra progresso do pedido em tempo real com animações suaves.
 */

import { motion } from 'framer-motion';
import { Check, ChefHat, Bike, Package, Clock, XCircle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// STEPS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const STEPS = [
  { id: 'CONFIRMED', label: 'Confirmado', icon: Check, message: 'O restaurante aceitou seu pedido!' },
  { id: 'PREPARING', label: 'Preparando', icon: ChefHat, message: 'O cheiro está ficando bom... A cozinha está a todo vapor.' },
  { id: 'DISPATCHED', label: 'A Caminho', icon: Bike, message: 'O motoboy saiu! Fique de olho na campainha.' },
  { id: 'DELIVERED', label: 'Entregue', icon: Package, message: 'Bom apetite! Não esqueça de avaliar.' },
];

// Status aliases (normaliza diferentes formatos)
const STATUS_MAP: Record<string, string> = {
  'PENDING': 'CONFIRMED',
  'pending': 'CONFIRMED',
  'ACCEPTED': 'CONFIRMED',
  'CONFIRMED': 'CONFIRMED',
  'PREPARING': 'PREPARING',
  'READY': 'PREPARING',
  'DISPATCHED': 'DISPATCHED',
  'DELIVERING': 'DISPATCHED',
  'OUT_FOR_DELIVERY': 'DISPATCHED',
  'DELIVERED': 'DELIVERED',
  'COMPLETED': 'DELIVERED',
};

interface OrderTrackerProps {
  status: string;
  estimatedTime?: number; // minutos
  compact?: boolean;
}

export default function OrderTracker({ status, estimatedTime, compact = false }: OrderTrackerProps) {
  // Normaliza o status para o formato esperado
  const normalizedStatus = STATUS_MAP[status] || status;
  
  // Mapeia status do banco para índice do array
  const currentStepIndex = STEPS.findIndex(s => s.id === normalizedStatus);
  
  // Se status for cancelado, mostra estado especial
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="w-full py-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
          <XCircle size={16} className="text-red-400" />
          <span className="text-sm font-bold text-red-400">Pedido Cancelado</span>
        </div>
      </div>
    );
  }
  
  // Se status desconhecido, assume primeiro step
  const safeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;
  const currentStep = STEPS[safeIndex];

  // Modo compacto (para listas)
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          safeIndex === STEPS.length - 1 ? 'bg-green-500' : 'bg-primary'
        }`}>
          <currentStep.icon size={14} className="text-black" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{currentStep.label}</p>
          {estimatedTime && safeIndex < STEPS.length - 1 && (
            <p className="text-[10px] text-white/40 flex items-center gap-1">
              <Clock size={10} /> ~{estimatedTime} min
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      {/* Barra de Progresso Horizontal */}
      <div className="relative flex justify-between items-center px-2">
        
        {/* Linha de Fundo */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full" />
        
        {/* Linha de Progresso Animada */}
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${(safeIndex / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 rounded-full"
        />

        {STEPS.map((step, index) => {
          const isActive = index <= safeIndex;
          const isCurrent = index === safeIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              {/* O Círculo do Ícone */}
              <motion.div 
                initial={false}
                animate={{ 
                  scale: isCurrent ? 1.15 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${
                  isActive 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-[#121212] border-white/20'
                } ${isCurrent ? 'shadow-[0_0_15px_rgba(34,197,94,0.6)]' : ''}`}
              >
                <StepIcon size={18} className={isActive ? 'text-black' : 'text-white/40'} />
              </motion.div>

              {/* Label (Abaixo) */}
              <p className={`absolute top-12 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                isActive ? 'text-green-400' : 'text-white/30'
              }`}>
                {step.label}
              </p>

              {/* Pulso se for o atual */}
              {isCurrent && (
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-green-500 rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Mensagem de Contexto */}
      <motion.div 
        key={currentStep.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-14 text-center bg-white/5 rounded-xl p-4 border border-white/5"
      >
        <p className="text-sm text-white/80">
          {currentStep.message}
        </p>
        {estimatedTime && safeIndex < STEPS.length - 1 && (
          <p className="text-xs text-white/40 mt-2 flex items-center justify-center gap-1">
            <Clock size={12} /> Tempo estimado: ~{estimatedTime} min
          </p>
        )}
      </motion.div>
    </div>
  );
}
