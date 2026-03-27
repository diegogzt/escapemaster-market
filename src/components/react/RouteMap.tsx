import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Navigation } from 'lucide-react';

interface RouteRoom {
  id: string;
  name: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string;
  org_name?: string;
  order: number;
}

interface RouteMapProps {
  rooms: RouteRoom[];
  lang?: string;
  routeColor?: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({ rooms, lang = 'es', routeColor = '#0097b2' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [L, setL] = useState<any>(null);

  const roomsWithCoords = rooms.filter(r => r.latitude && r.longitude);

  useEffect(() => {
    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainer.current || roomsWithCoords.length === 0) {
        setIsLoading(false);
        return;
      }

      const leaflet = await import('leaflet');
      setL(leaflet.default);
      await import('leaflet/dist/leaflet.css');

      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = leaflet.default.map(mapContainer.current, {
        zoomControl: false,
        scrollWheelZoom: true
      });

      leaflet.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      leaflet.default.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add numbered markers for each room
      const markers: any[] = [];
      const polylineCoords: [number, number][] = [];

      roomsWithCoords.forEach((room, idx) => {
        const coords: [number, number] = [room.latitude!, room.longitude!];
        polylineCoords.push(coords);

        const markerIcon = leaflet.default.divIcon({
          className: 'route-marker',
          html: `
            <div style="
              width: 36px; height: 36px; 
              background: ${routeColor}; 
              border-radius: 50%; 
              border: 3px solid white; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex; align-items: center; justify-content: center;
              color: white; font-weight: 800; font-size: 14px;
              cursor: pointer;
            ">${room.order}</div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = leaflet.default.marker(coords, { icon: markerIcon });
        
        // Popup with room info
        const popupContent = `
          <div style="min-width: 180px; font-family: system-ui, sans-serif;">
            <p style="font-size: 11px; color: ${routeColor}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">
              #${room.order} ${room.org_name || ''}
            </p>
            <p style="font-size: 15px; font-weight: 700; margin: 4px 0 8px; color: #111;">
              ${room.name}
            </p>
            <p style="font-size: 12px; color: #666; margin: 0;">${room.city}</p>
            <a href="/${lang}/game/${room.id}" 
               style="display: inline-block; margin-top: 8px; padding: 6px 16px; background: ${routeColor}; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
              ${lang === 'en' ? 'View' : 'Ver sala'}
            </a>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          maxWidth: 250,
          className: 'route-popup'
        });
        
        marker.addTo(map);
        markers.push(marker);
      });

      // Draw connecting polyline (route path)
      if (polylineCoords.length >= 2) {
        leaflet.default.polyline(polylineCoords, {
          color: routeColor,
          weight: 3,
          opacity: 0.7,
          dashArray: '8, 12',
          lineCap: 'round'
        }).addTo(map);
      }

      // Fit bounds
      if (markers.length > 0) {
        const group = leaflet.default.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.15));
      }

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

  if (roomsWithCoords.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[350px] sm:h-[420px] rounded-2xl overflow-hidden border border-gray-200 bg-white">
      <div ref={mapContainer} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 text-tropical-primary animate-spin" />
        </div>
      )}

      {/* Room count badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg border border-gray-200">
          <span className="text-xs font-bold text-tropical-primary">
            {roomsWithCoords.length} {lang === 'en' ? 'stops' : 'paradas'}
          </span>
        </div>
      </div>

      <style>{`
        .route-marker { background: transparent; border: none; }
        .route-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .route-popup .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default RouteMap;
