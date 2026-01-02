/**
 * 🏆 CUSTOMER LOYALTY BADGE
 * 
 * Mostra o nível de fidelidade do cliente e seu progresso
 * Usado no perfil do cliente e no checkout
 */

import { Crown, Star, ChevronRight } from 'lucide-react';
import { getCustomerLevel, getNextCustomerLevel, CUSTOMER_JOURNEY } from '../../types/journey';

interface LoyaltyBadgeProps {
  orderCount: number;
  showProgress?: boolean;
  compact?: boolean;
}

export function LoyaltyBadge({ orderCount, showProgress = true, compact = false }: LoyaltyBadgeProps) {
  const level = getCustomerLevel(orderCount);
  const nextLevel = getNextCustomerLevel(orderCount);
  
  const progressPercent = nextLevel 
    ? ((orderCount - (CUSTOMER_JOURNEY.find(l => l.id === level.id)?.ordersRequired || 0)) / 
       (nextLevel.ordersRequired - (CUSTOMER_JOURNEY.find(l => l.id === level.id)?.ordersRequired || 0))) * 100
    : 100;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${level.color}`}>
        <span className="text-sm">{level.icon}</span>
        <span className="text-xs font-bold">{level.label}</span>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl ${level.color}`}>
          {level.icon}
        </div>
        
        <div className="flex-1">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Nível de Fidelidade</p>
          <p className={`text-sm font-black ${level.color}`}>{level.label}</p>
          
          {/* Progress Bar */}
          {showProgress && nextLevel && (
            <div className="mt-2">
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${level.color.replace('text-', 'bg-')}`}
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <p className="text-[9px] text-white/30 mt-1">
                {nextLevel.ordersRequired - orderCount} pedidos para {nextLevel.label}
              </p>
            </div>
          )}
        </div>

        {/* Discount Badge */}
        {level.discount > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg text-center">
            <p className="text-[10px] text-green-400 font-bold">-R$ {level.discount}</p>
            <p className="text-[8px] text-green-400/60">por pedido</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Mini badge para exibição inline (ex: ao lado do nome)
 */
export function LoyaltyBadgeMini({ orderCount }: { orderCount: number }) {
  const level = getCustomerLevel(orderCount);
  
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${level.color}`} title={level.label}>
      <span>{level.icon}</span>
    </span>
  );
}

/**
 * Card de destaque para o checkout mostrando economia
 */
export function LoyaltyCheckoutCard({ orderCount }: { orderCount: number }) {
  const level = getCustomerLevel(orderCount);
  const nextLevel = getNextCustomerLevel(orderCount);
  
  if (level.discount === 0 && !nextLevel) return null;
  
  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-transparent p-4 rounded-xl border border-purple-500/20">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{level.icon}</span>
        <div className="flex-1">
          {level.discount > 0 ? (
            <>
              <p className="text-white font-bold text-sm">
                Você economiza R$ {level.discount.toFixed(2)}!
              </p>
              <p className="text-white/50 text-xs">
                Desconto VIP aplicado por ser <span className={level.color}>{level.label}</span>
              </p>
            </>
          ) : nextLevel && (
            <>
              <p className="text-white font-bold text-sm">
                Próximo desconto: R$ {nextLevel.discount.toFixed(2)} por pedido
              </p>
              <p className="text-white/50 text-xs">
                Mais {nextLevel.ordersRequired - orderCount} pedidos para desbloquear
              </p>
            </>
          )}
        </div>
        <ChevronRight size={16} className="text-white/30" />
      </div>
    </div>
  );
}
