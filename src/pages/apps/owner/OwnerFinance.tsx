import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, 
  Calendar, CreditCard, Banknote, PiggyBank 
} from 'lucide-react';
import { toast } from 'sonner';

type Period = 'today' | 'week' | 'month';

export default function OwnerFinance() {
  const [period, setPeriod] = useState<Period>('today');

  // Mock data - em produção viria do Firestore/Asaas
  const stats = {
    today: { revenue: 1450.00, orders: 24, avgTicket: 60.42, growth: 12 },
    week: { revenue: 8320.50, orders: 142, avgTicket: 58.60, growth: 8 },
    month: { revenue: 32150.00, orders: 520, avgTicket: 61.83, growth: 15 },
  };

  const currentStats = stats[period];

  const recentTransactions = [
    { id: 1, type: 'income', desc: 'Pedido #1234', amount: 89.90, time: '5min' },
    { id: 2, type: 'income', desc: 'Pedido #1233', amount: 45.00, time: '18min' },
    { id: 3, type: 'expense', desc: 'Taxa Plataforma', amount: -12.50, time: '1h' },
    { id: 4, type: 'income', desc: 'Pedido #1232', amount: 128.50, time: '2h' },
  ];

  const handleWithdraw = () => {
    toast.success("💸 Saque solicitado! Processando...");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
       {/* Seletor de Período */}
       <div className="flex gap-2 p-1 bg-[#121212] rounded-xl border border-white/5">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                period === p 
                  ? 'bg-primary text-black' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
       </div>

       {/* Card Principal - Faturamento */}
       <div className="bg-gradient-to-br from-green-900/30 to-[#1a1a1a] rounded-[2rem] p-6 border border-green-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-green-400" />
              <span className="text-green-400 text-sm font-bold">Faturamento</span>
            </div>
            <span className={`text-sm font-bold flex items-center gap-1 ${
              currentStats.growth > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {currentStats.growth > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {currentStats.growth > 0 ? '+' : ''}{currentStats.growth}%
            </span>
          </div>
          
          <h2 className="text-4xl font-black text-white mb-4">
            R$ {currentStats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs">Pedidos</p>
              <p className="text-lg font-bold text-white">{currentStats.orders}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Ticket Médio</p>
              <p className="text-lg font-bold text-white">
                R$ {currentStats.avgTicket.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
       </div>

       {/* Ações Rápidas */}
       <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleWithdraw}
            className="bg-[#121212] border border-green-500/20 p-4 rounded-2xl flex items-center gap-3 hover:border-green-500/50 transition-colors group active:scale-95"
          >
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Banknote size={20} className="text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-xs text-white/40">Disponível</p>
              <p className="text-sm font-bold text-white">Sacar R$ 850</p>
            </div>
          </button>
          
          <button className="bg-[#121212] border border-white/10 p-4 rounded-2xl flex items-center gap-3 hover:border-primary/50 transition-colors group active:scale-95">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <PiggyBank size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs text-white/40">Reserva</p>
              <p className="text-sm font-bold text-white">R$ 2.340</p>
            </div>
          </button>
       </div>

       {/* Transações Recentes */}
       <div>
          <h3 className="text-sm font-bold text-white/40 uppercase mb-4 ml-2">Últimas Movimentações</h3>
          <div className="space-y-2">
             {recentTransactions.map((tx, i) => (
               <motion.div 
                 key={tx.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="bg-[#121212] p-4 rounded-xl border border-white/5 flex items-center justify-between"
               >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {tx.type === 'income' ? (
                        <ArrowUpRight size={16} className="text-green-400" />
                      ) : (
                        <CreditCard size={16} className="text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tx.desc}</p>
                      <p className="text-xs text-white/40 flex items-center gap-1">
                        <Calendar size={10} /> {tx.time} atrás
                      </p>
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${
                    tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2).replace('.', ',')}
                  </span>
               </motion.div>
             ))}
          </div>
       </div>
    </motion.div>
  );
}
