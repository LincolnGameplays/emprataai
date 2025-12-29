import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, ChefHat, Search, CreditCard, ArrowRight, CheckCircle, Sparkles, CloudRain, Dumbbell, Zap, Moon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Loading } from '../components/Loading';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';
import SocialProofTicker from '../components/SocialProofTicker';
import { rewriteDescription, UserVibe, VIBE_METADATA } from '../services/neuroCopy';

// Interfaces simplificadas para o componente
interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isHighlight?: boolean;
}

interface CartItem extends MenuItem {
  cartId: string;
  quantity: number;
  notes: string;
}

// Order success state
interface OrderSuccess {
  orderId: string;
  deliveryPin: string;
  total: number;
}

export default function PublicMenu() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  
  // Estado do Carrinho e Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: '', cpf: '', table: '' });
  
  // Order Success State (with delivery PIN)
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  
  // Neuro-Copywriting State
  const [currentVibe, setCurrentVibe] = useState<UserVibe>('standard');
  const [optimizedDescriptions, setOptimizedDescriptions] = useState<Record<string, string>>({});
  
  // Deep Link handler - prevent double-trigger
  const deepLinkProcessed = useRef(false);

  // Neuro-Copywriting Effect
  useEffect(() => {
    if (currentVibe === 'standard') {
      setOptimizedDescriptions({});
      return;
    }

    const optimizeMenu = async () => {
      const itemsToOptimize = menuItems.slice(0, 10);

      for (const item of itemsToOptimize) {
        // Loading placeholder
        setOptimizedDescriptions(prev => ({ ...prev, [item.id]: '✨ Personalizando...' }));
        
        // Actual AI rewrite
        const newText = await rewriteDescription(item.title, item.description, currentVibe);
        setOptimizedDescriptions(prev => ({ ...prev, [item.id]: newText }));
      }
    };

    optimizeMenu();
  }, [currentVibe, menuItems]);

  // Carregar Dados
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // 1. Buscar Restaurante pelo Slug
        const q = query(collection(db, 'menus'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          toast.error("Restaurante não encontrado");
          setLoading(false);
          return;
        }

        const menuData = snapshot.docs[0].data();
        setRestaurant(menuData);

        // 2. Organizar Itens
        const items: MenuItem[] = [];
        const cats = new Set<string>();
        
        menuData.categories.forEach((cat: any) => {
          cats.add(cat.title);
          cat.items.forEach((item: any) => {
            items.push({ ...item, category: cat.title });
          });
        });

        setMenuItems(items);
        setCategories(['Todos', ...Array.from(cats)]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchMenu();
  }, [slug]);

  // ══════════════════════════════════════════════════════════════════
  // DEEP LINK HANDLER - Auto-add item from URL parameter
  // URL: /menu/[slug]?add_item=[itemId]
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const addItemId = searchParams.get('add_item');
    
    // Only process once, when items are loaded
    if (addItemId && menuItems.length > 0 && !deepLinkProcessed.current) {
      const targetItem = menuItems.find(item => item.id === addItemId);
      
      if (targetItem) {
        deepLinkProcessed.current = true;
        
        // Add to cart with promotional toast
        setCart(prev => {
          const existing = prev.find(i => i.id === targetItem.id);
          if (existing) {
            return prev.map(i => i.id === targetItem.id ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { ...targetItem, cartId: crypto.randomUUID(), quantity: 1, notes: '' }];
        });
        
        setIsCartOpen(true);
        toast.success('🔥 Oferta ativada! Item adicionado ao carrinho.', {
          duration: 4000,
          icon: '🎉'
        });
      }
    }
  }, [menuItems, searchParams]);

  // Lógica do Carrinho
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, cartId: crypto.randomUUID(), quantity: 1, notes: '' }];
    });
    toast.success(`${item.title} adicionado!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.cartId === cartId) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Finalizar Pedido
  const handleCheckout = async () => {
    if (!customer.name || !customer.cpf) {
      toast.error("Por favor, preencha nome e CPF");
      return;
    }

    try {
      setLoading(true);
      
      // Generate 4-digit delivery PIN for security
      const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
      
      const orderRef = await addDoc(collection(db, 'orders'), {
        restaurantId: restaurant.ownerId,
        customer,
        items: cart,
        total: cartTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
        paymentMethod: 'pix', // Default por enquanto
        isOrderBumpAccepted: false,
        deliveryPin // Security PIN for delivery confirmation
      });

      // Show success screen with PIN
      setOrderSuccess({
        orderId: orderRef.id,
        deliveryPin,
        total: cartTotal
      });
      
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
    } catch (e) {
      toast.error("Erro ao enviar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <Helmet>
        <title>{restaurant?.name || 'Cardápio'} | Emprata.ai</title>
      </Helmet>

      {/* SOCIAL PROOF TICKER - Living Menu */}
      {restaurant?.id && (
        <SocialProofTicker restaurantId={restaurant.id} />
      )}

      {/* HEADER CINEMATOGRÁFICO */}
      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a] z-10" />
        <img 
          src={restaurant?.coverUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"} 
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
          <h1 className="text-4xl font-black italic tracking-tighter mb-2">{restaurant?.name}</h1>
          <p className="text-white/60 line-clamp-2 max-w-lg">{restaurant?.description}</p>
        </div>
      </div>

      {/* CATEGORIAS (STICKY) */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 py-4 px-6 overflow-x-auto">
        <div className="flex gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* NEURO-COPYWRITING VIBE SELECTOR */}
      <div className="bg-[#121212] py-6 px-4 border-b border-white/5">
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 text-center">
          Como você está se sentindo hoje?
        </p>
        <div className="flex justify-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setCurrentVibe('comfort')} 
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all min-w-[80px] ${currentVibe === 'comfort' ? 'bg-white/10 border-blue-500 text-white' : 'border-white/10 text-white/40'}`}
          >
            <CloudRain className="w-5 h-5" />
            <span className="text-[10px] font-bold">Frio/Chuva</span>
          </button>

          <button 
            onClick={() => setCurrentVibe('fitness')} 
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all min-w-[80px] ${currentVibe === 'fitness' ? 'bg-white/10 border-green-500 text-white' : 'border-white/10 text-white/40'}`}
          >
            <Dumbbell className="w-5 h-5" />
            <span className="text-[10px] font-bold">Fitness</span>
          </button>

          <button 
            onClick={() => setCurrentVibe('energy')} 
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all min-w-[80px] ${currentVibe === 'energy' ? 'bg-white/10 border-orange-500 text-white' : 'border-white/10 text-white/40'}`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-bold">Fome Monstro</span>
          </button>

          <button 
            onClick={() => setCurrentVibe('late_night')} 
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all min-w-[80px] ${currentVibe === 'late_night' ? 'bg-white/10 border-purple-500 text-white' : 'border-white/10 text-white/40'}`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Larica</span>
          </button>
        </div>
      </div>

      {/* GRID DE ITENS (BENTO STYLE) */}
      <div className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-6">
        {menuItems
          .filter(i => activeCategory === 'Todos' || i.category === activeCategory)
          .map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="group bg-white/5 border border-white/5 rounded-3xl p-4 flex gap-4 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => addToCart(item)}
          >
            {/* Imagem Quadrada Perfeita */}
            <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden relative">
              <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg leading-tight mb-1">{item.title}</h3>
                  <span className="text-primary font-black">R$ {item.price.toFixed(2)}</span>
                </div>
                <p className={`text-xs leading-relaxed line-clamp-2 transition-all duration-300 ${optimizedDescriptions[item.id] ? 'text-primary/80' : 'text-white/40'}`}>
                  {optimizedDescriptions[item.id] || item.description}
                </p>
              </div>
              
              <button className="mt-2 w-full py-2 bg-white/5 rounded-xl text-xs font-bold uppercase hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FLOATING ACTION BUTTON (CART) */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 inset-x-0 px-6 z-40 max-w-md mx-auto"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-primary text-white p-4 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {cart.reduce((a,b) => a + b.quantity, 0)}
                </div>
                <span className="font-bold uppercase tracking-wider text-sm">Ver Sacola</span>
              </div>
              <span className="font-black text-lg">R$ {cartTotal.toFixed(2)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="relative w-full max-w-md bg-[#121212] h-full shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black italic">Sua Sacola</h2>
              <button onClick={() => setIsCartOpen(false)}><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.map(item => (
                <div key={item.cartId} className="flex gap-4">
                  <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-primary font-bold text-sm mb-2">R$ {item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3 bg-white/5 w-fit rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:text-primary"><Minus size={14} /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:text-primary"><Plus size={14} /></button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.cartId)} className="text-white/20 hover:text-red-500 self-start"><X size={16} /></button>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white/5 space-y-4">
              <div className="flex justify-between text-xl font-black">
                <span>Total</span>
                <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl font-black uppercase tracking-widest transition-all"
              >
                Finalizar Pedido
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CHECKOUT MODAL (DADOS) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#18181b] w-full max-w-md rounded-3xl p-8 border border-white/10"
          >
            <h2 className="text-2xl font-black italic mb-6">Identificação</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-white/40 mb-2">Seu Nome</label>
                <input 
                  type="text" 
                  value={customer.name}
                  onChange={e => setCustomer({...customer, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 focus:border-primary outline-none font-bold"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/40 mb-2">CPF (Nota Fiscal)</label>
                <IMaskInput
                  mask="000.000.000-00"
                  value={customer.cpf}
                  unmask={false}
                  onAccept={(value: string) => setCustomer({ ...customer, cpf: value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 focus:border-primary outline-none font-bold placeholder:text-white/20"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-white/40 mb-2">Mesa (Opcional)</label>
                <input 
                  type="text" 
                  value={customer.table}
                  onChange={e => setCustomer({...customer, table: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 focus:border-primary outline-none font-bold"
                  placeholder="Ex: 05"
                />
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-4 bg-primary rounded-xl font-black uppercase tracking-widest mt-6 flex items-center justify-center gap-2"
              >
                {loading ? 'Enviando...' : (
                  <>Confirmar e Pedir <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
               
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="w-full py-3 text-white/40 font-bold text-xs uppercase hover:text-white"
              >
                Voltar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ORDER SUCCESS MODAL - With Delivery PIN */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {orderSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="max-w-md w-full text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-green-400" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black mb-2"
            >
              Pedido Confirmado! 🎉
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 mb-8"
            >
              Seu pedido foi enviado para a cozinha
            </motion.p>

            {/* Delivery PIN Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-primary/20 to-orange-600/10 border border-primary/30 rounded-3xl p-6 mb-6"
            >
              <div className="flex items-center justify-center gap-2 text-primary mb-4">
                <Sparkles className="w-5 h-5" />
                <p className="text-sm font-bold uppercase tracking-wider">
                  Código de Recebimento
                </p>
              </div>

              {/* Giant PIN Display */}
              <div className="flex justify-center gap-3 mb-4">
                {orderSuccess.deliveryPin.split('').map((digit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="w-14 h-16 bg-black/50 border-2 border-primary rounded-xl flex items-center justify-center"
                  >
                    <span className="text-3xl font-black text-white">{digit}</span>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-white/50">
                Informe este código ao entregador para receber seu pedido
              </p>
            </motion.div>

            {/* Order Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white/5 rounded-xl p-4 mb-6 text-left"
            >
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total do Pedido</span>
                <span className="font-bold text-green-400">R$ {orderSuccess.total.toFixed(2)}</span>
              </div>
            </motion.div>

            {/* New Order Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => setOrderSuccess(null)}
              className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
            >
              Fazer Novo Pedido
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
