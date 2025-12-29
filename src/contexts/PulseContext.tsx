/**
 * ⚡ EMPRATA PULSE - Real-time Notification Context ⚡
 * Connects Firestore events to visual/sensory feedback
 * 
 * Features:
 * - Order status change notifications
 * - Vibration for waiters (order ready)
 * - Cash register sound for owners (new order)
 * - Global event bus for cross-component communication
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { toast } from 'sonner';
import type { Order } from '../types/orders';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export type UserRole = 'owner' | 'waiter' | 'driver' | 'customer';

interface PulseEvent {
  type: 'order_ready' | 'new_order' | 'order_delivered' | 'order_cancelled';
  order: Order;
  timestamp: Date;
}

interface PulseContextValue {
  // User context
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  
  // Recent events
  recentEvents: PulseEvent[];
  
  // Active orders count (for badges)
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  
  // Sound control
  soundEnabled: boolean;
  toggleSound: () => void;
  
  // Manual triggers
  playNotificationSound: () => void;
  vibrateDevice: (pattern?: number | number[]) => void;
}

const PulseContext = createContext<PulseContextValue | null>(null);

// ══════════════════════════════════════════════════════════════════
// SOUND UTILITIES
// ══════════════════════════════════════════════════════════════════

// Cash register "cha-ching" sound (base64 encoded short beep as fallback)
const playNewOrderSound = () => {
  try {
    // Create oscillator for a simple pleasant chime
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First note
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 880; // A5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.3);
    
    // Second note (delayed)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 1320; // E6
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc2.start(audioContext.currentTime + 0.15);
    osc2.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not available');
  }
};

const playReadySound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Quick 3-note ascending chime
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const startTime = audioContext.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  } catch (e) {
    console.log('Audio not available');
  }
};

// ══════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ══════════════════════════════════════════════════════════════════

export function PulseProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [recentEvents, setRecentEvents] = useState<PulseEvent[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [preparingCount, setPreparingCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Track previous order statuses to detect changes
  const previousOrdersRef = useRef<Map<string, string>>(new Map());
  const hasInteractedRef = useRef(false);

  // Mark user interaction (required for audio autoplay policy)
  useEffect(() => {
    const markInteraction = () => {
      hasInteractedRef.current = true;
    };
    
    window.addEventListener('click', markInteraction, { once: true });
    window.addEventListener('keydown', markInteraction, { once: true });
    window.addEventListener('touchstart', markInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', markInteraction);
      window.removeEventListener('keydown', markInteraction);
      window.removeEventListener('touchstart', markInteraction);
    };
  }, []);

  // Subscribe to orders
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      let pending = 0;
      let preparing = 0;
      let ready = 0;
      const newEvents: PulseEvent[] = [];

      snapshot.docs.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() } as Order;
        const previousStatus = previousOrdersRef.current.get(order.id);
        
        // Count by status
        if (order.status === 'pending') pending++;
        else if (order.status === 'preparing') preparing++;
        else if (order.status === 'ready') ready++;

        // Detect status changes
        if (previousStatus && previousStatus !== order.status) {
          // Order became ready
          if (order.status === 'ready') {
            newEvents.push({
              type: 'order_ready',
              order,
              timestamp: new Date()
            });

            // Notify waiter
            if (userRole === 'waiter' && hasInteractedRef.current) {
              vibrateDevice(200);
              toast.success(
                `🍽️ Pedido Pronto! Mesa ${order.customer.table || 'N/A'}`,
                { duration: 5000 }
              );
              if (soundEnabled) playReadySound();
            }
          }
        }

        // New order detection (wasn't in previous snapshot)
        if (!previousStatus && order.status === 'pending') {
          newEvents.push({
            type: 'new_order',
            order,
            timestamp: new Date()
          });

          // Notify owner
          if (userRole === 'owner' && hasInteractedRef.current) {
            if (soundEnabled) playNewOrderSound();
            toast.success(
              `💰 Novo Pedido! R$ ${order.total?.toFixed(2)}`,
              { duration: 4000 }
            );
          }
        }

        // Update previous status
        previousOrdersRef.current.set(order.id, order.status);
      });

      setPendingCount(pending);
      setPreparingCount(preparing);
      setReadyCount(ready);

      if (newEvents.length > 0) {
        setRecentEvents(prev => [...newEvents, ...prev].slice(0, 20));
      }
    });

    return () => unsubscribe();
  }, [userRole, soundEnabled]);

  // Utility functions
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const playNotificationSound = useCallback(() => {
    if (hasInteractedRef.current && soundEnabled) {
      playNewOrderSound();
    }
  }, [soundEnabled]);

  const vibrateDevice = useCallback((pattern: number | number[] = 200) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  return (
    <PulseContext.Provider value={{
      userRole,
      setUserRole,
      recentEvents,
      pendingCount,
      preparingCount,
      readyCount,
      soundEnabled,
      toggleSound,
      playNotificationSound,
      vibrateDevice
    }}>
      {children}
    </PulseContext.Provider>
  );
}

// ══════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════

export function usePulse() {
  const context = useContext(PulseContext);
  if (!context) {
    throw new Error('usePulse must be used within a PulseProvider');
  }
  return context;
}

// ══════════════════════════════════════════════════════════════════
// BADGE COMPONENT (for showing counts)
// ══════════════════════════════════════════════════════════════════

interface PulseBadgeProps {
  type: 'pending' | 'preparing' | 'ready';
  className?: string;
}

export function PulseBadge({ type, className = '' }: PulseBadgeProps) {
  const { pendingCount, preparingCount, readyCount } = usePulse();
  
  const count = type === 'pending' ? pendingCount : 
                type === 'preparing' ? preparingCount : readyCount;
  
  if (count === 0) return null;
  
  const colors = {
    pending: 'bg-yellow-500',
    preparing: 'bg-blue-500',
    ready: 'bg-green-500'
  };

  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white ${colors[type]} ${className}`}>
      {count}
    </span>
  );
}
