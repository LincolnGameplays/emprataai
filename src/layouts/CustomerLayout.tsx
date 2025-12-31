import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function CustomerLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  // Monitora pedidos ativos
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'orders'),
      where('customer.uid', '==', user.uid),
      where('status', 'in', ['PENDING', 'PREPARING', 'READY', 'DISPATCHED'])
    );
    const unsub = onSnapshot(q, (snap) => setActiveOrdersCount(snap.size));
    return () => unsub();
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      
      {/* 🖥️ DESKTOP HEADER */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#121212]/90 border-b border-white/5 sticky top-0 z-50">
        <Link to="/delivery" className="text-2xl font-black italic">Emprata.ai</Link>
        <div className="flex gap-6 items-center">
           <Link to="/delivery" className="hover:text-primary font-bold">Início</Link>
           <Link to="/search" className="hover:text-primary font-bold">Buscar</Link>
           <Link to="/me" className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20">
              <User size={16} /> <span className="text-sm font-bold">Perfil</span>
           </Link>
           <button onClick={signOut} title="Sair"><LogOut size={18} className="text-red-400" /></button>
        </div>
      </header>

      {/* 📄 MAIN CONTENT */}
      <main className="flex-1 pb-24 md:pb-0 relative z-0">
        <Outlet />
      </main>

      {/* 📱 MOBILE BOTTOM BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-[#121212] border-t border-white/10 px-6 py-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <Link to="/delivery" className={`flex flex-col items-center gap-1 ${isActive('/delivery') ? 'text-primary' : 'text-white/40'}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold">Início</span>
          </Link>
          
          <Link to="/search" className={`flex flex-col items-center gap-1 ${isActive('/search') ? 'text-primary' : 'text-white/40'}`}>
            <Search size={24} />
            <span className="text-[10px] font-bold">Buscar</span>
          </Link>

          <Link to="/me/orders" className="relative -top-5">
             <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center border-4 border-[#121212] shadow-lg">
                <ShoppingBag size={24} className="text-black" />
             </div>
          </Link>

          <Link to="/restaurants" className={`flex flex-col items-center gap-1 ${isActive('/restaurants') ? 'text-primary' : 'text-white/40'}`}>
            <MapPin size={24} />
            <span className="text-[10px] font-bold">Perto</span>
          </Link>

          <Link to="/me" className={`flex flex-col items-center gap-1 ${isActive('/me') ? 'text-primary' : 'text-white/40'}`}>
            <User size={24} />
            <span className="text-[10px] font-bold">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
