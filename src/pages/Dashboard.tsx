import { useNavigate } from 'react-router-dom';
import { Camera, Utensils, Eye, TrendingUp, DollarSign, Users, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, signOut } = useAuth(); // Added signOut for testing
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
        {/* SECTION 1: ACTION CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card: Studio */}
          <button 
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
          </button>

          {/* Card: Menu Builder */}
          <button 
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
          </button>

          {/* Card: View Menu */}
          <button 
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
          </button>
        </div>

        {/* SECTION 2: ANALYTICS PREVIEW (Mockup) */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
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
          </div>
          
          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
            <p className="text-sm font-bold text-primary">
              🚀 Configure seu cardápio para começar a ver dados reais aqui.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
