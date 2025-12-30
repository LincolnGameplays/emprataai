import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, FileText, Loader2, 
  AlertTriangle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { IMaskInput } from 'react-imask';

// Formatação de moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wallet' | 'extract'>('wallet');

  // Loading fake inicial
  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="animate-spin text-primary w-8 h-8"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">
              Minha <span className="text-primary">Carteira</span>
            </h1>
            <p className="text-white/40 text-sm">Acompanhe seu saldo e realize saques.</p>
          </div>
          <div className="flex bg-[#121212] p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab('wallet')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'wallet' ? 'bg-white/10 text-white' : 'text-white/40'}`}
            >
              <Wallet className="w-4 h-4" /> Saldo
            </button>
            <button 
              onClick={() => setActiveTab('extract')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'extract' ? 'bg-white/10 text-white' : 'text-white/40'}`}
            >
              <FileText className="w-4 h-4" /> Extrato
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
           {activeTab === 'wallet' ? <WalletTab /> : <ExtractTab />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WalletTab() {
  const [balance, setBalance] = useState({ 
    available: 0, 
    withdrawFee: 5, 
    hasWithdrawAccount: false, 
    isLocked: false, 
    hoursUntilUnlock: 0, 
    pixKey: '' 
  });
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  
  // Config Pix
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('CPF');
  const [configLoading, setConfigLoading] = useState(false);

  const fetchBalance = async () => {
     try {
       const fn = httpsCallable(functions, 'financeGetBalance');
       const res = await fn() as { data: typeof balance };
       setBalance(res.data);
       if(res.data.hasWithdrawAccount) setPixKey(res.data.pixKey);
     } catch(e) { console.error(e) }
  };

  useEffect(() => { fetchBalance(); }, []);

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);
    try {
      const saveFn = httpsCallable(functions, 'saveWithdrawAccount');
      await saveFn({ pixKey, pixKeyType });
      toast.success('Conta de saque salva!');
      setIsConfigModalOpen(false);
      fetchBalance();
    } catch (err: unknown) { 
      const error = err as { message?: string };
      toast.error(error.message || 'Erro ao salvar'); 
    } finally { setConfigLoading(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    const val = parseFloat(withdrawAmount.replace(/[^0-9,]/g, '').replace(',', '.'));
    try {
      const wFn = httpsCallable(functions, 'financeWithdraw');
      await wFn({ amount: val });
      toast.success('Saque enviado com sucesso!');
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      fetchBalance();
    } catch (err: unknown) { 
      const error = err as { message?: string };
      toast.error(error.message || 'Erro no saque'); 
    } finally { setWithdrawLoading(false); }
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
         {/* SALDO */}
         <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
            <div className="relative z-10">
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Saldo Disponível</p>
              <h2 className="text-4xl font-black text-white mb-6">{formatCurrency(balance.available)}</h2>
              <button 
                onClick={() => balance.hasWithdrawAccount ? setIsWithdrawModalOpen(true) : setIsConfigModalOpen(true)}
                disabled={balance.isLocked}
                className="w-full py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold uppercase transition-colors disabled:opacity-50"
              >
                {balance.isLocked ? `Bloqueado (${balance.hoursUntilUnlock}h)` : 'Sacar Pix'}
              </button>
            </div>
         </div>

         {/* CONTA DESTINO */}
         <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Conta de Destino</p>
                  {balance.hasWithdrawAccount ? (
                     <div className="flex items-center gap-2 text-green-400 font-bold">
                       <CheckCircle2 className="w-4 h-4"/> Ativa
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 text-yellow-500 font-bold">
                       <AlertTriangle className="w-4 h-4"/> Pendente
                     </div>
                  )}
               </div>
               <button onClick={() => setIsConfigModalOpen(true)} className="text-xs font-bold text-white/40 hover:text-white underline">
                 Alterar
               </button>
            </div>
            {balance.hasWithdrawAccount ? (
               <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-white/40 mb-1">Chave Pix</p>
                  <p className="font-mono text-lg font-bold truncate">{balance.pixKey}</p>
               </div>
            ) : (
              <p className="text-sm text-white/50">Configure sua chave Pix para receber os saques.</p>
            )}
         </div>
      </div>

      {/* MODAL CONFIG PIX */}
      <AnimatePresence>
        {isConfigModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
              <motion.div 
                initial={{scale:0.95, opacity:0}} 
                animate={{scale:1, opacity:1}} 
                exit={{scale:0.95, opacity:0}}
                className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-8 relative"
              >
                 <button onClick={() => setIsConfigModalOpen(false)} className="absolute top-4 right-4 text-white/30 hover:text-white text-xl">
                   ✕
                 </button>
                 <h3 className="text-xl font-bold mb-4">Configurar Chave Pix</h3>
                 <form onSubmit={handleSavePix} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                       {['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'].map(t => (
                          <button 
                            key={t} 
                            type="button" 
                            onClick={() => setPixKeyType(t)} 
                            className={`text-xs py-2 rounded border transition-colors ${pixKeyType===t ? 'bg-primary border-primary text-white' : 'border-white/10 text-white/40 hover:text-white'}`}
                          >
                            {t}
                          </button>
                       ))}
                    </div>
                    <input 
                      required 
                      value={pixKey} 
                      onChange={e=>setPixKey(e.target.value)} 
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 outline-none focus:border-primary" 
                      placeholder="Sua chave..." 
                    />
                    <button 
                      disabled={configLoading} 
                      className="w-full py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold uppercase transition-colors disabled:opacity-50"
                    >
                      {configLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5"/> : 'Salvar'}
                    </button>
                 </form>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* MODAL SAQUE */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
              <motion.div 
                initial={{scale:0.95, opacity:0}} 
                animate={{scale:1, opacity:1}} 
                exit={{scale:0.95, opacity:0}}
                className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-8 relative"
              >
                 <button onClick={() => setIsWithdrawModalOpen(false)} className="absolute top-4 right-4 text-white/30 hover:text-white text-xl">
                   ✕
                 </button>
                 <h3 className="text-xl font-bold mb-1">Quanto quer sacar?</h3>
                 <p className="text-white/40 text-sm mb-6">
                   Disponível: {formatCurrency(balance.available - balance.withdrawFee)}
                 </p>
                 <form onSubmit={handleWithdraw} className="space-y-4">
                    <IMaskInput 
                       mask="R$ num" 
                       blocks={{ num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',' } } as never}
                       value={withdrawAmount} 
                       onAccept={(v: string)=>setWithdrawAmount(v)}
                       className="w-full bg-black border border-white/10 rounded-xl p-4 text-3xl font-bold text-white outline-none focus:border-primary"
                       placeholder="R$ 0,00"
                    />
                    <div className="bg-yellow-500/10 p-3 rounded-xl text-xs text-yellow-200/70">
                      Taxa de saque: R$ {balance.withdrawFee.toFixed(2)}
                    </div>
                    <button 
                      disabled={withdrawLoading} 
                      className="w-full py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold uppercase transition-colors disabled:opacity-50"
                    >
                      {withdrawLoading ? <Loader2 className="animate-spin mx-auto w-5 h-5"/> : 'Confirmar'}
                    </button>
                 </form>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </>
  );
}

function ExtractTab() {
  const [items, setItems] = useState<Array<{
    id: string;
    type: string;
    value: number;
    description: string;
    date: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fn = httpsCallable(functions, 'financeGetStatement');
     fn().then((res) => {
       const data = res.data as { data: typeof items };
       setItems(data.data || []);
     }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-primary w-8 h-8"/>
    </div>
  );

  return (
     <motion.div 
       initial={{opacity:0, y:10}} 
       animate={{opacity:1, y:0}}
       className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden mt-4"
     >
        {items.length === 0 ? (
          <div className="p-10 text-center text-white/30">Sem movimentações.</div>
        ) : items.map((tx) => (
           <div key={tx.id} className="p-4 border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
              <div>
                <p className="font-bold text-sm">{tx.description}</p>
                <p className="text-xs text-white/40">{tx.date}</p>
              </div>
              <span className={`font-mono font-bold ${tx.type === 'WITHDRAW' ? 'text-red-400' : 'text-green-400'}`}>
                {tx.type === 'WITHDRAW' ? '-' : '+'}
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.value)}
              </span>
           </div>
        ))}
     </motion.div>
  );
}
