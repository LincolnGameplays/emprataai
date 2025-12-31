
import { motion } from 'framer-motion';
import { Plus, Flame, Sparkles } from 'lucide-react';
import type { MenuItem } from '../types/menu';

interface ProductStoriesProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export function ProductStories({ items, onItemClick }: ProductStoriesProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-4">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 w-8 h-8 rounded-full flex items-center justify-center animate-pulse">
          <Flame className="w-4 h-4 text-white fill-white" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            Em Alta
          </h2>
          <p className="text-[10px] text-white/50 font-medium">
            Os queridinhos do momento
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar snap-x snap-mandatory">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onItemClick(item)}
            className="snap-center flex-shrink-0 w-32 h-48 md:w-40 md:h-56 rounded-2xl relative overflow-hidden bg-white/5 border border-white/10 cursor-pointer group"
          >
            {/* Image Background */}
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black" />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

            {/* Content */}
            <div className="absolute inset-0 p-3 flex flex-col justify-end">
              <div className="bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full w-fit mb-1 flex items-center gap-1">
                <Sparkles className="w-2 h-2" />
                TOP 10
              </div>
              
              <h3 className="text-xs font-bold text-white line-clamp-2 leading-tight mb-1">
                {item.title}
              </h3>
              
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-black text-white">
                  R$ {item.price.toFixed(2).replace('.', ',')}
                </span>
                <button className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black shadow-lg transform active:scale-90 transition-transform">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Border Glow on Hover */}
            <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 rounded-2xl transition-colors duration-300 pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
