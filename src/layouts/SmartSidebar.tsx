/**
 * 🔍 SMART SIDEBAR - Navegação com Busca Instantânea
 * 
 * Sidebar inteligente com filtro por keywords
 * O usuário digita "Pix" e vê só "Financeiro"
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, LayoutDashboard, ShoppingBag, Bike, DollarSign, 
  BrainCircuit, Users, Settings, LogOut, ChevronRight,
  UtensilsCrossed, QrCode, BarChart3, Palette, Trophy,
  X, Menu as MenuIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  keywords: string;
  badge?: string;
}

// Mapa de Rotas com Keywords para Busca
const MENU_ITEMS: MenuItem[] = [
  { path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, keywords: 'home inicio resumo dashboard' },
  { path: '/journey', label: 'Minha Jornada', icon: Trophy, keywords: 'conquistas níveis prêmios gamification jornada', badge: 'XP' },
  { path: '/menu-builder', label: 'Cardápio', icon: UtensilsCrossed, keywords: 'menu itens pratos comida estoque' },
  { path: '/kitchen-display', label: 'Cozinha (KDS)', icon: ShoppingBag, keywords: 'pedidos vendas produção kds' },
  { path: '/dispatch', label: 'Logística', icon: Bike, keywords: 'motoboy entrega mapa gps corrida' },
  { path: '/finance', label: 'Financeiro', icon: DollarSign, keywords: 'saque saldo pix extrato dinheiro' },
  { path: '/qr-studio', label: 'QR Studio', icon: QrCode, keywords: 'qrcode mesa placa impressão' },
  { path: '/intelligence', label: 'Inteligência', icon: BarChart3, keywords: 'bi analytics relatorios metricas' },
  { path: '/owner', label: 'EmprataBrain', icon: BrainCircuit, keywords: 'ia inteligência ajuda chat brain', badge: 'AI' },
  { path: '/staff', label: 'Equipe', icon: Users, keywords: 'funcionarios pessoas garçom motoboy' },
  { path: '/store-settings', label: 'Loja', icon: Palette, keywords: 'loja visual marca cores' },
  { path: '/subscription', label: 'Plano', icon: Settings, keywords: 'assinatura upgrade premium black' },
  { path: '/profile', label: 'Perfil', icon: Settings, keywords: 'conta perfil configurações senha' },
];

interface SmartSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function SmartSidebar({ isOpen = true, onClose, isMobile = false }: SmartSidebarProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  // Filtro Inteligente
  const filteredMenu = MENU_ITEMS.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.keywords.toLowerCase().includes(query.toLowerCase())
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const sidebarContent = (
    <>
      {/* Header da Marca */}
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-black italic tracking-tighter text-white">
          EMPRATA<span className="text-primary">.AI</span>
        </h1>
        {isMobile && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} className="text-white/60" />
          </button>
        )}
      </div>

      {/* Busca Mágica */}
      <div className="px-4 mb-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative bg-[#121212] border border-white/10 rounded-xl flex items-center px-3 py-2.5 focus-within:border-primary/50 transition-colors">
            <Search size={16} className="text-white/40 mr-2 shrink-0" />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar aba..." 
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/30"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-white/40 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Navegação */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredMenu.length === 0 && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-white/30 py-4"
            >
              Nenhuma aba encontrada.
            </motion.p>
          )}

          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-white text-black font-bold shadow-lg' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-black' : 'text-white/50 group-hover:text-white'} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-black/20 text-black/80' : 'bg-purple-500/20 text-purple-400'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} />}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </nav>

      {/* Footer / User & Logout */}
      <div className="p-4 border-t border-white/5 space-y-2">
        {user && (
          <div className="px-3 py-2 text-xs">
            <p className="text-white/40">Logado como</p>
            <p className="text-white font-bold truncate">{user.displayName || user.email}</p>
          </div>
        )}
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold"
        >
          <LogOut size={18} /> Sair do Sistema
        </button>
      </div>
    </>
  );

  // Mobile: Overlay sidebar
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-72 h-screen bg-[#050505] border-r border-white/10 flex flex-col fixed left-0 top-0 z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Static sidebar
  return (
    <aside className="w-64 h-screen bg-[#050505] border-r border-white/10 flex flex-col fixed left-0 top-0 z-40">
      {sidebarContent}
    </aside>
  );
}

// Botão para abrir sidebar mobile
export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors lg:hidden"
    >
      <MenuIcon size={20} className="text-white" />
    </button>
  );
}
