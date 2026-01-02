/**
 * 📱 WhatsApp Marketing Tool - Neural AI Dispatcher
 * 
 * Features:
 * - AI-powered message personalization per customer
 * - Chip warmup protection with geometric progression
 * - Human-like scheduling to avoid bans
 * - Real-time preview of personalized messages
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { personalizeMessage, CAMPAIGN_TEMPLATES, CustomerProfile } from '../../../services/marketingAi';
import { calculateDailyLimit, getWarmupStatus, generateSchedule, calculateRiskScore, formatSchedulePreview } from '../../../utils/warmupLogic';
import { 
  Send, Zap, Thermometer, Users, MessageCircle, Loader2, Sparkles, 
  AlertTriangle, CheckCircle, Clock, Shield, ChevronRight, RefreshCw,
  Phone, Calendar, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK CRM DATA (Would come from Firestore in production)
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_CUSTOMERS: CustomerProfile[] = [
  { name: "Carlos Silva", phone: "5511999001234", favoriteDish: "X-Bacon Especial", lastOrderDays: 15, totalOrders: 12 },
  { name: "Ana Paula", phone: "5511999005678", favoriteDish: "Pizza Calabresa", lastOrderDays: 3, totalOrders: 8 },
  { name: "Marcos Oliveira", phone: "5511999009012", favoriteDish: "Sushi Combo Premium", lastOrderDays: 45, totalOrders: 3 },
  { name: "Juliana Costa", phone: "5511999003456", favoriteDish: "Hambúrguer Artesanal", lastOrderDays: 7, totalOrders: 22 },
  { name: "Ricardo Santos", phone: "5511999007890", favoriteDish: "Açaí Grande", lastOrderDays: 60, totalOrders: 5 },
];

export default function WhatsappTool() {
  const { user } = useAuth();
  const [baseMessage, setBaseMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<{ customer: CustomerProfile; message: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [targetFilter, setTargetFilter] = useState<'all' | 'dormant' | 'vip'>('all');
  
  // Chip status (would come from Firestore)
  const daysActive = 4;
  const warmupStatus = getWarmupStatus(daysActive);
  const dailyLimit = warmupStatus.dailyLimit;
  
  // Filter customers
  const filteredCustomers = MOCK_CUSTOMERS.filter(c => {
    if (targetFilter === 'dormant') return c.lastOrderDays >= 30;
    if (targetFilter === 'vip') return (c.totalOrders || 0) >= 10;
    return true;
  });

  // Risk assessment
  const riskScore = calculateRiskScore({
    messageCount: filteredCustomers.length,
    daysActive,
    hour: new Date().getHours()
  });

  // Generate schedule preview
  const schedulePreview = generateSchedule(Math.min(filteredCustomers.length, 5));
  const scheduleDisplay = formatSchedulePreview(schedulePreview);

  const handleSelectTemplate = (template: string) => {
    setSelectedTemplate(template);
    setBaseMessage(CAMPAIGN_TEMPLATES.find(t => t.title === template)?.template || '');
    setPreview([]);
  };

  const handleGenerateAI = async () => {
    if (!baseMessage) {
      toast.error("Escreva uma mensagem base primeiro.");
      return;
    }
    
    setIsGenerating(true);
    toast.loading('Gerando variações neurais...');
    
    try {
      const newPreviews: { customer: CustomerProfile; message: string }[] = [];
      
      // Generate for first 3 customers as preview
      const sampleCustomers = filteredCustomers.slice(0, 3);
      
      for (const customer of sampleCustomers) {
        const msg = await personalizeMessage(baseMessage, customer);
        newPreviews.push({ customer, message: msg });
      }
      
      setPreview(newPreviews);
      toast.dismiss();
      toast.success(`${newPreviews.length} mensagens personalizadas!`);
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao gerar mensagens");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartCampaign = () => {
    if (riskScore.level === 'high') {
      toast.error("Risco muito alto! Reduza a quantidade de mensagens.");
      return;
    }
    
    toast.success(`Campanha agendada para ${filteredCustomers.length} clientes!`, {
      description: `Primeiro envio: ${scheduleDisplay[0] || 'Em breve'}`,
      duration: 5000
    });
  };

  return (
    <div className="min-h-screen pb-20 space-y-8 animate-in fade-in">
       
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
              <MessageCircle className="text-white" size={24} />
            </div>
            Marketing Neural
          </h1>
          <p className="text-white/50 mt-1">Disparo em massa inteligente e anti-bloqueio.</p>
        </div>
        
        {/* Status Cards */}
        <div className="flex gap-3">
          <div className="bg-[#121212] px-4 py-3 rounded-xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-white/40">Limite Hoje</p>
            <p className="text-xl font-black text-white">
              {dailyLimit} <span className="text-xs font-normal text-white/40">msgs</span>
            </p>
          </div>
          <div className="bg-[#121212] px-4 py-3 rounded-xl border border-white/10">
            <p className="text-[10px] uppercase font-bold text-white/40">Saúde do Chip</p>
            <p className={`text-xl font-black ${warmupStatus.healthPercentage > 70 ? 'text-green-400' : warmupStatus.healthPercentage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {warmupStatus.healthPercentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Warmup Banner */}
      {warmupStatus.phase !== 'stable' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3"
        >
          <Thermometer className="text-yellow-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-yellow-400 font-bold flex items-center gap-2">
              Modo Aquecimento {warmupStatus.phase === 'new' ? '(Fase Inicial)' : '(Progressivo)'}
            </h4>
            <p className="text-xs text-yellow-100/60 mt-1">
              {warmupStatus.recommendation}
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LEFT PANEL - CREATION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Campaign Templates */}
          <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Templates de Campanha
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {CAMPAIGN_TEMPLATES.map((template) => (
                <button
                  key={template.title}
                  onClick={() => handleSelectTemplate(template.title)}
                  className={`p-4 rounded-xl text-left transition-all border ${
                    selectedTemplate === template.title
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <span className="text-sm font-bold">{template.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Editor */}
          <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
            <label className="text-sm font-bold text-white mb-3 block flex items-center gap-2">
              <MessageCircle size={14} />
              Sua Mensagem Base
            </label>
            <textarea 
              value={baseMessage}
              onChange={(e) => setBaseMessage(e.target.value)}
              className="w-full h-32 bg-black p-4 rounded-xl border border-white/10 text-white focus:border-green-500 outline-none resize-none placeholder:text-white/20"
              placeholder="Ex: Oi sumido! Temos promoção de pizza hoje. Vem conferir!"
            />
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating || !baseMessage}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Sparkles size={18} />
                )}
                PERSONALIZAR COM IA
              </button>
            </div>
          </div>

          {/* Target Filter */}
          <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              Público Alvo
            </h3>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'Todos', count: MOCK_CUSTOMERS.length },
                { id: 'dormant', label: 'Sumidos (+30 dias)', count: MOCK_CUSTOMERS.filter(c => c.lastOrderDays >= 30).length },
                { id: 'vip', label: 'VIP (+10 pedidos)', count: MOCK_CUSTOMERS.filter(c => (c.totalOrders || 0) >= 10).length },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setTargetFilter(filter.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    targetFilter === filter.id
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RIGHT PANEL - PREVIEW & ACTIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Preview */}
          <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5 min-h-[300px]">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              Preview Neural
            </h3>
            
            <AnimatePresence mode="wait">
              {preview.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-48 flex flex-col items-center justify-center text-white/20"
                >
                  <Sparkles size={40} className="mb-4 opacity-50" />
                  <p className="text-center text-sm max-w-xs">
                    A IA vai reescrever sua mensagem para cada cliente usando o histórico de compras.
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {preview.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-green-900/20 border border-green-500/20 p-4 rounded-xl rounded-tl-none"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-green-400">{item.customer.name}</span>
                        <span className="text-[10px] text-white/30">❤️ {item.customer.favoriteDish}</span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {item.message}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Risk & Schedule */}
          <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              Análise de Risco
            </h3>
            
            <div className={`p-4 rounded-xl border ${
              riskScore.level === 'high' 
                ? 'bg-red-500/10 border-red-500/30' 
                : riskScore.level === 'medium'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-green-500/10 border-green-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {riskScore.level === 'high' ? (
                  <AlertTriangle className="text-red-400" size={24} />
                ) : riskScore.level === 'medium' ? (
                  <AlertTriangle className="text-yellow-400" size={24} />
                ) : (
                  <CheckCircle className="text-green-400" size={24} />
                )}
                <div>
                  <p className={`font-bold ${
                    riskScore.level === 'high' ? 'text-red-400' : 
                    riskScore.level === 'medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    Risco {riskScore.level === 'low' ? 'Baixo' : riskScore.level === 'medium' ? 'Médio' : 'Alto'}
                  </p>
                  <p className="text-xs text-white/50">
                    {riskScore.warning || `${filteredCustomers.length} mensagens dentro do limite seguro`}
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule Preview */}
            <div className="mt-4 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-white/60 text-xs font-bold mb-2">
                <Clock size={12} />
                Horários Programados
              </div>
              <div className="flex flex-wrap gap-2">
                {scheduleDisplay.map((time, i) => (
                  <span key={i} className="bg-black px-2 py-1 rounded text-xs text-white/70 font-mono">
                    {time}
                  </span>
                ))}
                {filteredCustomers.length > 5 && (
                  <span className="text-xs text-white/30">+{filteredCustomers.length - 5} mais</span>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <button 
            onClick={handleStartCampaign}
            disabled={preview.length === 0 || riskScore.level === 'high'}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-500/20"
          >
            <Send size={20} />
            INICIAR CAMPANHA ({filteredCustomers.length} clientes)
          </button>
          
          <p className="text-center text-[10px] text-white/20 uppercase tracking-wider">
            Disparos distribuídos entre 10h-20h • Proteção anti-bloqueio ativa
          </p>
        </div>
      </div>
    </div>
  );
}
