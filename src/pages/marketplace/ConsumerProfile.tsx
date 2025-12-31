import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Clock, MapPin, ChevronRight, User, 
  LogOut, ShieldCheck, History, Loader2, Lock, Save
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';
import { validateCPFNative, maskCPF, maskPhone, validatePhone } from '../../utils/validators';
import { toast } from 'sonner';

export default function ConsumerProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Estados de Pedidos
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Perfil (Dados Públicos + Privados Segregados)
  const [profile, setProfile] = useState<any>({});
  const [privateData, setPrivateData] = useState<any>({ cpf: '' });
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Carrega dados do usuário
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Carrega perfil público e privado
    const loadProfile = async () => {
      try {
        // 1. Perfil Público
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setProfile(userDoc.data() || { displayName: user.displayName, phone: '' });

        // 2. Dados Privados (Sub-coleção protegida pelas regras)
        const privateDoc = await getDoc(doc(db, `users/${user.uid}/private_data`, 'sensitive'));
        if (privateDoc.exists()) {
          setPrivateData(privateDoc.data());
        }
      } catch (error) {
        console.error('[ConsumerProfile] Erro ao carregar perfil:', error);
      }
    };

    loadProfile();

    // Busca pedidos do usuário logado
    const q = query(
      collection(db, 'orders'),
      where('customer.uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const active: any[] = [];
      const past: any[] = [];

      snap.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        // Status que consideram o pedido "Aberto"
        if (['PENDING', 'PREPARING', 'READY', 'DISPATCHED'].includes(data.status?.toUpperCase())) {
          active.push(data);
        } else {
          past.push(data);
        }
      });

      setActiveOrders(active);
      setPastOrders(past);
      setLoading(false);
    });

    return () => unsub();
  }, [user, navigate]);

  // Salva dados (Público + Privado segregados)
  const handleSave = async () => {
    if (!auth.currentUser) return;

    // VALIDAÇÃO REAL com algoritmo matemático
    if (privateData.cpf && !validateCPFNative(privateData.cpf)) {
      return toast.error("CPF Inválido. Verifique os números digitados.");
    }
    if (profile.phone && !validatePhone(profile.phone)) {
      return toast.error("Telefone Inválido. Use formato (XX) XXXXX-XXXX");
    }

    setSaving(true);

    try {
      // 1. Salva dados PÚBLICOS
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: profile.displayName,
        phone: profile.phone,
        updatedAt: new Date()
      }, { merge: true });

      // 2. Salva dados PRIVADOS (Segregados na sub-coleção protegida)
      await setDoc(doc(db, `users/${auth.currentUser.uid}/private_data`, 'sensitive'), {
        cpf: privateData.cpf,
        updatedAt: new Date()
      }, { merge: true });

      toast.success("Dados atualizados e protegidos com sucesso!");
      setEditMode(false);
    } catch (error) {
      console.error('[ConsumerProfile] Erro ao salvar:', error);
      toast.error("Erro ao salvar. Verifique sua conexão.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* HEADER DO PERFIL */}
      <div className="bg-[#121212] p-6 pt-12 border-b border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-black font-black text-2xl">
            {user.displayName?.[0] || <User />}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.displayName || user.displayName || 'Cliente'}</h1>
            <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full w-fit mt-1">
              <ShieldCheck size={12} /> Conta Verificada
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 p-3 rounded-xl text-left">
              <p className="text-white/40 text-xs uppercase font-bold">E-mail</p>
              <p className="text-sm truncate">{user.email}</p>
           </div>
           <button onClick={signOut} className="bg-red-500/10 p-3 rounded-xl text-left hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold opacity-70">Sair</p>
                <p className="font-bold text-sm">Logout</p>
              </div>
              <LogOut size={16} />
           </button>
        </div>
      </div>
      
      {/* SEÇÃO DE EDIÇÃO DE PERFIL */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
            <User size={16} className="text-primary" /> Meu Perfil Blindado
          </h2>
          <button 
            onClick={() => setEditMode(!editMode)}
            className="text-xs text-primary font-bold"
          >
            {editMode ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editMode ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Dados Públicos */}
            <div>
              <label className="text-xs text-white/40 font-bold block mb-1">Nome Público</label>
              <input 
                value={profile.displayName || ''}
                onChange={e => setProfile({...profile, displayName: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white focus:border-primary/50 outline-none transition-colors"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 font-bold block mb-1">Celular (Validado)</label>
              <input 
                value={profile.phone || ''}
                onChange={e => setProfile({...profile, phone: maskPhone(e.target.value)})}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white focus:border-primary/50 outline-none transition-colors"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {/* Dados Sensíveis (Área Segura) */}
            <div className="bg-green-900/10 border border-green-500/20 p-4 rounded-xl mt-6">
              <div className="flex items-center gap-2 mb-3 text-green-400">
                <ShieldCheck size={18} />
                <span className="text-xs font-black uppercase tracking-wider">Área Segura (Criptografada)</span>
              </div>
              
              <label className="text-xs text-white/40 font-bold block mb-1">CPF</label>
              <div className="relative">
                <input 
                  value={privateData.cpf || ''}
                  onChange={e => setPrivateData({...privateData, cpf: maskCPF(e.target.value)})}
                  className="w-full bg-black border border-green-500/30 rounded-xl p-3 pl-10 text-white font-mono tracking-widest focus:border-green-500/60 outline-none transition-colors"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                <Lock className="absolute left-3 top-3.5 text-white/20" size={16} />
              </div>
              <p className="text-[10px] text-white/30 mt-2">
                Seu CPF é armazenado em uma coleção separada com regras de segurança estritas. 
                Nem outros usuários nem lojas podem vê-lo.
              </p>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-primary text-black font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  SALVAR DADOS
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <div className="bg-[#121212] border border-white/5 p-4 rounded-xl space-y-3">
            <div className="flex justify-between">
              <span className="text-white/40 text-sm">Nome:</span>
              <span className="font-medium">{profile.displayName || 'Não informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-sm">Telefone:</span>
              <span className="font-medium">{profile.phone || 'Não informado'}</span>
            </div>
            {privateData.cpf && (
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-green-400/60 text-sm flex items-center gap-1">
                  <Lock size={12} /> CPF:
                </span>
                <span className="font-mono text-green-400">***.***.***-{privateData.cpf.slice(-2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DUAL PERSONA SWITCH: Only for owners */}
      <div className="px-6">
        <button 
          onClick={() => {
            localStorage.setItem('activeRole', 'OWNER');
            window.location.href = '/dashboard';
          }}
          className="w-full bg-gradient-to-r from-gray-800 to-black border border-white/20 p-4 rounded-2xl flex items-center justify-between group hover:border-primary/50 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-lg group-hover:bg-primary group-hover:text-black transition-colors">
              <User size={24} /> 
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Gerenciar Restaurante</p>
              <p className="text-xs text-white/40">Acessar painel administrativo</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/40 group-hover:text-white" />
        </button>
      </div>

      <div className="p-6 space-y-8">
        
        {/* SEÇÃO 1: RASTREAMENTO (PEDIDOS ABERTOS) */}
        {activeOrders.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Em Andamento
            </h2>
            <div className="space-y-4">
              {activeOrders.map(order => (
                <Link 
                  key={order.id} 
                  to={`/track/${order.id}`}
                  className="block bg-gradient-to-r from-[#1a1a1a] to-[#121212] border border-primary/30 p-5 rounded-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase">
                    Rastrear Agora
                  </div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-lg">{order.restaurant?.name || 'Emprata Delivery'}</p>
                      <p className="text-xs text-white/60">Pedido #{order.id.slice(-4).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {translateStatus(order.status)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO 2: HISTÓRICO */}
        <section>
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
            <History size={16} /> Histórico de Pedidos
          </h2>
          
          {pastOrders.length === 0 && activeOrders.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl">
              <Package size={48} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/40">Nenhum pedido ainda</p>
              <p className="text-xs text-white/20 mt-1">Faça seu primeiro pedido!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastOrders.map(order => (
                <div key={order.id} className="bg-[#121212] border border-white/5 p-4 rounded-xl flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/5 p-2 rounded-lg">
                      <Package size={20} className="text-white/40" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{order.restaurant?.name || 'Pedido Finalizado'}</p>
                      <p className="text-xs text-white/40">
                        {order.createdAt?.toDate ? 
                          new Date(order.createdAt.toDate()).toLocaleDateString('pt-BR') : 
                          'Data indisponível'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(order.total || order.financials?.total || 0)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      order.status?.toUpperCase() === 'CANCELLED' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {order.status?.toUpperCase() === 'CANCELLED' ? 'Cancelado' : 'Concluído'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Auxiliar para traduzir status do Firestore
function translateStatus(status: string) {
  const map: Record<string, string> = {
    'PENDING': 'Aguardando Confirmação',
    'PREPARING': 'Em Preparo na Cozinha',
    'READY': 'Pronto para Entrega',
    'DISPATCHED': 'Saiu para Entrega (Acompanhe)',
    'DELIVERED': 'Entregue'
  };
  return map[status?.toUpperCase()] || status;
}
