/**
 * Live Operations - Real-Time Activity Feed
 * 
 * Shows live order activity in an engaging timeline format.
 * Makes the owner feel connected to the business pulse.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { Bell, Clock, ChefHat, Bike, CheckCircle, Package, AlertCircle, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityEvent {
  id: string;
  type: 'NEW' | 'COOK' | 'READY' | 'RIDE' | 'DONE' | 'CANCELLED';
  icon: any;
  color: string;
  bgColor: string;
  message: string;
  amount?: number;
  time: Date | null;
}

const STATUS_CONFIG = {
  'PENDING': { type: 'NEW', icon: Bell, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', verb: 'Novo pedido' },
  'pending': { type: 'NEW', icon: Bell, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', verb: 'Novo pedido' },
  'PREPARING': { type: 'COOK', icon: ChefHat, color: 'text-orange-400', bgColor: 'bg-orange-500/10', verb: 'Cozinha iniciou' },
  'preparing': { type: 'COOK', icon: ChefHat, color: 'text-orange-400', bgColor: 'bg-orange-500/10', verb: 'Cozinha iniciou' },
  'READY': { type: 'READY', icon: Package, color: 'text-blue-400', bgColor: 'bg-blue-500/10', verb: 'Pronto para entrega' },
  'ready': { type: 'READY', icon: Package, color: 'text-blue-400', bgColor: 'bg-blue-500/10', verb: 'Pronto para entrega' },
  'DISPATCHED': { type: 'RIDE', icon: Bike, color: 'text-purple-400', bgColor: 'bg-purple-500/10', verb: 'Saiu para entrega' },
  'dispatched': { type: 'RIDE', icon: Bike, color: 'text-purple-400', bgColor: 'bg-purple-500/10', verb: 'Saiu para entrega' },
  'DELIVERED': { type: 'DONE', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', verb: 'Entrega finalizada!' },
  'delivered': { type: 'DONE', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', verb: 'Entrega finalizada!' },
  'CANCELLED': { type: 'CANCELLED', icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/10', verb: 'Pedido cancelado' },
  'cancelled': { type: 'CANCELLED', icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-500/10', verb: 'Pedido cancelado' }
};

export function LiveOperations() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    setIsListening(true);
    
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(8)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events: ActivityEvent[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const status = data.status || 'PENDING';
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
        
        const customerName = data.customer?.name || 'Cliente';
        const total = Number(data.total) || 0;
        
        let message = `${config.verb}`;
        if (config.type === 'NEW') {
          message = `${config.verb} de ${customerName}`;
        } else if (config.type === 'DONE') {
          message = `${config.verb} +R$ ${total.toFixed(2)}`;
        } else {
          message = `${config.verb}: ${customerName}`;
        }

        return {
          id: doc.id,
          type: config.type as ActivityEvent['type'],
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
          message,
          amount: config.type === 'DONE' ? total : undefined,
          time: data.updatedAt?.toDate() || data.createdAt?.toDate() || null
        };
      });

      setActivities(events);
    }, (error) => {
      console.error('[LiveOperations] Error:', error);
      setIsListening(false);
    });

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, []);

  return (
    <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
          <motion.span 
            animate={isListening ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500' : 'bg-red-500'}`}
          />
          Atividade em Tempo Real
        </h3>
        {activities.length > 0 && (
          <span className="text-[10px] text-white/20 font-bold">
            {activities.length} eventos
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3 flex-1 overflow-y-auto relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => {
            const IconComponent = activity.icon;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 30, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative z-10 flex gap-4 items-start group"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full ${activity.bgColor} border border-white/10 flex items-center justify-center shrink-0 ${activity.color} group-hover:scale-110 transition-transform`}>
                  <IconComponent size={18} />
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-tight truncate">
                    {activity.message}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-white/30 font-medium flex items-center gap-1">
                      <Clock size={10} />
                      {activity.time 
                        ? formatDistanceToNow(activity.time, { locale: ptBR, addSuffix: true }) 
                        : 'Agora'}
                    </p>
                    
                    {activity.amount && (
                      <span className="text-[10px] text-green-400 font-bold flex items-center gap-0.5">
                        <DollarSign size={10} />
                        +{activity.amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {activities.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bell size={32} className="mx-auto mb-3 text-white/10" />
            <p className="text-white/30 text-sm font-medium">Silêncio na operação...</p>
            <p className="text-white/15 text-xs mt-1">Os eventos aparecerão aqui em tempo real</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
