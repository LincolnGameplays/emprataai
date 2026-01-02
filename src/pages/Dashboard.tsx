/**
 * Dashboard - EmprataOS Command Center
 * 
 * Features:
 * - Command Palette (Cmd+K) for quick navigation
 * - Modular app grid organized by section
 * - Real-time stats and status
 * - Feature gating based on subscription plan
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bike, ChefHat, Store, DollarSign, Users, BrainCircuit, 
  Zap, Search, QrCode, Smartphone, Settings, Lock, CreditCard, Monitor
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePlan } from '../hooks/usePlan';
import { CommandPalette } from '../components/dashboard/CommandPalette';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatCurrency } from '../utils/format';
import { PLANS } from '../types/subscription';
import JourneyWidget from '../components/dashboard/JourneyWidget';

export default function Dashboard() {
  const { user } = useAuth();
  const { currentPlan, canAccess } = usePlan();
  const navigate = useNavigate();
  const { totalSales, totalOrders } = useDashboardStats();
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
  const [showCommand, setShowCommand] = useState(false);

  // Global keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommand(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Módulos do Sistema com Feature Gates
  const MODULES: { title: string; apps: { title: string; desc: string; icon: any; path: string; color: string; bg: string; border?: string; feature: string }[] }[] = [
    {
      title: "Operação em Tempo Real",
      apps: [
        { title: "Logística", desc: "Gestão de Motoboys", icon: Bike, path: "/dispatch", color: "text-green-400", bg: "bg-green-500/10", feature: "dispatch_console" },
        { title: "Cozinha (KDS)", desc: "Pedidos para Preparo", icon: ChefHat, path: "/kitchen-display", color: "text-orange-400", bg: "bg-orange-500/10", feature: "kds_kitchen" },
        { title: "Terminal PDV", desc: "Caixa Unificado", icon: Monitor, path: "/pos", color: "text-cyan-400", bg: "bg-cyan-500/10", feature: "pos_terminal" },
      ]
    },
    {
      title: "Gestão & Estratégia",
      apps: [
        { title: "Cardápio", desc: "Editar Produtos", icon: Store, path: "/menu-builder", color: "text-blue-400", bg: "bg-blue-500/10", feature: "menu_builder" },
        { title: "Financeiro", desc: "Fluxo de Caixa", icon: DollarSign, path: "/finance", color: "text-yellow-400", bg: "bg-yellow-500/10", feature: "financial_advanced" },
        { title: "Equipe", desc: "Acessos e PINs", icon: Users, path: "/staff", color: "text-purple-400", bg: "bg-purple-500/10", feature: "staff_management" },
        { title: "Vitrine", desc: "Personalizar Loja", icon: Settings, path: "/store-settings", color: "text-slate-400", bg: "bg-slate-500/10", feature: "basic_access" },
      ]
    },
    {
      title: "Inteligência Artificial",
      apps: [
        { title: "EmprataBrain", desc: "Análise de Negócio", icon: BrainCircuit, path: "/intelligence", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30", feature: "emprata_brain" },
      ]
    },
    {
      title: "Apps & Ferramentas",
      apps: [
        { title: "App do Dono", desc: "Controle Mobile", icon: Smartphone, path: "/owner", color: "text-violet-400", bg: "bg-violet-500/10", feature: "basic_access" },
        { title: "QR Codes", desc: "Mesas e Links", icon: QrCode, path: "/qr-print", color: "text-emerald-400", bg: "bg-emerald-500/10", feature: "qr_codes" },
      ]
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <CommandPalette isOpen={showCommand} onClose={() => setShowCommand(false)} />

      {/* 1. HERO SECTION (Status Vital) */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#121212] to-black border border-white/10 p-8 md:p-12 shadow-2xl">
         {/* Background Glow */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-2">
                  Painel de <span className="text-primary">Controle</span>
               </h1>
               <div className="flex items-center gap-4 text-white/60">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                     <span className="text-xs font-bold uppercase">Sistema Online</span>
                  </div>
                  <span className="text-sm">Olá, {user?.displayName?.split(' ')[0] || 'Chef'}</span>
               </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3 flex-wrap">
               <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[130px]">
                  <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Vendas Hoje</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(totalSales)}</p>
               </div>
               <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[100px]">
                  <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Pedidos</p>
                  <p className="text-2xl font-black text-white">{totalOrders}</p>
               </div>
               <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[130px]">
                  <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Ticket Médio</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(averageTicket)}</p>
               </div>
            </div>
         </div>

         {/* Barra de Busca Rápida (Fake Input para abrir Command Palette) */}
         <div className="mt-8 relative max-w-2xl">
            <button 
               onClick={() => setShowCommand(true)}
               className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between text-white/40 group transition-all"
            >
               <div className="flex items-center gap-3">
                  <Search size={20} className="group-hover:text-white transition-colors" />
                  <span>Buscar ferramenta, pedido ou configuração...</span>
               </div>
               <div className="flex gap-1">
                  <kbd className="bg-black/40 px-2 py-1 rounded text-xs font-bold border border-white/10">⌘</kbd>
                  <kbd className="bg-black/40 px-2 py-1 rounded text-xs font-bold border border-white/10">K</kbd>
               </div>
            </button>
         </div>
      </div>

      {/* JOURNEY WIDGET - Barra de Progresso Verificado */}
      <JourneyWidget />

      {/* 2. GRID DE APLICATIVOS (Organizado por Seção) */}
      <div className="space-y-8">
         {MODULES.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
               <h3 className="text-sm font-black uppercase tracking-widest text-white/20 mb-4 ml-2 flex items-center gap-2">
                  {section.title}
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.apps.map((app) => {
                     const unlocked = canAccess(app.feature);
                     
                     return (
                        <motion.button
                           key={app.path}
                           onClick={() => unlocked ? navigate(app.path) : navigate('/subscription')}
                           whileHover={{ scale: 1.02, y: -2 }}
                           whileTap={{ scale: 0.98 }}
                           className={`p-6 rounded-3xl border transition-all text-left group relative overflow-hidden ${
                              unlocked 
                                 ? `bg-[#121212] ${app.border || 'border-white/5'} hover:border-white/20`
                                 : 'bg-[#0a0a0a] border-white/5 opacity-80'
                           }`}
                        >
                           <div className="flex items-start justify-between mb-4 relative z-10">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${app.bg} ${app.color} text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                                 <app.icon size={28} />
                              </div>
                              {!unlocked ? (
                                 <div className="bg-white/10 p-2 rounded-full backdrop-blur-md">
                                    <Lock size={14} className="text-white/60" />
                                 </div>
                              ) : (
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 p-2 rounded-full">
                                    <Zap size={14} className="text-white" />
                                 </div>
                              )}
                           </div>
                           <div className="relative z-10">
                              <h4 className="text-xl font-bold text-white mb-1">{app.title}</h4>
                              <p className="text-sm text-white/40 font-medium">{app.desc}</p>
                           </div>
                           
                           {/* Hover Gradient Effect */}
                           <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                           
                           {/* Unlock Overlay for locked modules */}
                           {!unlocked && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                 <span className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <Zap size={12} className="fill-black" /> DESBLOQUEAR
                                 </span>
                              </div>
                           )}
                        </motion.button>
                     );
                  })}
               </div>
            </motion.div>
         ))}
      </div>

      {/* 3. FOOTER INFO */}
      <div className="text-center text-white/20 text-xs py-4">
        <p>EmprataOS v2.0 • Pressione <kbd className="bg-white/5 px-1.5 py-0.5 rounded mx-1">⌘K</kbd> para buscar</p>
      </div>
    </div>
  );
}
