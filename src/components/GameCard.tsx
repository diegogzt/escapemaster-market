import React from 'react';
import { MapPin, Users, Timer, Star, Heart } from 'lucide-react';

interface GameProps {
    game: {
        id: string;
        name: string;
        city: string;
        players_min: number;
        players_max: number;
        duration: number;
        difficulty: string | number;
        price_min: number;
        images?: string[];
        themes?: string[] | { theme: { name: string, slug: string } }[];
        isVerified?: boolean;
        description?: string;
        rating?: number;
        reviews_count?: number;
        pricing_model?: 'per_person' | 'per_session';
    };
    lang?: string;
}

export const GameCard: React.FC<GameProps> = ({ game, lang = 'es' }) => {
    const [liked, setLiked] = React.useState(false);

    return (
        <a href={`/${lang}/game/${game.id}`} className="group block">
            {/* Image */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3">
                {game.images && game.images.length > 0 ? (
                    <img 
                        src={game.images[0]} 
                        alt={game.name} 
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" 
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    </div>
                )}

                {/* Favorite button */}
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked(!liked); }}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white hover:scale-110 transition-all shadow-sm z-10"
                    aria-label="Favorito"
                >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>

                {/* Hover overlay with extra details */}
                <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-sm hidden sm:block">
                    <div className="flex items-center gap-3 text-white text-xs font-medium">
                        <span className="flex items-center gap-1">
                            <Timer className="w-3.5 h-3.5" />
                            {game.duration > 0 ? `${game.duration} min` : '—'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {game.players_min === 0 && game.players_max === 0 ? '?' : `${game.players_min}-${game.players_max}`}
                        </span>
                        {game.themes?.slice(0, 2).map((t: any, i: number) => {
                            const label = typeof t === 'string' ? t : t?.theme?.name || t?.name || '';
                            return label ? (
                                <span key={i} className="bg-white/20 px-2 py-0.5 rounded-full capitalize">
                                    {label}
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>
            </div>

            {/* Content — Airbnb style */}
            <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[15px] text-tropical-text leading-snug line-clamp-1">
                        {game.name}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-current text-tropical-primary" />
                        <span className="text-sm font-medium text-tropical-text">{game.rating ? game.rating.toFixed(1) : '4.9'}</span>
                        {game.reviews_count ? <span className="text-xs text-tropical-text/40">({game.reviews_count})</span> : null}
                    </div>
                </div>
                <p className="text-sm text-tropical-text/60 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {game.city}
                </p>
                <p className="text-sm text-tropical-text/60 sm:hidden">
                    {game.duration > 0 ? `${game.duration} min` : ''} · {game.players_min}-{game.players_max} jug.
                </p>
                {game.price_min > 0 && (
                    <p className="text-sm text-tropical-text pt-1">
                        <span className="font-semibold">{game.price_min}€</span>
                        <span className="text-tropical-text/60 font-normal">
                            {game.pricing_model === 'per_session' ? ' / sesión' : ' / persona'}
                        </span>
                    </p>
                )}
            </div>
        </a>
    );
};
