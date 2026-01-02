/**
 * ⚡ DRIVER PAYOUT - End of Day Settlement ⚡
 * Calculate driver earnings and cash balance
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, User, DollarSign, Package, Wallet, 
  ArrowDownRight, ArrowUpRight, Calculator
} from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import type { Driver } from '../../types/logistics';
import type { Order } from '../../types/orders';

interface DriverPayoutProps {
  driver: Driver;
  onClose: () => void;
}

export default function DriverPayout({ driver, onClose }: DriverPayoutProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load today's delivered orders for this driver
  useEffect(() => {
    const loadOrders = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Get today's start
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const ordersQuery = query(
          collection(db, 'orders'),
          where('driverId', '==', driver.id),
          where('status', '==', 'delivered')
        );

        const snapshot = await getDocs(ordersQuery);
        const orderList = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Order))
          .filter((order) => {
            // Filter for today only
            const orderDate = (order.deliveredAt as any)?.toDate?.() || new Date(0);
            return orderDate >= todayStart;
          });

        setOrders(orderList);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [driver.id]);

  // Calculate totals
  const totalDeliveries = orders.length;
  const totalFees = orders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const cashCollected = orders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0);
  const balance = cashCollected - totalFees;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Fechamento do Dia</h2>
              <p className="text-xs text-white/40">{driver.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-white/40">
              Carregando...
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-white/40 text-xs mb-2">
                    <Package className="w-4 h-4" />
                    Total de Entregas
                  </div>
                  <p className="text-2xl font-black">{totalDeliveries}</p>
                </div>

                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-400 text-xs mb-2">
                    <DollarSign className="w-4 h-4" />
                    Valor a Receber
                  </div>
                  <p className="text-2xl font-black text-green-400">
                    R$ {totalFees.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 col-span-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
                    <Wallet className="w-4 h-4" />
                    Dinheiro Recebido (Cash)
                  </div>
                  <p className="text-2xl font-black text-blue-400">
                    R$ {cashCollected.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Balance Calculation */}
              <div className={`p-5 rounded-xl border ${
                balance > 0 
                  ? 'bg-yellow-500/10 border-yellow-500/30' 
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 text-sm">Saldo Final</span>
                  {balance > 0 ? (
                    <ArrowDownRight className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-green-400" />
                  )}
                </div>

                {balance > 0 ? (
                  <>
                    <p className="text-3xl font-black text-yellow-400">
                      R$ {balance.toFixed(2)}
                    </p>
                    <p className="text-sm text-yellow-400/70 mt-2">
                      💰 O motoboy deve devolver este valor
                    </p>
                  </>
                ) : balance < 0 ? (
                  <>
                    <p className="text-3xl font-black text-green-400">
                      R$ {Math.abs(balance).toFixed(2)}
                    </p>
                    <p className="text-sm text-green-400/70 mt-2">
                      ✅ Você deve pagar este valor ao motoboy
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-black text-white">
                      R$ 0,00
                    </p>
                    <p className="text-sm text-white/50 mt-2">
                      ⚖️ Tudo certo, nada a acertar
                    </p>
                  </>
                )}
              </div>

              {/* Formula Explanation */}
              <div className="text-xs text-white/30 text-center">
                <p>Dinheiro em mãos (R$ {cashCollected.toFixed(2)}) - Taxas devidas (R$ {totalFees.toFixed(2)})</p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
