import { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Shield, CreditCard, 
  Zap, Crown, Star, CheckCircle2, AlertTriangle, Loader2 
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, functions } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import CheckoutModal from '../../components/CheckoutModal'; // Seu modal de pagamento existente
import { IMaskInput } from 'react-imask';

// Configuração dos Planos para Exibição
const PLANS_INFO = {
  free: { 
    label: 'Gratuito', color: 'text-gray-400', 
    features: ['1 Crédito/dia', 'Resolução Padrão'] 
  },
  STARTER: { 
    label: 'Starter', color: 'text-blue-400', 
    features: ['50 Créditos', 'Full HD', 'Suporte Básico'] 
  },
  GROWTH: { 
    label: 'Growth', color: 'text-primary', 
    features: ['200 Créditos', '4K Ultra HD', 'Sem Marca d\'água'] 
  },
  SCALE: { 
    label: 'Scale', color: 'text-purple-400', 
    features: ['Créditos Ilimitados', 'API Access', 'Gerente de Conta'] 
  }
};

export default function UserProfile() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Controle de Checkout
  const [checkoutPlan, setCheckoutPlan] = useState<{plan: 'STARTER'|'GROWTH'|'SCALE', price: number} | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Escuta dados do usuário em tempo real
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      setUserData(doc.data());
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Função para Cancelar Assinatura Atual
  const handleCancelSubscription = async () => {
    if (!window.confirm("Tem certeza que deseja cancelar sua assinatura? Você perderá os benefícios ao fim do ciclo.")) return;
    
    setCancelling(true);
    try {
      // Nota: Você precisa ter exportado 'cancelSubscription' no backend conforme fizemos antes
      const cancelFn = httpsCallable(functions, 'cancelSubscription');
      // Assume que o ID da assinatura está salvo em userData.subscription.id
      const subId = userData?.subscription?.id;
      
      if (!subId) throw new Error("Assinatura não encontrada");

      await cancelFn({ subscriptionId: subId });
      toast.success("Assinatura cancelada com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao cancelar: " + error.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const currentPlanKey = userData?.subscription?.status === 'ACTIVE' 
    ? userData?.subscription?.plan // Ex: 'GROWTH'
    : 'free';

  const currentPlan = PLANS_INFO[currentPlanKey as keyof typeof PLANS_INFO] || PLANS_INFO.free;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-32">
      <div className="max-w-5xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center">
             <User className="w-8 h-8 text-white/50" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">Meu Perfil</h1>
            <p className="text-white/40 text-sm">Gerencie seus dados e sua assinatura.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* COLUNA 1: DADOS PESSOAIS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121212] border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Dados da Conta
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/30 uppercase">Nome</label>
                  <div className="flex items-center gap-3 p-3 bg-black/50 rounded-xl border border-white/5">
                    <User className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-medium">{userData?.name || 'Não informado'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/30 uppercase">Email</label>
                  <div className="flex items-center gap-3 p-3 bg-black/50 rounded-xl border border-white/5">
                    <Mail className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-medium truncate">{userData?.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/30 uppercase">CPF/CNPJ</label>
                  <div className="flex items-center gap-3 p-3 bg-black/50 rounded-xl border border-white/5">
                    <CreditCard className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-medium">{userData?.cpfCnpj || '---'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA 2 e 3: ASSINATURA E PLANOS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* CARD DO PLANO ATUAL */}
            <div className="bg-gradient-to-r from-[#1a1a1a] to-[#121212] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Plano Atual</span>
                   <h2 className={`text-4xl font-black italic mt-1 ${currentPlan.color}`}>
                     {currentPlan.label}
                   </h2>
                 </div>
                 {userData?.subscription?.status === 'ACTIVE' && (
                   <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3" /> ATIVO
                   </span>
                 )}
               </div>

               <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {currentPlan.features.map((feat: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle2 className="w-4 h-4 text-white/20" /> {feat}
                    </div>
                  ))}
               </div>

               {userData?.subscription?.status === 'ACTIVE' && (
                 <div className="pt-6 border-t border-white/10">
                    <button 
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                      className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                    >
                      {cancelling ? <Loader2 className="w-3 h-3 animate-spin"/> : <AlertTriangle className="w-3 h-3" />}
                      Cancelar Assinatura
                    </button>
                 </div>
               )}
            </div>

            {/* UPGRADE SECTION */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-yellow-500" /> Disponível para Upgrade
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                
                {/* PLANO STARTER */}
                {currentPlanKey !== 'STARTER' && currentPlanKey !== 'GROWTH' && currentPlanKey !== 'SCALE' && (
                  <PlanCard 
                    title="Starter" 
                    price="97" 
                    color="blue"
                    features={['50 Créditos', 'Full HD']}
                    onClick={() => setCheckoutPlan({ plan: 'STARTER', price: 97 })}
                  />
                )}

                {/* PLANO GROWTH */}
                {currentPlanKey !== 'GROWTH' && currentPlanKey !== 'SCALE' && (
                  <PlanCard 
                    title="Growth" 
                    price="197" 
                    color="orange"
                    isPopular
                    features={['200 Créditos', '4K Ultra', 'Sem Marca d\'água']}
                    onClick={() => setCheckoutPlan({ plan: 'GROWTH', price: 197 })}
                  />
                )}

                {/* PLANO SCALE */}
                {currentPlanKey !== 'SCALE' && (
                  <PlanCard 
                    title="Scale" 
                    price="497" 
                    color="purple"
                    features={['Créditos Ilimitados', 'API', 'Gerente Dedicado']}
                    onClick={() => setCheckoutPlan({ plan: 'SCALE', price: 497 })}
                  />
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL INTEGRADO */}
      {checkoutPlan && (
        <CheckoutModal 
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          plan={checkoutPlan.plan}
          price={checkoutPlan.price}
        />
      )}
    </div>
  );
}

// Subcomponente de Card de Plano
function PlanCard({ title, price, color, features, onClick, isPopular }: any) {
  const colors: any = {
    blue: 'border-blue-500/30 hover:border-blue-500 bg-blue-500/5',
    orange: 'border-orange-500/30 hover:border-orange-500 bg-orange-500/5',
    purple: 'border-purple-500/30 hover:border-purple-500 bg-purple-500/5',
  };

  const textColors: any = {
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
  };

  return (
    <button 
      onClick={onClick}
      className={`relative text-left p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl w-full ${colors[color]}`}
    >
      {isPopular && (
        <span className="absolute -top-3 right-4 px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full">
          Recomendado
        </span>
      )}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className={`text-lg font-black uppercase italic ${textColors[color]}`}>{title}</h4>
          <p className="text-2xl font-bold text-white">R$ {price}<span className="text-sm text-white/40">/mês</span></p>
        </div>
        {color === 'purple' ? <Crown className={`w-6 h-6 ${textColors[color]}`} /> : <Star className={`w-6 h-6 ${textColors[color]}`} />}
      </div>
      <ul className="space-y-2">
        {features.map((f: string, i: number) => (
          <li key={i} className="text-xs font-medium text-white/60 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-white/20" /> {f}
          </li>
        ))}
      </ul>
      <div className={`mt-4 py-2 rounded-lg text-center text-xs font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-colors ${textColors[color]}`}>
        Fazer Upgrade
      </div>
    </button>
  );
}
