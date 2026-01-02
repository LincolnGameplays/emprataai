/**
 * 📱 RESPONSIVE TABLE - Mobile-First Data Display
 * 
 * Transforms tables into cards on mobile for better UX.
 * Features:
 * - Grid layout that adapts to screen size
 * - Haptic feedback on interactions
 * - Status indicators with colors
 * - Touch-friendly action buttons
 */

import { motion } from 'framer-motion';
import { ChevronRight, Package, Clock, MapPin, User } from 'lucide-react';
import { hapticTap } from '../../services/apiClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Order {
  id: string;
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  items: Array<{ name: string; quantity: number }>;
  total: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date | { toDate: () => Date };
}

interface ResponsiveOrderListProps {
  orders: Order[];
  onOrderClick?: (order: Order) => void;
  emptyMessage?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<Order['status'], { color: string; bg: string; label: string }> = {
  PENDING: { color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'Pendente' },
  PREPARING: { color: 'text-blue-400', bg: 'bg-blue-500', label: 'Preparando' },
  READY: { color: 'text-green-400', bg: 'bg-green-500', label: 'Pronto' },
  OUT_FOR_DELIVERY: { color: 'text-purple-400', bg: 'bg-purple-500', label: 'Em Entrega' },
  DELIVERED: { color: 'text-gray-400', bg: 'bg-gray-500', label: 'Entregue' },
  CANCELLED: { color: 'text-red-400', bg: 'bg-red-500', label: 'Cancelado' },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatTime(date: Date | { toDate: () => Date }): string {
  const d = 'toDate' in date ? date.toDate() : date;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function getStatusConfig(status: Order['status']) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ResponsiveOrderList({ 
  orders, 
  onOrderClick,
  emptyMessage = 'Nenhum pedido encontrado'
}: ResponsiveOrderListProps) {
  
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40">
        <Package size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order, index) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => {
            hapticTap();
            onOrderClick?.(order);
          }}
          className="bg-[#121212] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all"
        >
          {/* Status Bar + Header */}
          <div className="flex items-center gap-4">
            <div className={`w-2 h-12 md:h-14 rounded-full ${getStatusConfig(order.status).bg}`} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-white text-lg">
                  #{order.id.slice(-4).toUpperCase()}
                </h4>
                <span className={`text-xs font-bold ${getStatusConfig(order.status).color}`}>
                  {getStatusConfig(order.status).label}
                </span>
              </div>
              <p className="text-sm text-white/40 flex items-center gap-2">
                <User size={12} />
                {order.customer.name}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 text-sm text-white/60 pl-6 md:pl-0">
            {/* Items */}
            <div className="flex items-center gap-2">
              <Package size={14} className="text-white/40" />
              <span>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
            </div>
            
            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/40" />
              <span>{formatTime(order.createdAt)}</span>
            </div>
            
            {/* Address (if delivery) */}
            {order.customer.address && (
              <div className="hidden md:flex items-center gap-2 max-w-[200px]">
                <MapPin size={14} className="text-white/40 shrink-0" />
                <span className="truncate">{order.customer.address}</span>
              </div>
            )}
          </div>

          {/* Total + Action */}
          <div className="flex items-center justify-between md:justify-end gap-4 pl-6 md:pl-0">
            <span className="text-lg font-bold text-white">
              {formatCurrency(order.total)}
            </span>
            <button 
              className="w-full md:w-auto bg-white/5 py-3 px-6 rounded-lg font-bold hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                hapticTap();
                onOrderClick?.(order);
              }}
            >
              Detalhes
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="bg-[#121212] p-4 rounded-xl border border-white/5 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-2 h-12 rounded-full bg-white/10" />
            <div className="flex-1">
              <div className="h-5 w-24 bg-white/10 rounded mb-2" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
            <div className="h-10 w-24 bg-white/10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ResponsiveOrderList;
