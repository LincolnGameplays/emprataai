/**
 * SalesChart Component
 * Recharts AreaChart with premium dark styling
 */

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../services/analyticsService';

interface SalesChartProps {
  data: { date: string; value: number }[];
  height?: number;
}

// ══════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ══════════════════════════════════════════════════════════════════

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
        {label}
      </p>
      <p className="text-lg font-black text-primary">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function SalesChart({ data, height = 300 }: SalesChartProps) {
  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-white/5 rounded-2xl border border-white/5"
        style={{ height }}
      >
        <p className="text-white/20 text-sm">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B00" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#FF6B00" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#FF6B00" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* X Axis */}
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}
            dy={10}
          />

          {/* Y Axis - Hidden but keeps spacing */}
          <YAxis 
            hide
            domain={['dataMin - 100', 'dataMax + 100']}
          />

          {/* Tooltip */}
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
          />

          {/* Area with gradient fill */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#FF6B00"
            strokeWidth={3}
            fill="url(#salesGradient)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
