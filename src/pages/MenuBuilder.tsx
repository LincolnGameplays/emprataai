/**
 * MenuBuilder - Digital Menu Dashboard
 * Create and manage your restaurant's Living Menu
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Plus, Trash2, GripVertical, Sparkles, QrCode, 
  ChevronLeft, Phone, Image as ImageIcon, Edit3, Check, X,
  Download, Loader2, Wand2, ExternalLink, Share2, Utensils
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/useAppStore';
import type { Menu, Category, MenuItem, MenuFormData } from '../types/menu';
import { 
  createMenu, 
  updateMenu, 
  getMenuByOwnerId, 
  generateSlug, 
  isSlugAvailable 
} from '../services/menuService';
import { enhanceDescription, organizeMenuStructure } from '../services/menuAi';
import { generateNewDescription } from '../services/neuroCopy';

import { analyzePricing } from '../services/businessAi';
import { MiniStudioModal } from '../components/MiniStudioModal';

// ══════════════════════════════════════════════════════════════════
// HELPER: Generate unique IDs
// ══════════════════════════════════════════════════════════════════
const generateId = () => crypto.randomUUID();

// ══════════════════════════════════════════════════════════════════
// DEFAULT EMPTY MENU
// ══════════════════════════════════════════════════════════════════
const createDefaultMenu = (ownerId: string): MenuFormData => ({
  ownerId,
  slug: '',
  name: '',
  description: '',
  logoUrl: null,
  phone: '',
  themeColor: '#FF6B00',
  categories: []
});

// ══════════════════════════════════════════════════════════════════
// PHONE PREVIEW COMPONENT
// ══════════════════════════════════════════════════════════════════
import { BulkImportModal } from '../components/admin/BulkImportModal';

// ... (existing code)

function PhonePreview({ menu }: { menu: MenuFormData }) {
  const highlights = menu.categories
    .flatMap(c => c.items)
    .filter(i => i.isHighlight);

  return (
    <div className="w-[320px] h-[640px] bg-[#0a0a0a] rounded-[40px] border-4 border-white/10 overflow-hidden shadow-2xl relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
      
      {/* Screen Content */}
      <div className="h-full overflow-y-auto no-scrollbar">
        {/* Header */}
        <div 
          className="h-40 flex flex-col items-center justify-center relative"
          style={{ background: `linear-gradient(135deg, ${menu.themeColor}40, ${menu.themeColor}10)` }}
        >
          {menu.logoUrl ? (
            <img src={menu.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <ChefHat className="w-8 h-8 text-white/40" />
            </div>
          )}
          <h1 className="text-lg font-black mt-3 text-white text-center px-4">
            {menu.name || 'Nome do Restaurante'}
          </h1>
          <p className="text-[10px] text-white/50 mt-1">
            {menu.description || 'Descrição curta aqui'}
          </p>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Destaques</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {highlights.slice(0, 3).map(item => (
                <div key={item.id} className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Utensils className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <span className="text-[9px] font-bold text-white line-clamp-1">{item.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="p-4 pt-0 space-y-4">
          {menu.categories.map(cat => (
            <div key={cat.id}>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/60 mb-2">{cat.title}</h3>
              <div className="space-y-2">
                {cat.items.map(item => (
                  <div key={item.id} className="flex gap-3 p-2 bg-white/5 rounded-xl">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <Utensils className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold text-white line-clamp-1">{item.title}</h4>
                      <p className="text-[9px] text-white/40 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="text-[11px] font-black text-primary">
                      R$ {item.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {menu.categories.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-white/20">
            <ChefHat className="w-12 h-12 mb-2" />
            <span className="text-xs">Adicione categorias</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function MenuBuilder() {
  const { user } = useAuth();
  const studioImage = useAppStore((s) => s.generatedImage);
  
  const [menu, setMenu] = useState<MenuFormData | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [editingItem, setEditingItem] = useState<{ catId: string; itemId: string } | null>(null);

  // Studio Modal State
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [studioTarget, setStudioTarget] = useState<{ catId: string; itemId: string } | null>(null);

  const handleOpenStudio = (catId: string, itemId: string) => {
    setStudioTarget({ catId, itemId });
    setShowStudioModal(true);
  };

  const handleStudioImageReady = (url: string) => {
    if (studioTarget) {
      updateItem(studioTarget.catId, studioTarget.itemId, { imageUrl: url });
      setStudioTarget(null);
      toast.success('Imagem aplicada com sucesso! 📸');
    }
  };

  // Load existing menu or create new
  useEffect(() => {
    async function loadMenu() {
      if (!user?.uid) return;
      
      try {
        const existing = await getMenuByOwnerId(user.uid);
        if (existing) {
          setMenu({
            ownerId: existing.ownerId,
            slug: existing.slug,
            name: existing.name,
            description: existing.description,
            logoUrl: existing.logoUrl,
            phone: existing.phone,
            themeColor: existing.themeColor,
            categories: existing.categories
          });
          setMenuId(existing.id);
        } else {
          setMenu(createDefaultMenu(user.uid));
        }
      } catch (error) {
        console.error('Erro ao carregar menu:', error);
        toast.error('Erro ao carregar menu');
        setMenu(createDefaultMenu(user?.uid || ''));
      } finally {
        setIsLoading(false);
      }
    }

    loadMenu();
  }, [user?.uid]);

  // Auto-save with debounce
  const saveMenu = useCallback(async () => {
    if (!menu || !user?.uid) return;

    setIsSaving(true);
    try {
      if (menuId) {
        await updateMenu(menuId, menu);
      } else {
        const created = await createMenu(menu);
        setMenuId(created.id);
      }
      toast.success('Cardápio salvo!', { duration: 1500 });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar cardápio');
    } finally {
      setIsSaving(false);
    }
  }, [menu, menuId, user?.uid]);

  // Update menu fields
  const updateField = <K extends keyof MenuFormData>(key: K, value: MenuFormData[K]) => {
    setMenu(prev => prev ? { ...prev, [key]: value } : null);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    updateField('name', name);
    if (!menu?.slug || menu.slug === generateSlug(menu.name)) {
      updateField('slug', generateSlug(name));
    }
  };

  // ════════════════════════════════════════════════════════════════
  // CATEGORY CRUD
  // ════════════════════════════════════════════════════════════════

  const addCategory = () => {
    const newCat: Category = {
      id: generateId(),
      title: 'Nova Categoria',
      items: []
    };
    setMenu(prev => prev ? { ...prev, categories: [...prev.categories, newCat] } : null);
  };

  const updateCategory = (catId: string, title: string) => {
    setMenu(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(c => c.id === catId ? { ...c, title } : c)
      };
    });
  };

  const deleteCategory = (catId: string) => {
    setMenu(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.filter(c => c.id !== catId)
      };
    });
  };

  const handleBulkImport = (data: any) => {
    setMenu(prev => {
      if (!prev) return null;
      
      const newCategories = data.categories.map((c: any) => ({
        id: crypto.randomUUID(),
        title: c.title,
        items: c.items.map((i: any) => ({
          id: crypto.randomUUID(),
          title: i.title,
          description: i.description || '',
          price: Number(i.price) || 0,
          imageUrl: null,
          isHighlight: false
        }))
      }));
  
      return {
        ...prev,
        categories: [...prev.categories, ...newCategories]
      };
    });
  };

  // ════════════════════════════════════════════════════════════════
  // ITEM CRUD
  // ════════════════════════════════════════════════════════════════

  const addItem = (catId: string) => {
    const newItem: MenuItem = {
      id: generateId(),
      title: 'Novo Item',
      description: '',
      price: 0,
      imageUrl: null,
      isHighlight: false
    };

    setMenu(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(c => 
          c.id === catId ? { ...c, items: [...c.items, newItem] } : c
        )
      };
    });

    setEditingItem({ catId, itemId: newItem.id });
  };

  const updateItem = (catId: string, itemId: string, updates: Partial<MenuItem>) => {
    setMenu(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(c => 
          c.id === catId 
            ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
            : c
        )
      };
    });
  };

  const deleteItem = (catId: string, itemId: string) => {
    setMenu(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(c => 
          c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
        )
      };
    });
  };

  // ════════════════════════════════════════════════════════════════
  // IMPORT FROM STUDIO
  // ════════════════════════════════════════════════════════════════

  const importFromStudio = () => {
    if (!studioImage) {
      toast.error('Gere uma imagem no Studio primeiro!');
      return;
    }

    // Create a new category if none exists
    if (menu?.categories.length === 0) {
      addCategory();
    }

    const targetCatId = menu?.categories[0]?.id;
    if (!targetCatId) return;

    const newItem: MenuItem = {
      id: generateId(),
      title: 'Novo Prato do Studio',
      description: 'Descrição do prato...',
      price: 29.90,
      imageUrl: studioImage,
      isHighlight: false
    };

    setMenu(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(c => 
          c.id === targetCatId ? { ...c, items: [...c.items, newItem] } : c
        )
      };
    });

    toast.success('Imagem importada do Studio!');
  };

  // ════════════════════════════════════════════════════════════════
  // AI: ENHANCE DESCRIPTION
  // ════════════════════════════════════════════════════════════════

  const handleEnhanceDescription = async (catId: string, itemId: string) => {
    const item = menu?.categories.find(c => c.id === catId)?.items.find(i => i.id === itemId);
    if (!item?.description) {
      toast.error('Adicione uma descrição primeiro');
      return;
    }

    setIsEnhancing(true);
    try {
      const enhanced = await enhanceDescription(item.description, 'gourmet');
      updateItem(catId, itemId, { description: enhanced });
      toast.success('Descrição aprimorada! ✨');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aprimorar descrição');
    } finally {
      setIsEnhancing(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // AI: AUTO-ORGANIZE
  // ════════════════════════════════════════════════════════════════

  // ════════════════════════════════════════════════════════════════
  // AI: AUTO-COMPLETE (Name -> Desc -> Price)
  // ════════════════════════════════════════════════════════════════

  const handleItemNameBlur = async (catId: string, itemId: string, name: string) => {
    if (!name || name.length < 3) return;

    // Find item to check if it needs auto-complete (empty desc/price)
    const item = menu?.categories.find(c => c.id === catId)?.items.find(i => i.id === itemId);
    if (!item) return;

    // Only auto-fill if description is empty or very short
    const shouldGenerateDesc = !item.description || item.description.length < 10;
    
    if (shouldGenerateDesc) {
      toast.promise(
        async () => {
          // 1. Generate Description
          const desc = await generateNewDescription(name);
          updateItem(catId, itemId, { description: desc });

          // 2. Suggest Price
          const analysis = await analyzePricing(desc || name, 50); // 50% target margin default
          if (analysis?.suggestedPrice) {
            updateItem(catId, itemId, { 
              description: desc,
              price: analysis.suggestedPrice,
              costPrice: analysis.costEstimate
            } as any);
            return `Sugestão: R$ ${analysis.suggestedPrice.toFixed(2)}`;
          }
        },
        {
          loading: 'IA Criando prato...',
          success: (msg) => `${msg || 'Prato criado com IA!'}`,
          error: 'Erro na IA'
        }
      );
    }
  };

  const handleAutoOrganize = async () => {
    if (!menu) return;

    const allItems = menu.categories.flatMap(c => c.items);
    if (allItems.length < 2) {
      toast.error('Adicione mais itens para organizar');
      return;
    }

    const itemNames = allItems.map(i => i.title);

    setIsOrganizing(true);
    try {
      const result = await organizeMenuStructure(itemNames);

      // Reorganize categories based on AI response
      const newCategories: Category[] = result.categories.map(aiCat => ({
        id: generateId(),
        title: aiCat.name,
        items: aiCat.items
          .map(itemName => {
            const existing = allItems.find(i => i.title === itemName);
            return existing || null;
          })
          .filter((i): i is MenuItem => i !== null)
          .map(item => ({
            ...item,
            isHighlight: result.suggestedHighlights.includes(item.title)
          }))
      }));

      setMenu(prev => prev ? { ...prev, categories: newCategories } : null);
      toast.success(`Cardápio organizado! ${result.suggestedHighlights.length} destaques sugeridos 🎯`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao organizar cardápio');
    } finally {
      setIsOrganizing(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // QR CODE URL
  // ════════════════════════════════════════════════════════════════

  const menuUrl = menu?.slug ? `https://emprata.ai/menu/${menu.slug}` : '';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!menu) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-black italic tracking-tight flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Living Menu
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Cardápio Digital</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Import from Studio */}
          <button 
            onClick={importFromStudio}
            disabled={!studioImage}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              studioImage 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Importar do Studio</span>
          </button>

          {/* QR Code */}
          <button 
            onClick={() => setShowQR(true)}
            disabled={!menu.slug}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Save */}
          <button 
            onClick={saveMenu}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-orange-600 rounded-xl font-bold text-sm transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span className="hidden md:inline">Salvar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
        
        {/* Left Panel: Editor */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          
          {/* Setup Section */}
          <section className="bg-white/5 rounded-3xl p-6 border border-white/5">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4">Configuração</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1 block">Nome do Restaurante</label>
                <input 
                  type="text"
                  value={menu.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Pizzaria do Zico"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1 block">URL do Cardápio</label>
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-sm">/menu/</span>
                  <input 
                    type="text"
                    value={menu.slug}
                    onChange={(e) => updateField('slug', generateSlug(e.target.value))}
                    placeholder="pizzaria-do-zico"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1 block">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="text"
                    value={menu.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="5511999999999"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/20 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Theme Color */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1 block">Cor Principal</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color"
                    value={menu.themeColor}
                    onChange={(e) => updateField('themeColor', e.target.value)}
                    className="w-12 h-12 rounded-xl border-2 border-white/10 cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={menu.themeColor}
                    onChange={(e) => updateField('themeColor', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white uppercase focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Description with AI */}
            <div className="mt-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1 block">Descrição Curta</label>
              <textarea 
                value={menu.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Desde 1990 servindo as melhores pizzas..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </section>

          {/* Categories Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/40">Categorias & Itens</h2>
              <div className="flex items-center gap-2">
                {/* AI Organize Button */}
                <button 
                  onClick={handleAutoOrganize}
                  disabled={isOrganizing || menu.categories.flatMap(c => c.items).length < 2}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOrganizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  <span className="hidden md:inline">Organizar com IA</span>
                </button>

                <button 
                  onClick={addCategory}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Categoria</span>
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
              <AnimatePresence>
                {menu.categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-white/5">
                      <GripVertical className="w-4 h-4 text-white/20 cursor-grab" />
                      <input 
                        type="text"
                        value={cat.title}
                        onChange={(e) => updateCategory(cat.id, e.target.value)}
                        className="flex-1 bg-transparent text-sm font-bold text-white focus:outline-none"
                      />
                      <button 
                        onClick={() => addItem(cat.id)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-white/5">
                      {cat.items.map((item) => (
                        <div key={item.id} className="p-4 flex items-start gap-4">
                          {/* Image */}
                          <div 
                            onClick={() => handleOpenStudio(cat.id, item.id)}
                            className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative cursor-pointer group"
                          >
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <ImageIcon className="w-6 h-6 text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Wand2 className="w-4 h-4 text-white" />
                            </div>
                            {item.isHighlight && (
                              <div className="absolute top-1 right-1 bg-yellow-500 rounded-full p-0.5">
                                <Sparkles className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <input 
                              type="text"
                              value={item.title}
                              onChange={(e) => updateItem(cat.id, item.id, { title: e.target.value })}
                              onBlur={(e) => handleItemNameBlur(cat.id, item.id, e.target.value)}
                              className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                              placeholder="Nome do prato (ex: X-Bacon)"
                            />
                            <div className="flex items-center gap-2">
                              <textarea
                                value={item.description}
                                onChange={(e) => updateItem(cat.id, item.id, { description: e.target.value })}
                                className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs text-white/60 focus:outline-none resize-none"
                                placeholder="Descrição..."
                                rows={2}
                              />
                              <button 
                                onClick={() => handleEnhanceDescription(cat.id, item.id)}
                                disabled={isEnhancing || !item.description}
                                className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50"
                                title="Aprimorar com IA"
                              >
                                {isEnhancing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1">
                                <span className="text-white/40 text-xs">Venda R$</span>
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={item.price || ''}
                                  onChange={(e) => updateItem(cat.id, item.id, { price: parseFloat(e.target.value) || 0 })}
                                  className="w-20 bg-white/5 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                                  placeholder="0,00"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-red-400/60 text-xs">Custo R$</span>
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={(item as any).costPrice || ''}
                                  onChange={(e) => updateItem(cat.id, item.id, { costPrice: parseFloat(e.target.value) || 0 } as any)}
                                  className="w-20 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 text-xs text-red-300 focus:outline-none"
                                  placeholder="0,00"
                                />
                              </div>
                              {item.price > 0 && (item as any).costPrice > 0 && (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                  ((item.price - (item as any).costPrice) / item.price) * 100 >= 30
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {(((item.price - (item as any).costPrice) / item.price) * 100).toFixed(0)}% margem
                                </span>
                              )}
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={item.isHighlight}
                                  onChange={(e) => updateItem(cat.id, item.id, { isHighlight: e.target.checked })}
                                  className="w-4 h-4 rounded bg-white/5 border-white/10"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-500">Destaque</span>
                              </label>
                            </div>
                          </div>

                          {/* Delete */}
                          <button 
                            onClick={() => deleteItem(cat.id, item.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {cat.items.length === 0 && (
                        <div className="p-4 text-center text-white/20 text-xs">
                          Clique em + para adicionar itens
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {menu.categories.length === 0 && (
                <div className="text-center py-12 text-white/20">
                  <ChefHat className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm">Adicione sua primeira categoria</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Panel: Preview (Desktop only) */}
        <div className="hidden lg:flex w-[400px] border-l border-white/5 flex-col items-center justify-center p-8 bg-black/20">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Preview</h3>
          <PhonePreview menu={menu} />
          
          {menu.slug && (
            <>
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl text-xs font-bold uppercase tracking-wider border border-purple-500/30 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Importar Mágico</span>
              </button>

          {/* CORREÇÃO DO ERRO DE SINTAXE AQUI */}
          {menu.slug && (
            <Link 
              to={`/menu/${menu.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 mt-4 text-xs text-white/40 hover:text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver página pública
            </Link>
          )}
            </>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      <MiniStudioModal 
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        onImageReady={handleStudioImageReady}
      />
      
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-3xl p-8 border border-white/10 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black mb-2">QR Code do Cardápio</h3>
              <p className="text-white/40 text-sm mb-6">Escaneie para acessar o cardápio</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                <QRCode value={menuUrl} size={200} />
              </div>

              <p className="text-xs text-white/40 mb-4 break-all">{menuUrl}</p>

              <div className="flex gap-3">
                <button 
                  onClick={() => navigator.clipboard.writeText(menuUrl).then(() => toast.success('Link copiado!'))}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all"
                >
                  Copiar Link
                </button>
                <button 
                  onClick={() => setShowQR(false)}
                  className="flex-1 py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold text-sm transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BulkImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onImport={handleBulkImport} 
      />
    </div>
  );
}
