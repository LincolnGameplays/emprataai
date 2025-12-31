import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, ChefHat, Search, CreditCard, ArrowRight, CheckCircle, Sparkles, CloudRain, Dumbbell, Zap, Moon, MapPin, Clock, ArrowLeft, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Loading } from '../components/Loading';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';
import SocialProofTicker from '../components/SocialProofTicker';
import { rewriteDescription, UserVibe, VIBE_METADATA } from '../services/neuroCopy';
import CheckoutFlow from '../components/checkout/CheckoutFlow';
import { getDynamicMenu, filterMenuByVibe } from '../services/dynamicMenu';
import { ProductStories } from '../components/ProductStories';
import { Menu } from '../types/menu';
import { useRestaurantMetrics } from '../hooks/useRestaurantMetrics';
import { calculateDistance, formatDistance } from '../utils/geo';
import { predictDeliveryTime, type DeliveryPrediction } from '../services/logisticsAi';
import { Loader2 } from 'lucide-react';

// Interfaces simplificadas para o componente
// Interfaces simplificadas para o componente
import type { MenuItem as BaseMenuItem } from '../types/menu';

interface MenuItem extends BaseMenuItem {
  category: string;
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
  const navigate = useNavigate();
  const tableId = searchParams.get('table');
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [processedMenu, setProcessedMenu] = useState<any>(null);
  const [stories, setStories] = useState<MenuItem[]>([]);
  
  // Estado do Carrinho e Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: '', cpf: '', table: tableId || '', phone: '', address: '' });
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  
  // Order Success State (with delivery PIN)
  // Order Success State (with delivery PIN)
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  
  // Real Data State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const { metrics, loading: metricsLoading } = useRestaurantMetrics(restaurant?.ownerId);
  
