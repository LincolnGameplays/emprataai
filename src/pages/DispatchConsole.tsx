/**
 * ⚡ DISPATCH CONSOLE - Logistics Command Center ⚡
 * Kanban-style order dispatch and driver management
 * 
 * Columns:
 * 1. Aguardando (Ready orders from kitchen)
 * 2. Motoboys Disponíveis (Available drivers)
 * 3. Em Rota (Out for delivery)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Package, Bike, MapPin, Clock, 
  DollarSign, Eye, EyeOff, User, Phone,
  CheckCircle, Plus, RefreshCw, Lock
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, serverTimestamp, addDoc, getDocs
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { toast } from 'sonner';
import type { Order } from '../types/orders';
import type { Driver } from '../types/logistics';

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function DispatchConsole() {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [dispatchedOrders, setDispatchedOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryFee, setDeliveryFee] = useState('5.00');
  const [showPin, setShowPin] = useState<string | null>(null);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Subscribe to ready orders
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
        if (order.status === 'ready') {
          ready.push(order);
        } else if (order.status === 'dispatched') {
          dispatched.push(order);
        }
      });
      
      setReadyOrders(ready);
      setDispatchedOrders(dispatched);
      setLoading(false);
    });

    // Subscribe to drivers
    const driversQuery = query(
      collection(db, 'drivers'),
      where('restaurantId', '==', user.uid),
      where('active', '==', true)
    );

    const unsubDrivers = onSnapshot(driversQuery, (snapshot) => {
      const driverList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[];
      setDrivers(driverList);
    });

    return () => {
      unsubOrders();
      unsubDrivers();
    };
  }, []);

  // Assign order to driver
  const handleAssignDriver = async (driver: Driver) => {
    if (!selectedOrder) return;

    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await updateDoc(orderRef, {
        status: 'dispatched',
        driverId: driver.id,
        driverName: driver.name,
        deliveryFee: parseFloat(deliveryFee) || 5,
        dispatchedAt: serverTimestamp()
      });

      // Update driver status
      const driverRef = doc(db, 'drivers', driver.id);
      await updateDoc(driverRef, {
        currentStatus: 'busy',
        totalDeliveriesToday: (driver.totalDeliveriesToday || 0) + 1
      });

      toast.success(`Pedido atribuído a ${driver.name}!`);
      setSelectedOrder(null);
      setDeliveryFee('5.00');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atribuir pedido');
    }
  };

  // Time since dispatched
  const getTimeSinceDispatch = (dispatchedAt: any) => {
    if (!dispatchedAt) return '0min';
    const now = Date.now();
    const dispatched = dispatchedAt.toDate?.()?.getTime() || dispatchedAt;
    const diff = Math.floor((now - dispatched) / 60000);
    return `${diff}min`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/tools" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-lg">Painel de Expedição</h1>
                <p className="text-xs text-white/40">Logística & Entregadores</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAddDriverOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Motoboy
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ════════════════════════════════════════════════════════════ */}
          {/* COLUMN 1: READY ORDERS */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-yellow-400" />
              <h2 className="font-bold">Aguardando Envio</h2>
              <span className="ml-auto px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {readyOrders.length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum pedido aguardando</p>
                </div>
              ) : (
                readyOrders.map((order) => (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPin(showPin === order.id ? null : order.id);
                        }}
                        className="p-1 hover:bg-white/10 rounded-lg"
                        title="Ver código de segurança"
                      >
                        {showPin === order.id ? (
                          <EyeOff className="w-4 h-4 text-white/40" />
                        ) : (
                          <Lock className="w-4 h-4 text-white/40" />
                        )}
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

                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>R$ {order.total?.toFixed(2)}</span>
                      <span>•</span>
                      <span>{order.items?.length || 0} itens</span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* COLUMN 2: AVAILABLE DRIVERS */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bike className="w-5 h-5 text-green-400" />
              <h2 className="font-bold">Motoboys</h2>
              <span className="ml-auto px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                {drivers.filter(d => d.currentStatus === 'available').length} livres
              </span>
            </div>

            {/* Delivery Fee Input */}
            {selectedOrder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl"
              >
                <p className="text-xs text-white/60 mb-2">Taxa de Entrega para este pedido:</p>
                <div className="flex items-center gap-2">
                  <span className="text-white/60">R$</span>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-bold focus:border-primary focus:outline-none"
                    step="0.50"
                    min="0"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {drivers.length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  <Bike className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum motoboy cadastrado</p>
                </div>
              ) : (
                drivers.map((driver) => (
                  <motion.button
                    key={driver.id}
                    disabled={driver.currentStatus === 'busy' || !selectedOrder}
                    onClick={() => handleAssignDriver(driver)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      driver.currentStatus === 'available' && selectedOrder
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 cursor-pointer'
                        : 'bg-black/30 border-white/10 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        driver.currentStatus === 'available' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        <User className={`w-5 h-5 ${
                          driver.currentStatus === 'available' ? 'text-green-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{driver.name}</p>
                        <p className="text-xs text-white/40 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {driver.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${
                          driver.currentStatus === 'available' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {driver.currentStatus === 'available' ? 'Livre' : 'Ocupado'}
                        </p>
                        <p className="text-xs text-white/40">
                          {driver.totalDeliveriesToday || 0} entregas
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* COLUMN 3: IN TRANSIT */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold">Em Rota</h2>
              <span className="ml-auto px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">
                {dispatchedOrders.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {dispatchedOrders.length === 0 ? (
                <div className="text-center py-8 text-white/30">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma entrega em andamento</p>
                </div>
              ) : (
                dispatchedOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold">{order.customer.name}</span>
                      <div className="flex items-center gap-1 text-blue-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-bold">
                          {getTimeSinceDispatch(order.dispatchedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                      <Bike className="w-3 h-3" />
                      <span>{order.driverName || 'Motoboy'}</span>
                    </div>

                    {order.customer.address && (
                      <div className="flex items-start gap-2 text-xs text-white/40">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{order.customer.address.neighborhood}</span>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ADD DRIVER MODAL */}
      <AnimatePresence>
        {isAddDriverOpen && (
          <AddDriverModal onClose={() => setIsAddDriverOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ADD DRIVER MODAL
// ══════════════════════════════════════════════════════════════════

function AddDriverModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !name.trim() || !phone.trim()) {
      toast.error('Preencha nome e telefone');
      return;
    }

    setLoading(true);
    try {
      // Generate 4-digit PIN
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      await addDoc(collection(db, 'drivers'), {
        restaurantId: user.uid,
        name: name.trim(),
        phone: phone.trim(),
        pixKey: pixKey.trim() || null,
        pin,
        active: true,
        currentStatus: 'available',
        totalDeliveriesToday: 0,
        createdAt: serverTimestamp()
      });

      toast.success(`Motoboy cadastrado! PIN: ${pin}`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

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
        className="bg-[#121212] w-full max-w-md rounded-2xl border border-white/10 p-6"
      >
        <h2 className="text-xl font-black mb-6">Cadastrar Motoboy</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-white/60">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="João Silva"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-white/60">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-white/60">Chave Pix (opcional)</label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, telefone ou email"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-primary focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Salvando...' : 'Cadastrar'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-white/40 hover:text-white text-sm font-bold"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
