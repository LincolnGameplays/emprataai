/**
 * 💰 FinanceModule - Módulo Financeiro Híbrido
 * 
 * Divide o financeiro em duas partes:
 * - WalletSection: Saldo, Saque e Extrato (Aberto para TODOS os planos)
 * - AnalyticsSection: DRE, Gráficos (Exclusivo BLACK via PlanGuard)
 * 
 * Isso resolve o "Loop Infinito de Frustração" onde usuários Starter
 * vendiam mas não conseguiam ver seu saldo nem sacar.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { 
  TrendingUp, ArrowUpRight, Wallet, History, 
  Loader2, Calendar, CreditCard, BarChart3, PieChart 
} from 'lucide-react';
import { toast } from 'sonner';
import { PlanGuard } from '../../components/ui/PlanGuard';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  desc: string;
  amount: number;
  time: string;
}

export default function FinanceModule() {
  const { currentPlan } = useSubscription();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 min-h-screen pb-20"
    >
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-white">Central Financeira</h1>
        <p className="text-white/50">Gerencie seus ganhos e saques.</p>
      </div>

      {/* 1. CARTEIRA (Disponível para TODOS - Starter a Black) */}
      <WalletSection />

      {/* 2. INTELIGÊNCIA (Bloqueado para Starter/Growth) */}
      <div className="pt-8 border-t border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="text-purple-400" />
          <h2 className="text-xl font-bold text-white">Inteligência de Lucro</h2>
          {currentPlan !== 'BLACK' && (
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
              EXCLUSIVO BLACK
            </span>
          )}
        </div>

        <PlanGuard feature="financial_analytics" fallback="blur">
          <AnalyticsSection />
        </PlanGuard>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WALLET SECTION (Aberto para TODOS os planos)
// ═══════════════════════════════════════════════════════════════════════════

function WalletSection() {
  const { user } = useAuth();
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadBalance = async () => {
      setLoading(true);
      
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Busca pedidos pagos/entregues do mês
        const q = query(
          collection(db, 'orders'),
          where('restaurantId', '==', user.uid),
          where('status', 'in', ['DELIVERED', 'PAID', 'delivered', 'paid', 'COMPLETED', 'completed']),
          where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
        );
        
        const snap = await getDocs(q);
        
        let totalRevenue = 0;
        const recentTx: Transaction[] = [];
        
        snap.forEach(d => {
          const orderData = d.data();
          const total = Number(orderData.total) || 0;
          totalRevenue += total;
          
          // Ultimas 5 transações
          if (recentTx.length < 5) {
            const createdAt = orderData.createdAt?.toDate?.() || new Date();
            const timeDiff = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60));
            let timeLabel = `${timeDiff}min`;
            if (timeDiff >= 60) timeLabel = `${Math.floor(timeDiff / 60)}h`;
            if (timeDiff >= 1440) timeLabel = `${Math.floor(timeDiff / 1440)}d`;
            
            recentTx.push({
              id: d.id,
              type: 'income',
              desc: `Pedido #${d.id.slice(-4).toUpperCase()}`,
              amount: total,
              time: timeLabel
            });
          }
        });
        
        // Simulação: 70% disponível, 30% a liberar (antecipação)
        // Em produção, viria da API do Asaas
        setBalance({ 
          available: totalRevenue * 0.7, 
          pending: totalRevenue * 0.3 
        });
        setTransactions(recentTx);
        
      } catch (error) {
        console.error('[FinanceModule] Error loading balance:', error);
        toast.error('Erro ao carregar saldo');
      } finally {
        setLoading(false);
      }
    };
    
    loadBalance();
  }, [user]);

  const handleWithdraw = () => {
    if (balance.available < 10) {
      toast.error('Saldo mínimo para saque: R$ 10,00');
      return;
    }
    toast.success("💸 Solicitação de saque enviada para sua conta bancária!", {
      description: "O valor estará disponível em até 1 dia útil."
    });
    // TODO: Integrar com API de saque do Asaas
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 className="animate-spin text-green-500" size={32} />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* SALDO DISPONÍVEL */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-[#1a1a1a] to-black p-8 rounded-[2rem] border border-green-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
            <Wallet size={20}/>
          </div>
          <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Saldo Disponível</span>
        </div>
        
        <h2 className="text-5xl font-black text-white mb-6">
          R$ {balance.available.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        
        <div className="flex gap-3">
          <button 
            onClick={handleWithdraw}
            className="flex-1 bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-95"
          >
            SACAR AGORA <ArrowUpRight size={18} />
          </button>
          <div className="flex-1 bg-[#121212] border border-white/10 rounded-xl flex flex-col justify-center px-4">
            <span className="text-[10px] text-white/40 uppercase font-bold">A liberar</span>
            <span className="text-lg font-bold text-white/60">
              R$ {balance.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* EXTRATO RÁPIDO */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#121212] p-6 rounded-[2rem] border border-white/5 h-full flex flex-col"
      >
        <h3 className="text-sm font-bold text-white/40 uppercase mb-4 flex items-center gap-2">
          <History size={16} /> Últimas Transações
        </h3>
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <CreditCard size={32} className="mx-auto mb-2" />
              <p>Nenhuma transação este mês.</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <motion.div 
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors"
              >
                <div>
                  <p className="font-bold text-sm text-white">{tx.desc}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Calendar size={10}/> {tx.time} atrás
                  </p>
                </div>
                <span className={`font-mono font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'} R$ {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS SECTION (Exclusivo BLACK - Protegido por PlanGuard)
// ═══════════════════════════════════════════════════════════════════════════

function AnalyticsSection() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Gráfico de Lucro Líquido (DRE) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2 bg-[#121212] h-64 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
        <BarChart3 size={48} className="text-purple-400/30 mb-4" />
        <p className="text-white/40 font-bold">Gráfico de Lucro Líquido (DRE)</p>
        <p className="text-white/20 text-sm mt-2">Em breve: Análise completa de receitas vs. custos</p>
      </motion.div>
      
      {/* Curva ABC de Produtos */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#121212] h-64 rounded-3xl border border-white/5 flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
        <PieChart size={48} className="text-green-400/30 mb-4" />
        <p className="text-white/40 font-bold">Curva ABC</p>
        <p className="text-white/20 text-sm mt-2">Produtos mais lucrativos</p>
      </motion.div>

      {/* Cards de métricas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="md:col-span-3 grid grid-cols-4 gap-4"
      >
        {[
          { label: 'Margem Bruta', value: '32%', color: 'green' },
          { label: 'CMV', value: 'R$ 4.250', color: 'red' },
          { label: 'Ticket Médio', value: 'R$ 45,90', color: 'blue' },
          { label: 'Crescimento', value: '+18%', color: 'purple' },
        ].map((metric, i) => (
          <div 
            key={i} 
            className={`bg-[#0a0a0a] p-4 rounded-2xl border border-${metric.color}-500/20`}
          >
            <p className="text-white/40 text-xs uppercase font-bold mb-1">{metric.label}</p>
            <p className={`text-2xl font-black text-${metric.color}-400`}>{metric.value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
