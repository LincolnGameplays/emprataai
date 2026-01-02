/**
 * 🔍 CommandPalette - Global Search with Plan-based Filtering
 * 
 * Keyboard shortcut: Cmd+K / Ctrl+K
 * Actions are filtered based on user's plan - premium features
 * don't appear for users without access.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ArrowRight, Store, Bike, ChefHat, Users, 
  DollarSign, BrainCircuit, Settings, QrCode, 
  Smartphone, BarChart3, Lock, LucideIcon
} from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { FeatureKey, PLANS, getRequiredPlan } from '../../types/subscription';
import { toast } from 'sonner';

// Action definitions with optional feature restriction
interface Action {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  section: string;
  feature?: FeatureKey; // If set, requires this feature to access
}

const ACTIONS: Action[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: BarChart3, path: '/dashboard', section: 'Operação' },
  { id: 'dispatch', label: 'Logística & Entregadores', icon: Bike, path: '/dispatch', section: 'Operação', feature: 'driver_app_access' },
  { id: 'kds', label: 'Tela da Cozinha (KDS)', icon: ChefHat, path: '/kitchen-display', section: 'Operação' },
  { id: 'menu', label: 'Editor de Cardápio', icon: Store, path: '/menu-builder', section: 'Gestão' },
  { id: 'staff', label: 'Equipe & Acessos', icon: Users, path: '/staff', section: 'RH' },
  { id: 'finance', label: 'Financeiro', icon: DollarSign, path: '/finance', section: 'Gestão', feature: 'financial_overview' },
  { id: 'ai', label: 'EmprataBrain Intelligence', icon: BrainCircuit, path: '/intelligence', section: 'IA', feature: 'ai_insights' },
  { id: 'qr', label: 'QR Codes das Mesas', icon: QrCode, path: '/qr-print', section: 'Ferramentas', feature: 'table_qr_code' },
  { id: 'store', label: 'Vitrine da Loja', icon: Store, path: '/store-settings', section: 'Gestão' },
  { id: 'owner', label: 'App do Dono (Mobile)', icon: Smartphone, path: '/owner', section: 'Apps' },
  { id: 'profile', label: 'Meu Perfil', icon: Settings, path: '/profile', section: 'Conta' },
  { id: 'subscription', label: 'Meu Plano', icon: DollarSign, path: '/subscription', section: 'Conta' },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { checkAccess } = useSubscription();

  // Filter actions based on query AND plan access
  // Premium features are hidden from users without access
  const filtered = ACTIONS.filter(action => {
    // Text filter
    const matchesQuery = 
      action.label.toLowerCase().includes(query.toLowerCase()) ||
      action.section.toLowerCase().includes(query.toLowerCase());
    
    if (!matchesQuery) return false;

    // Plan filter - hide premium actions from non-premium users
    // This prevents them from even seeing locked features
    if (action.feature && !checkAccess(action.feature)) {
      return false; // Hide completely (or change to true to show with lock)
    }

    return true;
  });

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle action selection
  const handleSelect = useCallback((action: Action) => {
    // Double-check permission (belt and suspenders)
    if (action.feature && !checkAccess(action.feature)) {
      const requiredPlan = getRequiredPlan(action.feature);
      toast.error(`Recurso do plano ${PLANS[requiredPlan].label}`, {
        description: 'Faça upgrade para acessar',
        action: {
          label: 'Ver Planos',
          onClick: () => navigate('/subscription')
        }
      });
      onClose();
      navigate('/subscription');
      return;
    }

    navigate(action.path);
    onClose();
  }, [checkAccess, navigate, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % Math.max(filtered.length, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
        break;
      case 'Enter':
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
        break;
    }
  }, [isOpen, onClose, filtered, selectedIndex, handleSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center px-4 border-b border-white/10">
              <Search className="text-white/40" size={20} />
              <input 
                autoFocus
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="O que você procura? (Ex: Cardápio, Cozinha...)"
                className="w-full bg-transparent p-4 text-white placeholder:text-white/20 outline-none text-lg"
              />
              <div className="text-[10px] font-bold text-white/20 border border-white/10 px-2 py-1 rounded">ESC</div>
            </div>

            {/* Resultados */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-white/30">
                  Nenhuma ferramenta encontrada.
                </div>
              ) : (
                filtered.map((action, index) => {
                  const Icon = action.icon;
                  const hasAccess = action.feature ? checkAccess(action.feature) : true;

                  return (
                    <button
                      key={action.id}
                      onClick={() => handleSelect(action)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl group transition-colors text-left ${
                        index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${
                          index === selectedIndex 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-white/5 text-white/60 group-hover:text-primary group-hover:bg-primary/10'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm flex items-center gap-2">
                            {action.label}
                            {!hasAccess && (
                              <Lock size={12} className="text-white/30" />
                            )}
                          </p>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">{action.section}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className={`transition-all ${
                        index === selectedIndex 
                          ? 'text-white opacity-100' 
                          : 'text-white/20 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }`} />
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="p-2 bg-white/5 border-t border-white/5 flex justify-between px-4 text-[10px] text-white/30">
               <span><strong>EmprataOS</strong> v2.0</span>
               <div className="flex gap-4">
                  <span>↑↓ Navegar</span>
                  <span>↵ Selecionar</span>
                  <span>ESC Fechar</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
