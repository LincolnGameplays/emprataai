import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { 
  TrendingUp, Wallet, ArrowUpRight, 
  Calendar, CreditCard, Banknote, PiggyBank, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

type Period = 'today' | 'week' | 'month';

interface FinanceData {
  revenue: number;
  orders: number;
  avgTicket: number;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  desc: string;
  amount: number;
  time: string;
}

export default function OwnerFinance() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceData>({ revenue: 0, orders: 0, avgTicket: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      
      try {
        const today = new Date();
        let startDate: Date;
        
        switch (period) {
          case 'today':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            break;
          case 'week':
            startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
          default:
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        // Busca pedidos do período que foram entregues/pagos
        const q = query(
          collection(db, 'orders'),
          where('restaurantId', '==', user.uid),
          where('status', 'in', ['DELIVERED', 'PAID', 'delivered', 'paid', 'COMPLETED', 'completed']),
          where('createdAt', '>=', Timestamp.fromDate(startDate))
        );
        
        const snap = await getDocs(q);
        
        let sum = 0;
        const recentTx: Transaction[] = [];
        
        snap.forEach(d => {
          const orderData = d.data();
          const total = Number(orderData.total) || 0;
          sum += total;
          
          // Add to recent transactions (limit to 5)
          if (recentTx.length < 5) {
            const createdAt = orderData.createdAt?.toDate?.() || new Date();
            const timeDiff = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60));
            let timeLabel = `${timeDiff}min`;
            if (timeDiff >= 60) {
              timeLabel = `${Math.floor(timeDiff / 60)}h`;
            }
            if (timeDiff >= 1440) {
              timeLabel = `${Math.floor(timeDiff / 1440)}d`;
            }
            
            recentTx.push({
              id: d.id,
              type: 'income',
              desc: `Pedido #${d.id.slice(-4).toUpperCase()}`,
              amount: total,
              time: timeLabel
            });
          }
        });
        
        const orderCount = snap.size;
        const avgTicket = orderCount > 0 ? sum / orderCount : 0;
        
        setData({ 
          revenue: sum, 
          orders: orderCount, 
          avgTicket 
        });
        setTransactions(recentTx);
        
      } catch (error) {
        console.error('[OwnerFinance] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, period]);

  const handleWithdraw = () => {
    toast.success("💸 Saque solicitado! Processando...");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

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
          <span className="text-sm font-bold flex items-center gap-1 text-green-400">
            <TrendingUp size={14} />
            Dados Reais
          </span>
        </div>
        
        <h2 className="text-4xl font-black text-white mb-4">
          R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/40 text-xs">Pedidos</p>
            <p className="text-lg font-bold text-white">{data.orders}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs">Ticket Médio</p>
            <p className="text-lg font-bold text-white">
              R$ {data.avgTicket.toFixed(2).replace('.', ',')}
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
            <p className="text-sm font-bold text-white">Solicitar Saque</p>
          </div>
        </button>
        
        <button className="bg-[#121212] border border-white/10 p-4 rounded-2xl flex items-center gap-3 hover:border-primary/50 transition-colors group active:scale-95">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <PiggyBank size={20} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-xs text-white/40">Relatório</p>
            <p className="text-sm font-bold text-white">Ver Detalhes</p>
          </div>
        </button>
      </div>

      {/* Transações Recentes */}
      <div>
        <h3 className="text-sm font-bold text-white/40 uppercase mb-4 ml-2">Últimas Movimentações</h3>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <CreditCard size={32} className="mx-auto mb-2" />
              <p>Nenhuma transação no período.</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
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
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
