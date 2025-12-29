/**
 * Dashboard - Simplified Analytics Focus
 * Quick access to Tools Hub and performance metrics
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Camera, Utensils, Eye, TrendingUp, DollarSign, 
  Users, LogOut, Sparkles, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">
            Bem-vindo, <span className="text-primary">{user?.displayName || user?.email?.split('@')[0] || 'Chef'}</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">
            Visão Geral do Seu Império Digital
          </p>
        </div>
        <button 
          onClick={() => signOut()} 
          className="text-xs font-bold text-red-500 uppercase tracking-widest hover:text-red-400 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid gap-8">
        {/* SECTION 1: MAIN ACTION CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card: Studio */}
          <motion.button 
            id="tour-studio-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/studio')}
            className="group relative h-48 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/10 transition-all hover:scale-[1.02] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[80px] group-hover:bg-primary/30 transition-all" />
            <div className="w-12 h-12 bg-black/50 rounded-2xl flex items-center justify-center border border-white/10 z-10">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left z-10">
              <h3 className="text-xl font-black italic uppercase">Estúdio IA</h3>
              <p className="text-xs text-white/50 font-bold mt-1">Criar novas fotos</p>
            </div>
          </motion.button>

          {/* Card: Menu Builder */}
          <motion.button 
            id="tour-menu-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/menu-builder')}
            className="group relative h-48 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/10 transition-all hover:scale-[1.02] overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[80px] group-hover:bg-blue-500/20 transition-all" />
            <div className="w-12 h-12 bg-black/50 rounded-2xl flex items-center justify-center border border-white/10 z-10">
              <Utensils className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-left z-10">
              <h3 className="text-xl font-black italic uppercase">Cardápio Digital</h3>
              <p className="text-xs text-white/50 font-bold mt-1">Gerenciar Pratos e Preços</p>
            </div>
          </motion.button>

          {/* Card: View Menu */}
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => window.open('/menu/meu-restaurante', '_blank')}
            className="group relative h-48 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/10 transition-all hover:scale-[1.02] overflow-hidden"
          >
            <div className="w-12 h-12 bg-black/50 rounded-2xl flex items-center justify-center border border-white/10 z-10">
              <Eye className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-left z-10">
              <h3 className="text-xl font-black italic uppercase">Ver Cardápio</h3>
              <p className="text-xs text-white/50 font-bold mt-1">Visualizar como cliente</p>
            </div>
          </motion.button>
        </div>

        {/* SECTION 2: TOOLS HUB CTA */}
        <motion.button
          id="tour-tools-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/tools')}
          className="group relative w-full h-32 bg-gradient-to-r from-primary/20 to-orange-600/10 border border-primary/30 rounded-3xl p-6 flex items-center justify-between hover:from-primary/30 hover:to-orange-600/20 transition-all hover:scale-[1.01] overflow-hidden"
        >
          {/* Glow Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 blur-[100px] opacity-50 group-hover:opacity-70 transition-opacity" />
          
          <div className="flex items-center gap-6 z-10">
            <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black italic uppercase text-primary">
                Ferramentas & Apps
              </h3>
              <p className="text-sm text-white/50 font-bold mt-1">
                KDS, WhatsApp, QR Codes, Precificação IA e mais
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-primary font-bold z-10">
            <span className="text-sm uppercase tracking-wider hidden sm:block">Acessar</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        {/* SECTION 3: ANALYTICS PREVIEW */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Performance (BETA)</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-white/40 text-xs font-bold uppercase">
                <DollarSign className="w-4 h-4" /> Vendas Hoje
              </div>
              <div className="text-3xl font-black text-white">R$ 0,00</div>
            </div>
            
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-white/40 text-xs font-bold uppercase">
                <Users className="w-4 h-4" /> Visitantes
              </div>
              <div className="text-3xl font-black text-white">0</div>
            </div>

            <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-white/40 text-xs font-bold uppercase">
                <TrendingUp className="w-4 h-4" /> Pedidos
              </div>
              <div className="text-3xl font-black text-white">0</div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
            <p className="text-sm font-bold text-primary">
              🚀 Configure seu cardápio para começar a ver dados reais aqui.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
