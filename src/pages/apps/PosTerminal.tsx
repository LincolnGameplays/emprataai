/**
 * POS Terminal - Unified Counter/Phone Orders
 * 
 * Interface optimized for horizontal screens (PC/Tablet).
 * Orders go to the same production queue (KDS) as online orders.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Minus, CreditCard, Banknote, Trash2, 
  Printer, QrCode, User, Package, Loader2, Smartphone
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/format';

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
  trackStock?: boolean;
  category?: string;
  imageUrl?: string;
}

interface CartItem extends Product {
  quantity: number;
}

type PaymentMethod = 'CARD' | 'CASH' | 'PIX';

export default function PosTerminal() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Load products in real-time
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'products'), 
      where('restaurantId', '==', auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(items);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category || 'Geral'))];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || (p.category || 'Geral') === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Add to cart
  const addToCart = useCallback((product: Product) => {
    // Check stock
    if (product.trackStock && product.stock !== undefined) {
      const cartItem = cart.find(c => c.id === product.id);
      const cartQty = cartItem?.quantity || 0;
      if (cartQty >= product.stock) {
        toast.error(`Estoque máximo: ${product.stock}`);
        return;
      }
    }

    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => 
          p.id === product.id 
            ? { ...p, quantity: p.quantity + 1 } 
            : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // Audio feedback
    new Audio('/sounds/beep.mp3').play().catch(() => {});
  }, [cart]);

  // Update quantity
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      
      // Stock check
      if (item.trackStock && item.stock !== undefined && newQty > item.stock) {
        toast.error(`Estoque máximo: ${item.stock}`);
        return item;
      }
      
      return { ...item, quantity: newQty };
    }).filter(item => item.quantity > 0));
  };

  // Remove from cart
  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Calculate total
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Finalize order
  const finalizeOrder = async (method: PaymentMethod) => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }
    
    setProcessing(true);
    
    try {
      const orderData = {
        restaurantId: auth.currentUser?.uid,
        source: 'POS', // Identifies as counter order
        customer: { 
          name: customerName || 'Cliente Balcão', 
          uid: 'walk-in' 
        },
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total,
        status: 'PREPARING', // Goes directly to kitchen (KDS)
        paymentMethod: method,
        paymentStatus: 'paid',
        isPaid: true, // Already paid at counter
        createdAt: serverTimestamp(),
        deliveryPin: Math.floor(1000 + Math.random() * 9000).toString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      toast.success("✅ Pedido enviado para cozinha!", {
        description: `Total: ${formatCurrency(total)}`
      });
      
      // Reset
      setCart([]);
      setCustomerName('');
      
    } catch (error) {
      console.error('[POS] Order error:', error);
      toast.error("Erro ao criar pedido");
    } finally {
      setProcessing(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        document.getElementById('pos-search')?.focus();
      }
      if (e.key === 'F4' && cart.length > 0) {
        finalizeOrder('CARD');
      }
      if (e.key === 'F5' && cart.length > 0) {
        finalizeOrder('CASH');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  if (loading) {
    return (
      <div className="h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden">
      {/* LEFT: PRODUCT CATALOG */}
      <div className="flex-1 flex flex-col border-r border-white/10">
        {/* Search Bar */}
        <div className="p-4 bg-[#1a1a1a] border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input 
              id="pos-search"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto (F2)..."
              className="w-full bg-[#0a0a0a] p-4 pl-12 rounded-xl text-lg font-bold border border-white/10 focus:border-primary outline-none transition-colors"
            />
          </div>
          
          {/* Categories */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                !activeCategory 
                  ? 'bg-primary text-black' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-primary text-black' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => {
              const isLowStock = product.trackStock && product.stock !== undefined && product.stock < 5;
              const isOutOfStock = product.trackStock && product.stock === 0;
              
              return (
                <motion.button 
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  disabled={isOutOfStock}
                  className={`bg-[#1a1a1a] p-4 rounded-xl border transition-all text-left group relative overflow-hidden ${
                    isOutOfStock 
                      ? 'border-red-500/30 opacity-50 cursor-not-allowed' 
                      : 'border-white/5 hover:border-primary/50'
                  }`}
                >
                  {product.imageUrl && (
                    <div className="absolute inset-0 opacity-10">
                      <img src={product.imageUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <h3 className="font-bold truncate text-sm">{product.name}</h3>
                    <p className="text-primary font-mono font-bold mt-2 text-lg">
                      {formatCurrency(product.price)}
                    </p>
                    
                    {product.trackStock && (
                      <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${
                        isOutOfStock ? 'text-red-400' : isLowStock ? 'text-yellow-400' : 'text-white/30'
                      }`}>
                        <Package size={10} />
                        {isOutOfStock ? 'ESGOTADO' : `${product.stock} em estoque`}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-2 right-2 bg-primary text-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={14} />
                  </div>
                </motion.button>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-white/30">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: CART & PAYMENT */}
      <div className="w-[420px] bg-[#0a0a0a] flex flex-col">
        {/* Customer Name */}
        <div className="p-4 border-b border-white/10 bg-[#1a1a1a]">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Nome do Cliente (Opcional)"
              className="w-full bg-black/50 p-3 pl-10 rounded-lg border border-white/10 text-white outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {cart.map(item => (
              <motion.div 
                key={item.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="text-xs text-white/40">{formatCurrency(item.price)} cada</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  
                  <span className="font-mono font-bold w-8 text-center">{item.quantity}</span>
                  
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {cart.length === 0 && (
            <div className="text-center py-16 text-white/20">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Carrinho vazio</p>
              <p className="text-xs mt-1">Clique nos produtos para adicionar</p>
            </div>
          )}
        </div>

        {/* Total & Payment */}
        <div className="p-4 bg-[#1a1a1a] border-t border-white/10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-white/40 text-xs font-bold uppercase">Total</span>
              <p className="text-xs text-white/30">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>
            </div>
            <span className="text-4xl font-black text-green-400">{formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => finalizeOrder('CARD')}
              disabled={processing || cart.length === 0}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <CreditCard size={20} />
              <span className="text-xs">Cartão</span>
              <span className="text-[8px] text-white/50">F4</span>
            </button>
            
            <button 
              onClick={() => finalizeOrder('CASH')}
              disabled={processing || cart.length === 0}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Banknote size={20} />
              <span className="text-xs">Dinheiro</span>
              <span className="text-[8px] text-white/50">F5</span>
            </button>
            
            <button 
              onClick={() => finalizeOrder('PIX')}
              disabled={processing || cart.length === 0}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Smartphone size={20} />
              <span className="text-xs">PIX</span>
            </button>
          </div>
          
          {processing && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
