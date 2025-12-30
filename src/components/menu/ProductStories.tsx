import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Flame } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/format';

// Extended MenuItem for Stories view (backwards compatible)
interface MenuItemExtended {
  id: string;
  name?: string;      // Alias for title
  title?: string;
  description: string;
  price: number;
  image?: string;     // Alias for imageUrl
  imageUrl?: string | null;
  isPopular?: boolean;
  isHighlight?: boolean;
  serves?: number;
}

interface ProductStoriesProps {
  product: MenuItemExtended;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (quantity: number, observation?: string) => void;
}

export default function ProductStories({ product, isOpen, onClose, onAddToCart }: ProductStoriesProps) {
  const [quantity, setQuantity] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Fecha ao arrastar para baixo (Gesto natural)
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose();
    }
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black flex items-end md:items-center justify-center"
        >
          {/* Fundo desfocado (Desktop) */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl hidden md:block" onClick={onClose} />

          <motion.div
            layoutId={`product-${product.id}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="relative w-full md:max-w-md h-[100dvh] md:h-[85vh] bg-[#121212] md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Barra de Gesto (Mobile) */}
            <div className="absolute top-0 left-0 right-0 h-16 z-20 bg-gradient-to-b from-black/60 to-transparent flex justify-center pt-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-30 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* IMAGEM IMERSIVA (Full Height) */}
            <div className="flex-1 relative">
              <img 
                src={product.image || product.imageUrl || ''} 
                alt={product.name || product.title || ''} 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/20 to-transparent" />
              
              {/* Badges Flutuantes */}
              <div className="absolute bottom-4 left-0 right-0 p-6 pb-0 flex flex-col justify-end">
                <div className="flex gap-2 mb-4">
                  {(product.isPopular || product.isHighlight) && (
                    <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-lg shadow-orange-500/20">
                      <Flame className="w-3 h-3 fill-current" /> Popular
                    </span>
                  )}
                  {product.serves && (
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-bold uppercase rounded-full">
                      Serve {product.serves} pessoas
                    </span>
                  )}
                </div>

                <motion.h2 
                  className="text-4xl font-black text-white leading-none mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {product.name || product.title}
                </motion.h2>

                <p className="text-white/70 text-sm leading-relaxed line-clamp-3 mb-4">
                  {product.description}
                </p>
              </div>
            </div>

            {/* CONTROLES E AÇÃO (Sticky Bottom) */}
            <div className="bg-[#121212] p-6 pt-0 pb-8 safe-area-bottom">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-1.5 border border-white/10">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold text-white w-4 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 text-right">
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-black text-primary">
                    {formatCurrency(product.price * quantity)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onAddToCart(quantity);
                  onClose();
                }}
                className="w-full py-4 bg-primary hover:bg-orange-600 active:scale-95 transition-all rounded-2xl font-black uppercase tracking-widest text-white shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingBag className="w-5 h-5" />
                Adicionar ao Pedido
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
