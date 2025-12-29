/**
 * PublicMenu - The Living Menu Public Page
 * Mobile-first digital menu experience
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, ChefHat, Utensils, Loader2 } from 'lucide-react';

import { getMenuBySlug } from '../services/menuService';
import type { Menu, MenuItem } from '../types/menu';

// ══════════════════════════════════════════════════════════════════
// ANIMATED MENU ITEM
// ══════════════════════════════════════════════════════════════════
function AnimatedItem({ item, index }: { item: MenuItem; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
    >
      {/* Image */}
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
        {item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="w-8 h-8 text-white/20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              {item.title}
            </h3>
            {item.isHighlight && (
              <span className="inline-block text-[9px] font-black uppercase tracking-wider text-yellow-500 mt-0.5">
                ⭐ Chef's Choice
              </span>
            )}
          </div>
          <span className="text-primary font-black text-base whitespace-nowrap">
            R$ {item.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-white/50 mt-1 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// HIGHLIGHTS CAROUSEL
// ══════════════════════════════════════════════════════════════════
function HighlightsCarousel({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-white/40 px-4 mb-3">
        ✨ Destaques
      </h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-36 snap-start"
          >
            <div className="aspect-square rounded-2xl overflow-hidden relative bg-white/5">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Utensils className="w-12 h-12 text-white/20" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                <span className="text-primary font-black text-sm">
                  R$ {item.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// STICKY CATEGORY NAV
// ══════════════════════════════════════════════════════════════════
function CategoryNav({ 
  categories, 
  activeCategory, 
  onSelect,
  themeColor 
}: { 
  categories: { id: string; title: string }[];
  activeCategory: string;
  onSelect: (id: string) => void;
  themeColor: string;
}) {
  return (
    <nav className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-y border-white/5">
      <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 py-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeCategory === cat.id
                ? 'text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
            style={{
              backgroundColor: activeCategory === cat.id ? themeColor : 'transparent'
            }}
          >
            {cat.title}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════
// WHATSAPP FAB
// ══════════════════════════════════════════════════════════════════
function WhatsAppFAB({ phone, restaurantName }: { phone: string; restaurantName: string }) {
  if (!phone) return null;

  const message = encodeURIComponent(`Olá! Gostaria de fazer um pedido no ${restaurantName}`);
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5C] text-white px-5 py-4 rounded-full shadow-lg shadow-[#25D366]/30 font-bold text-sm transition-all hover:scale-105 active:scale-95"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline">Fazer Pedido</span>
    </motion.a>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Load menu by slug
  useEffect(() => {
    async function loadMenu() {
      if (!slug) {
        setError('Cardápio não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getMenuBySlug(slug);
        if (data) {
          setMenu(data);
          if (data.categories.length > 0) {
            setActiveCategory(data.categories[0].id);
          }
        } else {
          setError('Cardápio não encontrado');
        }
      } catch (err) {
        console.error('Error loading menu:', err);
        setError('Erro ao carregar cardápio');
      } finally {
        setIsLoading(false);
      }
    }

    loadMenu();
  }, [slug]);

  // Scroll to category
  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const element = categoryRefs.current[catId];
    if (element) {
      const offset = 60; // Height of sticky nav
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Get highlighted items
  const highlights = menu?.categories
    .flatMap(c => c.items)
    .filter(i => i.isHighlight) || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !menu) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
        <ChefHat className="w-16 h-16 text-white/20 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">Cardápio não encontrado</h1>
        <p className="text-white/40 mb-6">{error}</p>
        <a 
          href="https://emprata.ai" 
          className="px-6 py-3 bg-primary rounded-xl font-bold text-white hover:bg-orange-600 transition-colors"
        >
          Criar meu Cardápio
        </a>
      </div>
    );
  }

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{menu.name} | Cardápio Digital</title>
        <meta name="description" content={menu.description || `Cardápio digital de ${menu.name}`} />
        <meta property="og:title" content={`${menu.name} | Cardápio Digital`} />
        <meta property="og:description" content={menu.description} />
        <meta name="theme-color" content={menu.themeColor} />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Immersive Header */}
        <header 
          className="relative py-12 px-4 text-center"
          style={{
            background: `linear-gradient(180deg, ${menu.themeColor}30 0%, transparent 100%)`
          }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mb-4"
          >
            {menu.logoUrl ? (
              <img 
                src={menu.logoUrl} 
                alt={menu.name}
                className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-white/10"
              />
            ) : (
              <div 
                className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center border-2 border-white/10"
                style={{ backgroundColor: `${menu.themeColor}30` }}
              >
                <ChefHat className="w-10 h-10" style={{ color: menu.themeColor }} />
              </div>
            )}
          </motion.div>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black tracking-tight mb-2"
          >
            {menu.name}
          </motion.h1>

          {/* Description */}
          {menu.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/50 text-sm max-w-md mx-auto"
            >
              {menu.description}
            </motion.p>
          )}
        </header>

        {/* Highlights Carousel */}
        <HighlightsCarousel items={highlights} />

        {/* Sticky Category Navigation */}
        <CategoryNav 
          categories={menu.categories.map(c => ({ id: c.id, title: c.title }))}
          activeCategory={activeCategory}
          onSelect={scrollToCategory}
          themeColor={menu.themeColor}
        />

        {/* Menu Items */}
        <main className="px-4 py-6 pb-24 space-y-8">
          {menu.categories.map((category) => (
            <section 
              key={category.id}
              ref={el => categoryRefs.current[category.id] = el}
              id={`category-${category.id}`}
            >
              <h2 className="text-lg font-black uppercase tracking-wider mb-4">
                {category.title}
              </h2>
              
              <div className="space-y-3">
                {category.items.map((item, index) => (
                  <AnimatedItem key={item.id} item={item} index={index} />
                ))}
              </div>

              {category.items.length === 0 && (
                <p className="text-white/20 text-sm text-center py-8">
                  Nenhum item nesta categoria
                </p>
              )}
            </section>
          ))}

          {menu.categories.length === 0 && (
            <div className="text-center py-16">
              <Utensils className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/40">Cardápio vazio</p>
            </div>
          )}
        </main>

        {/* WhatsApp FAB */}
        <WhatsAppFAB phone={menu.phone} restaurantName={menu.name} />

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 text-center">
          <a 
            href="https://emprata.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
          >
            Feito com Emprata.ai ⚡
          </a>
        </footer>
      </div>
    </>
  );
}
