import { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, AlertTriangle, Loader2, Upload, Camera, FileText, Check,
  Calendar, Info, DollarSign
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
  birthDate: string;
  companyType: string;
  incomeValue: string;
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

// --- Subcomponente: Botão de Upload ---
const DocUploadButton = ({ label, type, onUpload, isDone }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setUploading(true);
    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        await onUpload(type, base64, file.name);
        setUploading(false);
      };
    } catch (err) {
      toast.error('Erro ao processar arquivo');
      setUploading(false);
    }
  };

  return (
    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all ${isDone ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-primary/50 hover:bg-white/5'}`}>
      <input 
        type="file" 
        accept="image/*,application/pdf" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFile}
        disabled={isDone || uploading}
      />
      
      {isDone ? (
        <>
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-green-500/20">
            <Check className="w-6 h-6 text-white" />
          </div>
          <span className="text-green-500 font-bold text-sm">Enviado</span>
        </>
      ) : uploading ? (
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
      ) : (
        <>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 text-white hover:bg-primary hover:text-white transition-colors"
          >
            {type === 'SELFIE' ? <Camera className="w-5 h-5"/> : <Upload className="w-5 h-5"/>}
          </button>
          <span className="text-white/60 font-medium text-sm">{label}</span>
          <span className="text-white/20 text-xs mt-1">JPG, PNG ou PDF</span>
        </>
      )}
    </div>
  );
};

// --- Componente Principal ---

