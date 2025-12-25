/**
 * ProfilePage Component - Robust Dashboard with Skeleton Loading
 * Defensive code that never shows white screen
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Save, LogOut, Camera,
  Zap, Crown, Calendar, CheckCircle, Loader2, Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/useAppStore';

// ============================================
// SKELETON LOADING COMPONENT
// ============================================
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 animate-pulse">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/10" />
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="h-8 bg-white/10 rounded-lg w-48 mx-auto md:mx-0" />
              <div className="h-4 bg-white/10 rounded w-64 mx-auto md:mx-0" />
            </div>
            
            {/* Badge */}
            <div className="h-12 w-32 bg-white/10 rounded-2xl" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-24 mb-4" />
              <div className="h-8 bg-white/10 rounded w-16 mb-2" />
              <div className="h-3 bg-white/10 rounded w-20" />
            </div>
          ))}
        </div>

        {/* Actions Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 h-14 bg-white/10 rounded-2xl animate-pulse" />
          <div className="flex-1 h-14 bg-white/10 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PROFILE PAGE COMPONENT
// ============================================
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, userData, loading, signOut } = useAuth();
  const { credits, plan } = useAppStore();
  
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Mock stats
  const imagesGenerated = 12;

  // Calculate billing cycle
  const getBillingDates = () => {
    const today = new Date();
    const renewalDate = new Date(today);
    renewalDate.setDate(renewalDate.getDate() + 30);
    
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    };

    return {
      start: formatDate(today),
      renewal: formatDate(renewalDate)
    };
  };

  const billingDates = getBillingDates();

  // Normalize plan for consistent comparison
  const normalizedPlan = plan?.toLowerCase() || 'free';
  const isPro = normalizedPlan === 'pro' || normalizedPlan === 'starter';

  useEffect(() => {
    if (userData?.name) {
      setName(userData.name);
    } else if (user?.displayName) {
      setName(user.displayName);
    }
  }, [userData, user]);

  // ============================================
  // DEFENSIVE GUARDS
  // ============================================
  
  // Guard 1: Show skeleton while loading
  if (loading) {
    return <ProfileSkeleton />;
  }
  
  // Guard 2: Redirect if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;

    try {
      setIsSaving(true);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: name.trim()
      });

      setMessage('✅ Nome atualizado!');
      setIsEditing(false);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating name:', error);
      setMessage('❌ Erro ao atualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleManageSubscription = () => {
    // Link to Kirvano customer portal (placeholder)
    window.open('https://kirvano.com/portal', '_blank');
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pt-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl z-50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Voltar ao Studio</span>
          </button>

          <h1 className="text-xl font-black italic">
            Emprata<span className="text-primary">.ai</span>
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Card Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar with Plan Ring */}
            <div className="relative">
              <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${isPro ? 'from-primary to-orange-600' : 'from-gray-500 to-gray-600'} flex items-center justify-center text-4xl font-black ring-4 ${isPro ? 'ring-primary/30' : 'ring-white/10'}`}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:scale-110 transition-transform ring-2 ring-zinc-950">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              {/* Editable Name */}
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsEditing(true);
                  }}
                  className="text-2xl md:text-3xl font-black bg-transparent border-b-2 border-transparent hover:border-white/20 focus:border-primary focus:outline-none transition-colors max-w-[200px] md:max-w-[300px]"
                  placeholder="Seu Nome"
                />
                {isEditing && (
                  <button
                    onClick={handleSaveName}
                    disabled={isSaving}
                    className="p-2 bg-primary rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Email */}
              <div className="flex items-center gap-2 text-white/60 justify-center md:justify-start">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">{user?.email}</span>
              </div>

              {/* Message */}
              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm font-bold ${message.includes('✅') ? 'text-green-400' : 'text-red-400'}`}
                >
                  {message}
                </motion.p>
              )}
            </div>

            {/* Plan Badge */}
            <div className={`px-6 py-3 rounded-2xl ${isPro ? 'bg-gradient-to-r from-primary to-orange-600' : 'bg-white/10'} text-white font-black text-sm uppercase flex items-center gap-2 shadow-lg`}>
              <Crown className={`w-5 h-5 ${isPro ? 'fill-current' : ''}`} />
              {isPro ? 'ASSINANTE PRO' : 'MEMBRO GRATUITO'}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Card 1: Credits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gradient-to-br from-primary/20 to-orange-600/20 border-2 border-primary/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-primary fill-current" />
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Créditos</h3>
            </div>
            <p className="text-4xl font-black text-white mb-1">{credits}</p>
            <p className="text-xs text-white/40 font-bold">Disponíveis</p>
          </motion.div>

          {/* Card 2: Billing Cycle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Ciclo Atual</h3>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Renovação:</span>
                <span className="font-bold text-sm text-primary">{billingDates.renewal}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-green-400 font-bold text-xs">Ativo</span>
            </div>
          </motion.div>

          {/* Card 3: Images Generated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Imagens</h3>
            </div>
            <p className="text-4xl font-black text-white mb-1">{imagesGenerated}</p>
            <p className="text-xs text-white/40 font-bold">Geradas este mês</p>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button 
            onClick={handleManageSubscription}
            className="flex-1 bg-primary hover:bg-orange-600 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <ExternalLink className="w-5 h-5" />
            Gerenciar Assinatura
          </button>
          <button 
            onClick={handleLogout}
            className="flex-1 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        </motion.div>
      </div>
    </div>
  );
}
