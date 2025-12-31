
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, CheckCircle, Flame, Timer, UtensilsCrossed, Bell, Printer, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThermalReceipt } from '../components/kds/ThermalReceipt';

interface KitchenOrder {
  id: string;
  items: any[];
  status: string;
  customer: { name: string; phone?: string };
  deliveryType?: string; 
  tableNumber?: string;
  createdAt: any;
  notes?: string;
  source?: string;
  displayId?: string;
  restaurantId?: string;
  total?: number;
  financials?: { total: number };
  paymentStatus?: string;
}

export default function KitchenDisplay() {
  const [newOrders, setNewOrders] = useState<KitchenOrder[]>([]);
  const [prepOrders, setPrepOrders] = useState<KitchenOrder[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [printingOrder, setPrintingOrder] = useState<KitchenOrder | null>(null);
  
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const isFirstLoad = useRef(true);
  const previousOrderCount = useRef(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // QUERY ABRANGENTE: Pega maiúsculo e minúsculo
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', user.uid),
      where('status', 'in', ['PENDING', 'pending', 'PREPARING', 'preparing', 'READY', 'ready']),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const pending: KitchenOrder[] = [];
      const preparing: KitchenOrder[] = [];

      snap.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() } as KitchenOrder;
        const s = data.status?.toUpperCase();
        
        if (s === 'PENDING') pending.push(data);
        else if (s === 'PREPARING') preparing.push(data);
      });

      // Tocar som se chegou pedido novo (e não é a primeira carga da página)
      if (!isFirstLoad.current && pending.length > previousOrderCount.current) {
        audioRef.current.play().catch(() => {});
        toast.info("🔔 Novo pedido na cozinha!");
      }

      previousOrderCount.current = pending.length;
      setNewOrders(pending);
      setPrepOrders(preparing);
      isFirstLoad.current = false;
    });

    return () => unsub();
  }, []);

  const updateStatus = async (orderId: string, newStatus: 'PREPARING' | 'READY') => {
    setLoadingAction(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: newStatus,
        ...(newStatus === 'READY' ? { kitchenFinishedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp()
      });
      
      if (newStatus === 'READY') {
        toast.success("Pedido enviado para expedição!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar. Tente novamente.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePrint = (order: KitchenOrder) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 500);
  };

  const getElapsedTime = (date: any) => {
    if (!date) return '0m';
    const start = date.toDate ? date.toDate().getTime() : new Date(date).getTime();
    const mins = Math.floor((Date.now() - start) / 60000);
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-[#101010] text-white p-4">
      {/* Área de Impressão (Oculta na tela, visível na impressão) */}
      {printingOrder && (
        <div className="hidden print:block fixed top-0 left-0 bg-white text-black w-full h-full z-[9999]">
           <ThermalReceipt order={printingOrder} />
        </div>
      )}

      {/* HEADER */}
      <header className="flex items-center justify-between mb-6 p-4 bg-[#1a1a1a] rounded-2xl border border-white/5 shadow-xl print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/20">
            <ChefHat size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
              Cozinha <span className="text-orange-500">Inteligente</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/40">V2.0</span>
            </h1>
            <p className="text-xs text-white/40 font-bold flex items-center gap-1">
              <Volume2 size={10} /> Sistema de som ativo
            </p>
          </div>
        </div>
        <div className="flex gap-4">
            <div className="text-center">
                <span className="block text-3xl font-black text-white">{newOrders.length}</span>
                <span className="text-[10px] text-white/40 uppercase font-bold">A Fazer</span>
            </div>
            <div className="w-px bg-white/10"></div>
            <div className="text-center">
                <span className="block text-3xl font-black text-orange-500">{prepOrders.length}</span>
                <span className="text-[10px] text-orange-500/60 uppercase font-bold">No Fogo</span>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)] print:hidden">
        
        {/* COLUNA 1: NOVOS PEDIDOS (PENDING) */}
        <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-4 flex flex-col shadow-inner">
          <h2 className="text-sm font-black uppercase mb-4 flex items-center gap-2 text-white/60 tracking-widest">
            <Bell className="w-4 h-4 text-blue-500" /> Fila de Pedidos
          </h2>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            <AnimatePresence mode="popLayout">
              {newOrders.length === 0 && (
                <div className="text-center py-20 opacity-30">
                  <UtensilsCrossed size={48} className="mx-auto mb-4"/>
                  <p>Tudo limpo por aqui, Chef!</p>
                </div>
              )}
              {newOrders.map(order => (
                <motion.div 
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-[#18181b] p-0 rounded-xl border border-white/5 overflow-hidden group hover:border-blue-500/50 transition-all relative"
                >
                  {/* ✅ INDICADOR DE PAGAMENTO PIX */}
                  {order.paymentStatus === 'PAID' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-black text-[10px] font-black px-2 py-1 rounded shadow-lg animate-bounce z-20">
                      💳 PAGO (PIX)
                    </div>
                  )}
                  <div className="p-4 flex justify-between items-start bg-gradient-to-r from-blue-500/5 to-transparent">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-white">{order.customer.name}</h3>
                        <span className="text-[10px] font-mono text-white/30">#{order.id.slice(-4)}</span>
                      </div>
                      <div className="flex gap-2">
                        {order.deliveryType === 'DINE_IN' ? (
                           <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                             Mesa {order.tableNumber}
                           </span>
                        ) : (
                           <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                             {order.source || 'Delivery'}
                           </span>
                        )}
                        <span className="bg-white/5 text-white/60 text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                          <Timer size={10} /> {getElapsedTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePrint(order)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
                        title="Imprimir Ticket"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'PREPARING')}
                        disabled={loadingAction === order.id}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {loadingAction === order.id ? '...' : 'Iniciar'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 border-t border-white/5 bg-black/20">
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="font-black text-blue-400 bg-blue-400/10 px-1.5 rounded text-sm">{item.quantity}x</span>
                          <div>
                            <span className="text-sm font-medium text-white/90 block">{item.name}</span>
                            {item.notes && <span className="text-xs text-red-400 font-bold block mt-0.5">⚠️ {item.notes}</span>}
                            {item.options && item.options.length > 0 && (
                                <span className="text-[10px] text-white/40 block">
                                  + {item.options.map((o:any) => o.name).join(', ')}
                                </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {order.notes && (
                        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-200">
                           📝 {order.notes}
                        </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUNA 2: EM PREPARO (PREPARING) */}
        <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-4 flex flex-col shadow-inner">
          <h2 className="text-sm font-black uppercase mb-4 flex items-center gap-2 text-white/60 tracking-widest">
            <Flame className="w-4 h-4 text-orange-500" /> Em Preparo
          </h2>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            <AnimatePresence mode="popLayout">
              {prepOrders.map(order => (
                <motion.div 
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="bg-[#18181b] rounded-xl border-l-4 border-orange-500 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                     <Flame size={100} />
                  </div>

                  <div className="p-5 flex justify-between items-start relative z-10">
                    <div>
                      <h3 className="font-bold text-xl text-white mb-1">{order.customer.name}</h3>
                      <div className="flex items-center gap-2">
                          <span className="text-orange-500 text-xs font-bold uppercase flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded">
                             <Clock size={12} /> {getElapsedTime(order.createdAt)}
                          </span>
                          <span className="text-white/30 text-xs font-mono">
                             {order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} itens
                          </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePrint(order)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition-colors"
                        title="Imprimir Ticket"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'READY')}
                        disabled={loadingAction === order.id}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-green-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                      >
                        {loadingAction === order.id ? <Timer className="animate-spin"/> : <CheckCircle size={18} />}
                        <span>Pronto</span>
                      </button>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                     <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                           <span key={idx} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-medium text-white/80">
                              <span className="text-orange-500 font-bold mr-1">{item.quantity}x</span> {item.name}
                           </span>
                        ))}
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
