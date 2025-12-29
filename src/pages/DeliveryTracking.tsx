/**
 * ⚡ DELIVERY TRACKING - Premium Order Tracking Experience ⚡
 * AI-powered status updates with engaging copy
 * 
 * Route: /track/:orderId
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Bike, Package, CheckCircle, Clock, MapPin,
  Sparkles, MessageCircle, Phone
} from 'lucide-react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Helmet } from 'react-helmet-async';
import { generateDeliveryUpdate, DeliveryUpdateResponse } from '../services/neuralCore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface Order {
  id: string;
  status: string;
  items: { name: string; quantity: number }[];
  total: number;
  customer: { name: string; phone?: string };
  restaurant?: { name: string; phone?: string };
  createdAt: any;
  deliveryPin?: string;
  driverName?: string;
}

interface TimelineStep {
  id: string;
  status: string;
  label: string;
  icon: React.ElementType;
  completed: boolean;
  current: boolean;
  time?: Date;
}

// ══════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════

const STATUS_ORDER = ['pending', 'preparing', 'ready', 'dispatched', 'delivered'];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  pending: { label: 'Pedido Recebido', icon: Package },
  preparing: { label: 'Em Preparação', icon: ChefHat },
  ready: { label: 'Pronto para Entrega', icon: CheckCircle },
  dispatched: { label: 'Saiu para Entrega', icon: Bike },
  delivered: { label: 'Entregue', icon: CheckCircle }
};

const AI_TIPS = [
  "Dica: Enquanto espera, já separou a bebida gelada? 🧊",
  "Sabia que nosso chef é premiado? Seu prato está em boas mãos! 👨‍🍳",
  "Separe os talheres e guardanapos para aproveitar na hora! 🍴",
  "Que tal preparar aquele suco natural enquanto espera? 🍹",
  "Dica: O prato está mais gostoso quentinho! 🔥"
];

// ══════════════════════════════════════════════════════════════════
// ANIMATED DELIVERY ILLUSTRATION
// ══════════════════════════════════════════════════════════════════

function DeliveryAnimation({ status }: { status: string }) {
  const isMoving = status === 'dispatched';
  
  return (
    <div className="relative h-40 bg-gradient-to-b from-blue-500/10 to-transparent rounded-3xl overflow-hidden">
      {/* Road */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-800">
        <div className="h-1 bg-yellow-500 absolute top-1/2 left-0 right-0 -translate-y-1/2" 
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #EAB308 0, #EAB308 20px, transparent 20px, transparent 40px)'
          }}
        />
      </div>
      
      {/* Bike */}
      <motion.div
        animate={isMoving ? { 
          x: [-20, 280, -20],
        } : { x: 0 }}
        transition={isMoving ? { 
          duration: 4, 
          repeat: Infinity, 
          ease: "linear" 
        } : {}}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className="text-5xl">🛵</div>
      </motion.div>
      
      {/* Buildings */}
      <div className="absolute bottom-8 left-4 text-3xl opacity-40">🏠</div>
      <div className="absolute bottom-8 right-4 text-3xl opacity-40">🏢</div>
      
      {/* Status Text */}
      <div className="absolute top-4 left-0 right-0 text-center">
        <span className="text-sm font-bold text-white/60">
          {isMoving ? '🚀 A caminho!' : '⏳ Aguardando...'}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// AI CHATBOT BUBBLE
// ══════════════════════════════════════════════════════════════════

function AiTipBubble() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % AI_TIPS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/20 to-orange-600/10 border border-primary/30 rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold text-primary uppercase mb-1">Emprata AI</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-white/70"
            >
              {AI_TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function DeliveryTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState<DeliveryUpdateResponse | null>(null);
  const [previousStatus, setPreviousStatus] = useState<string>('');

  // Subscribe to order updates
  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Omit<Order, 'id'>;
        const orderData = { id: snapshot.id, ...data };
        setOrder(orderData);

        // Generate AI message on status change
        if (data.status !== previousStatus && data.items?.length > 0) {
          const itemName = data.items[0].name;
          const update = await generateDeliveryUpdate(
            itemName,
            data.status,
            'nosso chef'
          );
          setAiMessage(update);
          setPreviousStatus(data.status);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId, previousStatus]);

  // Build timeline
  const timeline: TimelineStep[] = STATUS_ORDER.map((status, index) => {
    const currentIndex = order ? STATUS_ORDER.indexOf(order.status) : -1;
    return {
      id: status,
      status,
      label: STATUS_CONFIG[status]?.label || status,
      icon: STATUS_CONFIG[status]?.icon || Package,
      completed: index < currentIndex,
      current: index === currentIndex,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Buscando seu pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">Pedido não encontrado</h1>
          <p className="text-white/60">Verifique o link ou entre em contato com o restaurante.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <Helmet>
        <title>Acompanhar Pedido | Emprata.ai</title>
      </Helmet>

      {/* Header */}
      <header className="bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 p-4 sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Pedido</p>
            <p className="font-black text-lg">#{orderId?.slice(-6).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/60">Ao vivo</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Delivery Animation */}
        <DeliveryAnimation status={order.status} />

        {/* AI Neural Status */}
        {aiMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl text-center"
          >
            <span className="text-4xl mb-4 block">{aiMessage.emoji || '🍔'}</span>
            <p className="text-lg font-bold leading-relaxed">{aiMessage.message}</p>
          </motion.div>
        )}

        {/* Timeline */}
        <div className="relative">
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">
            Acompanhamento
          </h2>
          
          <div className="space-y-0">
            {timeline.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                {/* Icon Column */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    step.completed ? 'bg-green-500/20' :
                    step.current ? 'bg-primary/20 ring-2 ring-primary' :
                    'bg-white/5'
                  }`}>
                    <step.icon className={`w-5 h-5 ${
                      step.completed ? 'text-green-400' :
                      step.current ? 'text-primary' :
                      'text-white/30'
                    }`} />
                  </div>
                  {index < timeline.length - 1 && (
                    <div className={`w-0.5 h-8 ${
                      step.completed ? 'bg-green-500/50' : 'bg-white/10'
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className="pb-6">
                  <p className={`font-bold ${
                    step.completed || step.current ? 'text-white' : 'text-white/40'
                  }`}>
                    {step.label}
                  </p>
                  {step.current && (
                    <p className="text-xs text-primary mt-1">Agora</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Delivery PIN (if dispatched) */}
        {(order.status === 'dispatched' || order.status === 'ready') && order.deliveryPin && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
            <p className="text-xs text-green-400 font-bold uppercase mb-2">Código de Recebimento</p>
            <p className="text-3xl font-black tracking-[0.2em]">{order.deliveryPin}</p>
            <p className="text-xs text-white/50 mt-2">Informe ao entregador</p>
          </div>
        )}

        {/* AI Tips */}
        <AiTipBubble />

        {/* Order Summary */}
        <div className="bg-white/5 rounded-2xl p-4">
          <h3 className="font-bold mb-3">Seu Pedido</h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-black text-primary">
              R$ {order.total.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Contact */}
        <a
          href={`tel:${order.restaurant?.phone || ''}`}
          className="flex items-center justify-center gap-2 py-4 bg-white/5 rounded-2xl text-white/60 hover:bg-white/10 transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span className="text-sm font-bold">Falar com restaurante</span>
        </a>
      </div>
    </div>
  );
}
