/**
 * 🛒 SmartCart - Carrinho de Alta Conversão
 * 
 * Features:
 * - Drawer lateral animado
 * - Upsell Engine (produtos complementares)
 * - Order Bump (checkbox para upgrade)
 * - Psicologia de vendas aplicada
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CartItem {
  id: string;
  cartId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  notes?: string;
}

interface SmartCartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onAddItem: (item: Omit<CartItem, 'cartId' | 'quantity'>) => void;
  onRemoveItem: (cartId: string) => void;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  restaurantId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UPSELL ENGINE DATA
// ═══════════════════════════════════════════════════════════════════════════

const UPSELL_ITEMS = [
  { id: 'up1', name: 'Batata Frita G', price: 12.90, image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=200&h=200&fit=crop' },
  { id: 'up2', name: 'Coca-Cola Zero', price: 6.90, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&fit=crop' },
  { id: 'up3', name: 'Água Mineral', price: 4.90, image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=200&h=200&fit=crop' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SmartCart({ 
  isOpen, 
  onClose, 
  cart, 
  onAddItem, 
  onRemoveItem, 
  onUpdateQuantity,
  restaurantId 
}: SmartCartProps) {
  const navigate = useNavigate();
  const [orderBump, setOrderBump] = useState(false);
  
  // Calcular totais
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const BUMP_PRICE = 2.99;
  const finalTotal = subtotal + (orderBump ? BUMP_PRICE : 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handler para adicionar upsell
  const handleAddUpsell = (item: typeof UPSELL_ITEMS[0]) => {
    onAddItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Escuro */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* O Drawer do Carrinho */}
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-[420px] bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* ══════════════════════════════════════════════════════════════
                HEADER
            ══════════════════════════════════════════════════════════════ */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#121212]">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShoppingBag className="text-green-500" size={20} /> 
                Seu Pedido
                {itemCount > 0 && (
                  <span className="ml-2 bg-green-500 text-black text-xs px-2 py-0.5 rounded-full font-black">
                    {itemCount}
                  </span>
                )}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                LISTA DE ITENS (Scrollável)
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-50"/>
                  <p className="font-medium">Seu carrinho está vazio.</p>
                  <button 
                    onClick={onClose} 
                    className="mt-4 text-green-400 font-bold text-sm hover:underline"
                  >
                    Ver Cardápio
                  </button>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <motion.div 
                      key={item.cartId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="flex gap-3 items-center bg-[#121212] p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                    >
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover bg-white/5" 
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                        <p className="text-green-400 font-mono text-xs">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-white/40 truncate">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 bg-black rounded-lg p-1 border border-white/10">
                        <button 
                          onClick={() => item.quantity === 1 ? onRemoveItem(item.cartId) : onUpdateQuantity(item.cartId, -1)}
                          className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                        >
                          {item.quantity === 1 ? <Trash2 size={14}/> : <Minus size={14}/>}
                        </button>
                        <span className="text-xs font-bold w-5 text-center text-white">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.cartId, 1)}
                          className="p-1.5 text-white/40 hover:text-green-400 transition-colors"
                        >
                          <Plus size={14}/>
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* ════════════════════════════════════════════════════════
                      UPSELL ENGINE (Sessão de Impulso)
                  ════════════════════════════════════════════════════════ */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-xs font-bold text-white/40 uppercase mb-3 flex items-center gap-2">
                      <Zap size={12} className="text-yellow-400 fill-yellow-400"/> 
                      Combina perfeitamente com:
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
                      {UPSELL_ITEMS.map(up => (
                        <motion.div 
                          key={up.id} 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAddUpsell(up)}
                          className="min-w-[120px] bg-[#121212] p-3 rounded-xl border border-white/5 relative group cursor-pointer hover:border-green-500/30 transition-all"
                        >
                          <div className="absolute top-2 right-2 bg-green-500 text-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={10} />
                          </div>
                          <img 
                            src={up.image} 
                            alt={up.name}
                            className="w-full h-16 object-cover rounded-lg mb-2 opacity-80 group-hover:opacity-100 transition-opacity" 
                          />
                          <p className="text-xs font-bold text-white truncate">{up.name}</p>
                          <p className="text-xs text-green-400">+ R$ {up.price.toFixed(2)}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                FOOTER & ORDER BUMP
            ══════════════════════════════════════════════════════════════ */}
            {cart.length > 0 && (
              <div className="p-5 bg-[#121212] border-t border-white/10 space-y-4">
                
                {/* ORDER BUMP (O Checkbox Mágico) */}
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setOrderBump(!orderBump)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    orderBump 
                      ? 'bg-green-500/10 border-green-500' 
                      : 'bg-black border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    orderBump ? 'bg-green-500 border-green-500' : 'border-white/30'
                  }`}>
                    {orderBump && <Zap size={12} className="text-black fill-black" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${orderBump ? 'text-green-400' : 'text-white'}`}>
                      ⚡ Entrega Prioritária
                    </p>
                    <p className="text-[10px] text-white/50">
                      Seu pedido fura a fila da cozinha.
                    </p>
                  </div>
                  <p className="text-sm font-bold text-white">+ R$ {BUMP_PRICE.toFixed(2)}</p>
                </motion.div>

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between text-white/40 text-sm">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <AnimatePresence>
                    {orderBump && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-green-400 text-sm overflow-hidden"
                      >
                        <span>Prioridade</span>
                        <span>R$ {BUMP_PRICE.toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botão de Checkout */}
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    // Navigate to checkout or trigger checkout modal
                    // This can be customized based on your checkout flow
                  }}
                  className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all"
                >
                  FINALIZAR PEDIDO <ArrowRight size={18} />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
