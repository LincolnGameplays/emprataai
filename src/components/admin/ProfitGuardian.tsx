import { useState } from 'react';
import { ShieldAlert, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { auditMenuMargins } from '../../services/businessAi';
import { formatCurrency } from '../../utils/format';

export function ProfitGuardian({ menuItems }: { menuItems: any[] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const runAudit = async () => {
    setAnalyzing(true);
    const result = await auditMenuMargins(menuItems);
    setReport(result);
    setAnalyzing(false);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl p-6 relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black italic flex items-center gap-2 text-white">
            <ShieldAlert className="text-yellow-500" /> Guardião de Lucro
          </h2>
          <p className="text-xs text-white/40">IA Financeira</p>
        </div>
        {!report && (
          <button 
            onClick={runAudit}
            disabled={analyzing}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            {analyzing ? <Loader2 className="animate-spin w-3 h-3" /> : 'Auditar Agora'}
          </button>
        )}
      </div>

      {report && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-black ${report.overallHealth > 70 ? 'text-green-500' : 'text-red-500'}`}>
              {report.overallHealth}
            </div>
            <p className="text-xs text-white/60 font-bold uppercase w-32">
              Score de Saúde Financeira
            </p>
          </div>

          {report.dangerousItems.length > 0 ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-red-400 uppercase mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Alertas de Prejuízo
              </p>
              <div className="space-y-3">
                {report.dangerousItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-red-500/10 pb-2 last:border-0">
                    <div>
                      <span className="font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-white/40">{item.suggestion}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-red-400 font-mono text-xs">Mg: {(item.currentMargin * 100).toFixed(0)}%</span>
                      <span className="block text-green-400 font-bold text-xs">Sugerido: {formatCurrency(item.suggestedPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500 w-5 h-5" />
              <p className="text-sm font-bold text-green-400">Seu cardápio está blindado!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
