/**
 * ⚡ SMART TOOLS - Emprata Brain Business Intelligence ⚡
 * Premium AI-powered tools for restaurant owners
 * 
 * Tools:
 * 1. O Espião de Lucro (Pricing Analysis)
 * 2. Blindagem de Reputação (Review Replies)
 * 3. Campanha Num Clique (Marketing)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, ShieldCheck, Rocket, 
  Sparkles, Copy, Check, ChevronDown, 
  Loader2, ArrowLeft, Brain 
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Business AI Service
import { 
  analyzePricing, 
  generateReviewReply, 
  generateCampaign,
  PricingAnalysis,
  ReviewRepliesResponse
} from '../services/businessAi';

// ══════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════

interface MenuItem {
  id: string;
  title: string;
  price: number;
}

interface MenuData {
  slug: string;
  categories: Array<{
    items: MenuItem[];
  }>;
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function SmartTools() {
  // Active tool state (null = grid view, 'pricing' | 'reviews' | 'campaign')
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-lg">Emprata Brain</h1>
                <p className="text-xs text-white/40">Inteligência de Negócios</p>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            AI Powered
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTool === null ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* HERO TEXT */}
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black italic mb-4">
                  Seu <span className="text-primary">Consultor 24/7</span>
                </h2>
                <p className="text-white/50 max-w-xl mx-auto">
                  Ferramentas de IA para precificar melhor, responder reviews como um profissional e criar campanhas virais.
                </p>
              </div>

              {/* BENTO GRID */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* CARD 1: Pricing */}
                <ToolCard
                  icon={TrendingUp}
                  title="O Espião de Lucro"
                  description="Precifique seus pratos como um consultor Michelin"
                  gradient="from-green-500/20 to-emerald-500/10"
                  iconColor="text-green-400"
                  onClick={() => setActiveTool('pricing')}
                />

                {/* CARD 2: Reviews */}
                <ToolCard
                  icon={ShieldCheck}
                  title="Blindagem de Reputação"
                  description="Respostas inteligentes para avaliações negativas"
                  gradient="from-blue-500/20 to-cyan-500/10"
                  iconColor="text-blue-400"
                  onClick={() => setActiveTool('reviews')}
                />

                {/* CARD 3: Campaign */}
                <ToolCard
                  icon={Rocket}
                  title="Campanha Num Clique"
                  description="Copy viral para WhatsApp com Deep Link"
                  gradient="from-orange-500/20 to-red-500/10"
                  iconColor="text-orange-400"
                  onClick={() => setActiveTool('campaign')}
                />
              </div>
            </motion.div>
          ) : activeTool === 'pricing' ? (
            <PricingTool onBack={() => setActiveTool(null)} />
          ) : activeTool === 'reviews' ? (
            <ReviewTool onBack={() => setActiveTool(null)} />
          ) : (
            <CampaignTool onBack={() => setActiveTool(null)} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TOOL CARD COMPONENT (Glassmorphism)
// ══════════════════════════════════════════════════════════════════

interface ToolCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  iconColor: string;
  onClick: () => void;
}

