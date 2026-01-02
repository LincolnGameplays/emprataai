/**
 * 📅 Campaign Builder - Sequence/Drip Campaign Creator
 * 
 * Visual timeline builder for automated message sequences.
 * Creates campaigns like:
 * - Day 0: Welcome message
 * - Day 3: "Did you like your order?"
 * - Day 7: "We miss you" + discount
 * 
 * Saves to Firestore: campaigns/{id}/steps
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Clock, MessageSquare, Play, Calendar,
  Save, Loader2, ChevronRight, Sparkles, Users, Send,
  Pause, Edit3, Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface CampaignStep {
  day: number;
  message: string;
}

interface Campaign {
  id?: string;
  name: string;
  description?: string;
  steps: CampaignStep[];
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  createdAt: Date;
  targetTag?: string;
}

// Pre-built templates
const CAMPAIGN_TEMPLATES: Campaign[] = [
  {
    name: 'Recuperação de Cliente',
    description: 'Para clientes que não pedem há 30+ dias',
    steps: [
      { day: 0, message: 'Oi {nome}! 👋 Sentimos sua falta por aqui. Temos novidades no cardápio que você vai amar!' },
      { day: 3, message: '{nome}, que tal matar a saudade do seu {prato_favorito}? 😋 Temos uma surpresa esperando por você!' },
      { day: 7, message: 'Última chamada, {nome}! 🔥 Use o cupom VOLTEI10 para 10% de desconto. Válido só hoje!' }
    ],
    status: 'DRAFT',
    createdAt: new Date(),
    targetTag: 'CLIENTE_INATIVO'
  },
  {
    name: 'Boas-vindas VIP',
    description: 'Para novos clientes após primeiro pedido',
    steps: [
      { day: 0, message: 'Obrigado pelo primeiro pedido, {nome}! 🎉 Esperamos que tenha amado. Qualquer feedback, estamos aqui!' },
      { day: 2, message: '{nome}, sabia que você pode ganhar pontos a cada pedido? ⭐ Peça novamente e acumule para descontos!' }
    ],
    status: 'DRAFT',
    createdAt: new Date(),
    targetTag: 'NOVO_CLIENTE'
  }
];

export default function CampaignBuilder() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing campaigns
  useEffect(() => {
    if (!user?.uid) return;
    loadCampaigns();
  }, [user?.uid]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, `users/${user?.uid}/campaigns`));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign));
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Start new campaign
  const handleNewCampaign = () => {
    setEditingCampaign({
      name: '',
      steps: [{ day: 0, message: '' }],
      status: 'DRAFT',
      createdAt: new Date()
    });
  };

  // Use template
  const handleUseTemplate = (template: Campaign) => {
    setEditingCampaign({ ...template, id: undefined });
  };

  // Add step
  const addStep = () => {
    if (!editingCampaign) return;
    const lastDay = editingCampaign.steps[editingCampaign.steps.length - 1]?.day || 0;
    setEditingCampaign({
      ...editingCampaign,
      steps: [...editingCampaign.steps, { day: lastDay + 2, message: '' }]
    });
  };

  // Remove step
  const removeStep = (index: number) => {
    if (!editingCampaign) return;
    const newSteps = [...editingCampaign.steps];
    newSteps.splice(index, 1);
    setEditingCampaign({ ...editingCampaign, steps: newSteps });
  };

  // Update step
  const updateStep = (index: number, field: keyof CampaignStep, value: any) => {
    if (!editingCampaign) return;
    const newSteps = [...editingCampaign.steps];
    (newSteps[index] as any)[field] = value;
    setEditingCampaign({ ...editingCampaign, steps: newSteps });
  };

  // Save campaign
  const handleSave = async () => {
    if (!editingCampaign?.name) {
      toast.error("Dê um nome à campanha");
      return;
    }
    
    if (editingCampaign.steps.some(s => !s.message)) {
      toast.error("Preencha todas as mensagens");
      return;
    }

    setSaving(true);
    try {
      if (editingCampaign.id) {
        // Update existing
        await updateDoc(doc(db, `users/${user?.uid}/campaigns`, editingCampaign.id), {
          name: editingCampaign.name,
          description: editingCampaign.description,
          steps: editingCampaign.steps,
          targetTag: editingCampaign.targetTag,
          updatedAt: new Date()
        });
        toast.success("Campanha atualizada!");
      } else {
        // Create new
        await addDoc(collection(db, `users/${user?.uid}/campaigns`), {
          ...editingCampaign,
          createdAt: new Date()
        });
        toast.success("Campanha criada!");
      }
      
      setEditingCampaign(null);
      loadCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  // Delete campaign
  const handleDelete = async (id: string) => {
    if (!confirm("Excluir campanha?")) return;
    
    try {
      await deleteDoc(doc(db, `users/${user?.uid}/campaigns`, id));
      toast.success("Campanha excluída");
      loadCampaigns();
    } catch (err) {
      toast.error("Erro ao excluir");
    }
  };

  // Insert variable
  const insertVariable = (index: number, variable: string) => {
    if (!editingCampaign) return;
    const currentMsg = editingCampaign.steps[index].message;
    updateStep(index, 'message', currentMsg + ` ${variable}`);
  };

  return (
    <div className="min-h-screen pb-20 space-y-8 animate-in fade-in">
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center">
              <Calendar size={24} className="text-white" />
            </div>
            Réguas de Contato
          </h1>
          <p className="text-white/50 mt-1">Sequências automatizadas para retenção de clientes.</p>
        </div>
        
        {!editingCampaign && (
          <button 
            onClick={handleNewCampaign}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-400 transition-colors"
          >
            <Plus size={18} /> Nova Campanha
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editingCampaign ? (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* CAMPAIGN EDITOR */
          /* ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Campaign Header */}
            <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-xs uppercase font-bold text-white/40 mb-2 block">
                    Nome da Campanha
                  </label>
                  <input 
                    value={editingCampaign.name}
                    onChange={e => setEditingCampaign({...editingCampaign, name: e.target.value})}
                    placeholder="Ex: Recuperação de Cliente Sumido"
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold text-lg focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingCampaign(null)}
                    className="px-4 py-3 rounded-xl border border-white/10 text-white/60 font-bold hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-400 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Salvar
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs uppercase font-bold text-white/40 mb-2 block">
                  Descrição (opcional)
                </label>
                <input 
                  value={editingCampaign.description || ''}
                  onChange={e => setEditingCampaign({...editingCampaign, description: e.target.value})}
                  placeholder="Quando usar esta campanha?"
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white/70 text-sm focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4 relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent -z-10" />

              {editingCampaign.steps.map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  {/* Day Marker */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border-2 border-purple-500/30 flex flex-col items-center justify-center z-10 shadow-xl">
                      <Clock size={14} className="text-purple-400 mb-0.5"/>
                      <span className="text-[10px] font-bold text-white/40">DIA</span>
                      <input 
                        type="number" 
                        min="0"
                        value={step.day}
                        onChange={(e) => updateStep(index, 'day', parseInt(e.target.value) || 0)}
                        className="w-8 bg-transparent text-center font-black text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Message Card */}
                  <div className="flex-1 bg-[#121212] p-5 rounded-2xl border border-white/5 group">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        <MessageSquare size={16} className="text-white/40"/> 
                        Mensagem {index + 1}
                      </h3>
                      {editingCampaign.steps.length > 1 && (
                        <button 
                          onClick={() => removeStep(index)} 
                          className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    <textarea 
                      value={step.message}
                      onChange={(e) => updateStep(index, 'message', e.target.value)}
                      placeholder={index === 0 
                        ? "Olá {nome}, tudo bem? ..." 
                        : "Oi {nome}, vimos que você ainda não voltou..."
                      }
                      className="w-full h-28 bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-purple-500 outline-none resize-none"
                    />
                    
                    {/* Variable Buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-[10px] text-white/30 mr-2">Variáveis:</span>
                      {['{nome}', '{prato_favorito}', '{cardapio}', '{cupom}'].map(v => (
                        <button
                          key={v}
                          onClick={() => insertVariable(index, v)}
                          className="text-[10px] bg-white/5 px-2 py-1 rounded text-purple-300 hover:bg-purple-500/20 transition-colors"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Add Step Button */}
              <div className="pl-20">
                <button 
                  onClick={addStep}
                  className="flex items-center gap-2 text-white/40 hover:text-purple-400 transition-colors font-bold text-sm"
                >
                  <div className="w-8 h-8 rounded-full border border-dashed border-current flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  Adicionar Mensagem
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* CAMPAIGN LIST */
          /* ═══════════════════════════════════════════════════════════════════ */
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Templates */}
            <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                Templates Prontos
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {CAMPAIGN_TEMPLATES.map((template, i) => (
                  <button
                    key={i}
                    onClick={() => handleUseTemplate(template)}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white">{template.name}</h3>
                      <Copy size={14} className="text-white/30 group-hover:text-purple-400" />
                    </div>
                    <p className="text-xs text-white/40 mt-1">{template.description}</p>
                    <p className="text-xs text-purple-400 mt-2">{template.steps.length} mensagens</p>
                  </button>
                ))}
              </div>
            </div>

            {/* My Campaigns */}
            <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
              <h2 className="font-bold text-white mb-4">Minhas Campanhas</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin text-white/30 mx-auto" size={32} />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <Calendar size={40} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold">Nenhuma campanha criada</p>
                  <p className="text-sm mt-1">Use um template ou crie do zero</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div 
                      key={campaign.id}
                      className="bg-black/50 p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          campaign.status === 'ACTIVE' ? 'bg-green-500' : 
                          campaign.status === 'PAUSED' ? 'bg-yellow-500' : 'bg-white/20'
                        }`} />
                        <div>
                          <p className="font-bold text-white">{campaign.name}</p>
                          <p className="text-xs text-white/40">
                            {campaign.steps?.length || 0} mensagens • {campaign.status}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingCampaign(campaign)}
                          className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => campaign.id && handleDelete(campaign.id)}
                          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
