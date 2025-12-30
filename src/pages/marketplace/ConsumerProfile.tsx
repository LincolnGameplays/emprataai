/**
 * ⚡ CONSUMER PROFILE - Order History & Account ⚡
 * User profile page for marketplace consumers
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  User, MapPin, Package, Tag, ChevronRight, 
  Plus, Home, Briefcase, Star, Clock, RefreshCw,
  Coins, LogOut, Loader2
} from 'lucide-react';
import { collection, query, where, orderBy, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import type { Order } from '../../types/orders';
import type { Address, Coupon } from '../../types/user';

// ══════════════════════════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════════════════════════

type Tab = 'orders' | 'addresses' | 'coupons';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'orders', label: 'Pedidos', icon: <Package className="w-5 h-5" /> },
  { id: 'addresses', label: 'Endereços', icon: <MapPin className="w-5 h-5" /> },
  { id: 'coupons', label: 'Cupons', icon: <Tag className="w-5 h-5" /> },
];

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function ConsumerProfile() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [emprataCoins, setEmprataCoins] = useState(0);

  // Load user data
  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to user document for consumer data
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const data = snapshot.data();
      if (data?.consumer) {
        setAddresses(data.consumer.savedAddresses || []);
        setCoupons(data.consumer.coupons || []);
        setEmprataCoins(data.consumer.emprataCoins || 0);
      }
    });

    // Load orders
    const loadOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('consumerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      } catch (e) {
        console.log('Error loading orders:', e);
      }
      setLoading(false);
    };

    loadOrders();
    return () => unsubUser();
  }, [user?.uid]);

  const labelIcons = {
    casa: <Home className="w-4 h-4" />,
    trabalho: <Briefcase className="w-4 h-4" />,
    outro: <MapPin className="w-4 h-4" />,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    preparing: 'bg-blue-500/20 text-blue-400',
    ready: 'bg-purple-500/20 text-purple-400',
    dispatched: 'bg-primary/20 text-primary',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Aguardando',
    preparing: 'Preparando',
    ready: 'Pronto',
    dispatched: 'A caminho',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Header */}
      <header className="bg-gradient-to-b from-primary/20 to-transparent pt-12 pb-8 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white/50" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-black">{user?.displayName || 'Consumidor'}</h1>
              <p className="text-sm text-white/40">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Emprata Coins */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/30 rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-black text-yellow-400">{emprataCoins}</p>
              <p className="text-xs text-white/50">Emprata Coins</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">Equivale a</p>
              <p className="text-sm font-bold text-yellow-400">R$ {(emprataCoins * 0.10).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">Nenhum pedido ainda</p>
                    <Link 
                      to="/marketplace" 
                      className="mt-4 inline-block px-6 py-3 bg-primary rounded-full font-bold hover:bg-orange-600 transition-colors"
                    >
                      Explorar Restaurantes
                    </Link>
                  </div>
                ) : (
                  orders.map(order => (
                    <div
                      key={order.id}
                      className="bg-white/5 border border-white/5 rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {order.restaurant?.logoUrl && (
                            <img 
                              src={order.restaurant.logoUrl} 
                              alt="" 
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                          )}
                          <div>
                            <p className="font-bold">{order.restaurant?.name || 'Restaurante'}</p>
                            <p className="text-xs text-white/40">
                              {order.items?.length} itens • R$ {order.total?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${statusColors[order.status] || 'bg-white/10'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Clock className="w-3 h-3" />
                          {order.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || 'Recente'}
                        </div>
                        
                        <button className="flex items-center gap-1 text-primary text-sm font-bold hover:underline">
                          <RefreshCw className="w-4 h-4" />
                          Pedir de Novo
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/50">
                      {labelIcons[addr.label] || <MapPin className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold capitalize">{addr.label}</p>
                      <p className="text-sm text-white/40">
                        {addr.street}, {addr.number}
                        {addr.complement && ` - ${addr.complement}`}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20" />
                  </div>
                ))}

                <button className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-2xl text-white/50 hover:text-white hover:border-white/20 transition-colors">
                  <Plus className="w-5 h-5" />
                  Adicionar Endereço
                </button>
              </motion.div>
            )}

            {/* COUPONS TAB */}
            {activeTab === 'coupons' && (
              <motion.div
                key="coupons"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {coupons.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">Nenhum cupom disponível</p>
                    <p className="text-sm text-white/30 mt-2">
                      Continue pedindo para ganhar cupons!
                    </p>
                  </div>
                ) : (
                  coupons.map(coupon => (
                    <div
                      key={coupon.id}
                      className="bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <Tag className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-primary">
                          {coupon.type === 'percentage' && `${coupon.value}% OFF`}
                          {coupon.type === 'fixed' && `R$ ${coupon.value} OFF`}
                          {coupon.type === 'delivery_free' && 'FRETE GRÁTIS'}
                        </p>
                        <p className="text-xs text-white/40">
                          Código: <span className="font-mono font-bold text-white">{coupon.code}</span>
                        </p>
                      </div>
                      {coupon.minOrder && (
                        <p className="text-xs text-white/30">
                          Mín. R$ {coupon.minOrder}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
