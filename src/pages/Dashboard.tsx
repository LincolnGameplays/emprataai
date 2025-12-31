
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Camera, Utensils, TrendingUp, DollarSign, 
  Users, LogOut, Bike, ChefHat
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
            Central de Comando
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
        
        {/* OPERATIONAL CARDS (Day-to-day) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card: Delivery / Dispatch */}
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/dispatch')}
            className="group relative h-40 bg-gradient-to-br from-green-900/20 to-black border border-green-500/30 rounded-3xl p-6 flex flex-col justify-between hover:border-green-500/60 transition-all hover:scale-[1.02] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-24 bg-green-500/10 blur-[60px] group-hover:bg-green-500/20 transition-all" />
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-2">
              <Bike className="w-6 h-6" />
            </div>
            <div className="text-left z-10">
              <h3 className="text-lg font-black italic uppercase text-green-400">Entregas</h3>
              <p className="text-[10px] text-white/50 font-bold mt-1">Expedição & Motoboys</p>
            </div>
          </motion.button>

          {/* Card: Kitchen / KDS */}
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/kitchen-display')}
            className="group relative h-40 bg-gradient-to-br from-orange-900/20 to-black border border-orange-500/30 rounded-3xl p-6 flex flex-col justify-between hover:border-orange-500/60 transition-all hover:scale-[1.02] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-24 bg-orange-500/10 blur-[60px] group-hover:bg-orange-500/20 transition-all" />
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 mb-2">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="text-left z-10">
              <h3 className="text-lg font-black italic uppercase text-orange-400">Cozinha</h3>
              <p className="text-[10px] text-white/50 font-bold mt-1">Monitor de Pedidos</p>
            </div>
          </motion.button>

          {/* Card: Studio */}
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/studio')}
            className="group relative h-40 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/10 transition-all hover:scale-[1.02]"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-2">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left z-10">
              <h3 className="text-lg font-black italic uppercase">Estúdio IA</h3>
              <p className="text-[10px] text-white/50 font-bold mt-1">Fotos & Marketing</p>
            </div>
          </motion.button>

          {/* Card: Menu */}
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate('/menu-builder')}
            className="group relative h-40 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:bg-white/10 transition-all hover:scale-[1.02]"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-2">
              <Utensils className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left z-10">
              <h3 className="text-lg font-black italic uppercase">Cardápio</h3>
              <p className="text-[10px] text-white/50 font-bold mt-1">Produtos & Preços</p>
            </div>
          </motion.button>
        </div>

        {/* ANALYTICS SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Performance Hoje</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-white/40 text-xs font-bold uppercase">
                <DollarSign className="w-4 h-4" /> Vendas
              </div>
              <div className="text-3xl font-black text-white">R$ 0,00</div>
            </div>
            
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-white/40 text-xs font-bold uppercase">
                <Users className="w-4 h-4" /> Clientes
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
        </motion.div>
      </div>
    </div>
  );
}
