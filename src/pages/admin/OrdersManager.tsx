import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';
import { CheckCircle, XCircle, Clock, Truck } from 'lucide-react';

export default function OrdersManager() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    // Escuta em tempo real todos os pedidos do restaurante logado
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h2 className="text-2xl font-black italic mb-6 uppercase">Gestão de Pedidos</h2>
      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-[#121212] border border-white/10 p-5 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-xs text-primary font-bold">#{order.id.slice(-5)} - {order.customer.name}</p>
              <p className="font-black text-lg">{formatCurrency(order.total)}</p>
              <p className="text-[10px] text-white/40">Método: {order.paymentMethod} | Status: {order.paymentStatus}</p>
            </div>
            <div className="flex gap-2">
              {order.status === 'pending' && (
                <button onClick={() => updateStatus(order.id, 'PREPARING')} className="bg-blue-500/20 text-blue-400 p-2 rounded-xl border border-blue-500/20"><Clock size={20} /></button>
              )}
              {order.status === 'PREPARING' && (
                <button onClick={() => updateStatus(order.id, 'DELIVERING')} className="bg-orange-500/20 text-orange-400 p-2 rounded-xl border border-orange-500/20"><Truck size={20} /></button>
              )}
              <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="bg-green-500/20 text-green-400 p-2 rounded-xl border border-green-500/20"><CheckCircle size={20} /></button>
              <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="bg-red-500/20 text-red-400 p-2 rounded-xl border border-red-500/20"><XCircle size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
