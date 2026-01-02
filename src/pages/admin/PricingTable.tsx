/**
 * 💎 PricingTable - Tabela de Planos Transparente
 * 
 * Exibe claramente:
 * - Preço mensal de cada plano
 * - Taxa por venda (12%, 9%, 6%)
 * - Features incluídas
 * 
 * Argumento matemático forte para upgrade:
 * "Starter = sem mensalidade, mas 12%"
 * "Black = R$ 300/mês, mas só 6%"
 */

import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PLAN_FEES } from '../../types/subscription';

interface Feature {
  name: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  fee: string;
  color: 'gray' | 'green' | 'purple';
  features: Feature[];
  btnText: string;
  onClick?: () => void;
  disabled?: boolean;
  highlight?: string;
}

export default function PricingTable() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-12"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black italic mb-4 text-white">Escolha seu Modelo de Negócio</h2>
        <p className="text-white/50 max-w-xl mx-auto">
          Comece sem custos fixos no Starter. Migre para assinaturas quando quiser pagar menos taxas e ter mais inteligência.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
        
        {/* STARTER */}
        <PricingCard 
          title="Starter" 
          price="R$ 0" 
          period="Sem mensalidade"
          fee={`${(PLAN_FEES.STARTER * 100).toFixed(0)}% por venda`}
          color="gray"
          features={[
            { name: "Cardápio Digital & QR Code", included: true },
            { name: "Painel de Pedidos (KDS)", included: true },
            { name: "Carteira Digital & Saques", included: true },
            { name: "App do Motorista (GPS)", included: false },
            { name: "Inteligência Artificial", included: false },
          ]}
          btnText="Plano Atual"
          disabled
        />

        {/* GROWTH */}
        <PricingCard 
          title="Growth" 
          price="R$ 149,90" 
          period="/mês"
          fee={`${(PLAN_FEES.GROWTH * 100).toFixed(0)}% por venda`}
          color="green"
          highlight="Melhor Custo-Benefício"
          features={[
            { name: "Tudo do Starter", included: true },
            { name: "Taxas Reduzidas (9%)", included: true },
            { name: "App de Entregadores (GPS)", included: true },
            { name: "Modo Chuva & Taxas Dinâmicas", included: true },
            { name: "Inteligência Artificial", included: false },
          ]}
          btnText="Assinar Growth"
          onClick={() => navigate('/subscription')}
        />

        {/* BLACK */}
        <PricingCard 
          title="Emprata Black" 
          price="R$ 299,90" 
          period="/mês"
          fee={`${(PLAN_FEES.BLACK * 100).toFixed(0)}% por venda`}
          color="purple"
          features={[
            { name: "Tudo do Growth", included: true },
            { name: "Menor Taxa do Mercado (6%)", included: true },
            { name: "EmprataBrain (IA Consultora)", included: true },
            { name: "DRE e Relatórios Financeiros", included: true },
            { name: "CRM Automático (Recuperação)", included: true },
          ]}
          btnText="Assinar Black"
          onClick={() => navigate('/subscription')}
        />

      </div>
    </motion.div>
  );
}

function PricingCard({ 
  title, 
  price, 
  period, 
  fee, 
  color, 
  features, 
  btnText, 
  onClick, 
  disabled, 
  highlight 
}: PricingCardProps) {
  const colors = {
    gray: 'border-white/10 bg-[#121212]',
    green: 'border-green-500/30 bg-[#121212] shadow-[0_0_30px_rgba(34,197,94,0.1)]',
    purple: 'border-purple-500/30 bg-gradient-to-b from-[#1a1a1a] to-black shadow-[0_0_30px_rgba(147,51,234,0.1)]'
  };
  
  const textColors = {
    gray: 'text-white',
    green: 'text-green-400',
    purple: 'text-purple-400'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={`rounded-3xl p-8 border relative ${colors[color]} flex flex-col h-full`}
    >
      {highlight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
          <Sparkles size={12} /> {highlight}
        </div>
      )}

      <h3 className={`text-xl font-bold mb-2 ${textColors[color]}`}>{title}</h3>
      <div className="mb-1 flex items-end gap-1">
        <span className="text-4xl font-black text-white">{price}</span>
        <span className="text-sm text-white/40 mb-1">{period}</span>
      </div>
      <div className="bg-white/5 rounded-lg p-2 text-center mb-8 border border-white/5">
        <span className="text-xs text-white/60 font-bold uppercase">Taxa sobre vendas:</span>
        <p className={`text-lg font-black ${textColors[color]}`}>{fee}</p>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className={`flex items-start gap-3 text-sm ${f.included ? 'text-white' : 'text-white/20'}`}>
            {f.included ? (
              <Check size={18} className={textColors[color]} />
            ) : (
              <X size={18} />
            )}
            <span>{f.name}</span>
          </li>
        ))}
      </ul>

      <button 
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-4 rounded-xl font-black transition-all active:scale-95 ${
          disabled 
            ? 'bg-white/5 text-white/20 cursor-not-allowed' 
            : color === 'green' 
              ? 'bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/20' 
              : color === 'purple'
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white hover:bg-gray-200 text-black shadow-lg'
        }`}
      >
        {btnText}
      </button>
    </motion.div>
  );
}
