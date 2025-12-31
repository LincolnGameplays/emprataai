import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Bell, Menu as MenuIcon, 
  DollarSign, BrainCircuit, Power 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'sonner';

// Sub-componentes
import OwnerHome from './owner/OwnerHome';
import OwnerMenu from './owner/OwnerMenu';
import OwnerFinance from './owner/OwnerFinance';
import OwnerBrain from './owner/OwnerBrain';

export default function OwnerApp() {
  const [currentTab, setCurrentTab] = useState<'HOME' | 'MENU' | 'FINANCE' | 'BRAIN'>('HOME');
  const { user } = useAuth();
  const [storeStatus, setStoreStatus] = useState<any>(null);

  // Monitora status vital da loja (Aberto/Fechado/Chuva)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      setStoreStatus(docSnap.data()?.marketplace || {});
    });
    return () => unsub();
  }, [user]);

  // Ações Rápidas Globais
  const toggleStore = async () => {
    if (!user) return;
    const newState = !storeStatus?.isOpen;
    await updateDoc(doc(db, 'users', user.uid), { 'marketplace.isOpen': newState });
    toast(newState ? "🟢 Loja ABERTA" : "🔴 Loja FECHADA");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col pb-24">
      
      {/* HEADER DE COMANDO (Sempre visível) */}
      <header className="px-6 pt-12 pb-4 bg-gradient-to-b from-black/80 to-transparent sticky top-0 z-50 backdrop-blur-sm flex justify-between items-center">
        <div>
           <h1 className="text-xl font-black italic tracking-tighter">
              Emprata<span className="text-primary">.Admin</span>
           </h1>
           <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${storeStatus?.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-bold text-white/60 uppercase">
                 {storeStatus?.isOpen ? 'Operação Online' : 'Loja Fechada'}
              </span>
           </div>
        </div>
        
        {/* Botão de Pânico / Power */}
        <button 
          onClick={toggleStore}
          className={`p-3 rounded-full border transition-all ${
             storeStatus?.isOpen 
               ? 'bg-red-500/10 border-red-500/50 text-red-500' 
               : 'bg-green-500/10 border-green-500/50 text-green-500'
          }`}
        >
           <Power size={20} />
        </button>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 px-4 relative">
         <AnimatePresence mode="wait">
            {currentTab === 'HOME' && <OwnerHome key="home" />}
            {currentTab === 'MENU' && <OwnerMenu key="menu" />}
            {currentTab === 'FINANCE' && <OwnerFinance key="finance" />}
            {currentTab === 'BRAIN' && <OwnerBrain key="brain" />}
         </AnimatePresence>
      </main>

      {/* NAVEGAÇÃO INFERIOR "FLOATING" */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex justify-around items-center z-50 px-2">
         <NavButton active={currentTab === 'HOME'} onClick={() => setCurrentTab('HOME')} icon={Store} label="Loja" />
         <NavButton active={currentTab === 'MENU'} onClick={() => setCurrentTab('MENU')} icon={MenuIcon} label="Cardápio" />
         
         {/* Botão Central IA */}
         <button 
           onClick={() => setCurrentTab('BRAIN')}
           className={`relative -top-6 w-16 h-16 rounded-full flex items-center justify-center border-4 border-[#050505] shadow-lg transition-all ${
              currentTab === 'BRAIN' ? 'bg-purple-600 scale-110' : 'bg-[#1a1a1a]'
           }`}
         >
            <BrainCircuit size={28} className={currentTab === 'BRAIN' ? 'text-white' : 'text-purple-400'} />
         </button>

         <NavButton active={currentTab === 'FINANCE'} onClick={() => setCurrentTab('FINANCE')} icon={DollarSign} label="Caixa" />
         <NavButton active={false} onClick={() => toast("Notificações em breve")} icon={Bell} label="Avisos" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
   return (
      <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-white scale-110' : 'text-white/30'}`}>
         <Icon size={24} strokeWidth={active ? 2.5 : 2} />
         <span className="text-[9px] font-bold">{label}</span>
      </button>
   )
}
