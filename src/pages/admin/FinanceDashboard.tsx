import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, FileText, Settings, LogOut, Loader2, 
  ArrowUpRight, ArrowDownLeft, DollarSign, Building2,
  AlertTriangle, CheckCircle2, History,
  Upload, Camera, Check, ArrowRight,
  Calendar, Info, Link as LinkIcon, Key, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { functions, db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';
import { IMaskInput } from 'react-imask';

// ============================================================================
// TIPOS E CONSTANTES
// ============================================================================

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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function FinanceDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'wallet' | 'extract' | 'settings'>('wallet');

  // Listeners
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setFinanceData(doc.data()?.finance);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Se carregando
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary w-8 h-8"/></div>;

  // Lógica de Estado: Qual tela mostrar?
  const hasAccount = !!financeData?.asaasAccountId;
  
  // Verificação de documentos: precisa ter enviado ID e Selfie
  const hasDocs = financeData?.documents?.docIdSent && financeData?.documents?.docSelfieSent;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-32">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER GERAL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">
              Financeiro <span className="text-primary">Emprata</span>
            </h1>
            <p className="text-white/40 text-sm">Gestão completa da sua conta digital.</p>
          </div>

          {/* Se tiver conta E documentos OK, mostra abas */}
          {hasAccount && hasDocs && (
            <div className="flex bg-[#121212] p-1 rounded-xl border border-white/10">
              <TabButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon={Wallet} label="Carteira" />
              <TabButton active={activeTab === 'extract'} onClick={() => setActiveTab('extract')} icon={FileText} label="Extrato" />
              <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Ajustes" />
            </div>
          )}
          
          {/* Se tiver conta mas faltar documentos, pode mostrar botão de Logout/Ajustes caso queira cancelar */}
           {hasAccount && !hasDocs && (
             <div className="flex bg-[#121212] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => {
                     const confirm = window.confirm("Deseja desconectar esta conta pendente?");
                     if(confirm) {
                        const fn = httpsCallable(functions, 'financeUnlinkAccount');
                        fn().then(() => window.location.reload());
                     }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Cancelar
                </button>
             </div>
           )}
        </div>

        {/* CONTEÚDO DINÂMICO */}
        <AnimatePresence mode="wait">
          
          {/* ESTADO 1: SEM CONTA (ONBOARDING) */}
          {!hasAccount && (
            <motion.div key="onboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <OnboardingSection user={user} />
            </motion.div>
          )}

          {/* ESTADO 2: FALTA DOCUMENTOS */}
          {hasAccount && !hasDocs && (
             <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <DocumentsSection financeData={financeData} />
             </motion.div>
          )}

          {/* ESTADO 3: CONTA ATIVA (DASHBOARD) */}
          {hasAccount && hasDocs && (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'wallet' && <WalletTab />}
              {activeTab === 'extract' && <ExtractTab />}
              {activeTab === 'settings' && <SettingsTab financeData={financeData} />}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES PRINCIPAIS (ABAS)
// ============================================================================

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        active ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// --- ABA 1: CARTEIRA (Saldo + Saque) ---
function WalletTab() {
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [hide, setHide] = useState(false);
  
  // States do Saque
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', pixKey: '', keyType: 'CPF' });

  const fetchBalance = async () => {
     try {
       const fn = httpsCallable(functions, 'financeGetBalance');
       const res: any = await fn();
       setBalance({ available: res.data.balance, pending: res.data.pending });
     } catch(e) { console.error(e) } finally { setLoading(false) }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);

    const amountNumber = parseFloat(withdrawForm.amount.replace(/[^0-9,]/g, '').replace(',', '.'));

    if (amountNumber > balance.available) {
      toast.error('Saldo insuficiente');
      setWithdrawLoading(false);
      return;
    }

    try {
      const withdrawFn = httpsCallable(functions, 'financeWithdraw');
      await withdrawFn({
        amount: amountNumber,
        pixKey: withdrawForm.pixKey,
        pixKeyType: withdrawForm.keyType
      });
      
      toast.success('💸 Saque realizado com sucesso!');
      setIsWithdrawModalOpen(false);
      setWithdrawForm({ amount: '', pixKey: '', keyType: 'CPF' });
      fetchBalance(); // Atualiza saldo
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar saque');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary"/></div>;

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
         {/* Card Principal */}
         <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
            <div className="relative z-10">
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Saldo Disponível</p>
              <h2 className="text-5xl font-black text-white mb-6 cursor-pointer" onClick={() => setHide(!hide)}>
                 {hide ? '••••••' : formatCurrency(balance.available)}
              </h2>
              <div className="flex gap-3">
                 <button onClick={() => setIsWithdrawModalOpen(true)} className="flex-1 py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 transition-colors">
                    <ArrowUpRight className="w-4 h-4"/> Sacar Pix
                 </button>
              </div>
            </div>
         </div>

         {/* Card Pendente */}
         <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-2 bg-yellow-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-yellow-500"/></div>
               <p className="text-sm font-bold text-white/40 uppercase">A Receber</p>
            </div>
            <p className="text-3xl font-bold text-white/80">{hide ? '••••••' : formatCurrency(balance.pending)}</p>
            <p className="text-xs text-white/30 mt-2">Vendas no crédito aguardando liquidação.</p>
         </div>
      </div>

      {/* MODAL DE SAQUE */}
      <AnimatePresence>
          {isWithdrawModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsWithdrawModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="relative bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl"
              >
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="text-2xl font-black italic uppercase mb-1">Realizar Saque</h3>
                      <p className="text-white/40 text-sm">Transferência Pix instantânea.</p>
                   </div>
                   <button onClick={() => setIsWithdrawModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowDownLeft className="w-4 h-4 rotate-45" /></button>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase">Valor do Saque</label>
                    <IMaskInput
                      mask="R$ num"
                      blocks={{
                        num: { mask: Number, thousandsSeparator: '.', padFractionalZeros: true, radix: ',', scale: 2 }
                      } as any}
                      value={withdrawForm.amount}
                      onAccept={(val: any) => setWithdrawForm({ ...withdrawForm, amount: val })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-2xl font-bold text-white focus:border-primary outline-none"
                      placeholder="R$ 0,00"
                    />
                    <div className="flex justify-between mt-1 text-xs">
                       <span className="text-white/30">Disponível: {formatCurrency(balance.available)}</span>
                       <button type="button" onClick={() => setWithdrawForm({...withdrawForm, amount: balance.available.toFixed(2).replace('.',',')})} className="text-primary font-bold hover:underline">
                         Sacar Tudo
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                     {['CPF', 'CNPJ', 'EMAIL'].map(type => (
                       <button
                         key={type} type="button"
                         onClick={() => setWithdrawForm({ ...withdrawForm, keyType: type })}
                         className={`py-2 rounded-lg text-xs font-bold border transition-colors ${withdrawForm.keyType === type ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10 hover:bg-white/5'}`}
                       >
                         {type}
                       </button>
                     ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/50 uppercase">Chave Pix</label>
                    <input 
                      value={withdrawForm.pixKey}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, pixKey: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                      placeholder={`Digite seu ${withdrawForm.keyType}`}
                    />
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-200/70">
                      Taxa de saque: <strong>R$ 3,50</strong> (cobrada pelo Asaas).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading || !withdrawForm.amount}
                    className="w-full py-4 bg-primary hover:bg-orange-600 rounded-xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {withdrawLoading ? <Loader2 className="animate-spin" /> : 'Confirmar Saque'}
                  </button>
                </form>
              </motion.div>
            </div>
      )}
      </AnimatePresence>
    </>
  );
}

// --- ABA 2: EXTRATO ---
function ExtractTab() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!user) return;
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(20));
    getDocs(q).then(snap => {
       setTransactions(snap.docs.map(d => d.data()));
       setLoading(false);
    });
  }, [user]);

  if(loading) return <Loader2 className="animate-spin mx-auto"/>;

  return (
    <div className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden">
       <div className="p-6 border-b border-white/10">
          <h3 className="font-bold text-lg">Últimas Movimentações</h3>
       </div>
       <div className="divide-y divide-white/10">
          {transactions.length === 0 ? (
             <div className="p-10 text-center text-white/30">Nenhuma transação encontrada.</div>
          ) : transactions.map((tx, i) => (
             <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-full ${tx.type === 'withdraw' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                      {tx.type === 'withdraw' ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownLeft className="w-4 h-4"/>}
                   </div>
                   <div>
                      <p className="font-bold text-sm">{tx.type === 'withdraw' ? 'Saque Pix' : 'Venda Recebida'}</p>
                      <p className="text-xs text-white/40">{tx.date?.toDate ? new Date(tx.date.toDate()).toLocaleDateString() : 'Hoje'}</p>
                   </div>
                </div>
                <span className={`font-mono font-bold ${tx.type === 'withdraw' ? 'text-white' : 'text-green-400'}`}>
                   {tx.type === 'withdraw' ? '-' : '+'}{formatCurrency(tx.amount)}
                </span>
             </div>
          ))}
       </div>
    </div>
  );
}

// --- ABA 3: CONFIGURAÇÕES E DESVINCULAR ---
function SettingsTab({ financeData }: any) {
  const [unlinking, setUnlinking] = useState(false);

  const handleUnlink = async () => {
    const confirm = window.confirm("TEM CERTEZA? Isso vai desconectar sua conta atual.");
    if (!confirm) return;

    setUnlinking(true);
    try {
      const fn = httpsCallable(functions, 'financeUnlinkAccount');
      await fn();
      toast.success("Conta desvinculada.");
      window.location.reload(); 
    } catch (error: any) {
      toast.error("Erro ao desvincular.");
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-6">
       {/* Card de Dados */}
       <div className="bg-[#121212] border border-white/10 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
             <Building2 className="w-5 h-5 text-primary"/> Dados da Conta
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
             <div>
                <p className="text-white/40 mb-1">ID da Conta Asaas</p>
                <code className="bg-black px-3 py-2 rounded border border-white/10 font-mono text-green-400 block w-full">
                   {financeData.asaasAccountId}
                </code>
             </div>
             <div>
                <p className="text-white/40 mb-1">Chave da Carteira (Wallet ID)</p>
                <code className="bg-black px-3 py-2 rounded border border-white/10 font-mono text-white/60 block w-full">
                   {financeData.asaasWalletId}
                </code>
             </div>
             <div>
                <p className="text-white/40 mb-1">Status</p>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 font-bold text-xs uppercase">
                   <CheckCircle2 className="w-3 h-3"/> {financeData.status}
                </span>
             </div>
          </div>
       </div>

       {/* Área de Perigo */}
       <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                <AlertTriangle className="w-6 h-6"/>
             </div>
             <div>
                <h3 className="text-lg font-bold text-red-500 mb-2">Zona de Perigo</h3>
                <p className="text-white/60 text-sm mb-6 max-w-xl">
                   Desvincular sua conta remove o acesso a ela através deste painel. 
                   Seu histórico fiscal permanece no Asaas.
                </p>
                <button 
                   onClick={handleUnlink}
                   disabled={unlinking}
                   className="px-6 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-xl text-red-500 font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2"
                >
                   {unlinking ? <Loader2 className="animate-spin"/> : <LogOut className="w-4 h-4"/>}
                   Desvincular Conta Atual
                </button>
             </div>
          </div>
       </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES (ONBOARDING & DOCS)
// ============================================================================

function OnboardingSection({ user }: any) {
  const [mode, setMode] = useState<'create' | 'link'>('create');
  
  // States para Link
  const [apiKey, setApiKey] = useState('');
  const [linking, setLinking] = useState(false);

  // States para Create
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OnboardFormData>({
    name: '', email: user?.email || '', cpfCnpj: '', birthDate: '', 
    companyType: 'MEI', incomeValue: '', phone: '', postalCode: '', 
    address: '', addressNumber: '', province: '', city: '', state: ''
  });

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação melhorada
    if (apiKey.length < 20 || !apiKey.includes('$')) {
      toast.error('Formato de chave inválido. Certifique-se de copiar a chave completa do Asaas.');
      return;
    }

    setLinking(true);
    try {
      const linkFn = httpsCallable(functions, 'financeLinkExistingAccount');
      await linkFn({ apiKey: apiKey.trim() });
      
      toast.success('Conta conectada com sucesso!');
      // Pequeno delay para o usuário ler o toast antes de recarregar
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao conectar conta');
    } finally {
      setLinking(false);
    }
  };

  const handleInputChange = (field: keyof OnboardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!formData.addressNumber || formData.birthDate.length < 10 || !formData.incomeValue) {
      toast.error('Preencha os campos obrigatórios corretamente.');
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
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
       {/* ABAS DE NAVEGAÇÃO */}
       <div className="grid grid-cols-2 border-b border-white/10">
          <button 
            type="button"
            onClick={() => setMode('create')}
            className={`p-6 text-sm font-bold uppercase tracking-widest transition-all ${
               mode === 'create' 
               ? 'bg-primary/10 text-primary border-b-2 border-primary' 
               : 'text-white/40 hover:bg-white/5'
            }`}
          >
            Não tenho conta
          </button>
          <button 
            type="button"
            onClick={() => setMode('link')}
            className={`p-6 text-sm font-bold uppercase tracking-widest transition-all ${
               mode === 'link' 
               ? 'bg-blue-500/10 text-blue-500 border-b-2 border-blue-500' 
               : 'text-white/40 hover:bg-white/5'
            }`}
          >
            Já tenho conta Asaas
          </button>
       </div>

       <div className="p-8 md:p-10 min-h-[400px]">
          
          {/* MODO 1: CRIAR NOVA */}
          {mode === 'create' && (
             <div className="animate-in fade-in slide-in-from-left-4">
                <div className="mb-8 text-center">
                   <h2 className="text-2xl font-black italic mb-2 text-white">Criar Conta Digital</h2>
                   <p className="text-white/40">Abra sua conta gratuita para receber pagamentos hoje mesmo.</p>
                </div>
                
                <form onSubmit={handleCreateAccount} className="max-w-3xl mx-auto space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-white/60 mb-2 block uppercase">Tipo de Conta</label>
                      <select value={formData.companyType} onChange={(e) => handleInputChange('companyType', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none">
                        {COMPANY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 mb-2 block uppercase">Nome / Razão Social</label>
                      <input required value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="João da Silva" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-white/60 mb-2 block uppercase">CPF ou CNPJ</label>
                      <IMaskInput mask={formData.companyType === 'INDIVIDUAL' ? '000.000.000-00' : [{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }] as any} value={formData.cpfCnpj} onAccept={(v: any) => handleInputChange('cpfCnpj', v)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 mb-2 block uppercase">Data de Nascimento</label>
                      <div className="relative">
                         <IMaskInput mask="00/00/0000" value={formData.birthDate} onAccept={(v: any) => handleInputChange('birthDate', v)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="DD/MM/AAAA" />
                         <Calendar className="absolute right-4 top-3 text-white/20 w-4 h-4 pointer-events-none"/>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                     <div>
                       <label className="text-xs font-bold text-white/60 mb-2 block uppercase">Faturamento Mensal</label>
                       <IMaskInput mask="R$ num" blocks={{ num: { mask: Number, thousandsSeparator: '.', padFractionalZeros: true, radix: ',', mapToRadix: ['.'] } } as any} value={formData.incomeValue} onAccept={(v: any) => handleInputChange('incomeValue', v)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="R$ 0,00" />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-white/60 mb-2 block uppercase">Email</label>
                       <input type="email" required value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" />
                     </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                     <input placeholder="CEP" value={formData.postalCode} onChange={(e) => handleInputChange('postalCode', e.target.value)} className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
                     <input placeholder="Endereço" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="md:col-span-2 bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
                  </div>
                  <div className="grid md:grid-cols-4 gap-4">
                     <input placeholder="Número" value={formData.addressNumber} onChange={(e) => handleInputChange('addressNumber', e.target.value)} className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
                     <input placeholder="Bairro" value={formData.province} onChange={(e) => handleInputChange('province', e.target.value)} className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
                     <input placeholder="Cidade" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
                     <input placeholder="UF" maxLength={2} value={formData.state} onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())} className="bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
                  </div>
                  
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary hover:bg-orange-600 rounded-2xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Criar Conta Financeira'}
                  </button>
                </form>
             </div>
          )}

          {/* MODO 2: VINCULAR EXISTENTE (Layout Intuitivo com Tutorial) */}
          {mode === 'link' && (
             <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
                <div className="text-center mb-10">
                   <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                      <LinkIcon className="w-10 h-10" />
                   </div>
                   <h2 className="text-3xl font-black italic mb-3 text-white">Conectar Asaas</h2>
                   <p className="text-white/50 text-lg">
                      Utilize sua conta existente para gerenciar tudo pelo Emprata.
                   </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                   {/* Coluna Instruções */}
                   <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                         <HelpCircle className="w-4 h-4 text-blue-400"/> Como pegar a chave?
                      </h4>
                      <ol className="space-y-4 text-sm text-white/60">
                         <li className="flex gap-3">
                            <span className="flex-none w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">1</span>
                            <span>Acesse o painel do Asaas no computador.</span>
                         </li>
                         <li className="flex gap-3">
                            <span className="flex-none w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">2</span>
                            <span>Vá no menu <strong className="text-white">Configurações</strong> e depois em <strong className="text-white">Integrações</strong>.</span>
                         </li>
                         <li className="flex gap-3">
                            <span className="flex-none w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">3</span>
                            <span>Clique em <strong className="text-white">"Gerar nova chave de API"</strong>.</span>
                         </li>
                         <li className="flex gap-3">
                            <span className="flex-none w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">4</span>
                            <span>Copie a chave inteira (começa com <code className="text-blue-400">$</code>) e cole ao lado.</span>
                         </li>
                      </ol>
                   </div>

                   {/* Coluna Formulário */}
                   <form onSubmit={handleLinkAccount} className="flex flex-col justify-center space-y-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            <Key className="w-4 h-4" /> Cole sua Chave API Aqui
                         </label>
                         <textarea 
                            required
                            rows={3}
                            placeholder="$aact_..."
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-mono text-xs resize-none"
                         />
                      </div>

                      <button
                        type="submit"
                        disabled={linking || apiKey.length < 10}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                      >
                        {linking ? <Loader2 className="animate-spin" /> : (
                           <>Conectar Agora <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                   </form>
                </div>
                
                <p className="text-center text-xs text-white/20">
                   Seus dados são criptografados e utilizados apenas para processar pagamentos na plataforma.
                </p>
             </div>
          )}
       </div>
    </div>
  );
}

function DocumentsSection({ financeData }: any) {
    const docs = financeData.documents || {};
    
    // Função de Upload
    const handleDocUpload = async (type: string, base64: string, fileName: string) => {
      try {
        const uploadFn = httpsCallable(functions, 'financeUploadDocuments');
        await uploadFn({ type, fileBase64: base64, fileName });
        toast.success('Documento enviado!');
      } catch (error: any) {
        toast.error('Erro no envio.');
      }
    };

    return (
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-10 text-center max-w-3xl mx-auto">
         <div className="mb-10">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Documentação Pendente</h2>
            <p className="text-white/50 max-w-md mx-auto">Envie seus documentos para validar a conta.</p>
         </div>

         <div className="grid md:grid-cols-3 gap-6 mb-8">
            <DocUploadButton label="Frente RG/CNH" type="IDENTIFICATION" onUpload={handleDocUpload} isDone={docs.docIdSent} />
            <DocUploadButton label="Verso RG/CNH" type="IDENTIFICATION" onUpload={handleDocUpload} isDone={docs.docIdSent} />
            <DocUploadButton label="Selfie" type="SELFIE" onUpload={handleDocUpload} isDone={docs.docSelfieSent} />
         </div>

         <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-xs text-yellow-200/80">O Asaas exige fotos legíveis. A validação pode levar até 48h.</p>
         </div>
      </div>
    )
}

const DocUploadButton = ({ label, type, onUpload, isDone }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      await onUpload(type, reader.result as string, file.name);
      setUploading(false);
    };
  };

  return (
    <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all ${isDone ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-primary/50 hover:bg-white/5'}`}>
      <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFile} disabled={isDone || uploading} />
      {isDone ? (
        <>
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3"><Check className="w-6 h-6 text-white" /></div>
          <span className="text-green-500 font-bold text-sm">Enviado</span>
        </>
      ) : uploading ? (
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
      ) : (
        <>
          <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3 text-white hover:bg-primary transition-colors">
            {type === 'SELFIE' ? <Camera className="w-5 h-5"/> : <Upload className="w-5 h-5"/>}
          </button>
          <span className="text-white/60 font-medium text-sm">{label}</span>
        </>
      )}
    </div>
  );
};
