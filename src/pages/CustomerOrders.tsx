import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Package, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

export default function CustomerOrders() {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Busca pedidos onde o CPF ou o UID do cliente coincida
    const q = query(
      collection(db, 'orders'),
      where('customer.uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(docs);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <h1 className="text-2xl font-black italic mb-8">Meus <span className="text-primary">Pedidos</span></h1>

      <div className="space-y-4">
        {orders.map(order => (
          <Link 
            key={order.id} 
            to={`/track/${order.id}`} // Link para a página de rastreio existente
            className="block bg-[#121212] border border-white/10 rounded-3xl p-5 hover:border-primary/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Package className="text-primary w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Pedido #{order.id.slice(-5).toUpperCase()}</p>
                  <p className="text-xs text-white/40">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'Data inválida'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {order.status}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <p className="font-black text-lg">{formatCurrency(order.total)}</p>
              <div className="flex items-center text-primary text-xs font-bold gap-1">
                Acompanhar Rastreio <ChevronRight size={14} />
              </div>
            </div>
          </Link>
        ))}
        
        {orders.length === 0 && !loading && (
          <div className="text-center py-10 text-white/40">
             <p>Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
