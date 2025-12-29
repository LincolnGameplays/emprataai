/**
 * Kitchen Display System (KDS)
 * Real-time order management for kitchen staff
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, ChefHat, CheckCircle, AlertTriangle, 
  Volume2, VolumeX, RefreshCw, Users, Package,
  Flame, ChevronRight
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc,
  doc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Order, OrderStatus } from '../types/orders';
import VoiceControl from '../components/kds/VoiceControl';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ══════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/50', label: 'PENDENTE' },
  preparing: { color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/50', label: 'PREPARANDO' },
  ready: { color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/50', label: 'PRONTO' },
  dispatched: { color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/50', label: 'ENVIADO' },
  delivered: { color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/50', label: 'ENTREGUE' },
  billing_requested: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/50', label: '💳 CONTA' },
  closed: { color: 'text-gray-600', bg: 'bg-gray-800/50 border-gray-600/50', label: 'FECHADO' },
  cancelled: { color: 'text-gray-600', bg: 'bg-gray-800/50 border-gray-600/50', label: 'CANCELADO' }
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered'];

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

function getTimeAgo(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

function getMinutesSince(timestamp: any): number {
  if (!timestamp) return 0;
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

// ══════════════════════════════════════════════════════════════════
// PRODUCTION SUMMARY COMPONENT
// ══════════════════════════════════════════════════════════════════

interface ProductionSummaryProps {
  orders: Order[];
}

function ProductionSummary({ orders }: ProductionSummaryProps) {
  // Aggregate items from pending and preparing orders
  const aggregatedItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; quantity: number; image?: string }>();
    
    orders
      .filter(o => o.status === 'pending' || o.status === 'preparing')
      .forEach(order => {
        order.items.forEach(item => {
          const existing = itemMap.get(item.name);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            itemMap.set(item.name, {
              name: item.name,
              quantity: item.quantity,
              image: item.image
            });
          }
        });
      });
    
    // Sort by quantity (highest first)
    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  if (aggregatedItems.length === 0) return null;

  const totalItems = aggregatedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/30 rounded-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h3 className="font-black text-sm uppercase">Resumo da Chapa</h3>
          <p className="text-[10px] text-white/40">{totalItems} itens na fila</p>
        </div>
      </div>

      {/* Aggregated Items */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {aggregatedItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 bg-black/30 rounded-xl"
          >
            {/* Quantity Badge */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
              item.quantity >= 5 ? 'bg-red-500/30 text-red-400' :
              item.quantity >= 3 ? 'bg-yellow-500/30 text-yellow-400' :
              'bg-white/10 text-white'
            }`}>
              {item.quantity}x
            </div>
            
            {/* Item Name */}
            <span className="font-bold text-sm flex-1 truncate">{item.name}</span>
            
            {/* Priority Indicator */}
            {item.quantity >= 5 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase">
                Urgente
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer Tip */}
      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <p className="text-[10px] text-white/30">
          💡 Produza em lote para maior eficiência
        </p>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ORDER CARD COMPONENT
// ══════════════════════════════════════════════════════════════════

interface OrderCardProps {
  order: Order;
  onAdvanceStatus: () => void;
  onShowDetails: () => void;
}

function OrderCard({ order, onAdvanceStatus, onShowDetails }: OrderCardProps) {
  const config = STATUS_CONFIG[order.status];
  const minutes = getMinutesSince(order.createdAt);
  const isBillingRequested = order.status === 'billing_requested';

  // Delay-based border colors
  const getDelayBorder = () => {
    if (order.status === 'delivered' || order.status === 'closed') return '';
    if (minutes > 20) return 'border-red-500 ring-2 ring-red-500/50 animate-pulse';
    if (minutes > 10) return 'border-yellow-500';
    return 'border-green-500';
  };

  // Call waiter handler
  const handleCallWaiter = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`🔔 [WAITER CALL] Pedido #${order.id?.slice(-4).toUpperCase()} está PRONTO para entrega na Mesa ${order.customer?.table || 'N/A'}`);
    alert(`Garçom notificado! Pedido #${order.id?.slice(-4).toUpperCase()} pronto para entrega.`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        ${config.bg} border-2 rounded-2xl p-4 cursor-pointer select-none
        ${getDelayBorder()}
        ${isBillingRequested ? 'ring-2 ring-red-500/50' : ''}
        hover:scale-[1.02] transition-transform
      `}
      onClick={onAdvanceStatus}
      onDoubleClick={onShowDetails}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-white">
            #{order.id?.slice(-4).toUpperCase() || '?'}
          </span>
          {order.customer?.table && (
            <span className="px-2 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase">
              Mesa {order.customer.table}
            </span>
          )}
        </div>
        <span className={`text-xs font-black uppercase ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Customer */}
      <div className="flex items-center gap-2 mb-3 text-white/60">
        <Users className="w-4 h-4" />
        <span className="text-sm font-bold truncate">
          {order.customer?.name || 'Anônimo'}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items.slice(0, 4).map((item, i) => (
          <div 
            key={i} 
            className="flex justify-between text-sm"
          >
            <span className="font-bold text-white">
              {item.quantity}x {item.name}
            </span>
            {item.notes && (
              <span className="text-yellow-400 text-xs">⚠️</span>
            )}
          </div>
        ))}
        {order.items.length > 4 && (
          <span className="text-xs text-white/40">
            +{order.items.length - 4} mais...
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className={`flex items-center gap-1 text-xs font-bold ${
          minutes > 20 ? 'text-red-400' : minutes > 10 ? 'text-yellow-400' : 'text-green-400'
        }`}>
          <Clock className="w-3 h-3" />
          {minutes} min
        </div>
        <span className="text-lg font-black text-primary">
          R$ {order.total.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {/* Call Waiter Button (only for ready orders) */}
      {order.status === 'ready' && (
        <button
          onClick={handleCallWaiter}
          className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-sm font-black uppercase tracking-wider transition-colors"
        >
          🔔 Chamar Garçom
        </button>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function KitchenDisplay() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to real-time orders
  useEffect(() => {
    if (!restaurantId) return;

    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      where('status', 'in', ['pending', 'preparing', 'ready', 'billing_requested']),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders: Order[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Order));

      // Play sound for new pending orders
      const prevPendingCount = orders.filter(o => o.status === 'pending').length;
      const newPendingCount = newOrders.filter(o => o.status === 'pending').length;
      
      if (newPendingCount > prevPendingCount && soundEnabled) {
        playNotificationSound();
      }

      setOrders(newOrders);
    });

    return () => unsubscribe();
  }, [restaurantId, soundEnabled]);

  // Notification sound (simple beep)
  const playNotificationSound = () => {
    try {
      audioRef.current?.play();
    } catch (e) {
      console.log('Audio play blocked');
    }
  };

  // Advance order status
  const advanceStatus = async (order: Order) => {
    const currentIndex = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number]);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return;

    const nextStatus = STATUS_FLOW[currentIndex + 1];
    
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus,
        updatedAt: Timestamp.now(),
        ...(nextStatus === 'delivered' && { completedAt: Timestamp.now() })
      });
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // Filter orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const billingOrders = orders.filter(o => o.status === 'billing_requested');

  // Voice command handler (unified interface)
  const handleVoiceCommand = async (command: string, value: string) => {
    if (command === 'ready') {
      // Find order by number (last 2-4 digits of ID or orderNumber)
      const order = orders.find(o => 
        o.id?.slice(-4).toUpperCase().includes(value.toUpperCase()) ||
        o.id?.slice(-2) === value ||
        String(o.id).includes(value)
      );
      
      if (order) {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'ready',
          updatedAt: Timestamp.now()
        });
      } else {
        toast.error(`Pedido ${value} não encontrado`);
      }
    } else if (command === 'call_waiter') {
      toast.success('🔔 Garçom foi notificado!', { duration: 3000 });
      console.log('[VOICE] Waiter called from KDS');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      {/* Audio element for notifications */}
      <audio 
        ref={audioRef} 
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleCADB3qO3+ug"
        preload="auto"
      />

      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ChefHat className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Cozinha
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Kitchen Display System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Billing Alert */}
          {billingOrders.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500 rounded-xl animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-bold text-red-400">
                {billingOrders.length} Conta(s) Pedida(s)
              </span>
            </div>
          )}

          {/* Toggle Summary */}
          <button 
            onClick={() => setShowSummary(!showSummary)}
            className={`p-3 rounded-xl transition-colors ${showSummary ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10'}`}
            title="Resumo da Produção"
          >
            <Package className="w-6 h-6" />
          </button>

          {/* Sound Toggle */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl transition-colors ${soundEnabled ? 'bg-primary' : 'bg-white/10'}`}
          >
            {soundEnabled ? (
              <Volume2 className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </button>

          {/* Refresh */}
          <button 
            onClick={() => window.location.reload()}
            className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Billing Requested Priority Section */}
      {billingOrders.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            CONTAS PEDIDAS - PRIORIDADE
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {billingOrders.map(order => (
                <OrderCard 
                  key={order.id}
                  order={order}
                  onAdvanceStatus={() => advanceStatus(order)}
                  onShowDetails={() => setSelectedOrder(order)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Main Layout with Production Summary */}
      <div className="flex gap-6">
        {/* Production Summary Sidebar */}
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 280 }}
              exit={{ opacity: 0, width: 0 }}
              className="hidden lg:block shrink-0"
            >
              <ProductionSummary orders={orders} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban Columns */}
        <div className="flex-1 grid md:grid-cols-3 gap-6">
          {/* Pending Column */}
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-yellow-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              PENDENTES ({pendingOrders.length})
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {pendingOrders.map(order => (
                  <OrderCard 
                    key={order.id}
                    order={order}
                    onAdvanceStatus={() => advanceStatus(order)}
                    onShowDetails={() => setSelectedOrder(order)}
                  />
                ))}
              </AnimatePresence>
              {pendingOrders.length === 0 && (
                <div className="text-center py-12 text-white/20">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-bold">Nenhum pendente</p>
                </div>
              )}
            </div>
          </section>

          {/* Preparing Column */}
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              PREPARANDO ({preparingOrders.length})
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {preparingOrders.map(order => (
                  <OrderCard 
                    key={order.id}
                    order={order}
                    onAdvanceStatus={() => advanceStatus(order)}
                    onShowDetails={() => setSelectedOrder(order)}
                  />
                ))}
              </AnimatePresence>
              {preparingOrders.length === 0 && (
                <div className="text-center py-12 text-white/20">
                  <ChefHat className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-bold">Nenhum em preparo</p>
                </div>
              )}
            </div>
          </section>

          {/* Ready Column */}
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              PRONTOS ({readyOrders.length})
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {readyOrders.map(order => (
                  <OrderCard 
                    key={order.id}
                    order={order}
                    onAdvanceStatus={() => advanceStatus(order)}
                    onShowDetails={() => setSelectedOrder(order)}
                  />
                ))}
              </AnimatePresence>
              {readyOrders.length === 0 && (
                <div className="text-center py-12 text-white/20">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm font-bold">Nenhum pronto</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-3xl p-8 max-w-md w-full border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-3xl font-black mb-4">
                Pedido #{selectedOrder.id?.slice(-4).toUpperCase()}
              </h3>
              
              <div className="mb-4 p-4 bg-white/5 rounded-xl">
                <p className="font-bold">{selectedOrder.customer?.name}</p>
                <p className="text-white/40 text-sm">CPF: {selectedOrder.customer?.cpf}</p>
                {selectedOrder.customer?.table && (
                  <p className="text-white/40 text-sm">Mesa: {selectedOrder.customer.table}</p>
                )}
              </div>

              <div className="space-y-2 mb-6">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between p-3 bg-white/5 rounded-xl">
                    <div>
                      <span className="font-bold">{item.quantity}x {item.name}</span>
                      {item.notes && (
                        <p className="text-xs text-yellow-400">⚠️ {item.notes}</p>
                      )}
                    </div>
                    <span className="text-primary font-bold">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-4 bg-primary/20 rounded-xl">
                <span className="font-bold">TOTAL</span>
                <span className="text-2xl font-black text-primary">
                  R$ {selectedOrder.total.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Control */}
      <VoiceControl onCommand={handleVoiceCommand} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// VOICE CONTROL WRAPPER
// ══════════════════════════════════════════════════════════════════

function KitchenDisplayWithVoice() {
  return <KitchenDisplayContent />;
}

function KitchenDisplayContent() {
  // Get orders from parent or use hook
  return <KitchenDisplay />;
}

