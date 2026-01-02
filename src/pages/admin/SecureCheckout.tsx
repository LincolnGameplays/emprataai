/**
 * SecureCheckout - Checkout Blindado com KYC
 * 
 * Fluxo em 2 etapas:
 * 1. Identificação (KYC) - CPF/CNPJ validados antes de prosseguir
 * 2. Pagamento - Só liberado após dados verificados
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { isValidCPF, isValidCNPJ, cleanDigits, maskCPF, maskPhone } from '../../utils/validators';
import { ShieldCheck, Building2, User, CreditCard, QrCode, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface SecureCheckoutProps {
  plan: 'GROWTH' | 'BLACK';
  onBack?: () => void;
}

export default function SecureCheckout({ plan, onBack }: SecureCheckoutProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // Estado do Formulário (Dados Reais)
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    cpf: '',
    phone: '',
    businessName: '',
    cnpj: '',
    address: '',
    zipCode: ''
  });

  // Estado do Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'AUTO_PIX'>('PIX');

  // ETAPA 1: SALVAR E VALIDAR DADOS
  const handleSaveData = async () => {
    // 1. Validações de Segurança
    if (!formData.fullName.trim()) {
      return toast.error("Nome completo é obrigatório.");
    }
    
    if (!isValidCPF(formData.cpf)) {
      return toast.error("CPF Inválido. Verifique os números.");
    }
    
    if (formData.cnpj && !isValidCNPJ(formData.cnpj)) {
      return toast.error("CNPJ Inválido. Verifique os números.");
    }
    
    if (formData.phone.replace(/\D/g, '').length < 10) {
      return toast.error("Telefone inválido.");
    }
    
    if (!formData.businessName) {
      return toast.error("Nome do estabelecimento é obrigatório.");
    }

    setLoading(true);

    try {
      // 2. Salva no Firestore (Agora temos os dados REAIS do dono)
      await updateDoc(doc(db, 'users', user!.uid), {
        personalInfo: {
          fullName: formData.fullName,
          cpf: cleanDigits(formData.cpf),
          phone: cleanDigits(formData.phone),
          address: formData.address
        },
        businessInfo: {
          legalName: formData.businessName,
          cnpj: formData.cnpj ? cleanDigits(formData.cnpj) : null
        },
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date()
      });

      // 3. Avança para Pagamento
      setStep(2);
      toast.success("✅ Dados verificados com segurança.");
    } catch (e) {
      console.error('[SecureCheckout] Error saving data:', e);
      toast.error("Erro ao salvar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 2: PROCESSAR PAGAMENTO NO ASAAS
  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const value = plan === 'GROWTH' ? 149.90 : 299.90;

      // Chama nossa API Segura na Vercel
      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.uid,
          customerData: {
            name: formData.fullName,
            cpfCnpj: cleanDigits(formData.cnpj || formData.cpf),
            email: user!.email,
            phone: cleanDigits(formData.phone)
          },
          billingType: paymentMethod === 'AUTO_PIX' ? 'PIX' : paymentMethod,
          value: value,
          cycle: 'MONTHLY',
          description: `Assinatura Emprata ${plan}`
        })
      });

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
        return;
      }

      // Fallback se não houver URL
      toast.success("Assinatura criada! Verifique seu email.");

    } catch (e) {
      console.error('[SecureCheckout] Payment error:', e);
      toast.error("Falha na comunicação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const planPrice = plan === 'GROWTH' ? '149,90' : '299,90';
  const planName = plan === 'GROWTH' ? 'Growth' : 'Black';

  return (
    <div className="min-h-screen bg-[#050505] py-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        {onBack && (
          <button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
        )}

        <div className="bg-[#121212] p-8 rounded-[2rem] border border-white/10 shadow-2xl">
          
          {/* CABEÇALHO DE PROGRESSO */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-0" />
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step >= 1 ? 'bg-primary text-black' : 'bg-[#1a1a1a] text-white/40'
            }`}>
              1
            </div>
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step >= 2 ? 'bg-primary text-black' : 'bg-[#1a1a1a] text-white/40'
            }`}>
              2
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">
            {step === 1 ? 'Identificação Obrigatória' : 'Forma de Pagamento'}
          </h2>
          <p className="text-sm text-white/50 mb-6 flex items-center gap-2">
            <ShieldCheck size={14} className="text-green-500" /> 
            Ambiente Seguro e Criptografado (256-bit SSL)
          </p>

          {/* --- PASSO 1: DADOS (KYC) --- */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-sm font-bold text-white/70 uppercase mb-3 flex items-center gap-2">
                  <User size={16}/> Dados do Responsável
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Nome Completo"
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="bg-black p-3 rounded-lg border border-white/10 text-white w-full focus:border-primary outline-none transition-colors"
                  />
                  <input 
                    placeholder="CPF (Obrigatório)"
                    value={formData.cpf}
                    onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})}
                    maxLength={14}
                    className="bg-black p-3 rounded-lg border border-white/10 text-white w-full focus:border-primary outline-none transition-colors"
                  />
                  <input 
                    placeholder="Celular / WhatsApp"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})}
                    maxLength={15}
                    className="bg-black p-3 rounded-lg border border-white/10 text-white w-full focus:border-primary outline-none transition-colors md:col-span-2"
                  />
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-sm font-bold text-white/70 uppercase mb-3 flex items-center gap-2">
                  <Building2 size={16}/> Dados da Empresa
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Nome do Estabelecimento"
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                    className="bg-black p-3 rounded-lg border border-white/10 text-white w-full focus:border-primary outline-none transition-colors md:col-span-2"
                  />
                  <input 
                    placeholder="CNPJ (Opcional)"
                    value={formData.cnpj}
                    onChange={e => setFormData({...formData, cnpj: e.target.value})}
                    className="bg-black p-3 rounded-lg border border-white/10 text-white w-full focus:border-primary outline-none transition-colors"
                  />
                  <input 
                    placeholder="Endereço Completo"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="bg-black p-3 rounded-lg border border-white/10 text-white w-full focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveData} 
                disabled={loading}
                className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20}/> : 'VALIDAR E CONTINUAR'}
              </button>
            </motion.div>
          )}

          {/* --- PASSO 2: PAGAMENTO --- */}
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PaymentOption 
                  active={paymentMethod === 'PIX'} 
                  onClick={() => setPaymentMethod('PIX')}
                  icon={QrCode} 
                  title="Pix Imediato" 
                  desc="Liberação instantânea"
                />
                <PaymentOption 
                  active={paymentMethod === 'CREDIT_CARD'} 
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  icon={CreditCard} 
                  title="Cartão" 
                  desc="Até 12x"
                />
                <PaymentOption 
                  active={paymentMethod === 'AUTO_PIX'} 
                  onClick={() => setPaymentMethod('AUTO_PIX')}
                  icon={QrCode} 
                  title="Pix Automático" 
                  desc="Cobrança mensal auto"
                  highlight
                />
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                <p className="text-white font-bold text-lg">
                  Emprata {planName}: R$ {planPrice}/mês
                </p>
                <p className="text-xs text-white/50 mt-1">Cancele a qualquer momento.</p>
              </div>

              <button 
                onClick={handlePayment} 
                disabled={loading}
                className="w-full py-4 bg-green-500 text-black font-black rounded-xl hover:brightness-110 shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20}/>
                ) : (
                  <>
                    <Lock size={18} /> PAGAR COM SEGURANÇA
                  </>
                )}
              </button>

              <button 
                onClick={() => setStep(1)}
                className="w-full text-center text-white/40 hover:text-white text-sm transition-colors"
              >
                ← Voltar para dados
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

interface PaymentOptionProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  desc: string;
  highlight?: boolean;
}

function PaymentOption({ active, onClick, icon: Icon, title, desc, highlight }: PaymentOptionProps) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden ${
        active 
          ? 'bg-white text-black border-white scale-105 shadow-xl' 
          : 'bg-[#1a1a1a] border-white/10 text-white/50 hover:bg-white/5'
      }`}
    >
      {highlight && (
        <div className="absolute top-0 right-0 bg-green-500 text-[8px] text-black font-black px-2 py-1">
          NOVO
        </div>
      )}
      <Icon size={24} className={active ? 'text-black' : 'text-white/40'} />
      <div className="text-center">
        <p className="font-bold text-sm leading-tight">{title}</p>
        <p className="text-[10px] opacity-70 leading-tight mt-1">{desc}</p>
      </div>
    </button>
  );
}
