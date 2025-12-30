import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { TrendingUp, TrendingDown, DollarSign, Package, Percent } from 'lucide-react';

interface DailyData {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  ordersCount: number;
}

interface ProfitData {
  dailyData: DailyData[];
  totals: {
    totalSales: number;
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    ordersCount: number;
    avgProfitMargin: number;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function ProfitChart() {
  const [data, setData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30'>('7');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fn = httpsCallable(functions, 'getProfitAnalytics');
        const result = await fn({}) as { data: ProfitData };
        setData(result.data);
      } catch (error) {
        console.error('Error fetching profit data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-40 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (!data) return null;

  const { totals, dailyData } = data;
  const isProfitable = totals.totalProfit > 0;
  const recentDays = dailyData.slice(0, parseInt(period));

  // Calcula maior valor para escala do gráfico
  const maxValue = Math.max(...recentDays.map(d => Math.max(d.totalRevenue, d.totalProfit)));

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden">
      {/* Glow effect */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${isProfitable ? 'bg-green-500/10' : 'bg-red-500/10'}`} />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Profit-First Dashboard</h3>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black text-white">Análise de Lucro</h2>
            {isProfitable ? (
              <TrendingUp className="w-6 h-6 text-green-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-400" />
            )}
          </div>
        </div>
        
        {/* Period selector */}
        <div className="flex bg-black/50 rounded-xl border border-white/10 p-1">
          <button 
            onClick={() => setPeriod('7')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${period === '7' ? 'bg-white/10 text-white' : 'text-white/40'}`}
          >
            7 dias
          </button>
          <button 
            onClick={() => setPeriod('30')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${period === '30' ? 'bg-white/10 text-white' : 'text-white/40'}`}
          >
            30 dias
          </button>
        </div>
      </div>

      {/* Big Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-white/40 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Faturamento</span>
          </div>
          <p className="text-xl font-black text-white">{formatCurrency(totals.totalSales)}</p>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-white/40 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Custos</span>
          </div>
          <p className="text-xl font-black text-red-400">{formatCurrency(totals.totalCosts)}</p>
        </div>
        
        <div className={`rounded-2xl p-4 border ${isProfitable ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center gap-2 text-white/40 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Lucro Real</span>
          </div>
          <p className={`text-2xl font-black ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totals.totalProfit)}
          </p>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 text-white/40 mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Margem</span>
          </div>
          <p className={`text-xl font-black ${totals.avgProfitMargin >= 20 ? 'text-green-400' : totals.avgProfitMargin >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
            {totals.avgProfitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-40">
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {recentDays.reverse().map((day, i) => {
            const revenueHeight = maxValue > 0 ? (day.totalRevenue / maxValue) * 100 : 0;
            const profitHeight = maxValue > 0 ? (day.totalProfit / maxValue) * 100 : 0;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex gap-0.5 items-end h-32">
                  {/* Revenue bar */}
                  <div 
                    className="flex-1 bg-white/20 rounded-t transition-all group-hover:bg-white/30"
                    style={{ height: `${revenueHeight}%` }}
                  />
                  {/* Profit bar */}
                  <div 
                    className={`flex-1 rounded-t transition-all ${day.totalProfit >= 0 ? 'bg-green-500/60 group-hover:bg-green-500/80' : 'bg-red-500/60'}`}
                    style={{ height: `${Math.abs(profitHeight)}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30 group-hover:text-white/60">
                  {day.date?.slice(8, 10)}
                </span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-black/90 border border-white/20 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  <p className="text-xs text-white/60 mb-1">{day.date}</p>
                  <p className="text-sm text-white">Vendas: {formatCurrency(day.totalRevenue)}</p>
                  <p className={`text-sm font-bold ${day.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Lucro: {formatCurrency(day.totalProfit)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white/20 rounded" />
          <span className="text-white/40">Faturamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/60 rounded" />
          <span className="text-white/40">Lucro Real</span>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <p className="text-sm text-yellow-200/80">
          💡 <strong>Insight:</strong> Você vendeu {formatCurrency(totals.totalSales)}, 
          mas lucrou apenas {formatCurrency(totals.totalProfit)} 
          ({totals.avgProfitMargin.toFixed(0)}% de margem).
          {totals.avgProfitMargin < 15 && ' Considere revisar seus custos ou aumentar preços.'}
        </p>
      </div>
    </div>
  );
}
