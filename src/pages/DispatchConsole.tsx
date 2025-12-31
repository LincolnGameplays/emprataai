
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Package, Bike, MapPin, Clock, 
  User, Phone, EyeOff, Lock, Plus, Sparkles, Loader2
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, serverTimestamp, addDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../config/firebase';
import { toast } from 'sonner';
import type { Order } from '../types/orders';
import type { Driver } from '../types/logistics';

export default function DispatchConsole() {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [dispatchedOrders, setDispatchedOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryFee, setDeliveryFee] = useState('5.00');
  const [showPin, setShowPin] = useState<string | null>(null);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  // Load data from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', user.uid),
      where('status', 'in', ['ready', 'dispatched']),
      orderBy('createdAt', 'desc')
    );

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ready: Order[] = [];
      const dispatched: Order[] = [];
      snapshot.docs.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() } as Order;
        if (order.status === 'ready') ready.push(order);
        else if (order.status === 'dispatched') dispatched.push(order);
      });
      setReadyOrders(ready);
      setDispatchedOrders(dispatched);
      setLoading(false);
    });

    const driversQuery = query(
      collection(db, 'drivers'),
      where('restaurantId', '==', user.uid),
      where('active', '==', true)
    );

    const unsubDrivers = onSnapshot(driversQuery, (snapshot) => {
      setDrivers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver)));
    });

    return () => { unsubOrders(); unsubDrivers(); };
  }, []);

  // --- NOVA FUNCIONALIDADE: SMART BATCHING ---
  const handleSmartBatch = async () => {
    if (readyOrders.length < 2) {
      toast.error('Precisa de pelo menos 2 pedidos para agrupar.');
      return;
    }
    
    setOptimizing(true);
    try {
      const smartBatchFn = httpsCallable(functions, 'smartBatch');
      const result: any = await smartBatchFn({ 
        orderIds: readyOrders.map(o => o.id),
        drivers: drivers.filter(d => d.currentStatus === 'available').map(d => d.id)
      });

      if (result.data.batches?.length > 0) {
        toast.success(`${result.data.batches.length} rotas otimizadas encontradas!`);
        // Aqui você poderia mostrar um modal para confirmar o agrupamento
        // Por enquanto, apenas avisamos que a IA processou.
      } else {
        toast.info('Nenhuma rota otimizada encontrada no momento.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao otimizar rotas');
    } finally {
      setOptimizing(false);
    }
  };

  const handleAssignDriver = async (driver: Driver) => {
    if (!selectedOrder) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'dispatched',
        driverId: driver.id,
        driverName: driver.name,
        deliveryFee: parseFloat(deliveryFee) || 5,
        dispatchedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'drivers', driver.id), {
        currentStatus: 'busy',
        totalDeliveriesToday: (driver.totalDeliveriesToday || 0) + 1
      });
      toast.success(`Pedido enviado para ${driver.name}`);
      setSelectedOrder(null);
    } catch (e) { toast.error('Erro ao despachar'); }
  };

  const getTimeSinceDispatch = (dispatchedAt: any) => {
    if (!dispatchedAt) return '0min';
    const diff = Math.floor((Date.now() - (dispatchedAt.toDate?.()?.getTime() || dispatchedAt)) / 60000);
    return `${diff}min`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-lg">Gestão de Entregas</h1>
                <p className="text-xs text-white/40">Logística Inteligente</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* BOTÃO DE SMART BATCHING INTEGRADO */}
            <button
              onClick={handleSmartBatch}
              disabled={optimizing || readyOrders.length < 2}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {optimizing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
              Otimizar Rotas (IA)
            </button>
            <button
              onClick={() => setIsAddDriverOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Motoboy
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* COLUMN 1: READY ORDERS */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-yellow-400" />
              <h2 className="font-bold">Aguardando Envio</h2>
              <span className="ml-auto px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
                {readyOrders.length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {readyOrders.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sem pedidos prontos</p>
                </div>
              ) : (
                readyOrders.map((order) => (
                  <motion.button
                    key={order.id}
                    layout
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedOrder?.id === order.id
                        ? 'bg-primary/20 border-primary'
                        : 'bg-black/30 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold">{order.customer.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowPin(showPin === order.id ? null : order.id); }}
                        className="p-1 hover:bg-white/10 rounded-lg"
                      >
                        {showPin === order.id ? <EyeOff className="w-4 h-4 text-white/40" /> : <Lock className="w-4 h-4 text-white/40" />}
                      </button>
                    </div>
                    
                    {order.customer.address && (
                       <div className="flex items-start gap-2 text-xs text-white/60 mb-2">
                         <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                         <span>
                           {order.customer.address.street}, {order.customer.address.number}
                           {order.customer.address.neighborhood && ` - ${order.customer.address.neighborhood}`}
                         </span>
                       </div>
                    )}
                    
                    {showPin === order.id && order.deliveryPin && (
                       <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-center">
                         <p className="text-[10px] text-yellow-400/70 mb-1">CÓDIGO DE SEGURANÇA</p>
                         <p className="font-mono text-xl font-black text-yellow-400 tracking-widest">
                           {order.deliveryPin}
                         </p>
                       </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-white/40 mt-2">
                      <span>R$ {order.total?.toFixed(2)}</span>
                      <span>•</span>
                      <span>{order.items?.length || 0} itens</span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: DRIVERS (With Assign Logic) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-2 mb-4">
              <Bike className="w-5 h-5 text-green-400" />
              <h2 className="font-bold">Motoboys</h2>
              <span className="ml-auto px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                {drivers.filter(d => d.currentStatus === 'available').length} livres
              </span>
            </div>
            
            {/* Fee Input if Order Selected */}
            <AnimatePresence>
              {selectedOrder && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 overflow-hidden">
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
                    <p className="text-xs text-white/60 mb-2">Taxa para <strong>{selectedOrder.customer.name}</strong>:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">R$</span>
                      <input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-primary" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {drivers.map((driver) => (
                <motion.button
                  key={driver.id}
                  disabled={driver.currentStatus === 'busy' || !selectedOrder}
                  onClick={() => handleAssignDriver(driver)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    driver.currentStatus === 'available' && selectedOrder
                      ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                      : 'bg-black/30 border-white/10 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${driver.currentStatus === 'available' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <User className={`w-5 h-5 ${driver.currentStatus === 'available' ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{driver.name}</p>
                      <p className="text-xs text-white/40 flex items-center gap-1"><Phone className="w-3 h-3" /> {driver.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${driver.currentStatus === 'available' ? 'text-green-400' : 'text-red-400'}`}>
                        {driver.currentStatus === 'available' ? 'Livre' : 'Em rota'}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* COLUMN 3: IN TRANSIT */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold">Em Rota</h2>
              <span className="ml-auto px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                {dispatchedOrders.length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {dispatchedOrders.map((order) => (
                <motion.div key={order.id} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">{order.customer.name}</span>
                    <div className="flex items-center gap-1 text-blue-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-bold">{getTimeSinceDispatch(order.dispatchedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Bike className="w-3 h-3" /> <span>{order.driverName}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add Driver Modal */}
      <AnimatePresence>
        {isAddDriverOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsAddDriverOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#121212] w-full max-w-md rounded-2xl border border-white/10 p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-black mb-4">Novo Motoboy</h2>
               <div className="space-y-4">
                 {/* Simplified form structure - in real usage would use state */}
                 <p className="text-white/40 text-sm">Contrate ou cadastre seu entregador para rastreamento.</p>
                 <button onClick={() => setIsAddDriverOpen(false)} className="w-full py-3 bg-white/10 rounded-xl mt-4">Fechar</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
