/**
 * ⚡ QUICK ACTIONS - Dock de Ações Rápidas
 * 
 * Ações mais usadas em um clique
 * Estilo macOS Dock no Dashboard
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Bike, QrCode, TrendingUp, BrainCircuit, UtensilsCrossed } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  description: string;
}

const ACTIONS: QuickAction[] = [
  { 
    label: 'Novo Pedido', 
    icon: Plus, 
    path: '/kitchen-display', 
    color: 'bg-white text-black hover:bg-gray-100',
    description: 'Abrir balcão'
  },
  { 
    label: 'Motoboy', 
    icon: Bike, 
    path: '/dispatch', 
    color: 'bg-[#1a1a1a] text-white border border-white/10 hover:bg-white/10',
    description: 'Chamar entrega'
  },
  { 
    label: 'QR Mesa', 
    icon: QrCode, 
    path: '/qr-studio', 
    color: 'bg-[#1a1a1a] text-white border border-white/10 hover:bg-white/10',
    description: 'Gerar placa'
  },
  { 
    label: 'Lucro', 
    icon: TrendingUp, 
    path: '/finance', 
    color: 'bg-[#1a1a1a] text-white border border-white/10 hover:bg-white/10',
    description: 'Ver saldo'
  },
];

interface QuickActionsProps {
  variant?: 'full' | 'compact';
}

export default function QuickActions({ variant = 'full' }: QuickActionsProps) {
  const navigate = useNavigate();

  if (variant === 'compact') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {ACTIONS.map((action, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(action.path)}
            className={`${action.color} px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 transition-all`}
          >
            <action.icon size={16} />
            <span className="text-xs font-bold">{action.label}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ACTIONS.map((action, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(action.path)}
          className={`${action.color} p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-xl group`}
        >
          <div className={`p-2.5 rounded-xl transition-colors ${i === 0 ? 'bg-black/10' : 'bg-white/10 group-hover:bg-white/20'}`}>
            <action.icon size={22} />
          </div>
          <div className="text-center">
            <span className="text-sm font-bold block">{action.label}</span>
            <span className={`text-[10px] ${i === 0 ? 'text-black/50' : 'text-white/40'}`}>{action.description}</span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/**
 * Mini Dock para header mobile
 */
export function QuickActionsMini() {
  const navigate = useNavigate();
  
  const miniActions = [
    { icon: Plus, path: '/kitchen-display', color: 'bg-primary text-black' },
    { icon: QrCode, path: '/qr-studio', color: 'bg-white/10 text-white' },
    { icon: BrainCircuit, path: '/owner', color: 'bg-purple-500/20 text-purple-400' },
  ];

  return (
    <div className="flex gap-1">
      {miniActions.map((action, i) => (
        <button
          key={i}
          onClick={() => navigate(action.path)}
          className={`${action.color} p-2 rounded-lg transition-all hover:scale-105 active:scale-95`}
        >
          <action.icon size={18} />
        </button>
      ))}
    </div>
  );
}
