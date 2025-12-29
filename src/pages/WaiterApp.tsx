/**
 * Waiter App - Mobile-First Order Interface
 * Fast table selection and order placement for waiters
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, ShoppingBag, Send, Search, Plus, Minus,
  X, Users, Receipt, Loader2, ChefHat, DollarSign,
  LogOut, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  collection, 
  getDocs, 
  addDoc,
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { setWaiterOnline, updateWaiterPerformance } from '../services/staffService';
import { formatCurrency } from '../services/analyticsService';
import type { WaiterSession } from '../types/staff';
import type { CartItem } from '../types/orders';
import type { MenuItem } from '../types/menu';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

type ViewMode = 'tables' | 'menu' | 'cart' | 'my-tables';

// ══════════════════════════════════════════════════════════════════
// TABLE GRID COMPONENT
// ══════════════════════════════════════════════════════════════════

function TableGrid({ 
  onSelect, 
  occupiedTables 
}: { 
  onSelect: (table: number) => void;
  occupiedTables: number[];
}) {
  const tables = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-5 gap-3 p-4">
      {tables.map(table => (
        <button
          key={table}
          onClick={() => onSelect(table)}
          className={`
            aspect-square rounded-2xl font-black text-2xl flex items-center justify-center
            transition-all active:scale-95
            ${occupiedTables.includes(table) 
              ? 'bg-primary/20 text-primary border-2 border-primary' 
              : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }
          `}
        >
          {table}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MENU ITEM CARD (Minimal)
// ══════════════════════════════════════════════════════════════════

function MenuItemCard({ 
  item, 
  quantity, 
  onAdd, 
  onRemove 
}: { 
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{item.title}</p>
        <p className="text-sm text-primary font-bold">
          {formatCurrency(item.price)}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {quantity > 0 && (
          <>
            <button
              onClick={onRemove}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-black text-lg">{quantity}</span>
          </>
        )}
        <button
          onClick={onAdd}
          className="w-10 h-10 bg-primary rounded-full flex items-center justify-center active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function WaiterApp() {
  const navigate = useNavigate();
  
  // Session
  const [session, setSession] = useState<WaiterSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [view, setView] = useState<ViewMode>('tables');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myTables, setMyTables] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Load session from sessionStorage
  useEffect(() => {
    const savedSession = sessionStorage.getItem('waiterSession');
    if (savedSession) {
      const parsed = JSON.parse(savedSession) as WaiterSession;
      setSession(parsed);
      setWaiterOnline(parsed.waiterId, true);
    } else {
      // Redirect to login if no session
      navigate('/waiter-login');
    }
    setIsLoading(false);

    // Set offline on unmount
    return () => {
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as WaiterSession;
        setWaiterOnline(parsed.waiterId, false);
      }
    };
  }, [navigate]);

  // Load menu items
  useEffect(() => {
    async function loadMenu() {
      if (!session) return;

      try {
        const q = query(
          collection(db, 'menus'),
          where('ownerId', '==', session.ownerId)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const menu = snapshot.docs[0].data();
          const items: MenuItem[] = menu.categories?.flatMap((cat: any) => cat.items) || [];
          setMenuItems(items);
        }
      } catch (error) {
        console.error('Error loading menu:', error);
      }
    }

    loadMenu();
  }, [session]);

  // Handle table selection
  const handleTableSelect = (table: number) => {
    setSelectedTable(table);
    setView('menu');
    if (!myTables.includes(table)) {
      setMyTables(prev => [...prev, table]);
    }
  };

  // Cart management
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => 
          i.menuItemId === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.title,
        price: item.price,
        quantity: 1,
        imageUrl: item.imageUrl || undefined
      }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => 
          i.menuItemId === menuItemId 
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      }
      return prev.filter(i => i.menuItemId !== menuItemId);
    });
  };

  const getItemQuantity = (itemId: string): number => {
    return cart.find(i => i.menuItemId === itemId)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Send order to kitchen
  const sendOrder = async () => {
    if (!session || !selectedTable || cart.length === 0) return;

    setIsSending(true);
    try {
      const orderItems = cart.map(item => ({
        id: crypto.randomUUID(),
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        imageUrl: item.imageUrl,
        status: 'pending'
      }));

      const order = {
        restaurantId: session.restaurantId,
        ownerId: session.ownerId,
        customer: {
          name: `Mesa ${selectedTable}`,
          cpf: '',
          table: selectedTable.toString()
        },
        items: orderItems,
        subtotal: cartTotal,
        deliveryFee: 0,
        total: cartTotal,
        status: 'pending',
        orderNumber: Math.floor(Math.random() * 999) + 1,
        isPaid: false,
        waiterId: session.waiterId,
        waiterName: session.waiterName,
        tableNumber: selectedTable,
        isOrderBumpAccepted: false,
        deliveryType: 'dine_in',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'orders'), order);
      await updateWaiterPerformance(session.waiterId, cartTotal);

      toast.success('Pedido enviado para a cozinha! 🍳');
      setCart([]);
      setView('tables');
      setSelectedTable(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar pedido');
    } finally {
      setIsSending(false);
    }
  };

  // Logout
  const handleLogout = () => {
    if (session) {
      setWaiterOnline(session.waiterId, false);
    }
    sessionStorage.removeItem('waiterSession');
    navigate('/');
  };

  // Filter menu items
  const filteredItems = menuItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-black sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">{session.waiterName}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Modo Garçom</p>
          </div>
        </div>

        {selectedTable && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-full">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-black text-primary">Mesa {selectedTable}</span>
          </div>
        )}

        <button 
          onClick={handleLogout}
          className="p-2 text-white/40 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {/* Tables View */}
          {view === 'tables' && (
            <motion.div
              key="tables"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="p-4">
                <h2 className="text-lg font-black uppercase tracking-tight mb-4">
                  Selecione a Mesa
                </h2>
              </div>
              <TableGrid 
                onSelect={handleTableSelect}
                occupiedTables={myTables}
              />
            </motion.div>
          )}

          {/* Menu View */}
          {view === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar prato..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Items */}
              <div className="space-y-2">
                {filteredItems.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={getItemQuantity(item.id)}
                    onAdd={() => addToCart(item)}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}

                {filteredItems.length === 0 && (
                  <div className="text-center py-12 text-white/30">
                    <ChefHat className="w-12 h-12 mx-auto mb-2" />
                    <p>Nenhum item encontrado</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Cart View */}
          {view === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <h2 className="text-lg font-black uppercase tracking-tight">
                Resumo do Pedido
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div 
                        key={item.menuItemId}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                      >
                        <div>
                          <p className="font-bold">{item.quantity}x {item.name}</p>
                          <p className="text-sm text-white/40">
                            {formatCurrency(item.price)} cada
                          </p>
                        </div>
                        <p className="font-black text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-primary/20 rounded-2xl flex items-center justify-between">
                    <span className="font-black uppercase">Total</span>
                    <span className="text-2xl font-black text-primary">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>

                  <button
                    onClick={sendOrder}
                    disabled={isSending}
                    className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Disparar para Cozinha
                      </>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* My Tables View */}
          {view === 'my-tables' && (
            <motion.div
              key="my-tables"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <h2 className="text-lg font-black uppercase tracking-tight">
                Minhas Mesas
              </h2>

              {myTables.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <Users className="w-12 h-12 mx-auto mb-2" />
                  <p>Nenhuma mesa atendida ainda</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {myTables.map(table => (
                    <button
                      key={table}
                      onClick={() => handleTableSelect(table)}
                      className="aspect-square rounded-2xl bg-primary/20 text-primary font-black text-3xl flex items-center justify-center border-2 border-primary active:scale-95"
                    >
                      {table}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-4 z-50">
        <button
          onClick={() => setView('tables')}
          className={`flex flex-col items-center gap-1 ${view === 'tables' ? 'text-primary' : 'text-white/40'}`}
        >
          <Grid3X3 className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Mesas</span>
        </button>

        <button
          onClick={() => setView('my-tables')}
          className={`flex flex-col items-center gap-1 ${view === 'my-tables' ? 'text-primary' : 'text-white/40'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Minhas</span>
        </button>

        {/* Cart Button (Center, Prominent) */}
        <button
          onClick={() => setView('cart')}
          className="relative -mt-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <ShoppingBag className="w-7 h-7" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs font-black flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() => view === 'menu' ? setView('tables') : setSelectedTable(null)}
          className={`flex flex-col items-center gap-1 ${view === 'menu' ? 'text-primary' : 'text-white/40'}`}
        >
          <Receipt className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Pedidos</span>
        </button>

        <button
          onClick={() => toast.info('Em breve: Fechar conta')}
          className="flex flex-col items-center gap-1 text-white/40"
        >
          <DollarSign className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Conta</span>
        </button>
      </nav>
    </div>
  );
}