  // AI Delivery Prediction State
  const [deliveryEstimate, setDeliveryEstimate] = useState<DeliveryPrediction | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  
  // 1. Pegar Geolocalização Real do Cliente
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      });
    }
  }, []);

  // 2. Calcular Distância Real
  useEffect(() => {
    if (userLocation && restaurant?.location?.lat) {
      const dist = calculateDistance(
        userLocation.lat, userLocation.lng,
        restaurant.location.lat, restaurant.location.lng
      );
      setDistance(formatDistance(dist));
    }
  }, [userLocation, restaurant]);

  // 3. AI Delivery Time Prediction
  useEffect(() => {
    const calculateEstimate = async () => {
      if (!restaurant?.ownerId || !userLocation) return;
      
      const storeLocation = restaurant.location || restaurant.marketplace?.location;
      if (!storeLocation?.lat) return;
      
      setEstimateLoading(true);
      try {
        const prediction = await predictDeliveryTime({
          restaurantId: restaurant.ownerId,
          storeLocation: { lat: storeLocation.lat, lng: storeLocation.lng },
          userLocation
        });
        setDeliveryEstimate(prediction);
      } catch (e) {
        console.error('Prediction error:', e);
      } finally {
        setEstimateLoading(false);
      }
    };
    
    calculateEstimate();
  }, [restaurant, userLocation]);
  
  // Neuro-Copywriting State
  const [currentVibe, setCurrentVibe] = useState<UserVibe>('standard');
  const [optimizedDescriptions, setOptimizedDescriptions] = useState<Record<string, string>>({});
  
  // Deep Link handler - prevent double-trigger
  const deepLinkProcessed = useRef(false);

  // Vibe Colors Dynamic
  const vibeColors = {
    standard: 'from-orange-500/10 to-transparent',
    comfort: 'from-blue-500/10 to-transparent',
    fitness: 'from-green-500/10 to-transparent',
    energy: 'from-yellow-500/10 to-transparent',
    late_night: 'from-purple-500/10 to-transparent'
  };

  // Neuro-Copywriting Effect
  useEffect(() => {
    if (currentVibe === 'standard') {
      setOptimizedDescriptions({});
      return;
    }

    const optimizeMenu = async () => {
      const itemsToOptimize = menuItems.slice(0, 10);

      for (const item of itemsToOptimize) {
        setOptimizedDescriptions(prev => ({ ...prev, [item.id]: '✨ Personalizando...' }));
        
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
        const q = query(collection(db, 'menus'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          toast.error("Restaurante não encontrado");
          setLoading(false);
          return;
        }

        const menuData = snapshot.docs[0].data() as Menu;
        setRestaurant(menuData);

        // Apply Dynamic Logic
        const dynamicMenu = getDynamicMenu(menuData);
        
        if (dynamicMenu) {
            setProcessedMenu(dynamicMenu);
            
            // Extract stories
            const allItemsValues: MenuItem[] = dynamicMenu.categories.flatMap((c: any) => 
              c.items.map((i: any) => ({ ...i, category: c.title }))
            );

            setStories(allItemsValues.filter(i => i.isHighlight).slice(0, 10)); // Top 10 highlights

            // Populate flat items
            setMenuItems(allItemsValues);
            setFilteredMenuItems(allItemsValues); // Initialize filtered items

            // Update categories
            setCategories(['Todos', ...dynamicMenu.categories.map(c => c.title)]);
        } else {
             const items: MenuItem[] = [];
             const cats = new Set<string>();
             
             menuData.categories.forEach(cat => {
               cats.add(cat.title);
               cat.items.forEach(item => {
                 items.push({ ...item, category: cat.title });
               });
             });
     
             setMenuItems(items);
             setFilteredMenuItems(items); // Initialize filtered items
             setCategories(['Todos', ...Array.from(cats)]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchMenu();
  }, [slug]);

  // Vibe Filter Effect
  useEffect(() => {
    if (!restaurant) return;
    
    // Simplification: just reset visible items to full menu on vibe change, 
    // real logic can be complex re-sorting.
    // For now we assume menuItems contains all items we want to show.
    
  }, [currentVibe, restaurant]);

  // Semantic Search Handler
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term) {
      setFilteredMenuItems(menuItems);
      return;
    }

    if (term.length < 4) {
      const simpleFilter = menuItems.filter(i => i.title.toLowerCase().includes(term.toLowerCase()));
      setFilteredMenuItems(simpleFilter);
      return;
    }

    setIsSearchingAI(true);
    try {
      // Lazy import to avoid circular dependencies if any
      const { semanticSearch } = await import('../services/menuAi');
      const matchedIds = await semanticSearch(term, menuItems);
      
      if (matchedIds.length > 0) {
        const aiItems = menuItems.filter(i => matchedIds.includes(i.id));
        setFilteredMenuItems(aiItems);
        toast.success('IA: Encontrei pratos perfeitos para você!', { icon: '🤖' });
      } else {
        const simpleFilter = menuItems.filter(i => i.title.toLowerCase().includes(term.toLowerCase()));
        setFilteredMenuItems(simpleFilter);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingAI(false);
    }
  };

  // DEEP LINK HANDLER
  useEffect(() => {
    const addItemId = searchParams.get('add_item');
    
    if (addItemId && menuItems.length > 0 && !deepLinkProcessed.current) {
      const targetItem = menuItems.find(item => item.id === addItemId);
      
      if (targetItem) {
        deepLinkProcessed.current = true;
        
        setCart(prev => {
          const existing = prev.find(i => i.id === targetItem.id);
          if (existing) {
            return prev.map(i => i.id === targetItem.id ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { ...targetItem, cartId: crypto.randomUUID(), quantity: 1, notes: '' }];
        });
        
        setIsCartOpen(true);
        toast.success('🔥 Oferta ativada!', { icon: '🎉' });
      }
    }
  }, [menuItems, searchParams]);

  // Logic Helpers
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, cartId: crypto.randomUUID(), quantity: 1, notes: '' }];
    });
    // Add pulsing feedback here implicitly via UI state update
    toast.success(`${item.title} adicionado!`);
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

  // Final Checkout with Anti-Fraud
  const handleCheckoutFinal = async (paymentData: any) => {
    try {
      setLoading(true);
      const MAX_DELIVERY_RADIUS_KM = 15; 

      // 1. Verificação de Distância (Geo-Fencing)
      if (userLocation && restaurant?.location?.lat) {
        const distanceKm = calculateDistance(
          userLocation.lat, userLocation.lng, 
          restaurant.location.lat, restaurant.location.lng
        ); 
        
        if (distanceKm > MAX_DELIVERY_RADIUS_KM) {
          toast.error(`Desculpe, não entregamos neste local (${distanceKm}km). Limite: ${MAX_DELIVERY_RADIUS_KM}km.`);
          setLoading(false);
          return; // BLOQUEIA O PEDIDO
        }
      }

      // 2. Verificação de Valor Alto (Anti-Golpe)
      if (cartTotal > 300 && paymentData.paymentMethod === 'CASH') {
        toast.error("Para pedidos acima de R$ 300, apenas pagamento via Pix ou Cartão Online.");
        setLoading(false);
        return; // BLOQUEIA PAGAMENTO NA ENTREGA PARA VALORES ALTOS
      }

      const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
      
      const orderRef = await addDoc(collection(db, 'orders'), {
        restaurantId: restaurant.ownerId,
        customer: {
          ...customer,
          uid: auth.currentUser?.uid || null
        },
        items: cart,
        total: cartTotal,
        paymentMethod: paymentData.paymentMethod,
        paymentStatus: paymentData.paymentStatus || 'pending',
        changeFor: paymentData.changeFor ?? null, 
        paymentId: paymentData.paymentId ?? null, 
        source: tableId ? 'QR_TABLE' : 'WEB_DELIVERY',
        tableId: tableId || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        deliveryPin,
        isOrderBumpAccepted: false,
      });

      setOrderSuccess({
        orderId: orderRef.id,
        deliveryPin,
        total: cartTotal
      });
      
      setCart([]);
      setCustomerConfirmed(false);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
    } catch (e) {
      toast.error("Erro ao finalizar pedido");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className={`min-h-screen bg-[#050505] text-white pb-32 transition-colors duration-700`}>
      <Helmet>
        <title>{restaurant?.name || 'Cardápio'} | Emprata.ai</title>
      </Helmet>

      {/* Dynamic Background Gradient based on Vibe */}
      <div className={`fixed inset-0 bg-gradient-to-b ${vibeColors[currentVibe]} opacity-30 pointer-events-none transition-all duration-1000`} />

      {/* HEADER ULTRA-IMMERSIVE (Glassmorphism) */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-10" />
        <img 
          src={restaurant?.coverUrl || "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80"} 
          className="w-full h-full object-cover scale-105 animate-slow-zoom"
        />
        <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start">
           <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             {tableId ? `Mesa ${tableId}` : 'Delivery Online'}
           </div>
           
           {/* SEARCH BAR (New) */}
           <div className="relative w-full max-w-xs mx-auto md:mr-0 z-50">
             <input 
                 value={searchTerm}
                 onChange={(e) => handleSearch(e.target.value)} 
                 placeholder="Ex: 'Jantar romântico'..."
                 className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs text-white placeholder-white/50 focus:border-primary focus:outline-none transition-all"
             />
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
             {isSearchingAI && <Sparkles className="absolute right-3 top-2.5 w-4 h-4 text-purple-400 animate-pulse" />}
           </div>

        </div>
        <div className="absolute bottom-0 left-0 p-8 z-20 w-full max-w-4xl mx-auto">
           {/* TAGS REAIS */}
            <div className="flex gap-2 mb-2">
              {metrics.isNew ? (
                 <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                   Novo
                 </span>
              ) : (
                 <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                   <Star size={10} className="fill-black"/> {metrics.rating}
                 </span>
              )}

              {/* Distância Real */}
              {distance && (
                 <span className="bg-black/50 backdrop-blur text-white border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                   <MapPin size={10}/> {distance}
                 </span>
              )}
            </div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50"
          >
            {restaurant?.name}
          </motion.h1>
          <div className="flex items-center gap-4 text-sm font-bold text-white/50">
             {/* AI Delivery Estimate */}
             <div className="flex items-center gap-2">
               {estimateLoading ? (
                 <><Loader2 size={14} className="animate-spin" /> Calculando...</>
               ) : deliveryEstimate ? (
                 <div className="flex flex-col">
                   <span className="flex items-center gap-1 text-white">
                     <Clock size={14} /> {deliveryEstimate.minTime}-{deliveryEstimate.maxTime} min
                   </span>
                   {deliveryEstimate.reason && (
                     <span className="text-[10px] text-primary">
                       {deliveryEstimate.weatherImpact && '☔ '}{deliveryEstimate.reason}
                     </span>
                   )}
                 </div>
               ) : (
                 <span className="flex items-center gap-1"><Clock size={16} /> 30-45 min</span>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* TICKER DE PROVA SOCIAL REAL */}
      <SocialProofTicker metrics={metrics} />

      {/* CATEGORIAS (Floating Glass) */}
      <div className="sticky top-4 z-30 px-4 mb-8">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full flex gap-2 overflow-x-auto no-scrollbar shadow-2xl">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'bg-white text-black shadow-lg shadow-white/20 scale-105' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* NEURO-VIBE (Mood Selector) */}
      <div className="max-w-md mx-auto mb-10 px-6">
        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] text-center mb-4">
          Personalize sua experiência
        </p>
        <div className="flex justify-center gap-4">
           {[
             { id: 'standard', icon: <ChefHat />, label: 'Normal' },
             { id: 'late_night', icon: <Moon />, label: 'Larica' },
             { id: 'fitness', icon: <Dumbbell />, label: 'Fit' },
             { id: 'energy', icon: <Zap />, label: 'Fome' }
           ].map((vibe) => (
             <button
               key={vibe.id}
               onClick={() => setCurrentVibe(vibe.id as UserVibe)}
               className={`p-3 rounded-2xl border transition-all ${
                 currentVibe === vibe.id 
                 ? 'bg-white/10 border-white text-white scale-110 shadow-xl shadow-white/10' 
                 : 'bg-transparent border-white/5 text-white/30 hover:bg-white/5'
               }`}
             >
               {vibe.icon}
             </button>
           ))}
        </div>
      </div>

      {/* STORIES */}
      <ProductStories items={stories} onItemClick={(item) => addToCart({ ...item, category: 'Stories' })} />

      {/* BENTO GRID MENU */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenuItems
          .filter(i => activeCategory === 'Todos' || i.category === activeCategory)
          .map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className={`group relative overflow-hidden rounded-[2rem] border border-white/5 hover:border-white/20 transition-all bg-[#121212] ${
               index % 5 === 0 ? 'md:col-span-2 md:row-span-2' : '' // Bento logic: Highlight first item of bunch
            }`}
            onClick={() => addToCart(item)}
          >
            {/* Image Layer */}
            <div className={`w-full ${index % 5 === 0 ? 'h-96' : 'h-64'} relative`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-90" />
              <img 
                src={item.imageUrl || ''} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[0.3] group-hover:grayscale-0" 
              />
              
              {/* Floating Price Tag */}
              <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                 <span className="text-white font-black">R$ {item.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Content Layer */}
            <div className="absolute bottom-0 left-0 w-full p-6 z-20">
              <h3 className={`font-black italic leading-none mb-2 ${index % 5 === 0 ? 'text-4xl' : 'text-xl'}`}>
                {item.title}
              </h3>
              <p className={`text-white/60 mb-4 line-clamp-2 text-sm ${index % 5 === 0 ? 'max-w-md' : ''}`}>
                 {optimizedDescriptions[item.id] || item.description}
              </p>
              
              <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                <Plus className="w-4 h-4" /> Adicionar à sacola
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FLOATING CART CTA */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 z-40 px-6 flex justify-center"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-primary text-white pl-6 pr-2 py-2 rounded-full shadow-[0_0_40px_rgba(255,100,0,0.4)] flex items-center gap-4 hover:scale-105 transition-transform active:scale-95"
            >
              <span className="font-black uppercase tracking-widest text-sm">Ver Sacola</span>
              <div className="bg-white text-black font-black w-10 h-10 rounded-full flex items-center justify-center">
                {cart.reduce((a,b) => a + b.quantity, 0)}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CART DRAWER (Modern Glass) */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-[#121212] flex flex-col items-center border-l border-white/10"
          >
             <div className="w-full p-6 flex items-center justify-between border-b border-white/5">
                <h2 className="text-xl font-black italic">Seu Pedido</h2>
                <button onClick={() => setIsCartOpen(false)} className="bg-white/5 p-2 rounded-full hover:bg-white/20"><X size={20}/></button>
             </div>
             
             <div className="flex-1 w-full overflow-y-auto p-6 space-y-4">
               {cart.map(item => (
                 <div key={item.cartId} className="bg-white/5 rounded-2xl p-4 flex gap-4 border border-white/5">
                     <img src={item.imageUrl || ''} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1">
                       <h4 className="font-bold text-sm leading-tight mb-1">{item.title}</h4>
                       <span className="text-primary text-xs font-black">R$ {item.price.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-center bg-black/40 rounded-lg p-1 gap-2">
                       <button onClick={() => updateQuantity(item.cartId, 1)} className="hover:text-primary"><Plus size={14}/></button>
                       <span className="text-xs font-bold">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.cartId, -1)} className="hover:text-primary"><Minus size={14}/></button>
                    </div>
                 </div>
               ))}
             </div>

             <div className="w-full p-6 bg-gradient-to-t from-black to-transparent">
                <div className="flex justify-between items-end mb-6">
                   <span className="text-white/60 text-sm">Total a pagar</span>
                   <span className="text-3xl font-black text-white">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                  className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
                >
                  Continuar
                </button>
             </div>
          </motion.div>
        </>
      )}

      {/* CHECKOUT FLOW (Context Aware) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
           {!customerConfirmed ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md bg-[#121212] rounded-3xl p-8 border border-white/10 relative">
               <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 text-white/40"><X /></button>
               
               <h2 className="text-2xl font-black italic mb-2">Identifique-se</h2>
               <p className="text-white/40 text-sm mb-6">Para emitir sua nota e acompanhar o pedido.</p>

               <div className="space-y-4">
                 <input placeholder="Seu Nome" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-primary text-white" />
                 
                 <IMaskInput mask="000.000.000-00" placeholder="CPF" value={customer.cpf} unmask={false} onAccept={(val) => setCustomer({...customer, cpf: val})} className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-primary text-white" />
                 
                 <IMaskInput mask="(00) 00000-0000" placeholder="WhatsApp" value={customer.phone} onAccept={(val) => setCustomer({...customer, phone: val})} className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-primary text-white" />
                 
                 {/* CONTEXT AWARE: Show Table or Address */}
                 {tableId ? (
                   <div className="bg-primary/10 border border-primary/50 text-primary p-4 rounded-xl flex items-center gap-3">
                     <MapPin className="w-5 h-5" />
                     <span className="font-bold text-sm">Você está na Mesa {tableId}</span>
                   </div>
                 ) : (
                    <input placeholder="Endereço Completo" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-primary text-white" />
                 )}

                 <button onClick={() => {
                   if(customer.name && customer.cpf) setCustomerConfirmed(true);
                   else toast.error('Dados incompletos');
                 }} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest mt-4">
                   Ir para Pagamento
                 </button>
               </div>
             </motion.div>
           ) : (
              <div className="w-full max-w-md">
                 <CheckoutFlow 
                   order={{
                     id: `order_${Date.now()}`,
                     total: cartTotal,
                     restaurantId: restaurant?.ownerId,
                     customer: {
                       name: customer.name,
                       cpf: customer.cpf,
                       phone: customer.phone || ''
                     },
                     items: cart
                   }}
                   onSuccess={handleCheckoutFinal}
                   onCancel={() => setCustomerConfirmed(false)}
                 />
              </div>
           )}
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
            <h1 className="text-4xl font-black italic mb-2">Pedido Recebido!</h1>
            <p className="text-white/60 mb-8 max-w-xs">{tableId ? 'Acompanhe pelo painel da mesa.' : 'Um entregador aceitará seu pedido em breve.'}</p>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">PIN DE ENTREGA</p>
              <p className="text-5xl font-black text-primary tracking-[0.2em]">{orderSuccess.deliveryPin}</p>
            </div>

            <button onClick={() => setOrderSuccess(null)} className="text-white/50 hover:text-white font-bold text-sm uppercase">Fazer novo pedido</button>
        </div>
      )}
    </div>
  );
}
