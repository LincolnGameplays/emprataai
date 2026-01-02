
/**
 * ⚡ CHECKOUT GUARD - Login Required Wrapper ⚡
 * Ensures user is authenticated before accessing checkout
 * Saves customer data to Firestore for future convenience
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, LogIn, Loader2, User, Phone, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { validateDocument, sanitizeInput, validatePhone } from '../../utils/validators';
import { toast } from 'sonner';
import { IMaskInput } from 'react-imask';
import CheckoutFlow from './CheckoutFlow';

interface CheckoutGuardProps {
  cart: any[];
  restaurantId: string;
  total: number;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export default function CheckoutGuard({ cart, restaurantId, total, onClose, onSuccess }: CheckoutGuardProps) {
  const { user, loginWithGoogle } = useAuth();
  const [step, setStep] = useState<'login' | 'identity' | 'payment'>('login');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    cpf: '',
  });

  // Check login state and load saved data
  useEffect(() => {
    const init = async () => {
      if (user) {
        setStep('identity');
        
        // Load saved profile data
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCustomerData({
              name: data.name || user.displayName || '',
              phone: data.phone || '',
              cpf: data.cpf || '',
            });
          } else {
            // First time user, use Google display name
            setCustomerData(prev => ({
              ...prev,
              name: user.displayName || '',
            }));
          }
        } catch (err) {
          console.error('Error loading profile:', err);
        }
      } else {
        setStep('login');
      }
      setLoading(false);
    };

    init();
  }, [user]);

  // Handle identity validation and save
  const handleValidateIdentity = async () => {
    // Validate inputs
    const docValidation = validateDocument(customerData.cpf);
    
    if (!customerData.name || customerData.name.split(' ').length < 2) {
      toast.error("Por favor, digite seu nome completo e sobrenome.");
      return;
    }

    if (!docValidation.isValid) {
      toast.error(`O ${docValidation.type || 'CPF'} informado é inválido.`);
      return;
    }

    if (!validatePhone(customerData.phone)) {
      toast.error("Telefone inválido. Use DDD + número.");
      return;
    }

    setSaving(true);

    try {
      // Save to user's profile permanently
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          name: sanitizeInput(customerData.name),
          cpf: customerData.cpf.replace(/\D/g, ''),
          phone: customerData.phone.replace(/\D/g, ''),
          email: user.email,
          updatedAt: new Date(),
        }, { merge: true });
      }

      setStep('payment');
      toast.success('Dados salvos com sucesso!');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Google login
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // useEffect will handle the rest
    } catch (err) {
      toast.error('Erro ao fazer login');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#121212] w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
      >
        {/* STEP 0: LOGIN REQUIRED */}
        {step === 'login' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Shield size={40} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Identifique-se</h2>
              <p className="text-white/60 text-sm">Para sua segurança, faça login para continuar o pedido.</p>
            </div>
            <button 
              onClick={handleLogin}
              className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Entrar com Google
            </button>
            <button
              onClick={onClose}
              className="text-white/40 text-sm hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <p className="text-xs text-white/30">Seus dados estão protegidos pela EmprataAI.</p>
          </div>
        )}

        {/* STEP 1: IDENTITY VALIDATION */}
        {step === 'identity' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white mb-1">Confirme seus dados</h2>
              <p className="text-white/50 text-sm">Essas informações são necessárias para a entrega.</p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <User size={12} /> Nome Completo
                </label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  placeholder="João da Silva"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <FileText size={12} /> CPF
                </label>
                <IMaskInput
                  mask="000.000.000-00"
                  value={customerData.cpf}
                  onAccept={(val) => setCustomerData({ ...customerData, cpf: val })}
                  placeholder="000.000.000-00"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block flex items-center gap-1">
                  <Phone size={12} /> Telefone (WhatsApp)
                </label>
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={customerData.phone}
                  onAccept={(val) => setCustomerData({ ...customerData, phone: val })}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleValidateIdentity}
              disabled={saving}
              className="w-full mt-6 py-4 bg-primary hover:bg-orange-600 disabled:opacity-50 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Continuar para Pagamento
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full mt-3 py-2 text-white/40 hover:text-white text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* STEP 2: PAYMENT (Uses existing CheckoutFlow) */}
        {step === 'payment' && user && (
          <CheckoutFlow
            order={{
              total,
              restaurantId,
              customer: {
                name: customerData.name,
                cpf: customerData.cpf,
                phone: customerData.phone,
              },
              items: cart,
            }}
            onSuccess={(paymentData) => {
              onSuccess({
                ...paymentData,
                customer: {
                  ...customerData,
                  uid: user.uid,
                  email: user.email,
                },
              });
            }}
            onCancel={onClose}
          />
        )}
      </motion.div>
    </div>
  );
}
