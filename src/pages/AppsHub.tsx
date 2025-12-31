/**
 * AppsHub - Staff App Download Portal
 * 
 * Central hub for employees to download native apps
 * or access web versions of Driver/Waiter apps.
 */

import { motion } from 'framer-motion';
import { ShieldCheck, Bike, ChefHat, Smartphone, Download, ArrowRight, Scan, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AppsHub() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-6 md:p-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter">
            Emprata<span className="text-primary">.ai</span> <span className="text-white/40">Workforce</span>
          </h1>
          <p className="text-white/60 mt-2 text-lg">Central de Download e Acesso para Colaboradores.</p>
        </div>
        <Link to="/staff-login" className="bg-white text-black px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-transform">
           <ShieldCheck size={20} /> LOGIN WEB
        </Link>
      </div>

      {/* Grid de Apps */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        
        {/* CARD DO MOTORISTA */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          className="bg-[#121212] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-green-500/50 transition-colors"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10">
             <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-black mb-6 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                <Bike size={32} />
             </div>
             <h2 className="text-3xl font-black mb-2">Driver App</h2>
             <p className="text-white/50 mb-8 h-12">Para entregadores. GPS em tempo real, rota inteligente e carteira digital.</p>
             
             <div className="flex gap-4">
                <a 
                  href="#" 
                  className="flex-1 bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                   <Download size={18} /> Android
                </a>
                <a 
                  href="#" 
                  className="flex-1 bg-[#1a1a1a] border border-white/10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                >
                   <Download size={18} /> iOS
                </a>
             </div>
             
             <div className="mt-6 flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="bg-white p-2 rounded-lg">
                   <Scan size={32} className="text-black"/>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-bold uppercase text-white/40">Acesso Web (PWA)</p>
                   <p className="text-sm font-bold text-green-400">emprata.ai/driver</p>
                </div>
                <Link to="/driver" className="p-3 bg-green-500/10 rounded-xl text-green-400 hover:bg-green-500/20">
                   <ExternalLink size={18} />
                </Link>
             </div>
          </div>
        </motion.div>

        {/* CARD DO GARÇOM */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }}
          className="bg-[#121212] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-blue-500/50 transition-colors"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10">
             <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-black mb-6 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                <ChefHat size={32} />
             </div>
             <h2 className="text-3xl font-black mb-2">Waiter Pad</h2>
             <p className="text-white/50 mb-8 h-12">Para salão. Mapa de mesas, envio para cozinha e fechamento de conta.</p>
             
             <div className="flex gap-4">
                <a 
                  href="#" 
                  className="flex-1 bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                   <Download size={18} /> Android
                </a>
                <a 
                  href="#" 
                  className="flex-1 bg-[#1a1a1a] border border-white/10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                >
                   <Download size={18} /> iOS
                </a>
             </div>

             <div className="mt-6 flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="bg-white p-2 rounded-lg">
                   <Scan size={32} className="text-black"/>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-bold uppercase text-white/40">Acesso Web (PWA)</p>
                   <p className="text-sm font-bold text-blue-400">emprata.ai/waiter</p>
                </div>
                <Link to="/waiter" className="p-3 bg-blue-500/10 rounded-xl text-blue-400 hover:bg-blue-500/20">
                   <ExternalLink size={18} />
                </Link>
             </div>
          </div>
        </motion.div>

      </div>

      {/* Kitchen Mode Card */}
      <div className="max-w-5xl mx-auto mt-8">
        <motion.div 
          initial={{ y: 50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#121212] border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 hover:border-orange-500/50 transition-colors"
        >
          <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 shrink-0">
            <Smartphone size={28} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black mb-1">Kitchen Display (KDS)</h3>
            <p className="text-white/50 text-sm">Painel de pedidos para a cozinha. Use em tablet fixo na área de produção.</p>
          </div>
          <Link 
            to="/kitchen-mode" 
            className="bg-orange-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shrink-0"
          >
            Abrir KDS <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
      
      <p className="text-center text-white/20 mt-16 text-sm">
         © 2024 EmprataAI Enterprise Solutions. Distribuição restrita para colaboradores.
      </p>
    </div>
  );
}
