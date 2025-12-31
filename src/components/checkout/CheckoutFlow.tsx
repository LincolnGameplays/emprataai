/**
 * ⚡ CHECKOUT FLOW - Complete Payment Experience ⚡
 * Supports Pix Online, Card (Tokenized), and Pay on Delivery
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, QrCode, Banknote, Loader2, ArrowRight, 
  Copy, Check, AlertTriangle, Shield
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

type PaymentMethod = 'pix_online' | 'credit_online' | 'credit_machine' | 'debit_machine' | 'cash';
type Step = 'method' | 'processing' | 'pix_waiting' | 'success' | 'error';

interface CheckoutFlowProps {
  order: {
    id?: string;
    total: number;
    restaurantId: string;
    customer: {
      name: string;
      cpf: string;
      phone: string;
    };
    items?: any[];
  };
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

interface PixData {
  // Campos retornados pelo backend financeCharge
  pixCode?: string;      // Copia e Cola
  pixImage?: string;     // QR Code Base64
  paymentId?: string;
  invoiceUrl?: string;
  success?: boolean;
}

// ══════════════════════════════════════════════════════════════════
// PAYMENT METHOD OPTIONS
// ══════════════════════════════════════════════════════════════════

const PAYMENT_OPTIONS: { 
  id: PaymentMethod; 
  label: string; 
  description: string; 
  icon: React.ReactNode;
  category: 'online' | 'delivery';
}[] = [
  { 
    id: 'pix_online', 
    label: 'Pix Automático', 
    description: 'Aprovação imediata • Envio mais rápido',
    icon: <QrCode className="w-6 h-6 text-green-400" />,
    category: 'online'
  },
  { 
    id: 'credit_online', 
    label: 'Cartão de Crédito', 
    description: 'Visa, Master, Elo • Parcele em até 12x',
    icon: <CreditCard className="w-6 h-6 text-blue-400" />,
    category: 'online'
  },
  { 
    id: 'credit_machine', 
    label: 'Maquininha (Crédito)', 
    description: 'Pague ao receber',
    icon: <CreditCard className="w-6 h-6" />,
    category: 'delivery'
  },
  { 
    id: 'debit_machine', 
    label: 'Maquininha (Débito)', 
    description: 'Pague ao receber',
    icon: <CreditCard className="w-6 h-6" />,
    category: 'delivery'
  },
  { 
    id: 'cash', 
    label: 'Dinheiro', 
    description: 'Pague ao receber',
    icon: <Banknote className="w-6 h-6 text-green-500" />,
    category: 'delivery'
  },
];

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function CheckoutFlow({ order, onSuccess, onCancel }: CheckoutFlowProps) {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [changeFor, setChangeFor] = useState('');
  const [cardData, setCardData] = useState({ holder: '', number: '', expiry: '', cvv: '' });
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ════════════════════════════════════════════════════════════════
  // HANDLE CONFIRM PAYMENT
  // ════════════════════════════════════════════════════════════════

  const handleConfirm = async () => {
    if (!method) return;
    
    setStep('processing');
    setError(null);

    try {
      // OFFLINE PAYMENTS (Cash/Machine) - Don't call Asaas
      if (['cash', 'credit_machine', 'debit_machine'].includes(method)) {
        // Return data to parent to create order
        onSuccess({
          paymentMethod: method,
          paymentStatus: 'pending',
          changeFor: method === 'cash' ? parseFloat(changeFor.replace(/\D/g, '')) / 100 : undefined,
        });
        return;
      }

      // ONLINE PAYMENTS (Pix/Card) - Call Asaas
      const chargeFn = httpsCallable(functions, 'financeCharge');

      const result = await chargeFn({
        orderId: order.id || `temp_${Date.now()}`,
        amount: order.total,
        restaurantId: order.restaurantId,
        // CORREÇÃO: Backend espera customerData com cpfCnpj
        customerData: {
          name: order.customer.name,
          cpfCnpj: order.customer.cpf.replace(/\D/g, ''), // Remove formatação do CPF
        },
        // CORREÇÃO: Backend espera billingType em CAIXA ALTA
        billingType: method === 'pix_online' ? 'PIX' : 'CREDIT_CARD',
        card: method === 'credit_online' ? cardData : undefined,
      });

      const data = result.data as PixData;

      if (method === 'pix_online') {
        setPixData(data);
        setStep('pix_waiting');
        toast.success('Pix gerado! Escaneie o QR Code para pagar.');
      } else if (method === 'credit_online') {
        // Card payment processed
        onSuccess({
          paymentMethod: method,
          paymentStatus: 'authorized',
          paymentId: data.paymentId,
        });
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Erro ao processar pagamento');
      setStep('error');
    }
  };

  // ════════════════════════════════════════════════════════════════
  // COPY PIX CODE
  // ════════════════════════════════════════════════════════════════

  const handleCopyPix = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode);
      setCopied(true);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#121212] w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-orange-600/10 p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black italic">Pagamento Seguro</h2>
        </div>
        <p className="text-sm text-white/50">
          Total: <span className="text-primary font-black text-lg">R$ {order.total.toFixed(2)}</span>
        </p>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: METHOD SELECTION */}
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Online Options */}
              <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">
                Pague Agora
              </p>
              
              {PAYMENT_OPTIONS.filter(o => o.category === 'online').map(option => (
                <button
                  key={option.id}
                  onClick={() => setMethod(option.id)}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                    method === option.id
                      ? 'bg-primary/10 border-primary text-white'
                      : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  {option.icon}
                  <div className="text-left flex-1">
                    <p className="font-bold text-sm">{option.label}</p>
                    <p className="text-xs opacity-60">{option.description}</p>
                  </div>
                </button>
              ))}

              {method === 'credit_online' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <input 
                    placeholder="Nome no Cartão" 
                    onChange={e => setCardData({...cardData, holder: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-primary text-white"
                  />
                  <IMaskInput
                    mask="0000 0000 0000 0000"
                    placeholder="0000 0000 0000 0000"
                    onAccept={(val) => setCardData({...cardData, number: val})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-primary text-white"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <IMaskInput
                      mask="00/00"
                      placeholder="MM/AA"
                      onAccept={(val) => setCardData({...cardData, expiry: val})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-primary text-white"
                    />
                    <IMaskInput
                      mask="000"
                      placeholder="CVV"
                      onAccept={(val) => setCardData({...cardData, cvv: val})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-primary text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 justify-center">
                    <Shield size={12} /> Seus dados são criptografados e processados pelo Asaas
                  </div>
                </motion.div>
              )}

              {/* Delivery Options */}
              <p className="text-xs font-black uppercase tracking-widest text-white/40 mt-6 mb-2">
                Pague na Entrega
              </p>
              
              {PAYMENT_OPTIONS.filter(o => o.category === 'delivery').map(option => (
                <button
                  key={option.id}
                  onClick={() => setMethod(option.id)}
                  className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                    method === option.id
                      ? 'bg-white/10 border-white text-white'
                      : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5'
                  }`}
                >
                  {option.icon}
                  <div className="text-left flex-1">
                    <p className="font-bold text-sm">{option.label}</p>
                    <p className="text-xs opacity-60">{option.description}</p>
                  </div>
                </button>
              ))}

              {/* Change Input (Cash) */}
              <AnimatePresence>
                {method === 'cash' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/5 p-4 rounded-2xl mt-2 border border-white/10">
                      <label className="text-xs font-bold text-white/50 mb-2 block uppercase tracking-wider">
                        Precisa de troco para?
                      </label>
                      <IMaskInput
                        mask="R$ num"
                        blocks={{
                          num: {
                            mask: Number,
                            scale: 2,
                            thousandsSeparator: '.',
                            padFractionalZeros: true,
                            radix: ',',
                          },
                        }}
                        value={changeFor}
                        onAccept={(val) => setChangeFor(val)}
                        placeholder="R$ 0,00"
                        className="w-full bg-transparent border-b border-white/20 pb-2 outline-none font-black text-xl text-white"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm Button */}
              <button
                disabled={!method}
                onClick={handleConfirm}
                className="w-full mt-6 py-4 bg-primary hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                Confirmar Pedido
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Cancel */}
              <button
                onClick={onCancel}
                className="w-full py-3 text-white/40 hover:text-white text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          )}

          {/* STEP 2: PIX WAITING */}
          {step === 'pix_waiting' && pixData && (
            <motion.div
              key="pix"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-4"
            >
              {/* QR Code */}
              {pixData.pixImage && (
                <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-xl">
                  <img
                    src={`data:image/png;base64,${pixData.pixImage}`}
                    alt="Pix QR Code"
                    className="w-48 h-48"
                  />
                </div>
              )}

              {/* Copy Paste */}
              {pixData.pixCode && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3 mb-6">
                  <input
                    readOnly
                    value={pixData.pixCode}
                    className="bg-transparent text-xs w-full text-white/50 truncate font-mono"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="flex items-center gap-1 text-primary font-bold text-xs uppercase shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              )}

              {/* Waiting Animation */}
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-bold">Aguardando pagamento...</span>
              </div>

              <p className="text-xs text-white/30 mt-4">
                O pedido será enviado automaticamente após a confirmação
              </p>
            </motion.div>
          )}

          {/* STEP 3: PROCESSING */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-white/60 font-medium">Processando pagamento...</p>
              <p className="text-xs text-white/30 mt-2">Ambiente seguro EmprataAI</p>
            </motion.div>
          )}

          {/* STEP 4: ERROR */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-black mb-2">Erro no Pagamento</h3>
              <p className="text-sm text-white/50 mb-6">{error || 'Tente outro método'}</p>
              <button
                onClick={() => setStep('method')}
                className="px-8 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-colors"
              >
                Tentar Novamente
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
