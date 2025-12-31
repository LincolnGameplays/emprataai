import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'sonner';
import { ShieldCheck, Loader2, ArrowRight, Delete, KeyRound } from 'lucide-react';

export default function StaffLogin() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Foca no input ao abrir
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleLogin = async () => {
    if (pin.length < 6) return toast.error("Digite os 6 dígitos do seu PIN.");
    setLoading(true);

    try {
      // Busca segura
      const q = query(collection(db, 'staff'), where('pin', '==', pin), where('active', '==', true));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error("PIN incorreto ou não encontrado.");
        setPin(''); // Limpa para tentar de novo
        setLoading(false);
        return;
      }

      const member = snap.docs[0].data();
      
      // Sessão Persistente
      localStorage.setItem('emprata_staff_token', JSON.stringify({
        id: snap.docs[0].id,
        role: member.role,
        name: member.name,
        restaurantId: member.restaurantId
      }));

      toast.success(`Bem-vindo, ${member.name.split(' ')[0]}!`);
      
      // Roteamento Direto
      if (member.role === 'DRIVER') navigate('/driver');
      else if (member.role === 'WAITER') navigate('/waiter');
      else if (member.role === 'KITCHEN') navigate('/kitchen-mode');
      else navigate('/dashboard');

    } catch (e) {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) setPin(prev => prev + num);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden text-white font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
         
         {/* Logo / Header */}
         <div className="mb-10 text-center">
            <div className="w-20 h-20 bg-[#121212] rounded-3xl border border-white/10 flex items-center justify-center mb-4 mx-auto shadow-[0_0_30px_rgba(255,255,255,0.05)]">
               <ShieldCheck className="text-primary w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter">
               Acesso <span className="text-primary">Staff</span>
            </h1>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-2">Área Restrita</p>
         </div>

         {/* Display do PIN */}
         <div className="mb-8 flex gap-3">
            {[...Array(6)].map((_, i) => (
               <div 
                 key={i} 
                 className={`w-10 h-14 rounded-xl border flex items-center justify-center text-2xl font-black transition-all ${
                    i < pin.length 
                      ? 'bg-primary text-black border-primary scale-110 shadow-lg' 
                      : 'bg-white/5 border-white/10 text-white/10'
                 }`}
               >
                  {i < pin.length ? '•' : ''}
               </div>
            ))}
         </div>

         {/* Teclado Virtual Numérico (Melhor UX Mobile) */}
         <div className="grid grid-cols-3 gap-4 w-full px-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
               <button
                 key={num}
                 onClick={() => handleNumberClick(num.toString())}
                 className="h-20 bg-[#121212] rounded-2xl border border-white/5 text-2xl font-bold hover:bg-white/10 active:scale-95 transition-all"
               >
                 {num}
               </button>
            ))}
            <div className="h-20" /> {/* Espaço Vazio */}
            <button 
              onClick={() => handleNumberClick('0')}
              className="h-20 bg-[#121212] rounded-2xl border border-white/5 text-2xl font-bold hover:bg-white/10 active:scale-95 transition-all"
            >
              0
            </button>
            <button 
              onClick={() => setPin(prev => prev.slice(0, -1))}
              className="h-20 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 active:scale-95 transition-all"
            >
              <Delete size={24} />
            </button>
         </div>

         <button 
           onClick={handleLogin}
           disabled={loading || pin.length < 6}
           className="w-full py-5 bg-white text-black font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all"
         >
            {loading ? <Loader2 className="animate-spin" /> : <>ACESSAR <ArrowRight size={20} /></>}
         </button>

      </div>
    </div>
  );
}
