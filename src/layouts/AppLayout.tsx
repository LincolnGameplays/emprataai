
import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Camera, UtensilsCrossed, Users, Settings,
  Menu, X, ChevronRight, DollarSign, Bike, ChefHat
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { UserDropdown } from '../components/UserDropdown';
import OnboardingTour from '../components/OnboardingTour';
import SmartHelp from '../components/SmartHelp';

// ══════════════════════════════════════════════════════════════════
// NAVIGATION CONFIG
// ══════════════════════════════════════════════════════════════════

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/dispatch', label: 'Entregas', icon: <Bike className="w-5 h-5" /> }, // Nova Aba
  { path: '/kitchen-display', label: 'Cozinha', icon: <ChefHat className="w-5 h-5" /> }, // Nova Aba
  { path: '/menu-builder', label: 'Cardápio', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { path: '/studio', label: 'Estúdio IA', icon: <Camera className="w-5 h-5" /> },
  { path: '/finance', label: 'Financeiro', icon: <DollarSign className="w-5 h-5" />, ownerOnly: true },
  { path: '/staff', label: 'Equipe', icon: <Users className="w-5 h-5" />, ownerOnly: true },
  { path: '/profile', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
];

// Page titles
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Visão Geral',
  '/dispatch': 'Gestão de Entregas',
  '/kitchen-display': 'Monitor de Cozinha (KDS)',
  '/studio': 'Estúdio de Criação',
  '/menu-builder': 'Construtor de Cardápio',
  '/finance': 'Gestão Financeira',
  '/staff': 'Gestão de Equipe',
  '/profile': 'Configurações',
};

// ══════════════════════════════════════════════════════════════════
// SIDEBAR COMPONENT (Desktop)
// ══════════════════════════════════════════════════════════════════

function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/5 z-40">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-black italic tracking-tighter">
            Emprata<span className="text-primary">.ai</span>
          </span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm
              transition-all group relative
              ${isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full"
                  />
                )}
                <span className={isActive ? 'text-primary' : 'text-white/40 group-hover:text-white/60'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="p-4 bg-white/5 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
            Novo
          </p>
          <p className="text-sm font-bold text-white/60">
            📱 App do Garçom disponível
          </p>
          <NavLink 
            to="/waiter-login" 
            className="text-xs text-primary font-bold flex items-center gap-1 mt-2 hover:underline"
          >
            Acessar <ChevronRight className="w-3 h-3" />
          </NavLink>
        </div>
      </div>
    </aside>
  );
}

function BottomBar({ items }: { items: NavItem[] }) {
  const mobileItems = items.slice(0, 5); // Mostra os 5 primeiros no mobile

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-50">
      {mobileItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
            ${isActive ? 'text-primary' : 'text-white/40'}
          `}
        >
          {({ isActive }) => (
            <>
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                className={isActive ? 'text-primary' : ''}
              >
                {item.icon}
              </motion.div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label.split(' ')[0]}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Header({ title }: { title: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
      <button 
        className="lg:hidden p-2 -ml-2 text-white/60 hover:text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      <div className="lg:flex-1">
        <motion.h1 
          key={title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg lg:text-xl font-black tracking-tight"
        >
          {title}
        </motion.h1>
      </div>
      <UserDropdown />
    </header>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const filteredNavItems = NAV_ITEMS;
  const pageTitle = PAGE_TITLES[location.pathname] || 'Emprata.ai';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar items={filteredNavItems} />
      <div className="lg:ml-64 min-h-screen flex flex-col pb-20 lg:pb-0">
        <Header title={pageTitle} />
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomBar items={filteredNavItems} />
      <OnboardingTour />
      <SmartHelp />
    </div>
  );
}
