/**
 * ⚡ TOOLS HUB - Central de Ferramentas Emprata.ai ⚡
 * Categorized Bento Grid layout with all app tools
 * 
 * Categories:
 * A. Operação (Chão de Loja) - KDS, QR Codes, Waiter Mode
 * B. Gestão (Backoffice) - Staff, Pricing AI
 * C. Marketing & Vendas - WhatsApp, Reviews, Campaigns
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Monitor, QrCode, ClipboardList, 
  Users, TrendingUp, 
  MessageCircle, ShieldCheck, Rocket,
  ArrowLeft, Sparkles, X, Brain
} from 'lucide-react';

// Import AI Tools for modals
import { 
  analyzePricing, 
  generateReviewReply, 
  generateCampaign,
  PricingAnalysis,
  ReviewRepliesResponse
} from '../services/businessAi';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ══════════════════════════════════════════════════════════════════

interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  gradient: string;
  link?: string;
  modal?: 'pricing' | 'reviews' | 'campaigns';
  isNew?: boolean;
}

interface ToolCategory {
  title: string;
  subtitle: string;
  tools: ToolItem[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    title: "Operação",
    subtitle: "Chão de Loja",
    tools: [
      {
        id: "kds",
        title: "Kitchen Display (KDS)",
        description: "Tela de pedidos para a cozinha",
        icon: Monitor,
        iconColor: "text-red-400",
        gradient: "from-red-500/20 to-orange-500/10",
        link: "/kitchen-mode"
      },
      {
        id: "qr",
        title: "Gerador de Placas",
        description: "Imprima QR Codes para as mesas",
        icon: QrCode,
        iconColor: "text-purple-400",
        gradient: "from-purple-500/20 to-pink-500/10",
        link: "/print-qr"
      },
      {
        id: "waiter",
        title: "Modo Garçom",
        description: "App leve para lançar pedidos",
        icon: ClipboardList,
        iconColor: "text-cyan-400",
        gradient: "from-cyan-500/20 to-blue-500/10",
        link: "/waiter-mode"
      },
      {
        id: "logistics",
        title: "Logística & Entregadores",
        description: "Painel de expedição e motoboys",
        icon: Monitor,
        iconColor: "text-pink-400",
        gradient: "from-pink-500/20 to-purple-500/10",
        link: "/logistics/dispatch",
        isNew: true
      }
    ]
  },
  {
    title: "Gestão",
    subtitle: "Backoffice",
    tools: [
      {
        id: "staff",
        title: "Equipe & Acesso",
        description: "Gerencie garçons e permissões",
        icon: Users,
        iconColor: "text-blue-400",
        gradient: "from-blue-500/20 to-indigo-500/10",
        link: "/staff"
      },
      {
        id: "pricing",
        title: "Precificação IA",
        description: "Calculadora de lucro e neuromarketing",
        icon: TrendingUp,
        iconColor: "text-green-400",
        gradient: "from-green-500/20 to-emerald-500/10",
        modal: "pricing"
      }
    ]
  },
  {
    title: "Marketing & Vendas",
    subtitle: "Crescimento",
    tools: [
      {
        id: "whatsapp",
        title: "Emprata Zap",
        description: "Automação e Disparos de WhatsApp",
        icon: MessageCircle,
        iconColor: "text-green-400",
        gradient: "from-green-500/20 to-emerald-500/10",
        link: "/tools/whatsapp",
        isNew: true
      },
      {
        id: "reviews",
        title: "Gestor de Reputação",
        description: "Responda reviews com IA",
        icon: ShieldCheck,
        iconColor: "text-blue-400",
        gradient: "from-blue-500/20 to-cyan-500/10",
        modal: "reviews"
      },
      {
        id: "campaigns",
        title: "Gerador de Ofertas",
        description: "Crie campanhas virais",
        icon: Rocket,
        iconColor: "text-orange-400",
        gradient: "from-orange-500/20 to-red-500/10",
        modal: "campaigns"
      }
    ]
  }
];

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function ToolsHub() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<'pricing' | 'reviews' | 'campaigns' | null>(null);

  const handleToolClick = (tool: ToolItem) => {
    if (tool.link) {
      navigate(tool.link);
    } else if (tool.modal) {
      setActiveModal(tool.modal);
    }
  };

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
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-lg">Ferramentas & Apps</h1>
                <p className="text-xs text-white/40">Central de Recursos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {TOOL_CATEGORIES.map((category, catIndex) => (
          <motion.section
            key={category.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1 }}
          >
            {/* Category Header */}
            <div className="mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight">
                {category.title}
              </h2>
              <p className="text-sm text-white/40 font-medium">{category.subtitle}</p>
            </div>

            {/* Tools Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.tools.map((tool, toolIndex) => (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: catIndex * 0.1 + toolIndex * 0.05 }}
                  onClick={() => handleToolClick(tool)}
                  className={`group relative text-left p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${tool.gradient} backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:-translate-y-1`}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`absolute top-0 right-0 w-24 h-24 ${tool.iconColor} blur-[60px] opacity-40`} />
                  </div>

                  {/* NEW Badge */}
                  {tool.isNew && (
                    <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-black uppercase">
                      Novo
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${tool.iconColor}`}>
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{tool.title}</h3>
                    <p className="text-sm text-white/50">{tool.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        ))}
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {activeModal === 'pricing' && (
          <PricingModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'reviews' && (
          <ReviewsModal onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'campaigns' && (
          <CampaignsModal onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL: PRICING
// ══════════════════════════════════════════════════════════════════

function PricingModal({ onClose }: { onClose: () => void }) {
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
    <ModalWrapper onClose={onClose} title="Precificação IA" icon={TrendingUp} iconColor="text-green-400">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-white/60">Descreva o prato</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Burger artesanal 180g, queijo brie, cebola caramelizada"
            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-primary focus:outline-none resize-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-3 text-white/60">
            Margem de Lucro: <span className="text-primary">{margin}%</span>
          </label>
          <input
            type="range"
            min={30}
            max={100}
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer accent-primary"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Analisando...' : <><Sparkles className="w-4 h-4" /> Calcular</>}
        </button>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3"
          >
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Custo:</span>
              <span className="font-bold">R$ {result.costEstimate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-white/60">Preço Sugerido:</span>
              <span className="font-black text-green-400">R$ {result.suggestedPrice.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-primary font-bold mb-1 flex items-center gap-1"><Brain className="w-3 h-3" /> Neuromarketing</p>
              <p className="text-sm text-white/70">{result.tip}</p>
            </div>
          </motion.div>
        )}
      </div>
    </ModalWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL: REVIEWS
// ══════════════════════════════════════════════════════════════════

function ReviewsModal({ onClose }: { onClose: () => void }) {
  const [reviewText, setReviewText] = useState('');
  const [stars, setStars] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewRepliesResponse | null>(null);

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
      toast.error(error.message || 'Erro ao gerar');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <ModalWrapper onClose={onClose} title="Gestor de Reputação" icon={ShieldCheck} iconColor="text-blue-400">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-white/60">Cole a avaliação ruim</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Ex: Comida chegou fria e demorou 2 horas..."
            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-primary focus:outline-none resize-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setStars(s)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${stars === s ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              {s}★
            </button>
          ))}
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Gerando...' : <><Sparkles className="w-4 h-4" /> Gerar Resposta</>}
        </button>
        {result && (
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {result.replies.map((reply, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-blue-400">{reply.tone}</span>
                  <button onClick={() => handleCopy(reply.text)} className="text-xs text-white/40 hover:text-white">Copiar</button>
                </div>
                <p className="text-xs text-white/70">{reply.text}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL: CAMPAIGNS
// ══════════════════════════════════════════════════════════════════

function CampaignsModal({ onClose }: { onClose: () => void }) {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!itemName.trim() || !price) {
      toast.error('Preencha nome e preço!');
      return;
    }
    setLoading(true);
    try {
      const campaign = await generateCampaign(itemName, parseFloat(price));
      setResult(campaign);
      toast.success('Campanha criada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('Copiado!');
  };

  return (
    <ModalWrapper onClose={onClose} title="Gerador de Ofertas" icon={Rocket} iconColor="text-orange-400">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-white/60">Nome do Prato</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Ex: X-Bacon Duplo"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-white/60">Preço (R$)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="24.90"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/20 focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Criando...' : <><Sparkles className="w-4 h-4" /> Gerar Campanha</>}
        </button>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
          >
            <p className="text-sm text-white mb-3">{result}</p>
            <button
              onClick={handleCopy}
              className="w-full py-2 rounded-lg bg-white/10 text-sm font-bold hover:bg-white/20 transition-colors"
            >
              Copiar Texto
            </button>
          </motion.div>
        )}
      </div>
    </ModalWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODAL WRAPPER COMPONENT
// ══════════════════════════════════════════════════════════════════

interface ModalWrapperProps {
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}

function ModalWrapper({ onClose, title, icon: Icon, iconColor, children }: ModalWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#121212] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="p-5">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
