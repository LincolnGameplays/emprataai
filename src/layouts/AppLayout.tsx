import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Bike, ChefHat, Store, Camera, 
  DollarSign, Users, Settings, Menu as MenuIcon, 
  X, ChevronRight, BarChart3, Bell, Search, ShieldCheck
} from 'lucide-react';
import { UserDropdown } from '../components/UserDropdown';
import { useAuth } from '../hooks/useAuth';

// ══════════════════════════════════════════════════════════════════
// NAVIGATION CONFIG (Organizada por Setores)
// ══════════════════════════════════════════════════════════════════

const SECTIONS = [
  {
    title: 'Operação em Tempo Real',
    items: [
      { path: '/dashboard', label: 'Visão Geral', icon: <LayoutDashboard size={20} /> },
      { path: '/dispatch', label: 'Logística & Entregas', icon: <Bike size={20} />, badge: 'Ao Vivo' },
      { path: '/kitchen-display', label: 'KDS Cozinha', icon: <ChefHat size={20} /> },
    ]
  },
  {
    title: 'Gestão & Vendas',
    items: [
      { path: '/menu-builder', label: 'Cardápio Digital', icon: <MenuIcon size={20} /> },
      { path: '/store-settings', label: 'Vitrine do App', icon: <Store size={20} />, highlight: true },
      { path: '/finance', label: 'Financeiro', icon: <DollarSign size={20} /> },
      { path: '/staff', label: 'Equipe & Acessos', icon: <Users size={20} /> },
    ]
  },
  {
    title: 'Crescimento & IA',
    items: [
      { path: '/intelligence', label: 'Business Intelligence', icon: <BarChart3 size={20} />, highlight: true },
      { path: '/studio', label: 'Estúdio Mágico IA', icon: <Camera size={20} /> },
      // Futuro: { path: '/marketing', label: 'Campanhas', icon: <Megaphone size={20} /> },
    ]
  }
];

export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      
      {/* ════════════ SIDEBAR (Navegação Robusta) ════════════ */}
      <motion.aside 
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed md:relative z-50 h-screen bg-[#121212] border-r border-white/5 flex flex-col transition-all duration-300"
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-black text-xl mr-3 shrink-0">
            E.
          </div>
          {isSidebarOpen && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black italic text-lg tracking-tighter">
              Emprata<span className="text-primary">AI</span>
            </motion.span>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 custom-scrollbar">
          {SECTIONS.map((section, idx) => (
            <div key={idx}>
              {isSidebarOpen && (
                <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <div className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group
                        ${isActive ? 'bg-primary text-black font-bold shadow-[0_0_20px_rgba(255,107,0,0.3)]' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                      `}>
                        {/* Icon */}
                        <div className={`${isActive ? 'text-black' : item.highlight ? 'text-primary' : ''}`}>
                          {item.icon}
                        </div>

                        {/* Label */}
                        {isSidebarOpen && (
                          <span className="text-sm whitespace-nowrap">{item.label}</span>
                        )}

                        {/* Badge (Notification/Live) */}
                        {item.badge && isSidebarOpen && (
                          <span className="absolute right-3 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase animate-pulse">
                            {item.badge}
                          </span>
                        )}

                        {/* Tooltip for collapsed mode */}
                        {!isSidebarOpen && (
                          <div className="absolute left-full ml-4 bg-white text-black px-3 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Sidebar (Profile) */}
        <div className="p-4 border-t border-white/5">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-2 text-white/20 hover:text-white transition-colors mb-4">
              {isSidebarOpen ? <ChevronRight className="rotate-180" /> : <ChevronRight />}
           </button>
        </div>
      </motion.aside>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0a0a]">
        
        {/* Topbar (Busca Global + Notificações + Perfil) */}
        <header className="h-20 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
           {/* Global Search (Command Center) */}
           <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
              <input 
                placeholder="Buscar pedido, cliente ou ferramenta..." 
                className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all focus:bg-[#1a1a1a]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                 <kbd className="bg-white/10 px-1.5 rounded text-[10px] text-white/40 font-mono">⌘</kbd>
                 <kbd className="bg-white/10 px-1.5 rounded text-[10px] text-white/40 font-mono">K</kbd>
              </div>
           </div>

           {/* Right Actions */}
           <div className="flex items-center gap-6 ml-6">
              <div className="flex items-center gap-4">
                 <button className="relative p-2 text-white/40 hover:text-white transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                 </button>
                 <div className="h-8 w-px bg-white/10" />
                 <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-white leading-none">{user?.displayName}</span>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                       <ShieldCheck size={10} /> Dono
                    </span>
                 </div>
              </div>
              
              {/* User Dropdown (Role Switcher) */}
              <div className="relative group">
                 <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-black border border-white/20 overflow-hidden">
                    {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <Settings className="p-2 text-white/50" />}
                 </button>
                 <UserDropdown />
              </div>
           </div>
        </header>

        {/* Page Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 scroll-smooth">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
