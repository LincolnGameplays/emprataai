
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import L from 'leaflet';
import { Package, CheckCircle, Bike, ChefHat, Clock } from 'lucide-react';

// Ícones personalizados (Hack para React Leaflet)
const iconPerson = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [40, 40],
});
const iconBike = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png',
    iconSize: [45, 45],
});

// Componente para recentralizar o mapa
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

const statusSteps = [
  { key: 'PENDING', label: 'Pedido Recebido', icon: Package },
  { key: 'PREPARING', label: 'Em Preparo', icon: ChefHat },
  { key: 'READY', label: 'Pronto para Entrega', icon: CheckCircle },
  { key: 'DISPATCHED', label: 'Saindo para Entrega', icon: Bike },
];

export default function DeliveryTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [driverLoc, setDriverLoc] = useState<{lat:number, lng:number} | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setOrder({ id: doc.id, ...data });
        // Pega localização do driver do pedido
        if (data.delivery?.driverLocation) {
          setDriverLoc(data.delivery.driverLocation);
        }
      }
    });
    return () => unsub();
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Bike className="w-12 h-12 mx-auto mb-4 animate-bounce text-primary" />
          <p className="text-white/60">Carregando rastreamento...</p>
        </div>
      </div>
    );
  }

  // Pega localização do cliente ou usa um padrão (Centro SP)
  const clientPos: [number, number] = order.deliveryAddress?.coordinates 
    ? [order.deliveryAddress.coordinates.lat, order.deliveryAddress.coordinates.lng] 
    : [-23.5505, -46.6333];

  const driverPos: [number, number] | null = driverLoc 
    ? [driverLoc.lat, driverLoc.lng] 
    : null;

  const currentStatusIndex = statusSteps.findIndex(s => s.key === order.status?.toUpperCase());

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Mapa ocupa metade da tela no mobile */}
      <div className="h-[50vh] w-full relative z-0">
        <MapContainer center={clientPos} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Marcador Cliente */}
          <Marker position={clientPos} icon={iconPerson}>
            <Popup>Você está aqui</Popup>
          </Marker>

          {/* Marcador Motoboy (Só aparece se tiver localização) */}
          {driverPos && (
            <>
              <Marker position={driverPos} icon={iconBike}>
                <Popup>Seu pedido</Popup>
              </Marker>
              <ChangeView center={driverPos} />
            </>
          )}
        </MapContainer>
        
        {/* Overlay de Status */}
        {!driverPos && order.status?.toUpperCase() === 'DISPATCHED' && (
           <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white p-3 rounded-xl text-center z-[1000] border border-white/10">
             📡 Aguardando sinal de GPS do motoboy...
           </div>
        )}
      </div>

      {/* Detalhes do Pedido (Parte inferior) */}
      <div className="flex-1 bg-[#121212] rounded-t-3xl -mt-6 relative z-10 p-6">
         <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />
         
         <div className="flex justify-between items-center mb-6">
            <div>
               <h2 className="text-2xl font-black text-white">
                 {order.status?.toUpperCase() === 'DISPATCHED' ? 'A Caminho!' : 
                  order.status?.toUpperCase() === 'READY' ? 'Pronto!' : 'Preparando...'}
               </h2>
               <p className="text-white/40 text-sm flex items-center gap-1">
                 <Clock size={14} /> Previsão: 15-25 min
               </p>
            </div>
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center text-3xl">
               {order.status?.toUpperCase() === 'DISPATCHED' ? '🛵' : 
                order.status?.toUpperCase() === 'READY' ? '✅' : '👨‍🍳'}
            </div>
         </div>

         {/* Steps Timeline */}
         <div className="space-y-4 mb-6">
           {statusSteps.map((step, idx) => {
             const Icon = step.icon;
             const isActive = idx <= currentStatusIndex;
             return (
               <div key={step.key} className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                   isActive ? 'bg-green-500 border-green-500 text-black' : 'border-white/20 text-white/30'
                 }`}>
                   <Icon size={18} />
                 </div>
                 <span className={`font-medium ${isActive ? 'text-white' : 'text-white/30'}`}>
                   {step.label}
                 </span>
               </div>
             );
           })}
         </div>
         
         {order.deliveryPin && (
            <div className="mt-6 p-4 bg-white/5 rounded-2xl text-center border border-white/10">
               <p className="text-xs text-white/40 uppercase mb-1">Código de Entrega</p>
               <p className="text-3xl font-black text-white tracking-widest">{order.deliveryPin}</p>
            </div>
         )}
      </div>
    </div>
  );
}
