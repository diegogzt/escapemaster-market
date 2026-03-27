import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Loader2, X, Star, Users, Clock, Euro, Lock } from 'lucide-react';

// Types
interface Room {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  price_min: number;
  difficulty?: string;
  rating?: number;
  reviews_count?: number;
  players_min: number;
  players_max: number;
  duration: number;
  images: string[];
  themes?: string[];
}

interface MapSearchProps {
  rooms: Room[];
  lang?: string;
  onRoomSelect?: (room: Room) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Spanish cities coordinates (fallback when room doesn't have coordinates)
const CITY_COORDINATES: Record<string, [number, number]> = {
  'madrid': [40.4168, -3.7038],
  'barcelona': [41.3851, 2.1734],
  'valencia': [39.4699, -0.3763],
  'sevilla': [37.3891, -5.9845],
  'bilbao': [43.2630, -2.9350],
  'malaga': [36.7213, -4.4214],
  'zaragoza': [41.6488, -0.8891],
  'murcia': [37.9922, -1.1307],
  'palma': [39.5696, 2.6502],
  'las palmas': [28.1235, -15.4363],
  'alicante': [38.3452, -0.4810],
  'cordoba': [37.8882, -4.7794],
  'valladolid': [41.6523, -4.7245],
  'vigo': [42.2406, -8.7207],
  'gijon': [43.5453, -5.6615],
  'granada': [37.1773, -3.5986],
  'default': [40.4168, -3.7038] // Madrid as default
};

const getCityCoordinates = (city: string): [number, number] => {
  const normalized = city?.toLowerCase().trim() || 'default';
  return CITY_COORDINATES[normalized] || CITY_COORDINATES['default'];
};

const toFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

// Room Card for Map Popup
const MapRoomCard: React.FC<{ room: Room; lang: string; onClose: () => void }> = ({ room, lang, onClose }) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-[calc(100vw-2rem)] max-w-80 animate-slide-up">
      {/* Header Image */}
      <div className="relative h-28 sm:h-32 bg-tropical-primary">
        {room.images?.[0] ? (
          <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Lock size={36} className="text-white/70" />
          </div>
        )}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 w-10 h-10 sm:w-8 sm:h-8 bg-black/50 hover:bg-black/70 active:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X size={18} />
        </button>
        <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap max-w-[70%]">
          {room.themes?.slice(0, 2).map((theme, i) => (
            <span key={i} className="text-[10px] font-bold bg-white/90 text-tropical-primary px-2 py-0.5 rounded-full">
              {theme}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight line-clamp-2">{room.name}</h3>
          <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin size={12} />
            {room.city}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-gray-600">
          {room.rating && (
            <span className="flex items-center gap-1">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              {room.rating.toFixed(1)}
              {room.reviews_count && <span className="text-gray-400">({room.reviews_count})</span>}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={12} />
            {room.players_min}-{room.players_max}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {room.duration}min
          </span>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <span className="text-[10px] sm:text-xs text-gray-500">{lang === 'en' ? 'From' : 'Desde'}</span>
            <p className="font-bold text-tropical-primary text-base sm:text-lg flex items-center">
              {room.price_min}€
              <span className="text-[10px] sm:text-xs font-normal text-gray-400 ml-1">/ {lang === 'en' ? 'person' : 'pers.'}</span>
            </p>
          </div>
          <a 
            href={`/${lang}/game/${room.slug || room.id}`}
            className="px-4 py-2.5 sm:py-2 bg-tropical-primary hover:bg-tropical-primary/90 active:bg-tropical-primary/80 text-white text-sm font-bold rounded-xl transition-colors min-w-[60px] text-center"
          >
            {lang === 'en' ? 'View' : 'Ver'}
          </a>
        </div>
      </div>
    </div>
  );
};

// Main Map Component
export const MapSearch: React.FC<MapSearchProps> = ({
  rooms,
  lang = 'es',
  onRoomSelect,
  initialCenter,
  initialZoom = 6
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const selectedRoomRef = useRef<Room | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [L, setL] = useState<any>(null);

  // Calculate center from rooms or use Spain center
  const calculateCenter = (): [number, number] => {
    if (
      initialCenter &&
      Number.isFinite(initialCenter[0]) &&
      Number.isFinite(initialCenter[1])
    ) {
      return initialCenter;
    }
    if (userLocation) return userLocation;
    
    const roomsWithCoords = rooms
      .map((room) => {
        const latitude = toFiniteNumber(room.latitude);
        const longitude = toFiniteNumber(room.longitude);
        if (latitude === null || longitude === null) return null;
        return { latitude, longitude };
      })
      .filter((room): room is { latitude: number; longitude: number } => room !== null);

    if (roomsWithCoords.length > 0) {
      const avgLat = roomsWithCoords.reduce((sum, room) => sum + room.latitude, 0) / roomsWithCoords.length;
      const avgLng = roomsWithCoords.reduce((sum, room) => sum + room.longitude, 0) / roomsWithCoords.length;
      return [avgLat, avgLng];
    }
    
    return [40.4168, -3.7038]; // Madrid
  };

  // Get user location
  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
          if (mapRef.current) {
            mapRef.current.setView(coords, 12);
          }
        },
        (error) => console.log('Geolocation error:', error),
        { enableHighAccuracy: true }
      );
    }
  };

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainer.current) return;
      
      // Dynamic import for SSR compatibility
      const leaflet = await import('leaflet');
      setL(leaflet.default);
      
      // Import CSS
      await import('leaflet/dist/leaflet.css');

      // Fix default marker icons
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const center = calculateCenter();
      
      // Create map
      const map = leaflet.default.map(mapContainer.current, {
        center: center,
        zoom: initialZoom,
        zoomControl: false
      });

      // Add tile layer (OpenStreetMap)
      leaflet.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      // Add zoom control to bottom right
      leaflet.default.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      setIsLoading(false);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add room markers
  useEffect(() => {
    if (!mapRef.current || !L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Custom marker icon
    const createMarkerIcon = (isSelected: boolean = false) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="width:40px;height:40px;background:${isSelected ? '#0097b2' : 'white'};border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid ${isSelected ? 'white' : '#0097b2'};display:flex;align-items:center;justify-content:center;cursor:pointer;transform:scale(${isSelected ? '1.25' : '1'});transition:transform 0.2s;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? 'white' : '#0097b2'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
    };

    // Add markers for each room
    rooms.forEach(room => {
      let coords: [number, number];

      const latitude = toFiniteNumber(room.latitude);
      const longitude = toFiniteNumber(room.longitude);
      
      if (latitude !== null && longitude !== null) {
        coords = [latitude, longitude];
      } else {
        // Use city coordinates with slight offset to prevent overlap
        const baseCoords = getCityCoordinates(room.city);
        const offset = (Math.random() - 0.5) * 0.02; // Small random offset
        coords = [baseCoords[0] + offset, baseCoords[1] + offset];
      }

      const marker = L.marker(coords, {
        icon: createMarkerIcon(false)
      });

      marker.on('click', () => {
        // Update all markers to unselected, then this one to selected
        markersRef.current.forEach((m, i) => {
          m.setIcon(createMarkerIcon(false));
        });
        marker.setIcon(createMarkerIcon(true));
        
        selectedRoomRef.current = room;
        setSelectedRoom(room);
        onRoomSelect?.(room);
        mapRef.current.setView(coords, Math.max(mapRef.current.getZoom(), 13));
      });

      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // Fit bounds if multiple rooms
    if (rooms.length > 1 && markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [rooms, L]);

  // Add user location marker
  useEffect(() => {
    if (!mapRef.current || !L || !userLocation) return;

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="relative">
          <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div class="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping"></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker(userLocation, { icon: userIcon }).addTo(mapRef.current);
    
    return () => marker.remove();
  }, [userLocation, L]);

  return (
    <div className="relative w-full h-full min-h-[400px] sm:min-h-[500px]">
      {/* Map with overflow-hidden for border radius clipping */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200">
        <div ref={mapContainer} className="w-full h-full touch-pan-x touch-pan-y" />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center space-y-2">
              <Loader2 className="w-8 h-8 text-tropical-primary animate-spin mx-auto" />
              <p className="text-sm font-medium text-gray-600">
                {lang === 'en' ? 'Loading map...' : 'Cargando mapa...'}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 space-y-2">
          <button
            onClick={getUserLocation}
            className="w-11 h-11 sm:w-10 sm:h-10 bg-white hover:bg-gray-50 active:bg-gray-100 rounded-xl shadow-lg border border-gray-200 flex items-center justify-center text-tropical-primary transition-colors"
            title={lang === 'en' ? 'My location' : 'Mi ubicación'}
          >
            <Navigation size={20} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Room Count Badge */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-gray-200">
            <span className="text-xs font-bold text-tropical-primary">
              {rooms.length} {rooms.length === 1 
                ? (lang === 'en' ? 'room' : 'sala') 
                : (lang === 'en' ? 'rooms' : 'salas')
              }
            </span>
          </div>
        </div>
      </div>

      {/* Selected Room Card - OUTSIDE overflow-hidden container so it's never clipped */}
      {selectedRoom && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-full px-3 sm:px-0 sm:w-auto" style={{ zIndex: 9999 }}>
          <MapRoomCard 
            room={selectedRoom} 
            lang={lang} 
            onClose={() => setSelectedRoom(null)} 
          />
        </div>
      )}

      {/* Custom styles for markers */}
      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .user-location-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default MapSearch;
