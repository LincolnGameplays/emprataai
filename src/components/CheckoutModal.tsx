import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, QrCode, Loader2, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { IMaskInput } from 'react-imask';
import { useAuth } from '../hooks/useAuth';

interface CheckoutModalProps {
  plan: 'STARTER' | 'GROWTH' | 'SCALE';
  price: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ plan, price, isOpen, onClose }: CheckoutModalProps) {
  const { user } = useAuth();
  const [method, setMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  
  // Dados do Cartão
  const [cardData, setCardData] = useState({
    number: '', name: '', expiry: '', ccv: '',
    holderName: '', holderCpf: '', holderPhone: ''
  });

  // Dados do Pix Retornado
  const [pixResult, setPixResult] = useState<{ code: string, image: string } | null>(null);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const createSub = httpsCallable(functions, 'createSubscription');
      
      const payload: any = {
        plan: plan,
        billingType: method
      };

      if (method === 'CREDIT_CARD') {
        const [month, year] = cardData.expiry.split('/');
        payload.creditCard = {
          holderName: cardData.name,
          number: cardData.number.replace(/\s/g, ''),
          expiryMonth: month,
          expiryYear: `20${year}`,
          ccv: cardData.ccv
        };
        payload.creditCardHolder = {
          name: cardData.holderName || user?.displayName || cardData.name,
          email: user?.email,
          cpfCnpj: cardData.holderCpf.replace(/\D/g, ''),
          postalCode: '00000000', // Pode pedir no form se quiser validação estrita
          addressNumber: '0',
          phone: cardData.holderPhone.replace(/\D/g, '')
        };
      }

      const result: any = await createSub(payload);

      if (result.data.success) {
        if (method === 'PIX') {
          setPixResult({
            code: result.data.pixCode,
            image: result.data.pixImage
          });
          setStep('SUCCESS');
        } else {
          toast.success('Assinatura realizada com sucesso!');
          onClose();
        }
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (pixResult?.code) {
      navigator.clipboard.writeText(pixResult.code);
      toast.success('Código Pix copiado!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#121212] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
          <div>
            <h3 className="font-black italic text-xl">Checkout {plan}</h3>
            <p className="text-white/40 text-sm">R$ {price.toFixed(2)} / mês</p>
          </div>
          <button onClick={onClose}><X className="text-white/40 hover:text-white" /></button>
        </div>

        <div className="p-6">
          {step === 'SUCCESS' && pixResult ? (
            <div className="text-center py-4">
              <h3 className="text-green-500 font-bold text-xl mb-4 flex items-center justify-center gap-2">
                <QrCode /> Escaneie para Pagar
              </h3>
              
              <div className="bg-white p-4 rounded-xl inline-block mb-6">
                <img src={`data:image/png;base64,${pixResult.image}`} alt="Pix QRCode" className="w-48 h-48" />
              </div>

              <div className="bg-white/5 p-4 rounded-xl mb-4 break-all text-xs font-mono text-white/50">
                {pixResult.code.substring(0, 40)}...
              </div>

              <button 
                onClick={copyPix}
                className="w-full py-3 bg-primary rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
              >
                <Copy className="w-4 h-4" /> Copiar Código Pix
              </button>
              
              <p className="mt-4 text-xs text-white/30">
                Seu plano será ativado automaticamente após o pagamento.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePayment}>
              {/* Seleção de Método */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setMethod('PIX')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'PIX' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="font-bold text-sm">Pix Instantâneo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('CREDIT_CARD')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'CREDIT_CARD' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="font-bold text-sm">Cartão de Crédito</span>
                </button>
              </div>

              {/* Form do Cartão */}
              {method === 'CREDIT_CARD' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div>
                    <input 
                      required
                      placeholder="Nome impresso no cartão"
                      value={cardData.name}
                      onChange={e => setCardData({...cardData, name: e.target.value.toUpperCase()})}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <IMaskInput 
                      mask="0000 0000 0000 0000"
                      placeholder="Número do Cartão"
                      required
                      value={cardData.number}
                      onAccept={(val: any) => setCardData({...cardData, number: val})}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                    />
                     <div className="flex gap-2">
                        <IMaskInput 
                          mask="00/00" placeholder="MM/AA" required
                          value={cardData.expiry} onAccept={(val: any) => setCardData({...cardData, expiry: val})}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-center"
                        />
                        <IMaskInput 
                          mask="000" placeholder="CVV" required
                          value={cardData.ccv} onAccept={(val: any) => setCardData({...cardData, ccv: val})}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-center"
                        />
                     </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-3 uppercase font-bold">Dados do Titular</p>
                    <div className="grid grid-cols-2 gap-4">
                       <IMaskInput 
                          mask="000.000.000-00" placeholder="CPF do Titular" required
                          value={cardData.holderCpf} onAccept={(val: any) => setCardData({...cardData, holderCpf: val})}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                       />
                       <IMaskInput 
                          mask="(00) 00000-0000" placeholder="Celular" required
                          value={cardData.holderPhone} onAccept={(val: any) => setCardData({...cardData, holderPhone: val})}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                       />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-4 bg-primary hover:bg-orange-600 rounded-xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : `Pagar R$ ${price.toFixed(2)}`}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
