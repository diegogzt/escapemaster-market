import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface HeroSearchBarProps {
    translations?: {
        where: string;
        when: string;
        players: string;
        button: string;
    };
    currentLang?: string;
    themes?: { name: string; slug: string }[];
}

export const HeroSearchBar: React.FC<HeroSearchBarProps> = ({ translations, currentLang = 'es', themes = [] }) => {
    const t = translations || {
        where: '¿Donde buscas?',
        when: '¿Cuando?',
        players: 'Jugadores',
        button: 'Buscar'
    };

    const [location, setLocation] = useState('');
    const [players, setPlayers] = useState('');
    const [date, setDate] = useState('');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.append('q', location);
        if (players) params.append('players', players);
        if (date) params.append('date', date);
        
        window.location.href = `/${currentLang}/search?${params.toString()}`;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="bg-white rounded-full shadow-lg border border-gray-200 max-w-4xl mx-auto flex items-center h-[66px] relative pr-16">
            {/* Destino */}
            <div className="flex-1 min-w-0 pl-7 pr-3 border-r border-gray-200 h-full flex flex-col justify-center cursor-pointer hover:bg-gray-50 rounded-l-full transition-colors">
                <label className="text-[11px] font-semibold text-gray-800 leading-none mb-0.5">Destino</label>
                <input
                    type="text"
                    placeholder="Ciudad, nombre..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none outline-none text-sm text-gray-500 placeholder:text-gray-400 w-full p-0 m-0 h-5"
                />
            </div>

            {/* Fecha */}
            <div className="hidden sm:flex w-40 px-4 border-r border-gray-200 h-full flex-col justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <label className="text-[11px] font-semibold text-gray-800 leading-none mb-0.5">{t.when}</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-gray-500 placeholder:text-gray-400 w-full p-0 m-0 h-5 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute"
                    placeholder="Elige fecha"
                />
            </div>

            {/* Jugadores */}
            <div className="hidden sm:flex w-32 px-4 h-full flex-col justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <label className="text-[11px] font-semibold text-gray-800 leading-none mb-0.5">{t.players}</label>
                <input
                    type="number"
                    placeholder="Num. jugadores"
                    min={1}
                    max={20}
                    value={players}
                    onChange={(e) => setPlayers(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none outline-none text-sm text-gray-500 placeholder:text-gray-400 w-full p-0 m-0 h-5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
            </div>

            {/* Filtros button */}
            <a
                href={`/${currentLang}/search`}
                className="hidden md:flex items-center gap-1.5 px-5 h-full border-l border-gray-200 cursor-pointer hover:bg-gray-50 rounded-r-full transition-colors text-gray-600 hover:text-gray-900"
            >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">Filtros</span>
            </a>

            {/* Search button */}
            <button
                onClick={handleSearch}
                className="absolute right-2 w-12 h-12 bg-tropical-primary hover:bg-tropical-primary/90 active:scale-95 rounded-full flex items-center justify-center text-white shadow-md transition-all"
                aria-label={t.button}
            >
                <Search className="w-5 h-5" />
            </button>
        </div>
    );
};
