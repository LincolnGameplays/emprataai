import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // CRUCIAL IMPORT
import { ArrowLeft, List, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import L from 'leaflet';

// --- FIX FOR MISSING LEAFLET ICONS ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});
// -------------------------------------

export default function DispatchConsole() {
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('MAP');
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, 'drivers'), where('restaurantId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col text-white">
      {/* Header */}
      <header className="h-16 bg-[#121212] border-b border-white/5 px-6 flex items-center justify-between shrink-0 z-50">
        <Link to="/dashboard" className="flex items-center gap-2 text-white font-bold hover:text-primary">
          <ArrowLeft size={20}/> Voltar
        </Link>
        <div className="flex bg-white/10 rounded-lg p-1">
           <button onClick={() => setViewMode('LIST')} className={`px-4 py-1 rounded text-xs font-bold transition-all ${viewMode === 'LIST' ? 'bg-white text-black' : 'text-white'}`}>Lista</button>
           <button onClick={() => setViewMode('MAP')} className={`px-4 py-1 rounded text-xs font-bold transition-all ${viewMode === 'MAP' ? 'bg-white text-black' : 'text-white'}`}>Mapa</button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
         {viewMode === 'MAP' ? (
            <div style={{ height: "100%", width: "100%" }}>
                <MapContainer 
                    center={[-23.5505, -46.6333]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                >
                   <TileLayer 
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                   />
                   
                   {drivers.map(d => d.location && (
                     <Marker key={d.id} position={[d.location.lat, d.location.lng]}>
                        <Popup>
                            <div className="text-black">
                                <strong>{d.name}</strong><br />
                                Status: {d.currentStatus}
                            </div>
                        </Popup>
                     </Marker>
                   ))}
                </MapContainer>
            </div>
         ) : (
            <div className="p-8 text-white overflow-y-auto h-full">
               <h2 className="font-bold text-xl mb-4">Lista de Motoboys</h2>
               {drivers.length === 0 && <p className="text-white/40">Nenhum motoboy encontrado.</p>}
               {drivers.map(d => (
                 <div key={d.id} className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10 mb-2 flex justify-between items-center">
                    <span className="font-bold">{d.name}</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${d.currentStatus === 'busy' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                       {d.currentStatus === 'busy' ? 'Ocupado' : 'Livre'}
                    </span>
                 </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
