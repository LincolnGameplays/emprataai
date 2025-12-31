import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Bike, ChefHat, User, Plus, Trash2, Key, 
  Loader2, RefreshCw, ShieldCheck, CreditCard, Copy, AlertTriangle
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { toast } from 'sonner';

type StaffRole = 'DRIVER' | 'WAITER' | 'KITCHEN' | 'MANAGER';

interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  phone: string;
  active: boolean;
  vehicle?: string;
  plate?: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    role: 'DRIVER' as StaffRole,
    pin: '',
    vehicle: '',
    plate: ''
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, 'staff'), where('restaurantId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember)));
    });
    return () => unsub();
  }, []);

  // ⚠️ GERADOR DE 6 DÍGITOS (100000 a 999999)
  const generateUniquePin = () => {
    let unique = false;
    let pin = '';
    while (!unique) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      // eslint-disable-next-line no-loop-func
      const exists = staff.find(s => s.pin === pin);
      if (!exists) unique = true;
    }
    return pin;
  };

  const handleGenerateForModal = () => {
      setNewMember(prev => ({ ...prev, pin: generateUniquePin() }));
  };

  useEffect(() => {
    if (isModalOpen && !newMember.pin) handleGenerateForModal();
  }, [isModalOpen]);

  const handleSave = async () => {
    if (!newMember.name || !newMember.phone) return toast.error("Preencha os dados obrigatórios");
    setLoading(true);
    try {
      await addDoc(collection(db, 'staff'), {
        ...newMember,
        restaurantId: auth.currentUser?.uid,
        active: true,
        createdAt: serverTimestamp()
      });
      toast.success("Crachá criado! PIN: " + newMember.pin);
      setIsModalOpen(false);
      setNewMember({ name: '', phone: '', role: 'DRIVER', pin: '', vehicle: '', plate: '' });
    } catch (e) {
      toast.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Revogar acesso?")) await deleteDoc(doc(db, 'staff', id));
  };

  // 🔄 CORREÇÃO DE LEGADO: Botão para atualizar PINs antigos de 4 dígitos para 6
  const upgradeLegacyPin = async (member: StaffMember) => {
      const newPin = generateUniquePin();
      if (confirm(`Atualizar o PIN de ${member.name} para 6 dígitos? Novo será: ${newPin}`)) {
          await updateDoc(doc(db, 'staff', member.id), { pin: newPin });
          toast.success("PIN Atualizado!");
      }
  };

  return (
    <div className="space-y-8 p-6 text-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-black italic flex items-center gap-2">
             <ShieldCheck className="text-primary" /> Staff & Acessos
           </h1>
           <p className="text-white/40">Gerenciamento de crachás digitais.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus size={20} /> NOVO MEMBRO
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.length === 0 && (
          <div className="col-span-full text-center py-20 bg-[#121212] rounded-3xl border border-white/5 border-dashed">
            <Users size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 font-bold">Sua equipe está vazia.</p>
            <p className="text-xs text-white/20">Clique em "Novo Membro" para começar.</p>
          </div>
        )}

        {staff.map((member) => (
          <motion.div 
            key={member.id}
            layout
            className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative group hover:border-white/20 transition-all"
          >
             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Trash2 size={16}/></button>
             </div>

             <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/5 ${
                   member.role === 'DRIVER' ? 'bg-green-500/20 text-green-400' :
                   member.role === 'WAITER' ? 'bg-blue-500/20 text-blue-400' :
                   member.role === 'KITCHEN' ? 'bg-orange-500/20 text-orange-400' :
                   'bg-purple-500/20 text-purple-400'
                }`}>
                   {member.role === 'DRIVER' && <Bike />}
                   {member.role === 'WAITER' && <User />}
                   {member.role === 'KITCHEN' && <ChefHat />}
                   {member.role === 'MANAGER' && <ShieldCheck />}
                </div>
                <div>
                   <h3 className="font-bold text-lg leading-tight">{member.name}</h3>
                   <span className="text-xs font-mono text-white/40 uppercase tracking-widest">{member.role}</span>
                </div>
             </div>

             <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-2 relative overflow-hidden">
                <div className="flex justify-between items-end relative z-10">
                   <div>
                      <p className="text-[9px] uppercase font-bold text-white/30 mb-1 flex items-center gap-1">
                         <Key size={10} /> PIN de Acesso
                      </p>
                      <p className={`text-2xl font-mono font-black tracking-[0.2em] select-all ${member.pin.length < 6 ? 'text-red-400' : 'text-white'}`}>
                         {member.pin}
                      </p>
                   </div>
                   <button onClick={() => { navigator.clipboard.writeText(member.pin); toast.success("PIN copiado!"); }} className="text-white/20 hover:text-white"><Copy size={18} /></button>
                </div>
             </div>

             {/* AVISO SE O PIN FOR ANTIGO (4 DÍGITOS) */}
             {member.pin.length < 6 && (
                 <button 
                    onClick={() => upgradeLegacyPin(member)}
                    className="w-full mt-2 py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 flex items-center justify-center gap-2 hover:bg-red-500/20"
                 >
                    <AlertTriangle size={12} /> Atualizar para 6 Dígitos
                 </button>
             )}

             <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-3">
                <div className="flex items-center gap-2 text-xs text-white/30">
                   <CreditCard size={12} />
                   <span className="font-mono">ID: {member.id.slice(0, 6).toUpperCase()}</span>
                </div>
                {member.role === 'DRIVER' && member.plate && (
                   <span className="text-xs font-bold text-white/40 bg-white/5 px-2 py-1 rounded">
                      {member.plate.toUpperCase()}
                   </span>
                )}
             </div>
          </motion.div>
        ))}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      <AnimatePresence>
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#121212] w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl">
                  <h2 className="text-2xl font-black mb-6">Novo Acesso</h2>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-2">
                        {['DRIVER', 'WAITER', 'KITCHEN', 'MANAGER'].map(r => (
                           <button 
                             key={r} 
                             onClick={() => setNewMember({...newMember, role: r as StaffRole})} 
                             className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                               newMember.role === r 
                                 ? 'bg-white text-black border-white' 
                                 : 'border-white/10 text-white/40 hover:bg-white/5'
                             }`}
                           >
                             {r === 'DRIVER' ? 'ENTREGADOR' : r === 'WAITER' ? 'GARÇOM' : r === 'KITCHEN' ? 'COZINHA' : 'GERENTE'}
                           </button>
                        ))}
                     </div>
                     <input 
                       placeholder="Nome Completo" 
                       value={newMember.name} 
                       onChange={e => setNewMember({...newMember, name: e.target.value})} 
                       className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none" 
                     />
                     <input 
                       placeholder="WhatsApp (Ex: 11999999999)" 
                       value={newMember.phone} 
                       onChange={e => setNewMember({...newMember, phone: e.target.value})} 
                       className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none" 
                     />
                     
                     {/* Campos extras para motorista */}
                     {newMember.role === 'DRIVER' && (
                       <div className="grid grid-cols-2 gap-2">
                         <input 
                           placeholder="Veículo" 
                           value={newMember.vehicle} 
                           onChange={e => setNewMember({...newMember, vehicle: e.target.value})} 
                           className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-primary outline-none" 
                         />
                         <input 
                           placeholder="Placa" 
                           value={newMember.plate} 
                           onChange={e => setNewMember({...newMember, plate: e.target.value})} 
                           className="bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm uppercase focus:border-primary outline-none" 
                         />
                       </div>
                     )}
                     
                     <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex justify-between items-center">
                        <div>
                           <p className="text-[10px] text-primary font-bold uppercase">PIN Gerado (6 Dígitos)</p>
                           <p className="text-3xl font-black font-mono text-white tracking-widest">{newMember.pin}</p>
                        </div>
                        <button onClick={handleGenerateForModal} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><RefreshCw size={16}/></button>
                     </div>

                     <button onClick={handleSave} disabled={loading} className="w-full py-4 bg-primary text-black font-black rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin mx-auto"/> : 'CRIAR CRACHÁ'}
                     </button>
                     <button onClick={() => setIsModalOpen(false)} className="w-full py-2 text-xs text-white/40 font-bold hover:text-white transition-colors">Cancelar</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
