import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, PauseCircle, PlayCircle, DollarSign, Package, Share2 } from 'lucide-react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  image?: string;
}

export default function OwnerMenu() {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Busca itens do cardápio
  useEffect(() => {
    const fetchItems = async () => {
      if (!user) return;
      try {
        const itemsRef = collection(db, 'users', user.uid, 'menuItems');
        const snapshot = await getDocs(itemsRef);
        const menuItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItem[];
        setItems(menuItems);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [user]);

  const toggleAvailability = async (item: MenuItem) => {
    if (!user) return;
    const newStatus = !item.available;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'menuItems', item.id), {
        available: newStatus
      });
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, available: newStatus } : i
      ));
      toast.success(newStatus ? "✅ Item Ativado" : "⏸️ Item Pausado (Esgotado)");
    } catch (error) {
      toast.error("Erro ao atualizar item");
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Mock items para demonstração
  const demoItems: MenuItem[] = [
    { id: '1', name: 'X-Bacon Especial', price: 32.90, available: true },
    { id: '2', name: 'Pizza Calabresa', price: 45.00, available: true },
    { id: '3', name: 'Coca-Cola Lata', price: 6.00, available: false },
    { id: '4', name: 'Hambúrguer Artesanal', price: 28.50, available: true },
  ];

  const displayItems = items.length > 0 ? filteredItems : demoItems;

  // ══════════════════════════════════════════════════════════════════
  // SHARE STORE (Viralidade Embutida)
  // ══════════════════════════════════════════════════════════════════
  const handleShareStore = async () => {
    const storeUrl = `https://emprata.ai/menu/${user?.uid}`;
    const shareData = {
      title: 'Peça no meu Delivery Oficial 🍔',
      text: 'Fugimos das taxas altas! Peça por aqui e ganhe entrega grátis no primeiro pedido.',
      url: storeUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Link compartilhado! 🎉");
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(storeUrl);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
       {/* ══════════════════════════════════════════════════════════════════ */}
       {/* VIRAL SHARE BUTTON (Growth Hack) */}
       {/* ══════════════════════════════════════════════════════════════════ */}
       <button 
         onClick={handleShareStore}
         className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/30 hover:from-green-500 hover:to-green-600 transition-all active:scale-[0.98]"
       >
         <Share2 size={20} /> 
         DIVULGAR NO WHATSAPP
       </button>

       {/* Search Bar */}
       <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto para editar..." 
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none transition-colors"
          />
       </div>

       {/* Stats */}
       <div className="flex gap-3">
          <div className="flex-1 bg-[#121212] rounded-xl p-3 border border-white/5">
             <p className="text-white/40 text-xs">Total Itens</p>
             <p className="text-xl font-bold text-white">{displayItems.length}</p>
          </div>
          <div className="flex-1 bg-[#121212] rounded-xl p-3 border border-white/5">
             <p className="text-white/40 text-xs">Disponíveis</p>
             <p className="text-xl font-bold text-green-400">
               {displayItems.filter(i => i.available).length}
             </p>
          </div>
          <div className="flex-1 bg-[#121212] rounded-xl p-3 border border-white/5">
             <p className="text-white/40 text-xs">Esgotados</p>
             <p className="text-xl font-bold text-red-400">
               {displayItems.filter(i => !i.available).length}
             </p>
          </div>
       </div>

       {/* Items List */}
       <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-white/40">
              <Package size={32} className="mx-auto mb-2 animate-pulse" />
              <p>Carregando cardápio...</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Package size={32} className="mx-auto mb-2" />
              <p>Nenhum item encontrado</p>
            </div>
          ) : (
            displayItems.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-[#121212] p-4 rounded-2xl border flex items-center justify-between ${
                  item.available ? 'border-white/5' : 'border-red-500/20 bg-red-900/5'
                }`}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      item.available ? 'bg-white/10' : 'bg-red-500/10'
                    }`}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package size={20} className={item.available ? 'text-white/40' : 'text-red-400'} />
                      )}
                    </div>
                    <div>
                       <h4 className={`font-bold ${item.available ? 'text-white' : 'text-white/50 line-through'}`}>
                         {item.name}
                       </h4>
                       <p className="text-xs text-green-400 font-mono">
                         R$ {item.price.toFixed(2).replace('.', ',')}
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                       <DollarSign size={18} />
                    </button>
                    <button 
                      onClick={() => toggleAvailability(item)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        item.available 
                          ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black' 
                          : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                       {item.available ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                    </button>
                 </div>
              </motion.div>
            ))
          )}
       </div>
    </motion.div>
  );
}
