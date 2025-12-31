/**
 * DriverApp - Robust Mobile App for Delivery Drivers
 * 
 * Features:
 * - setDoc with merge for auto-create driver document
 * - GPS permission handling with error fallback
 * - Heartbeat using watchPosition
 * - 4-digit delivery PIN verification
 * - Uber Black-style dark UI
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, CheckCircle, Phone, Bike, 
  Power, Lock, Clock, X, Loader2 
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'sonner';

export default function DriverApp() {
  // Staff session from localStorage
  const [staffSession, setStaffSession] = useState<any>(null);
  
  // Estado local para controle imediato da UI
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [earnings, setEarnings] = useState(0);
  
  // PIN de Entrega (4 Dígitos)
  const [deliveryPin, setDeliveryPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Load staff session
  useEffect(() => {
    const token = localStorage.getItem('emprata_staff_token');
    if (token) {
      try {
        setStaffSession(JSON.parse(token));
      } catch (e) {
        console.error('Invalid staff token');
      }
    }
  }, []);

  // 1. VERIFICAR STATUS INICIAL AO ABRIR O APP
  useEffect(() => {
    if (!staffSession?.id) return;
    const checkStatus = async () => {
      try {
        const docRef = doc(db, 'drivers', staffSession.id);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().currentStatus !== 'offline') {
          setIsOnline(true);
        }
      } catch (e) {
        console.log("Initial status check failed");
      }
    };
    checkStatus();
  }, [staffSession]);

  // 2. FUNÇÃO DE TOGGLE (LIGAR/DESLIGAR) - CORRIGIDA
  const toggleOnlineStatus = async () => {
    if (!staffSession?.id) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }
    setIsLoading(true);

    try {
      if (!isOnline) {
        // --- TENTANDO FICAR ONLINE ---
        if (!navigator.geolocation) {
          throw new Error("GPS não suportado neste dispositivo.");
        }

        // Força pegar a localização ANTES de mudar o status
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            // USAMOS setDoc PARA GARANTIR QUE O DOCUMENTO EXISTA
            await setDoc(doc(db, 'drivers', staffSession.id), {
              name: staffSession.name || 'Motorista',
              restaurantId: staffSession.restaurantId,
              location: { lat: latitude, lng: longitude },
              currentStatus: 'available', // Disponível
              lastUpdate: serverTimestamp(),
            }, { merge: true });

            setIsOnline(true);
            toast.success("Você está ONLINE! Aguardando chamados.");
            setIsLoading(false);
          }, 
          (error) => {
            console.error(error);
            toast.error("Erro de GPS. Permita a localização e tente novamente.");
            setIsLoading(false);
          }, 
          { enableHighAccuracy: true, timeout: 10000 }
        );

      } else {
        // --- FICANDO OFFLINE ---
        await updateDoc(doc(db, 'drivers', staffSession.id), {
          currentStatus: 'offline',
          lastUpdate: serverTimestamp()
        });
        setIsOnline(false);
        toast("Você está OFFLINE.");
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro de conexão.");
      setIsLoading(false);
    }
  };

  // 3. HEARTBEAT (GPS TRACKER EM BACKGROUND)
  useEffect(() => {
    if (!isOnline || !staffSession?.id) return;
    
    // Atualiza posição usando watchPosition para tracking contínuo
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateDoc(doc(db, 'drivers', staffSession.id), {
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          lastUpdate: serverTimestamp()
        }).catch(() => {}); // Ignora erros silenciosos de rede no heartbeat
      },
      (err) => console.log("GPS Error", err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, staffSession]);

  // 4. ESCUTAR PEDIDOS (DISPATCHED)
  useEffect(() => {
    if (!staffSession?.id) return;
    
    const q = query(
      collection(db, 'orders'),
      where('driverId', '==', staffSession.id),
      where('status', 'in', ['dispatched', 'DISPATCHED', 'out_for_delivery'])
    );
    
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setActiveDelivery({ id: snap.docs[0].id, ...data });
      } else {
        setActiveDelivery(null);
      }
    });
    
    return () => unsub();
  }, [staffSession]);

  // 5. FINALIZAR ENTREGA COM PIN 4 DÍGITOS
  const handleVerifyPin = async () => {
    if (!activeDelivery || !staffSession?.id) return;
    
    if (activeDelivery.deliveryPin && deliveryPin !== activeDelivery.deliveryPin) {
      toast.error("PIN Incorreto!");
      setDeliveryPin('');
      return;
    }
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'orders', activeDelivery.id), { 
        status: 'DELIVERED', 
        deliveredAt: serverTimestamp() 
      });
      
      // Volta para disponível
      await updateDoc(doc(db, 'drivers', staffSession.id), { 
        currentStatus: 'available' 
      });
      
      setEarnings(prev => prev + (activeDelivery.deliveryFee || 5));
      toast.success(`Entrega finalizada!`);
      setShowPinModal(false);
      setDeliveryPin('');
    } catch(e) {
      toast.error("Erro ao finalizar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden selection:bg-green-500 selection:text-black">
      
      {/* HEADER DE STATUS (Fixo) */}
      <div className={`p-6 flex justify-between items-center transition-all duration-500 z-20 ${isOnline ? 'bg-[#121212] border-b border-white/5' : 'bg-transparent'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isOnline ? 'bg-green-500 text-black shadow-green-500/20' : 'bg-white/10 text-white/20'}`}>
            <Bike size={24} />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">{staffSession?.name?.split(' ')[0] || 'Motorista'}</h2>
            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isOnline ? 'text-green-500' : 'text-white/30'}`}>
              {isOnline ? '● Online' : '○ Offline'}
            </p>
          </div>
        </div>
        {isOnline && (
          <div className="bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-xl text-right">
            <p className="text-[9px] text-white/40 uppercase font-bold">Saldo</p>
            <p className="text-xl font-mono font-black text-green-400">R$ {earnings.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 p-6 relative z-10 flex flex-col justify-center">
        
        {!isOnline ? (
          <div className="text-center space-y-8">
            <div className="relative mx-auto w-56 h-56 flex items-center justify-center">
              {/* Círculo Pulsante */}
              <div className="absolute inset-0 bg-green-500/10 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-4 bg-green-500/5 rounded-full animate-pulse opacity-40" />
              
              <button 
                onClick={toggleOnlineStatus}
                disabled={isLoading}
                className="relative w-48 h-48 bg-[#121212] rounded-full border-4 border-white/5 flex flex-col items-center justify-center hover:scale-105 active:scale-95 hover:border-green-500 transition-all shadow-2xl group z-10"
              >
                {isLoading ? (
                  <Loader2 size={48} className="text-green-500 animate-spin" />
                ) : (
                  <>
                    <Power size={48} className="text-white/20 group-hover:text-green-500 transition-colors mb-2" />
                    <span className="text-xs font-black uppercase text-white/40 group-hover:text-white tracking-widest">INICIAR</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-white/30 max-w-[200px] mx-auto text-xs font-medium">
              Toque para se conectar ao sistema de despacho EmprataAI.
            </p>
          </div>
        ) : activeDelivery ? (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#121212] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative"
          >
            {/* Barra de Progresso Animada */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
              <motion.div 
                initial={{ width: "0%" }} 
                animate={{ width: "100%" }} 
                transition={{ duration: 2, repeat: Infinity }} 
                className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" 
              />
            </div>

            {/* Header da Entrega */}
            <div className="bg-white/5 p-8 border-b border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                      Em Rota
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white">
                    {activeDelivery.customer?.name || 'Cliente'}
                  </h2>
                </div>
                {activeDelivery.customer?.phone && (
                  <a 
                    href={`tel:${activeDelivery.customer.phone}`} 
                    className="w-12 h-12 bg-green-500 text-black rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-green-500/20"
                  >
                    <Phone size={24} />
                  </a>
                )}
              </div>
            </div>

            {/* Informações */}
            <div className="p-8 space-y-8">
              {/* Trajeto Visual */}
              <div className="flex flex-col gap-6 relative">
                <div className="absolute left-[11px] top-3 bottom-8 w-0.5 bg-white/10" />
                
                <div className="flex gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-[#121212] border-2 border-white/20 shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Coleta</p>
                    <p className="font-bold text-white">Restaurante</p>
                  </div>
                </div>
                
                <div className="flex gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0" />
                  <div>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider mb-1">Entrega</p>
                    <p className="text-xl font-bold leading-tight">
                      {activeDelivery.customer?.address || activeDelivery.deliveryAddress?.street || 'Endereço'}
                    </p>
                    {activeDelivery.deliveryAddress?.neighborhood && (
                      <p className="text-sm text-white/50">{activeDelivery.deliveryAddress.neighborhood}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeDelivery.customer?.address || activeDelivery.deliveryAddress?.street || '')}`}
                  target="_blank"
                  className="py-4 bg-[#1a1a1a] rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 active:scale-95 transition-all text-sm"
                >
                  <Navigation size={18} className="text-blue-400" /> Navegar
                </a>
                <button 
                  onClick={() => setShowPinModal(true)}
                  className="py-4 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm shadow-xl"
                >
                  <CheckCircle size={18} /> FINALIZAR
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-40">
            <div className="w-32 h-32 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-6 animate-[spin_10s_linear_infinite]">
              <Bike size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-bold">Procurando corridas...</h3>
            <p className="text-xs mt-2 text-white/50">Mantenha o app aberto.</p>
          </div>
        )}
      </div>

      {/* Botão Offline */}
      {isOnline && !activeDelivery && (
        <div className="p-6">
          <button 
            onClick={toggleOnlineStatus} 
            className="w-full py-4 rounded-2xl border border-red-500/20 text-red-500/60 font-bold text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            Encerrar Turno
          </button>
        </div>
      )}

      {/* MODAL PIN DE ENTREGA (4 DÍGITOS) */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-end md:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }} 
              animate={{ y: 0 }}
              className="bg-[#121212] w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Lock className="text-white" size={28} />
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2">Confirmação</h3>
              <p className="text-sm text-white/50 mb-8">
                Peça o código de <strong>4 dígitos</strong> para o cliente.
              </p>

              {/* Display PIN */}
              <div className="flex justify-center gap-3 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`w-12 h-14 rounded-xl border flex items-center justify-center text-2xl font-black transition-all ${
                      i < deliveryPin.length 
                        ? 'bg-white text-black border-white scale-110' 
                        : 'bg-[#0a0a0a] border-white/10 text-white/20'
                    }`}
                  >
                    {deliveryPin[i] || ''}
                  </div>
                ))}
              </div>

              {/* Teclado Numérico */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button 
                    key={n} 
                    onClick={() => deliveryPin.length < 4 && setDeliveryPin(p => p + n)} 
                    className="py-4 bg-[#1a1a1a] rounded-xl font-bold text-xl hover:bg-white/10 active:scale-95 transition-all"
                  >
                    {n}
                  </button>
                ))}
                <div />
                <button 
                  onClick={() => deliveryPin.length < 4 && setDeliveryPin(p => p + '0')} 
                  className="py-4 bg-[#1a1a1a] rounded-xl font-bold text-xl hover:bg-white/10 active:scale-95 transition-all"
                >
                  0
                </button>
                <button 
                  onClick={() => setDeliveryPin(p => p.slice(0, -1))} 
                  className="py-4 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleVerifyPin}
                  disabled={deliveryPin.length < 4 || isLoading}
                  className="w-full py-4 bg-white text-black font-black rounded-xl text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'VALIDAR ENTREGA'}
                </button>
                <button 
                  onClick={() => { setShowPinModal(false); setDeliveryPin(''); }} 
                  className="w-full py-3 text-xs font-bold text-white/40 hover:text-white"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