export default function FinanceSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [financeData, setFinanceData] = useState<any>(null);
  
  // State para o Form de Criação
  const [formData, setFormData] = useState<OnboardFormData>({
    name: '',
    email: user?.email || '',
    cpfCnpj: '',
    birthDate: '',
    companyType: 'MEI',
    incomeValue: '',
    phone: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    province: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setFinanceData(doc.data()?.finance);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleInputChange = (field: keyof OnboardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função de Upload conectada ao Backend
  const handleDocUpload = async (type: string, base64: string, fileName: string) => {
    try {
      const uploadFn = httpsCallable(functions, 'financeUploadDocuments');
      await uploadFn({ type, fileBase64: base64, fileName });
      toast.success('Documento enviado com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro no envio. Tente novamente.');
    }
  };

  // Função de Criação de Conta (Onboard)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.addressNumber) {
      toast.error('O Número do endereço é obrigatório.');
      setIsSubmitting(false);
      return;
    }

    if (formData.birthDate.length < 10) {
      toast.error('Data de nascimento inválida');
      setIsSubmitting(false);
      return;
    }

    if (!formData.incomeValue) {
      toast.error('Informe a renda mensal estimada.');
      setIsSubmitting(false);
      return;
    }

    try {
      const [day, month, year] = formData.birthDate.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      const rawIncome = formData.incomeValue.replace(/[^0-9,]/g, '').replace(',', '.');
      const incomeNumber = parseFloat(rawIncome);

      const onboardFn = httpsCallable(functions, 'financeOnboard');
      await onboardFn({ ...formData, birthDate: formattedDate, incomeValue: incomeNumber });
      
      toast.success('Conta criada! Agora envie os documentos.');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary"/></div>;

  // --- ESTÁGIO 2: UPLOAD DE DOCUMENTOS ---
  // Se a conta existe (tem asaasAccountId), mostramos a tela de documentos
  if (financeData?.asaasAccountId) {
    const docs = financeData.documents || {};
    const allSent = docs.docIdSent && docs.docSelfieSent;

    return (
      <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-32">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 text-center">
            
            {allSent ? (
              <div className="py-10">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black text-white mb-2">Conta em Análise!</h2>
                <p className="text-white/60 mb-6 max-w-md mx-auto">
                  Recebemos seus documentos. O Asaas analisará em até 2 dias úteis. Você será notificado.
                </p>
                <div className="bg-black p-4 rounded-xl border border-white/5 inline-block text-left">
                  <p className="text-xs text-white/40 uppercase tracking-widest">Status Atual</p>
                  <code className="text-yellow-500 font-mono">Aguardando Aprovação</code>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-black italic tracking-tighter mb-2">
                    Falta Pouco!
                  </h2>
                  <p className="text-white/50 max-w-lg mx-auto">
                    Para ativar saques e pagamentos, o Banco Central exige o envio de documentos para validação de identidade (KYC).
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <DocUploadButton 
                    label="Frente do RG/CNH" 
                    type="IDENTIFICATION" 
                    onUpload={handleDocUpload} 
                    isDone={docs.docIdSent} 
                  />
                  <DocUploadButton 
                    label="Verso do RG/CNH" 
                    type="IDENTIFICATION" 
                    onUpload={handleDocUpload} 
                    isDone={docs.docIdSent} 
                  />
                  <DocUploadButton 
                    label="Selfie com Documento" 
                    type="SELFIE" 
                    onUpload={handleDocUpload} 
                    isDone={docs.docSelfieSent} 
                  />
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-yellow-200">Requisitos da Selfie</p>
                    <p className="text-xs text-yellow-200/60 mt-1">
                      Segure o documento ao lado do rosto. O ambiente deve estar iluminado. Não use óculos escuros ou chapéu.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ESTÁGIO 1: FORMULÁRIO DE CRIAÇÃO (Se não tem conta ainda) ---
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-32">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter mb-2">
            Ativar <span className="text-primary">Recebimentos</span>
          </h1>
          <p className="text-white/40">Preencha os dados para abrir sua conta digital.</p>
        </div>

        <form onSubmit={handleCreateAccount} className="bg-[#121212] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
          
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
                mask={formData.companyType === 'INDIVIDUAL' ? '000.000.000-00' : [{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }] as any}
                value={formData.cpfCnpj}
                onAccept={(val: any) => handleInputChange('cpfCnpj', val)}
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
                  onAccept={(val: any) => handleInputChange('birthDate', val)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                  placeholder="DD/MM/AAAA"
                />
                <Calendar className="absolute right-4 top-3 text-white/20 w-5 h-5 pointer-events-none" />
              </div>
              <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3"/> Obrigatório para validação da Receita Federal.
              </p>
            </div>
          </div>

          {/* RENDA E TELEFONE */}
          <div className="grid md:grid-cols-2 gap-6">
             <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Faturamento Mensal Estimado</label>
              <div className="relative">
                <IMaskInput
                  mask="R$ num"
                  blocks={{
                    num: {
                      mask: Number,
                      thousandsSeparator: '.',
                      padFractionalZeros: true,
                      normalizeZeros: true,
                      radix: ',',
                      mapToRadix: ['.'],
                      min: 0,
                    }
                  } as any}
                  value={formData.incomeValue}
                  onAccept={(val: any) => handleInputChange('incomeValue', val)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none pl-12"
                  placeholder="0,00"
                />
                <DollarSign className="absolute left-4 top-3 text-white/40 w-5 h-5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Celular</label>
              <IMaskInput
                mask="(00) 00000-0000"
                value={formData.phone}
                onAccept={(val: any) => handleInputChange('phone', val)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
              />
            </div>
          </div>

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
          </div>

          {/* ENDEREÇO */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">CEP</label>
              <IMaskInput
                mask="00000-000"
                value={formData.postalCode}
                onAccept={(val: any) => handleInputChange('postalCode', val)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Endereço (Rua/Av)</label>
              <input
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                placeholder="Ex: Avenida Paulista"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
             <div>
               <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Número</label>
               <input
                 required
                 value={formData.addressNumber}
                 onChange={(e) => handleInputChange('addressNumber', e.target.value)}
                 className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                 placeholder="123"
               />
             </div>
             
             <div>
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Bairro</label>
                <input 
                  value={formData.province} 
                  onChange={e => handleInputChange('province', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                />
             </div>
             
             <div>
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Cidade</label>
                <input 
                  required
                  value={formData.city} 
                  onChange={e => handleInputChange('city', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                />
             </div>
             
             <div>
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">UF</label>
                <input 
                  required
                  maxLength={2}
                  value={formData.state} 
                  onChange={e => handleInputChange('state', e.target.value.toUpperCase())}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                  placeholder="SP"
                />
             </div>
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
