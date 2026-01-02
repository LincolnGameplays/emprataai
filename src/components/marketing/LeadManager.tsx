/**
 * 📊 Lead Manager - Universal Contact Importer
 * 
 * Features:
 * - Import from Excel/CSV files
 * - Sync customers from order history
 * - Automatic phone normalization (55...)
 * - Tag-based organization
 * - Duplicate prevention via phone-based IDs
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  collection, writeBatch, doc, query, where, getDocs, 
  onSnapshot, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import * as XLSX from 'xlsx';
import { 
  Upload, Users, Tag, Database, Loader2, Save, 
  CheckCircle, AlertCircle, Search, Filter, MoreVertical,
  Phone, Calendar, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Lead {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  importedAt: Date;
  lastInteraction?: Date;
  status: 'ACTIVE' | 'BLOCKED' | 'UNSUBSCRIBED';
  totalOrders?: number;
  totalSpent?: number;
}

export default function LeadManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({ imported: 0, duplicates: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Load existing leads
  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(
      collection(db, `users/${user.uid}/leads`),
      orderBy('importedAt', 'desc'),
      limit(100)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
      setLeads(data);
    });
    
    return () => unsub();
  }, [user?.uid]);

  // Get unique tags
  const allTags = [...new Set(leads.flatMap(l => l.tags || []))];

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    const matchesTag = !selectedTag || lead.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. IMPORT FROM EXCEL/CSV
  // ═══════════════════════════════════════════════════════════════════════════
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("Planilha vazia.");
          setLoading(false);
          return;
        }

        await processLeads(data, 'EXCEL_IMPORT');
        toast.success(`${data.length} contatos processados!`);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler arquivo. Use colunas: Nome, Telefone.");
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    e.target.value = '';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SYNC FROM ORDER HISTORY
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSyncCustomers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'orders'), 
        where('restaurantId', '==', user?.uid)
      );
      const snap = await getDocs(q);
      
      const uniqueCustomers = new Map();
      
      snap.docs.forEach(d => {
        const order = d.data();
        if (order.customer?.phone) {
          const phone = normalizePhone(order.customer.phone);
          if (!phone) return;
          
          const existing = uniqueCustomers.get(phone);
          uniqueCustomers.set(phone, {
            name: order.customer.name || existing?.name || 'Cliente',
            phone,
            lastOrder: order.createdAt?.toDate?.() || new Date(),
            totalSpent: (existing?.totalSpent || 0) + (order.total || 0),
            totalOrders: (existing?.totalOrders || 0) + 1
          });
        }
      });

      const leads = Array.from(uniqueCustomers.values());
      
      if (leads.length === 0) {
        toast.info("Nenhum cliente com telefone encontrado nos pedidos.");
      } else {
        await processLeads(leads, 'CLIENTE_ATIVO');
        toast.success(`${leads.length} clientes sincronizados!`);
      }

    } catch (err) {
      console.error(err);
      toast.error("Erro ao sincronizar clientes.");
    }
    setLoading(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PROCESS & SAVE (BATCH)
  // ═══════════════════════════════════════════════════════════════════════════
  const normalizePhone = (phone: string): string | null => {
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length < 10) return null;
    if (!cleaned.startsWith('55')) cleaned = `55${cleaned}`;
    return cleaned;
  };

  const processLeads = async (rawLeads: any[], sourceTag: string) => {
    const batch = writeBatch(db);
    let count = 0;
    let duplicates = 0;
    
    for (const lead of rawLeads) {
      // Try multiple column names
      const rawPhone = lead.phone || lead.Phone || lead.Celular || lead.Telefone || lead.telefone;
      const phone = normalizePhone(String(rawPhone || ''));
      if (!phone) continue;

      const name = lead.name || lead.Name || lead.Nome || lead.nome || 'Cliente';
      
      // Use phone as document ID (prevents duplicates)
      const docRef = doc(db, `users/${user?.uid}/leads`, phone);
      
      batch.set(docRef, {
        name,
        phone,
        tags: [sourceTag],
        importedAt: new Date(),
        lastInteraction: lead.lastOrder || null,
        totalOrders: lead.totalOrders || 0,
        totalSpent: lead.totalSpent || 0,
        status: 'ACTIVE'
      }, { merge: true });

      count++;
      
      // Firestore batch limit is 500
      if (count % 400 === 0) {
        await batch.commit();
      }
    }
    
    if (count > 0) await batch.commit();
    setStats({ imported: count, duplicates });
  };

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-xl text-purple-400">
              <Database size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Central de Leads</h2>
              <p className="text-white/50 text-sm">
                {leads.length} contatos • Centralize para disparo
              </p>
            </div>
          </div>
        </div>

        {/* Import Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Excel Import */}
          <label className="border border-dashed border-white/20 rounded-2xl p-6 text-center hover:bg-white/5 transition-colors group relative cursor-pointer">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              className="sr-only"
              disabled={loading}
            />
            <div className="flex flex-col items-center">
              <Upload size={32} className="text-green-500 mb-3 group-hover:scale-110 transition-transform"/>
              <h3 className="font-bold text-white">Importar Planilha</h3>
              <p className="text-xs text-white/40 mt-1">Suporta .XLSX e .CSV</p>
              <p className="text-[10px] text-white/20 mt-1">Colunas: Nome, Telefone</p>
            </div>
          </label>

          {/* Sync from Orders */}
          <button 
            onClick={handleSyncCustomers}
            disabled={loading}
            className="border border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 transition-colors flex flex-col items-center justify-center"
          >
            {loading ? (
              <Loader2 className="animate-spin text-purple-500 mb-3" size={32}/>
            ) : (
              <Users size={32} className="text-purple-500 mb-3"/>
            )}
            <h3 className="font-bold text-white">Sincronizar Pedidos</h3>
            <p className="text-xs text-white/40 mt-1">Importar clientes do histórico</p>
          </button>
        </div>
        
        {/* Success Message */}
        <AnimatePresence>
          {stats.imported > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3"
            >
              <CheckCircle className="text-green-500 shrink-0" size={20} />
              <p className="text-green-200 font-bold text-sm">
                {stats.imported} contatos processados com sucesso!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LEADS TABLE */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#121212] p-6 rounded-[2rem] border border-white/5">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:border-purple-500 outline-none"
            />
          </div>
          
          {/* Tag Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                !selectedTag ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Todos
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedTag === tag ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Tag size={12} />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Leads List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Users size={40} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold">Nenhum lead encontrado</p>
              <p className="text-sm mt-1">Importe uma planilha ou sincronize pedidos</p>
            </div>
          ) : (
            filteredLeads.map((lead, i) => (
              <motion.div 
                key={lead.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-black/50 p-4 rounded-xl flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white">{lead.name}</p>
                    <p className="text-xs text-white/40 flex items-center gap-2">
                      <Phone size={10} />
                      +{lead.phone}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {lead.totalOrders && lead.totalOrders > 0 && (
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-white/40">{lead.totalOrders} pedidos</p>
                      <p className="text-sm font-bold text-green-400">
                        R$ {(lead.totalSpent || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-1">
                    {lead.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-white/5 text-white/50 text-[10px] px-2 py-1 rounded font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
