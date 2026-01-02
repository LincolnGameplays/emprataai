/**
 * 👤 ClientProfile - Hub do Cliente
 * 
 * Central onde o cliente vê:
 * - Pedidos em andamento (com rastreamento)
 * - Histórico de pedidos
 * - Ações rápidas (repetir, avaliar)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Package, MapPin, History, ChevronRight, Loader2, RefreshCw, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrderTracker from '../../components/consumer/OrderTracker';
import { formatCurrency } from '../../utils/format';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Order {
  id: string;
  restaurantName?: string;
  restaurantId: string;
  status: string;
  total: number;
  createdAt: any;
  items?: any[];
  customer?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ClientProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuta pedidos em tempo real do cliente logado
  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(
      collection(db, 'orders'),
      where('customer.uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user?.uid]);

  // Filtra pedidos por status
  const activeStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'DISPATCHED', 'READY'];
  const activeOrders = orders.filter(o => activeStatuses.includes(o.status));
  const pastOrders = orders.filter(o => ['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status));

  // Formata data
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-24 text-white font-sans">
      
      {/* ══════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 bg-[#050505]/90 backdrop-blur-lg border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 p-[2px]">
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-full h-full rounded-full object-cover bg-black" alt="Profile" />
              ) : (
                <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center text-lg font-bold">
                  {user?.displayName?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-black">{user?.displayName || 'Cliente'}</h1>
              <p className="text-white/40 text-xs">Meus Pedidos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* ══════════════════════════════════════════════════════════════════
            TABS DE NAVEGAÇÃO
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex bg-[#121212] p-1 rounded-xl mb-6 border border-white/5">
          <TabButton 
            active={activeTab === 'ACTIVE'} 
            onClick={() => setActiveTab('ACTIVE')} 
            label="Em Andamento" 
            count={activeOrders.length} 
          />
          <TabButton 
            active={activeTab === 'HISTORY'} 
            onClick={() => setActiveTab('HISTORY')} 
            label="Histórico" 
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CONTEÚDO DINÂMICO
        ══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === 'ACTIVE' ? (
            <motion.div 
              key="active" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-4"
            >
              {activeOrders.length === 0 ? (
                <EmptyState 
                  title="Nenhum pedido agora" 
                  desc="Que tal pedir algo gostoso?" 
                  btnLabel="Explorar Restaurantes" 
                  onAction={() => navigate('/marketplace')}
                />
              ) : (
                activeOrders.map(order => (
                  <motion.div 
                    key={order.id}
                    layout
                    className="bg-[#121212] rounded-3xl border border-green-500/30 overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.05)]"
                  >
                    {/* Header do Pedido Ativo */}
                    <div className="p-5 border-b border-white/5 flex justify-between items-center bg-green-900/10">
                      <div>
                        <h3 className="font-black text-base">{order.restaurantName || 'Restaurante'}</h3>
                        <p className="text-xs text-green-400 font-bold font-mono">
                          Pedido #{order.id.slice(-5).toUpperCase()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-500 text-black text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                        Ao Vivo
                      </span>
                    </div>
                    
                    {/* O Rastreador Visual */}
                    <div className="p-5">
                      <OrderTracker status={order.status} />
                    </div>

                    {/* Se estiver dispatched, mostra botão de mapa */}
                    {order.status === 'DISPATCHED' && (
                      <div className="p-4 bg-black/50 border-t border-white/5 text-center">
                        <button 
                          onClick={() => navigate(`/tracking/${order.id}`)}
                          className="text-sm font-bold text-white flex items-center justify-center gap-2 hover:text-green-400 transition-colors w-full py-2"
                        >
                          <MapPin size={16} /> Ver Motoboy no Mapa
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-3"
            >
              {pastOrders.length === 0 ? (
                <EmptyState 
                  title="Nenhum pedido ainda" 
                  desc="Seu histórico aparecerá aqui" 
                  btnLabel="Fazer Primeiro Pedido"
                  onAction={() => navigate('/marketplace')}
                />
              ) : (
                pastOrders.map(order => (
                  <motion.div 
                    key={order.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:border-white/15 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:bg-white/10 group-hover:text-white/40 transition-all">
                        <Package size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{order.restaurantName || 'Restaurante'}</h4>
                        <p className="text-[11px] text-white/40">
                          {formatDate(order.createdAt)} • {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        order.status === 'DELIVERED' || order.status === 'COMPLETED'
                          ? 'border-white/10 text-white/40' 
                          : 'border-red-500/20 text-red-400'
                      }`}>
                        {order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'Concluído' : 'Cancelado'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement repeat order
                          navigate(`/menu/${order.restaurantId}`);
                        }}
                        className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function TabButton({ active, onClick, label, count }: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  count?: number;
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all relative ${
        active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="absolute top-2 right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}

function EmptyState({ title, desc, btnLabel, onAction }: { 
  title: string; 
  desc: string; 
  btnLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center py-16 bg-[#121212] rounded-3xl border border-white/5 border-dashed">
      <History size={48} className="mx-auto text-white/10 mb-4" />
      <h3 className="text-white font-bold">{title}</h3>
      <p className="text-white/40 text-sm mb-6">{desc}</p>
      <button 
        onClick={onAction}
        className="px-6 py-2.5 bg-green-500 text-black rounded-xl font-bold text-sm hover:bg-green-400 hover:scale-105 transition-all"
      >
        {btnLabel}
      </button>
    </div>
  );
}