function ToolCard({ icon: Icon, title, description, gradient, iconColor, onClick }: ToolCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`relative group text-left p-6 rounded-3xl border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-xl overflow-hidden transition-all hover:border-white/20`}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className={`absolute top-0 right-0 w-32 h-32 ${iconColor} blur-[80px] opacity-30`} />
      </div>

      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${iconColor}`}>
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-white/50">{description}</p>

        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-primary">
          <Sparkles className="w-4 h-4" />
          <span>Usar Ferramenta</span>
        </div>
      </div>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════
// TOOL 1: PRICING TOOL
// ══════════════════════════════════════════════════════════════════

function PricingTool({ onBack }: { onBack: () => void }) {
  const [description, setDescription] = useState('');
  const [margin, setMargin] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PricingAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast.error('Descreva o prato primeiro!');
      return;
    }

    setLoading(true);
    try {
      const analysis = await analyzePricing(description, margin);
      setResult(analysis);
      toast.success('Análise concluída!');
    } catch (error: any) {
      toast.error(error.message || 'Erro na análise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="pricing"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar às ferramentas</span>
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black">O Espião de Lucro</h2>
          <p className="text-white/50 text-sm">Precificação inteligente com Neuromarketing</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2 text-white/60">
            Descreva o prato
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Burger artesanal 180g, blend de fraldinha e costela, queijo brie derretido, cebola caramelizada no mel, pão brioche tostado"
            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-4 text-white/60">
            Margem de Lucro Desejada: <span className="text-primary">{margin}%</span>
          </label>
          <input
            type="range"
            min={30}
            max={100}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-white/30 mt-2">
            <span>30% (Baixa)</span>
            <span>65% (Média)</span>
            <span>100% (Alta)</span>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold text-lg flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Calcular Preço Ideal
            </>
          )}
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20"
          >
            {/* Gauge / Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-black/30 rounded-2xl text-center">
                <p className="text-xs text-white/40 mb-1">Custo Estimado</p>
                <p className="text-2xl font-black text-white/60">R$ {result.costEstimate.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-black/30 rounded-2xl text-center">
                <p className="text-xs text-white/40 mb-1">Preço Sugerido</p>
                <p className="text-3xl font-black text-green-400">R$ {result.suggestedPrice.toFixed(2)}</p>
              </div>
            </div>

            {/* Profit Gauge Visualization */}
            <div className="relative h-4 rounded-full bg-white/10 mb-6 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${margin}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
              />
              <div 
                className="absolute top-0 h-full w-1 bg-white" 
                style={{ left: `${margin}%`, transform: 'translateX(-50%)' }}
              />
            </div>

            {/* Neuromarketing Tip */}
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl">
              <p className="text-xs text-primary font-bold mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                DICA DE NEUROMARKETING
              </p>
              <p className="text-white/80 text-sm leading-relaxed">{result.tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TOOL 2: REVIEW TOOL
// ══════════════════════════════════════════════════════════════════

function ReviewTool({ onBack }: { onBack: () => void }) {
  const [reviewText, setReviewText] = useState('');
  const [stars, setStars] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewRepliesResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!reviewText.trim()) {
      toast.error('Cole a avaliação primeiro!');
      return;
    }

    setLoading(true);
    try {
      const replies = await generateReviewReply(reviewText, stars);
      setResult(replies);
      toast.success('Respostas geradas!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar respostas');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copiado!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <motion.div
      key="reviews"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar às ferramentas</span>
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Blindagem de Reputação</h2>
          <p className="text-white/50 text-sm">Respostas inteligentes para reviews negativos</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2 text-white/60">
            Cole aqui a avaliação ruim do iFood/Google
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Ex: Comida chegou fria e demorou 2 horas. Péssimo atendimento, não recomendo!"
            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-3 text-white/60">
            Quantas estrelas?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setStars(s)}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${
                  stars === s 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {s}★
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 font-bold text-lg flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Resposta Mágica
            </>
          )}
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
          >
            {result.replies.map((reply, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                    {reply.tone}
                  </span>
                  <button
                    onClick={() => handleCopy(reply.text, index)}
                    className={`p-2 rounded-lg transition-all ${
                      copiedIndex === index 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/5 text-white/40 hover:text-white'
                    }`}
                  >
                    {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{reply.text}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TOOL 3: CAMPAIGN TOOL
// ══════════════════════════════════════════════════════════════════

function CampaignTool({ onBack }: { onBack: () => void }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSlug, setMenuSlug] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [campaign, setCampaign] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Load user's menu items from Firestore
  useEffect(() => {
    const loadMenu = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(collection(db, 'menus'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const menuData = snapshot.docs[0].data() as MenuData;
          setMenuSlug(menuData.slug || '');
          
          // Flatten all items from all categories
          const items: MenuItem[] = [];
          menuData.categories?.forEach((cat) => {
            cat.items?.forEach((item) => {
              items.push(item);
            });
          });
          setMenuItems(items);
        }
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setLoadingMenu(false);
      }
    };

    loadMenu();
  }, []);

  const handleGenerateCampaign = async (item: MenuItem) => {
    setSelectedItem(item);
    setLoading(true);
    setCampaign('');

    try {
      const text = await generateCampaign(item.title, item.price);
      setCampaign(text);
      toast.success('Campanha criada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar campanha');
    } finally {
      setLoading(false);
    }
  };

  const getDeepLink = () => {
    if (!selectedItem || !menuSlug) return '';
    return `https://emprataai.vercel.app/menu/${menuSlug}?add_item=${selectedItem.id}`;
  };

  const handleCopyAll = () => {
    const fullText = `${campaign}\n\n👉 Pedir agora: ${getDeepLink()}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Texto + Link copiados!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      key="campaign"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      {/* Back Button */}
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar às ferramentas</span>
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
          <Rocket className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Campanha Num Clique</h2>
          <p className="text-white/50 text-sm">Copy viral para WhatsApp com Deep Link</p>
        </div>
      </div>

      {/* Menu Items Dropdown */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2 text-white/60">
            Selecione um prato do seu cardápio
          </label>
          
          {loadingMenu ? (
            <div className="w-full p-4 bg-white/5 rounded-2xl flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-white/40" />
              <span className="text-white/40">Carregando cardápio...</span>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="w-full p-4 bg-white/5 rounded-2xl text-center text-white/40">
              <p>Nenhum prato encontrado.</p>
              <Link to="/menu-builder" className="text-primary hover:underline text-sm">
                Criar cardápio →
              </Link>
            </div>
          ) : (
            <div className="relative">
              <select
                onChange={(e) => {
                  const item = menuItems.find(i => i.id === e.target.value);
                  if (item) handleGenerateCampaign(item);
                }}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none cursor-pointer focus:border-primary focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled className="bg-[#0a0a0a]">
                  Escolha um prato...
                </option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id} className="bg-[#0a0a0a]">
                    {item.title} - R$ {item.price.toFixed(2)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-white/60">Criando campanha viral...</p>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {campaign && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20"
            >
              {/* Campaign Text */}
              <div className="p-4 bg-black/30 rounded-2xl mb-4">
                <p className="text-lg leading-relaxed">{campaign}</p>
              </div>

              {/* Deep Link */}
              <div className="p-3 bg-black/30 rounded-xl mb-6 flex items-center gap-2 overflow-hidden">
                <span className="text-xs text-white/40 shrink-0">🔗 Link:</span>
                <p className="text-xs text-primary truncate">{getDeepLink()}</p>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyAll}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:brightness-110'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Texto + Link
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
