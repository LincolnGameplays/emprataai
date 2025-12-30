import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, CheckCircle2, AlertTriangle, Loader2, Building2,
  Calendar, DollarSign, User
} from 'lucide-react';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { functions, db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { IMaskInput } from 'react-imask';

// Tipos atualizados
interface OnboardFormData {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate: string; // Novo
  companyType: string; // Novo
  phone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string;
  city: string;
  state: string;
}

const COMPANY_TYPES = [
  { value: 'MEI', label: 'MEI (Microempreendedor Individual)' },
  { value: 'LIMITED', label: 'LTDA (Limitada)' },
  { value: 'INDIVIDUAL', label: 'Pessoa Física (CPF)' },
  { value: 'ASSOCIATION', label: 'Associação / ONG' },
];

export default function FinanceSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [financeStatus, setFinanceStatus] = useState<any>(null);

  const [formData, setFormData] = useState<OnboardFormData>({
    name: '',
    email: user?.email || '',
    cpfCnpj: '',
    birthDate: '',
    companyType: 'MEI',
    phone: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    province: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setFinanceStatus(doc.data()?.finance);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleInputChange = (field: keyof OnboardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validação simples de data
    if (formData.birthDate.length < 10) {
      toast.error('Data de nascimento inválida');
      setIsSubmitting(false);
      return;
    }

    try {
      // Converte DD/MM/YYYY para YYYY-MM-DD
      const [day, month, year] = formData.birthDate.split('/');
      const formattedDate = `${year}-${month}-${day}`;

      const onboardFn = httpsCallable(functions, 'financeOnboard');
      await onboardFn({
        ...formData,
        birthDate: formattedDate
      });
      
      toast.success('🎉 Conta ativada com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

  // Se já tiver conta ativa
  if (financeStatus?.status === 'active') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center bg-[#111] rounded-3xl border border-white/10 mt-10">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-white mb-2">Conta Ativa!</h2>
        <p className="text-white/60 mb-6">Você já está habilitado para receber pagamentos.</p>
        <div className="bg-black p-4 rounded-xl border border-white/5 inline-block text-left">
           <p className="text-xs text-white/40 uppercase tracking-widest">ID da Conta</p>
           <code className="text-green-400 font-mono">{financeStatus.asaasAccountId}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-32">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-2">
            Ativar <span className="text-primary">Recebimentos</span>
          </h1>
          <p className="text-white/40">Preencha os dados fiscais para gerar sua subconta bancária.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
          
          {/* TIPO DE CONTA & NOME */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Tipo de Conta</label>
              <select
                value={formData.companyType}
                onChange={(e) => handleInputChange('companyType', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none"
              >
                {COMPANY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Nome Completo / Razão Social</label>
              <input
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                placeholder="Ex: João da Silva ou Pizzaria Ltda"
              />
            </div>
          </div>

          {/* DOCUMENTOS */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">CPF ou CNPJ</label>
              <IMaskInput
                mask={formData.companyType === 'INDIVIDUAL' ? '000.000.000-00' : [{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]}
                value={formData.cpfCnpj}
                onAccept={(val) => handleInputChange('cpfCnpj', val)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                placeholder="Digite apenas números"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Data de Nascimento</label>
              <div className="relative">
                <IMaskInput
                  mask="00/00/0000"
                  value={formData.birthDate}
                  onAccept={(val) => handleInputChange('birthDate', val)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                  placeholder="DD/MM/AAAA"
                />
                <Calendar className="absolute right-4 top-3 text-white/20 w-5 h-5 pointer-events-none" />
              </div>
              <p className="text-[10px] text-white/30 mt-1">Obrigatório para validação da Receita Federal.</p>
            </div>
          </div>

          {/* CONTATO */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Email da Conta</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Celular</label>
              <IMaskInput
                mask="(00) 00000-0000"
                value={formData.phone}
                onAccept={(val) => handleInputChange('phone', val)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* ENDEREÇO (Simplificado para o exemplo, mas ideal manter completo) */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">CEP</label>
              <IMaskInput
                mask="00000-000"
                value={formData.postalCode}
                onAccept={(val) => handleInputChange('postalCode', val)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Endereço com Número</label>
              <input
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                placeholder="Rua Exemplo, 123"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
             <input 
                placeholder="Bairro"
                value={formData.province} 
                onChange={e => handleInputChange('province', e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white"
             />
             <input 
                placeholder="Cidade"
                required
                value={formData.city} 
                onChange={e => handleInputChange('city', e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white"
             />
             <input 
                placeholder="UF"
                required
                maxLength={2}
                value={formData.state} 
                onChange={e => handleInputChange('state', e.target.value.toUpperCase())}
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white"
             />
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
             <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
             <p className="text-xs text-yellow-200/80">
               Seus dados serão enviados para o Asaas para abertura de conta de pagamento. 
               Certifique-se que o CPF/CNPJ está regular na Receita Federal.
             </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary hover:bg-orange-600 rounded-2xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Criar Conta Financeira'}
          </button>

        </form>
      </div>
    </div>
  );
}
