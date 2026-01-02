/**
 * 📋 ADMIN APPROVAL DASHBOARD - Restaurant Approval Management
 * 
 * Admin-only page to:
 * - View pending restaurant approvals
 * - Approve/Reject restaurants
 * - See approval history
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, XCircle, Clock, Store, Phone, Mail, 
  MapPin, FileText, AlertTriangle, Loader2, Search,
  Shield, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getPendingApprovals, 
  approveRestaurant, 
  rejectRestaurant,
  RestaurantApproval 
} from '../../services/approvalService';
import { useAuth } from '../../hooks/useAuth';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminApprovals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<RestaurantApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  // ═══════════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    try {
      const data = await getPendingApprovals();
      setApprovals(data);
    } catch (error) {
      console.error('[AdminApprovals] Error:', error);
      toast.error('Erro ao carregar aprovações');
    } finally {
      setLoading(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  async function handleApprove(restaurantId: string) {
    if (!user) return;
    
    setProcessing(restaurantId);
    try {
      await approveRestaurant(restaurantId, user.uid, 'Aprovado via painel admin');
      toast.success('Restaurante aprovado!');
      setApprovals(prev => prev.filter(a => a.restaurantId !== restaurantId));
    } catch (error) {
      toast.error('Erro ao aprovar');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(restaurantId: string) {
    if (!user || !rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    
    setProcessing(restaurantId);
    try {
      await rejectRestaurant(restaurantId, user.uid, rejectReason);
      toast.success('Restaurante rejeitado');
      setApprovals(prev => prev.filter(a => a.restaurantId !== restaurantId));
      setRejectModal(null);
      setRejectReason('');
    } catch (error) {
      toast.error('Erro ao rejeitar');
    } finally {
      setProcessing(null);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center">
              <Shield className="text-purple-400" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black">Aprovações</h1>
              <p className="text-white/40">Gerencie os pedidos de cadastro de restaurantes</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
              <Clock className="text-yellow-400" size={18} />
              <span className="font-bold text-yellow-400">{approvals.length}</span>
              <span className="text-white/40 text-sm">Pendentes</span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {approvals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <CheckCircle size={64} className="text-green-400/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tudo em dia!</h2>
            <p className="text-white/40">Não há aprovações pendentes no momento.</p>
          </motion.div>
        )}

        {/* Approvals List */}
        <div className="space-y-4">
          {approvals.map((approval, index) => (
            <motion.div
              key={approval.restaurantId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#121212] border border-white/5 rounded-2xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                
                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                      <Store className="text-white/40" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{approval.businessName}</h3>
                      <p className="text-white/40 text-sm">{approval.ownerName}</p>
                      <p className="text-white/20 text-xs mt-1">
                        Solicitado em {new Date(approval.requestedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Mail size={14} className="text-white/30" />
                      {approval.ownerEmail}
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Phone size={14} className="text-white/30" />
                      {approval.ownerPhone}
                    </div>
                    <div className="flex items-center gap-2 text-white/60 md:col-span-2">
                      <MapPin size={14} className="text-white/30" />
                      {approval.address}
                    </div>
                    {approval.cnpj && (
                      <div className="flex items-center gap-2 text-white/60">
                        <FileText size={14} className="text-white/30" />
                        CNPJ: {approval.cnpj}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 lg:w-48">
                  <button
                    onClick={() => handleApprove(approval.restaurantId)}
                    disabled={processing === approval.restaurantId}
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {processing === approval.restaurantId ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Aprovar
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setRejectModal(approval.restaurantId)}
                    disabled={processing === approval.restaurantId}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20"
                  >
                    <XCircle size={18} />
                    Rejeitar
                  </button>

                  <a
                    href={`https://wa.me/55${approval.ownerPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-[#25D366]/20"
                  >
                    <Phone size={18} />
                    WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reject Modal */}
        <AnimatePresence>
          {rejectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setRejectModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="text-red-400" size={24} />
                  <h3 className="text-xl font-bold">Rejeitar Restaurante</h3>
                </div>

                <p className="text-white/60 mb-4">
                  Informe o motivo da rejeição. O dono será notificado.
                </p>

                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Ex: CNPJ inválido, endereço não localizado..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 resize-none h-32"
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setRejectModal(null)}
                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleReject(rejectModal)}
                    disabled={!rejectReason.trim() || processing === rejectModal}
                    className="flex-1 bg-red-500 hover:bg-red-400 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    {processing === rejectModal ? 'Rejeitando...' : 'Confirmar Rejeição'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
