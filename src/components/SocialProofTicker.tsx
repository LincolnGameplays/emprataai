
import { Star, BadgeCheck, TrendingUp } from 'lucide-react';
import { RealMetrics } from '../hooks/useRestaurantMetrics';

export default function SocialProofTicker({ metrics }: { metrics: RealMetrics }) {
  // Se for novo, mostramos tag de novidade em vez de reviews vazias
  if (metrics.isNew) {
    return (
      <div className="bg-blue-500/10 border-b border-blue-500/20 py-2 overflow-hidden">
        <div className="flex items-center justify-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest">
          <BadgeCheck className="w-4 h-4" />
          <span>Restaurante Novo no EmprataAI • Seja um dos primeiros a experimentar!</span>
        </div>
      </div>
    );
  }

  // Se não tem reviews, não mostra nada (Melhor que mostrar fake)
  if (metrics.reviewCount === 0) return null;

  return (
    <div className="bg-[#121212] border-b border-white/5 py-3 overflow-hidden whitespace-nowrap">
      <div className="inline-flex items-center gap-8 animate-marquee">
        {/* Mostra métricas reais */}
        <span className="flex items-center gap-2 text-xs font-bold text-white/60">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          {metrics.rating} ({metrics.reviewCount} avaliações reais)
        </span>

        {/* Mostra comentários reais dos clientes */}
        {metrics.latestReviews.map((review, i) => (
          <span key={i} className="flex items-center gap-2 text-xs text-white/40 italic">
            "{review.comment}" — {review.customerName || 'Cliente'}
          </span>
        ))}
        
        {/* Repete para efeito marquee se precisar... */}
      </div>
    </div>
  );
}
