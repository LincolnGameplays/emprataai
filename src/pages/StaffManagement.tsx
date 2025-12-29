/**
 * Staff Management Page
 * Owner's team control panel
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, ChevronLeft, TrendingUp, DollarSign, 
  UserCheck, UserX, Edit2, Trash2, Eye, EyeOff,
  Loader2, Copy, CheckCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../hooks/useAuth';
import { 
  subscribeToStaff, 
  createWaiterAccount, 
  toggleWaiterActive,
  deleteWaiter,
  calculateStaffStats
} from '../services/staffService';
import { formatCurrency } from '../services/analyticsService';
import type { WaiterProfile, StaffStats } from '../types/staff';

// ══════════════════════════════════════════════════════════════════
// GENERATE RANDOM CODE
// ══════════════════════════════════════════════════════════════════

function generateRandomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ══════════════════════════════════════════════════════════════════
// KPI CARD
// ══════════════════════════════════════════════════════════════════

function KPICard({ 
  title, 
  value, 
  icon, 
  color = 'text-primary' 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color?: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 bg-white/5 rounded-xl ${color}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          {title}
        </span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function StaffManagement() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<WaiterProfile[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // New waiter form
  const [newWaiterName, setNewWaiterName] = useState('');
  const [newWaiterCode, setNewWaiterCode] = useState(generateRandomCode());
  const [createdWaiter, setCreatedWaiter] = useState<WaiterProfile | null>(null);

  // Subscribe to staff updates
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToStaff(user.uid, (staffList) => {
      setStaff(staffList);
      setStats(calculateStaffStats(staffList));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Create new waiter
  const handleCreateWaiter = async () => {
    if (!user?.uid || !newWaiterName.trim() || !newWaiterCode.trim()) {
      toast.error('Preencha nome e código');
      return;
    }

    if (newWaiterCode.length < 4) {
      toast.error('Código deve ter pelo menos 4 dígitos');
      return;
    }

    setIsCreating(true);
    try {
      const waiter = await createWaiterAccount({
        name: newWaiterName.trim(),
        code: newWaiterCode,
        ownerId: user.uid,
        restaurantId: user.uid // Using ownerId as restaurantId for now
      });
      
      setCreatedWaiter(waiter);
      toast.success('Garçom criado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar garçom');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle waiter active status
  const handleToggleActive = async (waiter: WaiterProfile) => {
    try {
      await toggleWaiterActive(waiter.id, !waiter.active);
      toast.success(waiter.active ? 'Garçom bloqueado' : 'Garçom ativado');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  // Delete waiter
  const handleDelete = async (waiterId: string) => {
    if (!confirm('Tem certeza que deseja excluir este garçom?')) return;
    
    try {
      await deleteWaiter(waiterId);
      toast.success('Garçom excluído');
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  // Reset modal state
  const resetModal = () => {
    setShowAddModal(false);
    setNewWaiterName('');
    setNewWaiterCode(generateRandomCode());
    setCreatedWaiter(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

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
              <Users className="w-5 h-5 text-primary" />
              Gestão de Equipe
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              Staff Management
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-orange-600 rounded-xl font-bold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Novo Garçom</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Total Equipe"
            value={stats?.totalStaff.toString() || '0'}
            icon={<Users className="w-4 h-4" />}
          />
          <KPICard 
            title="Online Agora"
            value={stats?.onlineNow.toString() || '0'}
            icon={<UserCheck className="w-4 h-4" />}
            color="text-green-400"
          />
          <KPICard 
            title="Vendas via Garçons"
            value={formatCurrency(stats?.totalSalesViaWaiters || 0)}
            icon={<DollarSign className="w-4 h-4" />}
            color="text-blue-400"
          />
          <KPICard 
            title="Top Performer"
            value={stats?.topPerformer?.name || '-'}
            icon={<TrendingUp className="w-4 h-4" />}
            color="text-yellow-400"
          />
        </section>

        {/* Staff List */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-black uppercase tracking-tight">Equipe</h2>
          </div>

          {staff.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-white/10 mb-3" />
              <p className="text-white/40 mb-4">Nenhum garçom cadastrado</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary rounded-xl font-bold text-sm"
              >
                Adicionar Primeiro Garçom
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {staff.map((waiter) => (
                <motion.div
                  key={waiter.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 flex items-center justify-between ${!waiter.active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className={`w-3 h-3 rounded-full ${
                      waiter.isOnline ? 'bg-green-500 animate-pulse' : 
                      waiter.active ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    
                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{waiter.name}</span>
                        {!waiter.active && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase">
                            Bloqueado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40">
                        <span>PIN: <code className="bg-white/10 px-1 rounded">{waiter.code}</code></span>
                        <button 
                          onClick={() => copyCode(waiter.code)}
                          className="hover:text-white transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center gap-6">
                    {/* Performance */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-white/40 text-[10px] uppercase">Vendas</p>
                        <p className="font-bold text-primary">
                          {formatCurrency(waiter.performance.totalSales)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-[10px] uppercase">Pedidos</p>
                        <p className="font-bold">{waiter.performance.totalOrders}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white/40 text-[10px] uppercase">Ticket</p>
                        <p className="font-bold">
                          {formatCurrency(waiter.performance.averageTicket)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(waiter)}
                        className={`p-2 rounded-lg transition-colors ${
                          waiter.active 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        title={waiter.active ? 'Bloquear' : 'Ativar'}
                      >
                        {waiter.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(waiter.id)}
                        className="p-2 bg-white/5 text-white/40 hover:text-red-400 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Waiter Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={resetModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-3xl p-8 max-w-md w-full border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              {!createdWaiter ? (
                <>
                  <h3 className="text-2xl font-black mb-6">Novo Garçom</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                        Nome do Garçom
                      </label>
                      <input
                        type="text"
                        value={newWaiterName}
                        onChange={(e) => setNewWaiterName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                        Código de Acesso (PIN)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newWaiterCode}
                          onChange={(e) => setNewWaiterCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl font-black tracking-widest focus:border-primary focus:outline-none"
                          maxLength={6}
                        />
                        <button
                          onClick={() => setNewWaiterCode(generateRandomCode())}
                          className="px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                          title="Gerar novo código"
                        >
                          🎲
                        </button>
                      </div>
                      <p className="text-xs text-white/30 mt-2">
                        O garçom usará este PIN para fazer login rápido
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={resetModal}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateWaiter}
                      disabled={isCreating || !newWaiterName.trim()}
                      className="flex-1 py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Criar
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  
                  <h3 className="text-2xl font-black mb-2">Garçom Criado!</h3>
                  <p className="text-white/40 mb-6">{createdWaiter.name}</p>
                  
                  <div className="bg-white/5 rounded-2xl p-6 mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Código de Acesso
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-4xl font-black tracking-[0.5em] text-primary">
                        {createdWaiter.code}
                      </span>
                      <button
                        onClick={() => copyCode(createdWaiter.code)}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-400 text-left">
                        Anote este código! O garçom precisará dele para acessar o app.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={resetModal}
                    className="w-full py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold transition-colors"
                  >
                    Concluir
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
