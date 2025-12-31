/**
 * Business Intelligence Page - EmprataBrain Analytics
 * 
 * Features:
 * - Desktop: Analytical data table (Bloomberg style)
 * - Mobile: Expandable insight cards
 * - AI-powered executive summary
 * - Customer DNA profiles with risk detection
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, AlertTriangle, Sparkles, 
  Search, Crown, Loader2, DollarSign, UserCheck, UserX
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { generateCustomerDNA, type CustomerProfile, type AnalyticsResult } from '../../services/analysisAi';
import { formatCurrency } from '../../utils/format';
import { AiPulse } from '../../components/ui/AiPulse';

export default function BusinessIntelligence() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    
    setLoading(true);
    generateCustomerDNA(user.uid)
      .then(result => {
        setData(result);
      })
      .catch(err => {
        console.error('BI Error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.uid]);

  const profiles = data?.profiles || [];
  
  const filteredProfiles = profiles
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => !filterTag || p.tags.some(t => t.includes(filterTag)))
    .sort((a, b) => b.totalSpent - a.totalSpent); // VIPs first

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. HEADER WITH AI INSIGHTS (Glassmorphism) */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#1a1a1a] to-black border border-white/10 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white mb-2">
                Business <span className="text-purple-400">Intelligence</span>
              </h1>
              <p className="text-white/40 text-sm md:text-base max-w-xl">
                {loading 
                  ? 'Analisando histórico de pedidos...' 
                  : `EmprataBrain analisou ${profiles.length} perfis de consumo.`}
              </p>
            </div>
            <AiPulse state={loading ? 'learning' : 'idle'} label="Neural Engine" />
          </div>

          {/* Stats Row */}
          {data?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <StatCard 
                icon={<Users size={18} />}
                label="Total Clientes"
                value={data.stats.totalCustomers.toString()}
                color="text-white"
              />
              <StatCard 
                icon={<UserCheck size={18} />}
                label="Ativos"
                value={data.stats.activeCustomers.toString()}
                color="text-green-400"
              />
              <StatCard 
                icon={<UserX size={18} />}
                label="Em Risco"
                value={data.stats.atRiskCustomers.toString()}
                color="text-red-400"
              />
              <StatCard 
                icon={<Crown size={18} />}
                label="VIPs"
                value={data.stats.vipCustomers.toString()}
                color="text-yellow-400"
              />
            </div>
          )}

          {/* AI Insight Card */}
          {!loading && data?.aiInsight && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-6 flex flex-col md:flex-row gap-6"
            >
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase text-purple-400 mb-2 flex items-center gap-2">
                  <Sparkles size={14} /> Insight Estratégico
                </h3>
                <p className="text-white/90 font-medium leading-relaxed">
                  "{data.aiInsight.insight}"
                </p>
              </div>
              <div className="h-px w-full md:w-px md:h-auto bg-white/10" />
              <div className="flex-1">
                <h3 className="text-xs font-black uppercase text-green-400 mb-2 flex items-center gap-2">
                  <TrendingUp size={14} /> Ação Recomendada
                </h3>
                <p className="text-white/90 font-medium leading-relaxed">
                  "{data.aiInsight.actionItem}"
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 2. CONTROLS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl py-2 px-1">
        <div className="relative w-full md:w-96 group">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" 
            size={18} 
          />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do cliente..."
            className="w-full bg-[#121212] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-primary outline-none transition-all shadow-lg"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {[
            { label: '💎 VIPs', tag: 'VIP' },
            { label: '⚠️ Risco', tag: null, filter: 'risk' },
            { label: '🆕 Novos', tag: 'Novo' },
            { label: '🔄 Frequentes', tag: 'Frequente' }
          ].map(item => (
            <button 
              key={item.label}
              onClick={() => setFilterTag(filterTag === item.tag ? null : item.tag)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filterTag === item.tag 
                  ? 'bg-white text-black' 
                  : 'bg-[#121212] border border-white/10 hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. SMART DATA TABLE */}
      <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* TABLE HEADER (Desktop only) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-5 border-b border-white/5 bg-white/[0.02] text-xs font-black uppercase tracking-widest text-white/40">
          <div className="col-span-4">Cliente</div>
          <div className="col-span-2 text-right">Gasto Total</div>
          <div className="col-span-2 text-center">Pedidos</div>
          <div className="col-span-2">Favorito</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* TABLE BODY */}
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-purple-400" size={40} />
              <p className="text-white/40 text-sm">Processando DNA dos clientes...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-20 text-center">
              <Users size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-white/40">Nenhum cliente encontrado</p>
            </div>
          ) : filteredProfiles.map((customer) => (
            <motion.div 
              key={customer.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group hover:bg-white/[0.02] transition-colors"
            >
              {/* DESKTOP VERSION */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-5 items-center">
                <div className="col-span-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    customer.totalSpent > 500 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' 
                      : 'bg-white/10 text-white'
                  }`}>
                    {customer.totalSpent > 500 ? <Crown size={16} /> : customer.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{customer.name}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {customer.tags.map(t => (
                        <span key={t} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono text-white/80">
                  {formatCurrency(customer.totalSpent)}
                </div>
                <div className="col-span-2 text-center">
                  <span className="bg-white/5 px-3 py-1 rounded-lg text-xs font-bold">
                    {customer.orderCount}x
                  </span>
                </div>
                <div className="col-span-2 text-xs text-white/60 truncate">
                  {customer.favoriteItems[0]}
                </div>
                <div className="col-span-2 flex justify-end">
                  <StatusBadge risk={customer.riskLevel} />
                </div>
              </div>

              {/* MOBILE VERSION (Card) */}
              <div className="md:hidden p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${
                      customer.totalSpent > 500 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' 
                        : 'bg-white/5 text-white'
                    }`}>
                      {customer.totalSpent > 500 ? <Crown size={20} /> : customer.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{customer.name}</h3>
                      <p className="text-xs text-white/40">
                        {customer.orderCount} pedido{customer.orderCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge risk={customer.riskLevel} />
                </div>
                
                <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase font-bold">LTV (Gasto)</p>
                    <p className="text-lg font-mono font-bold text-primary">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase font-bold">Favorito</p>
                    <p className="text-sm font-bold text-white truncate">
                      {customer.favoriteItems[0]}
                    </p>
                  </div>
                </div>
                
                {customer.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {customer.tags.map(t => (
                      <span key={t} className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/60">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ══════════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string; 
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
      <div className={`flex items-center gap-2 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ risk }: { risk: string }) {
  if (risk === 'HIGH') return (
    <span className="flex items-center gap-1 bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-red-500/20">
      <AlertTriangle size={10} /> Risco
    </span>
  );
  if (risk === 'MEDIUM') return (
    <span className="bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-yellow-500/20">
      Ausente
    </span>
  );
  return (
    <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-green-500/20">
      Ativo
    </span>
  );
}
