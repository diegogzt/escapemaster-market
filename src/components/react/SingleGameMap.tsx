import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';

interface SingleGameMapProps {
  latitude: number;
  longitude: number;
  name: string;
  city: string;
  lang?: string;
  zoom?: number;
}

export const SingleGameMap: React.FC<SingleGameMapProps> = ({
  latitude,
  longitude,
  name,
  city,
  lang = 'es',
  zoom = 15
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainer.current) return;
      
      try {
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

        const coords: [number, number] = [latitude, longitude];
        
        // Create map
        const map = leaflet.default.map(mapContainer.current, {
          center: coords,
          zoom: zoom,
          scrollWheelZoom: false
        });

        // Add tile layer (OpenStreetMap)
        leaflet.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(map);

        // Add custom marker icon
        const markerIcon = leaflet.default.divIcon({
          className: 'custom-marker',
          html: `
            <div style="width:40px;height:40px;background:#0097b2;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

        leaflet.default.marker(coords, { icon: markerIcon }).addTo(map);

        mapRef.current = map;
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize map:', err);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, zoom]);

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden border border-tropical-secondary/10 shadow-lg">
      <div ref={mapContainer} className="w-full h-full z-0" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 font-sans">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 text-tropical-primary animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-600">
              {lang === 'en' ? 'Loading map...' : 'Cargando mapa...'}
            </p>
          </div>
        </div>
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[400] font-sans">
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100 max-w-sm">
          <h4 className="font-bold text-tropical-primary text-sm sm:text-base">{name}</h4>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin size={12} className="text-tropical-secondary" />
            {city}
          </p>
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center py-2 bg-tropical-primary text-white text-xs font-bold rounded-lg hover:bg-tropical-primary/90 transition-colors"
          >
            {lang === 'en' ? 'Get Directions' : 'Cómo llegar'}
          </a>
        </div>
      </div>

      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default SingleGameMap;
