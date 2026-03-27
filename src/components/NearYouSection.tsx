import React, { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { GameCard } from './GameCard';

interface NearYouSectionProps {
    lang?: string;
}

interface Game {
    id: string;
    name: string;
    city: string;
    players_min: number;
    players_max: number;
    duration: number;
    difficulty: string;
    price_min: number;
    images?: string[];
    description?: string;
}

export const NearYouSection: React.FC<NearYouSectionProps> = ({ lang = 'es' }) => {
    const [city, setCity] = useState<string | null>(null);
    const [rooms, setRooms] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchNearby = async () => {
            try {
                // Try to get user's location
                if (!navigator.geolocation) {
                    setLoading(false);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            // Reverse geocode using free API
                            const { latitude, longitude } = position.coords;
                            const geoRes = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                                { headers: { 'Accept-Language': lang } }
                            );
                            const geoData = await geoRes.json();
                            
                            const userCity = geoData.address?.city 
                                || geoData.address?.town 
                                || geoData.address?.village 
                                || geoData.address?.municipality
                                || null;

                            if (!userCity) {
                                setLoading(false);
                                return;
                            }

                            setCity(userCity);

                            // Fetch nearby rooms
                            const roomsRes = await fetch(`/api/rooms/nearby?city=${encodeURIComponent(userCity)}`);
                            const roomsData = await roomsRes.json();
                            
                            if (roomsData.rooms && roomsData.rooms.length > 0) {
                                setRooms(roomsData.rooms);
                            }
                        } catch {
                            setError(true);
                        } finally {
                            setLoading(false);
                        }
                    },
                    () => {
                        // User denied location or error
                        setLoading(false);
                    },
                    { timeout: 8000, maximumAge: 300000 }
                );
            } catch {
                setLoading(false);
            }
        };

        fetchNearby();
    }, [lang]);

    // Don't render anything if no location or no rooms
    if (!loading && (rooms.length === 0 || !city)) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-tropical-primary" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {lang === 'en' ? 'Near you' : 'Cerca de ti'}
                </h2>
            </div>
            {city && (
                <p className="text-sm text-gray-500 mb-6 sm:mb-8">
                    {lang === 'en' ? `Escape rooms in ${city}` : `Escape rooms en ${city}`}
                </p>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">{lang === 'en' ? 'Getting your location...' : 'Obteniendo tu ubicación...'}</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {rooms.slice(0, 6).map((game) => (
                        <GameCard key={game.id} game={game} lang={lang} />
                    ))}
                </div>
            )}
        </section>
    );
};
