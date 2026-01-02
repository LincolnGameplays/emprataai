/**
 * 🗺️ SMART DISPATCH MAP - Centro de Comando Logístico
 * 
 * Features:
 * - Follow Mode: Câmera segue o motorista suavemente (panTo)
 * - User Override: Libera controle quando usuário arrasta o mapa
 * - Smart Routes: Otimização de waypoints via Google Directions
 * - HUD: Informações flutuantes em tempo real
 * - Delay Detection: Alertas de risco de atraso
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { Navigation, AlertTriangle, User, Zap, Battery, MapPin, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Driver, DispatchOrder, ScoredDriver } from '../../services/smartDispatch';
import { findBestDriver, estimateArrivalTime, checkDelayRisk } from '../../services/smartDispatch';

// ═══════════════════════════════════════════════════════════════════════════
// DARK MODE MAP STYLES
// ═══════════════════════════════════════════════════════════════════════════

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e8e8e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a3a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  styles: darkMapStyles,
  gestureHandling: 'greedy',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface SmartDispatchMapProps {
  driver: Driver | null;
  orders: DispatchOrder[];
  storeLocation: { lat: number; lng: number };
  allDrivers?: Driver[];
  onDriverSelect?: (driver: ScoredDriver) => void;
  onRouteCalculated?: (duration: number, distance: number) => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SmartDispatchMap({ 
  driver, 
  orders, 
  storeLocation,
  allDrivers = [],
  onDriverSelect,
  onRouteCalculated,
  className = ''
}: SmartDispatchMapProps) {
  
  // Google Maps API Loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  // Map Reference
  const mapRef = useRef<google.maps.Map | null>(null);

  // State
  const [isFollowing, setIsFollowing] = useState(true);
  const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [smartAlert, setSmartAlert] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number } | null>(null);
  const [suggestedDriver, setSuggestedDriver] = useState<ScoredDriver | null>(null);

  // Default center (São Paulo)
  const defaultCenter = { lat: -23.5505, lng: -46.6333 };
  const center = driver?.location || storeLocation || defaultCenter;

  // ═══════════════════════════════════════════════════════════════════════
  // 1. FOLLOW MODE - Câmera de Perseguição
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (isFollowing && mapRef.current && driver?.location) {
      // panTo creates smooth animation, unlike setCenter
      mapRef.current.panTo({
        lat: driver.location.lat,
        lng: driver.location.lng
      });

      // Dynamic zoom based on speed
      if (driver.speed && driver.speed > 60) {
        mapRef.current.setZoom(14); // Zoom out when moving fast
      } else {
        mapRef.current.setZoom(16); // Closer when slow/stopped
      }
    }
  }, [driver?.location, driver?.speed, isFollowing]);

  // Detect user dragging the map (breaks Follow Mode)
  const onMapDrag = useCallback(() => {
    if (isFollowing) {
      setIsFollowing(false);
    }
  }, [isFollowing]);

  // Re-enable follow mode
  const handleRecenter = () => {
    setIsFollowing(true);
    if (mapRef.current && driver?.location) {
      mapRef.current.panTo(driver.location);
      mapRef.current.setZoom(16);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 2. SMART ROUTE CALCULATION
  // ═══════════════════════════════════════════════════════════════════════

  const calculateSmartRoute = useCallback(async () => {
    if (!driver?.location || orders.length === 0 || !isLoaded) return;

    try {
      const directionsService = new google.maps.DirectionsService();

      // Build waypoints from orders
      const waypoints = orders.slice(0, -1).map(order => ({
        location: { lat: order.lat, lng: order.lng },
        stopover: true
      }));

      const lastOrder = orders[orders.length - 1];

      const result = await directionsService.route({
        origin: driver.location,
        destination: { lat: lastOrder.lat, lng: lastOrder.lng },
        waypoints: waypoints,
        optimizeWaypoints: true, // Google's TSP optimization
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (result.routes && result.routes.length > 0) {
        setRoute(result);

        // Calculate total duration and distance
        const totalDuration = result.routes[0].legs.reduce(
          (acc, leg) => acc + (leg.duration?.value || 0), 0
        );
        const totalDistance = result.routes[0].legs.reduce(
          (acc, leg) => acc + (leg.distance?.value || 0), 0
        );

        setRouteInfo({ duration: totalDuration, distance: totalDistance });
        onRouteCalculated?.(totalDuration, totalDistance);

        // Check for delay risk
        const predictedArrival = new Date(Date.now() + totalDuration * 1000);
        if (orders[0].deadline && predictedArrival > new Date(orders[0].deadline)) {
          setSmartAlert('⚠️ Risco de Atraso! Considere enviar um motoboy de apoio.');
        } else {
          setSmartAlert(null);
        }
      }
    } catch (error) {
      console.error('[SmartDispatchMap] Route error:', error);
    }
  }, [driver?.location, orders, isLoaded, onRouteCalculated]);

  // Recalculate route when orders change
  useEffect(() => {
    if (orders.length > 0) {
      calculateSmartRoute();
    } else {
      setRoute(null);
      setRouteInfo(null);
    }
  }, [orders, calculateSmartRoute]);

  // ═══════════════════════════════════════════════════════════════════════
  // 3. SMART DRIVER SUGGESTION
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (allDrivers.length > 0 && storeLocation) {
      const best = findBestDriver(allDrivers, storeLocation);
      setSuggestedDriver(best);
    }
  }, [allDrivers, storeLocation]);

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING / ERROR STATES
  // ═══════════════════════════════════════════════════════════════════════

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a] rounded-3xl">
        <p className="text-red-400">Erro ao carregar o mapa</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a] rounded-3xl">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <MapPin size={48} className="text-purple-500" />
          <p className="text-white/50">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className={`relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl ${className}`}>
      
      {/* ═══════════════════════════════════════════════════════════════════
          HUD - Heads-Up Display (Floating Info)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 left-4 z-10 space-y-2 max-w-xs">
        
        {/* Smart Alert */}
        <AnimatePresence>
          {smartAlert && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg"
            >
              <AlertTriangle size={20} className="shrink-0 animate-pulse" />
              <span className="text-xs font-bold">{smartAlert}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Driver Info Card */}
        {driver && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#121212]/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-xl"
          >
            <h3 className="text-white font-black text-sm flex items-center gap-2">
              <User size={14} className="text-purple-400" />
              {driver.name}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Battery size={12} className={driver.batteryLevel < 20 ? 'text-red-400' : 'text-green-400'} />
                {driver.batteryLevel}%
              </span>
              <span className={`font-bold ${driver.status === 'online' ? 'text-green-400' : 'text-yellow-400'}`}>
                {driver.status === 'online' ? '● Online' : '○ ' + driver.status}
              </span>
            </div>
            {driver.activeOrders > 0 && (
              <p className="text-xs text-yellow-400 mt-2">
                📦 {driver.activeOrders} pedido(s) ativo(s)
              </p>
            )}
          </motion.div>
        )}

        {/* Route Info */}
        {routeInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-500/20 backdrop-blur-md border border-purple-500/30 p-3 rounded-xl"
          >
            <div className="flex items-center gap-2 text-purple-300">
              <Route size={14} />
              <span className="text-xs font-bold">
                {Math.round(routeInfo.duration / 60)} min • {(routeInfo.distance / 1000).toFixed(1)} km
              </span>
            </div>
          </motion.div>
        )}

        {/* AI Suggestion */}
        {suggestedDriver && !driver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md border border-purple-500/30 p-4 rounded-xl"
          >
            <div className="flex items-center gap-2 text-purple-300 mb-2">
              <Zap size={14} />
              <span className="text-xs font-bold uppercase">Sugestão da IA</span>
            </div>
            <p className="text-white text-sm font-bold">{suggestedDriver.name}</p>
            <p className="text-white/60 text-xs mt-1">
              {suggestedDriver.distance.toFixed(1)}km • {suggestedDriver.batteryLevel}% bat
            </p>
            <button
              onClick={() => onDriverSelect?.(suggestedDriver)}
              className="w-full mt-3 bg-purple-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-purple-400 transition-colors"
            >
              Aceitar Sugestão
            </button>
          </motion.div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Recenter Button (appears when not following)
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isFollowing && driver && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleRecenter}
            className="absolute bottom-24 right-4 z-10 bg-white text-black p-4 rounded-full shadow-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Navigation size={20} className="fill-black" />
            <span className="text-sm">Centralizar</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          Google Map
      ═══════════════════════════════════════════════════════════════════ */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={15}
        options={mapOptions}
        onLoad={map => { mapRef.current = map; }}
        onDragStart={onMapDrag}
      >
        {/* Optimized Route */}
        {route && (
          <DirectionsRenderer
            directions={route}
            options={{
              polylineOptions: {
                strokeColor: '#8b5cf6',
                strokeWeight: 5,
                strokeOpacity: 0.9,
              },
              suppressMarkers: true,
            }}
          />
        )}

        {/* Store Marker */}
        {storeLocation && (
          <Marker
            position={storeLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title="Restaurante"
          />
        )}

        {/* Driver Marker */}
        {driver?.location && (
          <Marker
            position={driver.location}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 8,
              fillColor: '#8b5cf6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              rotation: 0, // Could be calculated from bearing
            }}
            title={driver.name}
          />
        )}

        {/* Order Markers */}
        {orders.map((order, index) => (
          <Marker
            key={order.id}
            position={{ lat: order.lat, lng: order.lng }}
            label={{
              text: String(index + 1),
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: order.priority === 'urgent' ? '#ef4444' : '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title={order.customerName || `Pedido ${index + 1}`}
          />
        ))}

        {/* All Drivers (small markers) */}
        {allDrivers
          .filter(d => d.id !== driver?.id && d.status !== 'offline')
          .map(d => (
            <Marker
              key={d.id}
              position={d.location}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#9ca3af',
                fillOpacity: 0.7,
                strokeColor: '#ffffff',
                strokeWeight: 1,
              }}
              title={`${d.name} (${d.status})`}
              onClick={() => {
                const scored = findBestDriver([d], storeLocation);
                if (scored) onDriverSelect?.(scored);
              }}
            />
          ))}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#121212]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl text-xs text-white/50 flex gap-4">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Loja</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Motorista</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Entrega</span>
      </div>
    </div>
  );
}
