/**
 * ⚡ FINANCE SETTINGS - Restaurant Payment Onboarding ⚡
 * Configure payment receiving via Asaas with plan-based fees
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, CheckCircle2, AlertTriangle, Loader2, Building2,
  User, Mail, Phone, MapPin, FileText, ArrowRight, Zap, Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { functions, db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { IMaskInput } from 'react-imask';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

interface FinanceData {
  asaasAccountId?: string;
  asaasWalletId?: string;
  status?: 'active' | 'pending' | 'blocked';
  onboardedAt?: Date;
}

interface OnboardFormData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string;
  city: string;
  state: string;
}

// ══════════════════════════════════════════════════════════════════
// FEE TABLE (Mirror of backend)
// ══════════════════════════════════════════════════════════════════

const PLAN_FEES = {
  free: { label: '4.99% + R$ 1,49', percentageFee: 4.99, fixedFee: 1.49 },
  starter: { label: '3.99% + R$ 0,99', percentageFee: 3.99, fixedFee: 0.99 },
  growth: { label: '2.49% + R$ 0,50', percentageFee: 2.49, fixedFee: 0.50 },
  scale: { label: '1.49% (Sem taxa fixa)', percentageFee: 1.49, fixedFee: 0 },
};

const PLAN_COLORS = {
  free: 'text-gray-400',
  starter: 'text-blue-400',
  growth: 'text-primary',
  scale: 'text-purple-400',
};

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function FinanceSettings() {
  const { user } = useAuth();
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'starter' | 'growth' | 'scale'>('free');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<OnboardFormData>({
    name: '',
    email: user?.email || '',
    cpfCnpj: '',
    phone: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    province: '',
    city: '',
    state: '',
  });

  // Load user finance data
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        const data = snapshot.data();
        setFinance(data?.finance || null);
        setUserPlan(data?.plan || 'free');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Handle form input
  const handleInputChange = (field: keyof OnboardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Submit onboarding
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const onboardFn = httpsCallable(functions, 'financeOnboard');
      const result = await onboardFn(formData);
      
      toast.success('🎉 Conta de recebimentos ativada!');
      console.log('Onboard result:', result.data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ativar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentFee = PLAN_FEES[userPlan];
  const isOnboarded = !!finance?.asaasAccountId;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-2">
            Configurações <span className="text-primary">Financeiras</span>
          </h1>
          <p className="text-white/40">
            Configure seus recebimentos via Pix e Cartão
          </p>
        </div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Seu Plano</p>
              <h2 className={`text-2xl font-black uppercase ${PLAN_COLORS[userPlan]}`}>
                {userPlan === 'free' ? 'Gratuito' : userPlan}
              </h2>
            </div>
            <Crown className={`w-8 h-8 ${PLAN_COLORS[userPlan]}`} />
          </div>

          <div className="bg-black/40 rounded-2xl p-4 mb-4">
            <p className="text-sm text-white/60 mb-1">Taxa por transação</p>
            <p className="text-xl font-black text-white">{currentFee.label}</p>
          </div>

          {userPlan !== 'scale' && (
            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <Zap className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-primary">
                  Faça upgrade para pagar menos taxas!
                </p>
                <p className="text-xs text-white/40">
                  Plano Scale: apenas 1.49% sem taxa fixa
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          )}
        </motion.div>

        {/* Onboarding Status */}
        <AnimatePresence mode="wait">
          {isOnboarded ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-3xl p-8 text-center"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-black mb-2">Recebimentos Ativos!</h3>
              <p className="text-white/60 mb-4">
                Sua conta está configurada para receber pagamentos via Pix e Cartão.
              </p>
              <div className="bg-black/40 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-1">ID da Conta</p>
                <code className="text-sm text-green-400 font-mono">
                  {finance?.asaasAccountId}
                </code>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Ativar Recebimentos Online</h3>
                  <p className="text-sm text-white/40">Preencha os dados do seu negócio</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                    Nome / Razão Social
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                    placeholder="Nome do estabelecimento"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                      Telefone
                    </label>
                    <IMaskInput
                      mask="(00) 00000-0000"
                      value={formData.phone}
                      onAccept={(value) => handleInputChange('phone', value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* CPF/CNPJ */}
                <div>
                  <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                    CPF ou CNPJ
                  </label>
                  <IMaskInput
                    mask={[
                      { mask: '000.000.000-00', maxLength: 14 },
                      { mask: '00.000.000/0000-00' }
                    ]}
                    value={formData.cpfCnpj}
                    onAccept={(value) => handleInputChange('cpfCnpj', value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                    placeholder="000.000.000-00"
                  />
                </div>

                {/* Address */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                      CEP
                    </label>
                    <IMaskInput
                      mask="00000-000"
                      value={formData.postalCode}
                      onAccept={(value) => handleInputChange('postalCode', value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                      Endereço
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                      placeholder="Rua, Avenida..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                      Número
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.addressNumber}
                      onChange={(e) => handleInputChange('addressNumber', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                      Cidade
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">
                      UF
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                      placeholder="SP"
                    />
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-200/80 leading-relaxed">
                    Ao continuar, você concorda em receber pagamentos via plataforma Asaas.
                    Os dados serão usados exclusivamente para processamento de transações e
                    estão protegidos pela LGPD.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary hover:bg-orange-600 rounded-2xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Ativar Recebimentos Online
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
