import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { 
  Building2, Wallet, ArrowUpRight, History, 
  AlertTriangle, Lock, CalendarClock, Settings, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceDashboard() {
  const { user } = useAuth();
  
  // Estados de Dados
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    available: 0,
    toReceive: 0,
    pending: 0
  });
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Estados de Configuração Bancária
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('CPF');
  const [isLocked, setIsLocked] = useState(false);
  const [hoursUntilUnlock, setHoursUntilUnlock] = useState(0);

  // 1. Busca Saldo Inteligente (Enterprise)
  const fetchBalance = async () => {
    try {
      const getBalance = httpsCallable(functions, 'financeGetBalance');
      const result: any = await getBalance();
      
      setFinancialData({
        available: result.data.available || result.data.balance || 0,
        toReceive: result.data.toReceive || 0,
        pending: result.data.pending || 0
      });

      // Verifica trava de segurança
      if (result.data.isLocked) {
        setIsLocked(true);
        setHoursUntilUnlock(result.data.hoursUntilUnlock || 0);
      }

      // Busca conta de saque salva
      const getAccount = httpsCallable(functions, 'getWithdrawAccount');
      const accResult: any = await getAccount();
      if (accResult.data.exists) {
        setPixKey(accResult.data.data.pixKey || '');
        setPixKeyType(accResult.data.data.pixKeyType || 'CPF');
      }
      if (accResult.data.isLocked) {
        setIsLocked(true);
        setHoursUntilUnlock(accResult.data.hoursUntilUnlock || 0);
      }

    } catch (error) {
      console.error("Erro ao buscar saldo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  // 2. Função de Saque
  const handleWithdraw = async () => {
    if (!withdrawAmount) return;
    const amount = parseFloat(withdrawAmount.replace(',', '.'));
    
    if (amount > financialData.available) {
      toast.error('Saldo insuficiente.');
      return;
    }

    setWithdrawLoading(true);
    try {
      const withdraw = httpsCallable(functions, 'financeWithdraw');
      const res: any = await withdraw({ amount });
      
      toast.success(res.data.message || 'Saque solicitado com sucesso!');
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      fetchBalance();
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Erro ao processar saque';
      
      if (msg.includes('bloqueado') || msg.includes('Bloqueado')) {
         toast.error('Saque bloqueado por segurança (Troca de Chave Recente).');
      } else {
         toast.error(msg);
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  // 3. Salvar Conta Bancária (Com Trava de Segurança)
  const handleSaveBank = async () => {
    if (!pixKey) {
      toast.error('Informe a chave Pix.');
      return;
    }

    setSaveLoading(true);
    try {
      const saveAccount = httpsCallable(functions, 'saveWithdrawAccount');
      const result: any = await saveAccount({ pixKey, pixKeyType });
      
      toast.success(result.data.message);
      if (result.data.locked) {
        setIsLocked(true);
        setHoursUntilUnlock(24);
      }
      
    } catch (error) {
      toast.error('Erro ao salvar conta.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Formatador de moeda
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">
              <span className="text-primary">Gestão</span> Financeira
            </h1>
            <p className="text-white/40">Controle seu fluxo de caixa e saques.</p>
          </div>
          <div className="flex gap-2 bg-[#121212] p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4 inline mr-2" />
              Visão Geral
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Conta de Saque
            </button>
          </div>
        </div>

        {/* Aviso de Trava de Segurança */}
        {isLocked && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <Lock className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-400">Saques Bloqueados Temporariamente</p>
              <p className="text-sm text-white/60">
                Por segurança, após alterar a chave Pix os saques ficam bloqueados por 24h.
                Restam <strong className="text-white">{hoursUntilUnlock} horas</strong>.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Cards Enterprise */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Card 1: Disponível */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet size={80} className="text-primary" />
                </div>
                <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Disponível para Saque
                </p>
                <h2 className="text-4xl font-black text-white mb-4">
                  {formatCurrency(financialData.available)}
                </h2>
                <button 
                  onClick={() => pixKey ? setWithdrawModalOpen(true) : setActiveTab('settings')}
                  disabled={isLocked}
                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm uppercase transition-colors ${
                    isLocked 
                      ? 'bg-gray-600 text-white/50 cursor-not-allowed' 
                      : 'bg-primary hover:bg-orange-600 text-white'
                  }`}
                >
                  {isLocked ? <Lock size={16} /> : <ArrowUpRight size={16} />}
                  {isLocked ? `Bloqueado (${hoursUntilUnlock}h)` : (pixKey ? 'Sacar Pix' : 'Configurar Conta')}
                </button>
              </div>

              {/* Card 2: A Receber (Futuro) */}
              <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CalendarClock size={80} className="text-blue-500" />
                </div>
                <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-1">A Receber (Crédito)</p>
                <h2 className="text-4xl font-black text-blue-400 mb-4">
                  {formatCurrency(financialData.toReceive)}
                </h2>
                <p className="text-xs text-white/30">
                  Vendas no cartão de crédito aguardando liberação (D+30).
                </p>
              </div>

              {/* Card 3: Status da Conta */}
              <div className="bg-[#121212] border border-white/10 rounded-3xl p-8">
                <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Status da Conta</p>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="text-green-500" />
                  <span className="font-bold text-white">Conta Emprata Ativa</span>
                </div>
                
                {pixKey ? (
                  <div className="bg-black/50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-white/40 mb-1">Chave Pix ({pixKeyType})</p>
                    <p className="font-mono text-white text-sm font-bold truncate">{pixKey}</p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
                    <p className="text-xs text-yellow-200/80">
                      Configure sua chave Pix para poder sacar.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-white/30">
                    Seu dinheiro está seguro e segregado conforme normas do Bacen.
                  </p>
                </div>
              </div>
            </div>

            {/* Histórico Recente */}
            <div className="bg-[#121212] border border-white/10 rounded-3xl p-8">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <History size={20} className="text-white/40" />
                Últimas Movimentações
              </h3>
              <div className="text-center py-10 text-white/30 text-sm bg-black/50 rounded-xl border border-dashed border-white/10">
                O histórico de transações aparecerá aqui assim que houver movimentações.
              </div>
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div className="bg-[#121212] border border-white/10 max-w-2xl mx-auto rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Settings className="text-primary" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Conta de Recebimento</h2>
                <p className="text-sm text-white/40">Para onde enviamos seu dinheiro quando você saca.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Tipo de Chave Pix</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPixKeyType(type)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                        pixKeyType === type 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-transparent text-white/40 border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {type === 'EVP' ? 'Aleat.' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Chave Pix</label>
                <input 
                  type="text" 
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={`Digite seu ${pixKeyType === 'EVP' ? 'código aleatório' : pixKeyType}`}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                />
              </div>

              {isLocked && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 rounded-xl flex gap-3 text-sm">
                  <AlertTriangle size={20} className="shrink-0 text-yellow-500" />
                  <p>
                    <strong>Modo de Segurança Ativo:</strong> Após salvar uma nova chave, 
                    saques ficarão bloqueados por 24 horas.
                  </p>
                </div>
              )}

              <button 
                onClick={handleSaveBank}
                disabled={saveLoading}
                className="w-full py-4 bg-primary hover:bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saveLoading ? <Loader2 className="animate-spin" /> : 'Salvar Conta Bancária'}
              </button>
            </div>
          </div>
        )}

        {/* Modal de Saque */}
        {withdrawModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#121212] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-black italic uppercase mb-6">Realizar Saque</h3>
              
              <div className="mb-6">
                <p className="text-sm text-white/40 mb-1">Disponível</p>
                <p className="text-3xl font-black text-primary">
                  {formatCurrency(financialData.available)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Enviar para</label>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <p className="font-mono text-green-400 font-bold">{pixKey}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Valor do Saque</label>
                <input 
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-2xl font-bold text-white focus:border-primary outline-none"
                />
                <p className="text-xs text-white/30 mt-2">Taxa de transferência: R$ 5,00 (descontado do saldo)</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setWithdrawModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleWithdraw}
                  disabled={withdrawLoading}
                  className="flex-1 py-3 bg-primary hover:bg-orange-600 text-white rounded-xl font-black uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {withdrawLoading ? <Loader2 className="animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
