import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, 
  Loader2, DollarSign, History, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { formatCurrency } from '../../utils/format';
import { IMaskInput } from 'react-imask';

export default function WalletDashboard() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [hideValues, setHideValues] = useState(false);
  
  // States do Saque
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', pixKey: '', keyType: 'CPF' });

  const fetchBalance = async () => {
    try {
      const getBalanceFn = httpsCallable(functions, 'financeGetBalance');
      const result: any = await getBalanceFn();
      if (result.data.success) {
        setBalance({
          available: result.data.balance,
          pending: result.data.pending
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar saldo');
    } finally {
      setLoading(false);
    }
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

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">
              Carteira <span className="text-primary">Digital</span>
            </h1>
            <p className="text-white/40 text-sm">Gerencie seus lucros em tempo real.</p>
          </div>
          <button 
            onClick={() => setHideValues(!hideValues)}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            {hideValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* MAIN CARD - SALDO */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative z-10">
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Saldo Disponível</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                {hideValues ? '••••••' : formatCurrency(balance.available)}
              </h2>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="flex-1 py-3 px-4 bg-primary hover:bg-orange-600 rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ArrowUpRight className="w-4 h-4" /> Sacar Pix
                </button>
                <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2 text-white/60 text-sm font-medium">
                   <History className="w-4 h-4" /> Histórico
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 flex flex-col justify-center">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-sm font-bold text-white/40 uppercase tracking-widest">A Receber (Futuro)</p>
             </div>
             <p className="text-3xl font-bold text-white/80">
               {hideValues ? '••••••' : formatCurrency(balance.pending)}
             </p>
             <p className="text-xs text-white/30 mt-2">
               Valores de vendas no cartão de crédito aguardando liquidação.
             </p>
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
                <h3 className="text-2xl font-black italic uppercase mb-1">Realizar Saque</h3>
                <p className="text-white/40 text-sm mb-6">Transferência Pix instantânea.</p>

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
                    <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-200/70">
                      Taxa de saque: <strong>R$ 3,50</strong> (cobrada pelo Asaas por transferência).
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

      </div>
    </div>
  );
}
