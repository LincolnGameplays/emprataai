/**
 * ⚡ SOCIAL PROOF TICKER - Living Menu ⚡
 * Shows real-time order activity to create FOMO and urgency
 * 
 * Features:
 * - "Someone just ordered [item]" notifications
 * - "X people viewing this menu" indicator
 * - Animated popups with Framer Motion
 * - Non-intrusive positioning
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Eye, ShoppingBag, TrendingUp, Flame } from 'lucide-react';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface RecentOrder {
  id: string;
  itemName: string;
  neighborhood?: string;
  timestamp: Date;
}

interface SocialProofMessage {
  id: string;
  type: 'order' | 'trending' | 'viewers';
  icon: React.ElementType;
  text: string;
  highlight?: string;
}

// ══════════════════════════════════════════════════════════════════
// MESSAGE TEMPLATES
// ══════════════════════════════════════════════════════════════════

const ORDER_TEMPLATES = [
  (item: string, location: string) => `Alguém ${location ? `em ${location}` : 'por perto'} acabou de pedir ${item}`,
  (item: string) => `🔥 Novo pedido: ${item}`,
  (item: string) => `Alguém garantiu um ${item} agora!`,
];

const TRENDING_TEMPLATES = [
  (item: string, count: number) => `${item} está bombando: ${count} pedidos hoje!`,
  (item: string, count: number) => `🔥 Hit do dia: ${item} (${count}x pedidos)`,
];

const VIEWER_TEMPLATES = [
  (count: number) => `${count} pessoas estão vendo este cardápio`,
  (count: number) => `👀 ${count} clientes navegando agora`,
];

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

interface SocialProofTickerProps {
  restaurantId: string;
  intervalMs?: number;
}

export default function SocialProofTicker({ 
  restaurantId, 
  intervalMs = 20000 // Show new message every 20 seconds
}: SocialProofTickerProps) {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [currentMessage, setCurrentMessage] = useState<SocialProofMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [itemCounts, setItemCounts] = useState<Map<string, number>>(new Map());
  const messageIndexRef = useRef(0);

  // Simulate viewers (8-25 people)
  const simulatedViewers = useRef(Math.floor(Math.random() * 18) + 8);

  // Subscribe to recent orders
  useEffect(() => {
    if (!restaurantId) return;

    // Get orders from last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      where('status', '!=', 'cancelled'),
      orderBy('status'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orders: RecentOrder[] = [];
      const counts = new Map<string, number>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const items = data.items || [];
        
        // Get first item name for display
        if (items.length > 0) {
          const firstItem = items[0];
          orders.push({
            id: doc.id,
            itemName: firstItem.name || 'Item especial',
            neighborhood: data.customer?.address?.neighborhood,
            timestamp: data.createdAt?.toDate?.() || new Date()
          });

          // Count items for trending
          items.forEach((item: any) => {
            const name = item.name || 'Item';
            counts.set(name, (counts.get(name) || 0) + item.quantity);
          });
        }
      });

      setRecentOrders(orders);
      setItemCounts(counts);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  // Cycle through messages
  useEffect(() => {
    const showNextMessage = () => {
      // Don't show if no orders yet
      if (recentOrders.length === 0 && itemCounts.size === 0) {
        setIsVisible(false);
        return;
      }

      const messageType = messageIndexRef.current % 3;
      let message: SocialProofMessage | null = null;

      if (messageType === 0 && recentOrders.length > 0) {
        // Show recent order
        const randomOrder = recentOrders[Math.floor(Math.random() * Math.min(5, recentOrders.length))];
        const template = ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];
        
        message = {
          id: `order-${Date.now()}`,
          type: 'order',
          icon: ShoppingBag,
          text: template(randomOrder.itemName, randomOrder.neighborhood || ''),
          highlight: randomOrder.itemName
        };
      } else if (messageType === 1 && itemCounts.size > 0) {
        // Show trending item
        const entries = Array.from(itemCounts.entries());
        const topItem = entries.sort((a, b) => b[1] - a[1])[0];
        
        if (topItem && topItem[1] >= 2) {
          const template = TRENDING_TEMPLATES[Math.floor(Math.random() * TRENDING_TEMPLATES.length)];
          message = {
            id: `trending-${Date.now()}`,
            type: 'trending',
            icon: Flame,
            text: template(topItem[0], topItem[1]),
            highlight: topItem[0]
          };
        }
      } else {
        // Show viewers count
        // Fluctuate viewers slightly
        simulatedViewers.current = Math.max(5, Math.min(30, 
          simulatedViewers.current + Math.floor(Math.random() * 7) - 3
        ));
        
        const template = VIEWER_TEMPLATES[Math.floor(Math.random() * VIEWER_TEMPLATES.length)];
        message = {
          id: `viewers-${Date.now()}`,
          type: 'viewers',
          icon: Eye,
          text: template(simulatedViewers.current)
        };
      }

      if (message) {
        setCurrentMessage(message);
        setIsVisible(true);

        // Hide after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }

      messageIndexRef.current++;
    };

    // Initial delay
    const initialDelay = setTimeout(() => {
      showNextMessage();
    }, 5000);

    // Show message periodically
    const interval = setInterval(showNextMessage, intervalMs);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [recentOrders, itemCounts, intervalMs]);

  return (
    <AnimatePresence>
      {isVisible && currentMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: -20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: -10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-24 left-4 z-40 max-w-[300px]"
        >
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                currentMessage.type === 'order' ? 'bg-green-500/20' :
                currentMessage.type === 'trending' ? 'bg-orange-500/20' :
                'bg-blue-500/20'
              }`}>
                <currentMessage.icon className={`w-5 h-5 ${
                  currentMessage.type === 'order' ? 'text-green-400' :
                  currentMessage.type === 'trending' ? 'text-orange-400' :
                  'text-blue-400'
                }`} />
              </div>

              {/* Text */}
              <div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {currentMessage.text}
                </p>
                <p className="text-[10px] text-white/30 mt-1">agora mesmo</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════════
// MINI COMPONENT: Viewers Badge (for header)
// ══════════════════════════════════════════════════════════════════

export function ViewersBadge() {
  const [count, setCount] = useState(Math.floor(Math.random() * 15) + 8);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => Math.max(5, Math.min(30, prev + Math.floor(Math.random() * 5) - 2)));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-xs text-white/60">
        {count} online
      </span>
    </div>
  );
}
