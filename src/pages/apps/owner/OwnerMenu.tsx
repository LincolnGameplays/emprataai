import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { Trash2, Eye, EyeOff, Plus, Image as ImageIcon, Loader2, Search, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
  imageUrl?: string;
  restaurantId: string;
}

export default function OwnerMenu() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Escuta em Tempo Real (Live)
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'products'), where('restaurantId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
      setLoading(false);
    }, (error) => {
      console.error('[OwnerMenu] Error fetching products:', error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Toggle disponibilidade
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { available: !currentStatus });
      toast.success(currentStatus ? "⏸️ Produto Pausado" : "✅ Produto Ativado");
    } catch (e) {
      console.error('[OwnerMenu] Error updating product:', e);
      toast.error("Erro ao atualizar");
    }
  };

  // Deletar produto
  const deleteProduct = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success("🗑️ Item removido");
      } catch (e) {
        console.error('[OwnerMenu] Error deleting product:', e);
        toast.error("Erro ao remover");
      }
    }
  };

  // Share store link (Growth Hack)
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Viral Share Button (Growth Hack) */}
      <button 
        onClick={handleShareStore}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-green-500/30 hover:from-green-500 hover:to-green-600 transition-all active:scale-[0.98]"
      >
        <Share2 size={20} /> 
        DIVULGAR NO WHATSAPP
      </button>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white">Gerenciar Cardápio</h2>
        <button 
          onClick={() => window.location.href = '/menu-builder'} 
          className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={18}/> Novo
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto..." 
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[#121212] rounded-xl p-3 border border-white/5">
          <p className="text-white/40 text-xs">Total Itens</p>
          <p className="text-xl font-bold text-white">{products.length}</p>
        </div>
        <div className="flex-1 bg-[#121212] rounded-xl p-3 border border-white/5">
          <p className="text-white/40 text-xs">Disponíveis</p>
          <p className="text-xl font-bold text-green-400">
            {products.filter(p => p.available).length}
          </p>
        </div>
        <div className="flex-1 bg-[#121212] rounded-xl p-3 border border-white/5">
          <p className="text-white/40 text-xs">Esgotados</p>
          <p className="text-xl font-bold text-red-400">
            {products.filter(p => !p.available).length}
          </p>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <ImageIcon size={32} className="mx-auto mb-2" />
            <p>{products.length === 0 ? 'Nenhum produto cadastrado.' : 'Nenhum produto encontrado.'}</p>
            {products.length === 0 && (
              <button 
                onClick={() => window.location.href = '/menu-builder'}
                className="mt-4 text-primary underline"
              >
                Adicionar primeiro produto
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((p, i) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-[#121212] p-4 rounded-xl border flex justify-between items-center ${
                p.available ? 'border-white/10' : 'border-red-500/20 bg-red-900/5'
              }`}
            >
              <div className="flex items-center gap-4">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                    <ImageIcon size={16} className="text-white/20"/>
                  </div>
                )}
                <div>
                  <h4 className={`font-bold ${p.available ? 'text-white' : 'text-white/50 line-through'}`}>
                    {p.name}
                  </h4>
                  <p className="text-sm text-white/50">
                    R$ {parseFloat(String(p.price)).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleStatus(p.id, p.available)} 
                  className={`p-2 rounded-lg border transition-colors ${
                    p.available 
                      ? 'border-green-500/20 text-green-500 hover:bg-green-500/10' 
                      : 'border-red-500/20 text-red-500 hover:bg-red-500/10'
                  }`}
                >
                  {p.available ? <Eye size={18}/> : <EyeOff size={18}/>}
                </button>
                <button 
                  onClick={() => deleteProduct(p.id)} 
                  className="p-2 rounded-lg border border-white/5 text-white/40 hover:text-red-400 hover:border-red-500/20 transition-colors"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
