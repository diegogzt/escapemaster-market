import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, X, ChevronDown, ChevronUp, MapPin, Users, Clock, 
  Euro, Star, Skull, Zap, Heart, Baby, Accessibility, Check, RotateCcw,
  Calendar, Sun, Moon, Sparkles, Award, Shield, Camera, Theater, Gift,
  Ghost, Map, Search, Rocket, Wand2, Landmark, Sword, Smile, Balloon, 
  Brain, UserSearch, Anchor, Leaf
} from 'lucide-react';

interface FilterState {
  // Location
  city: string;
  province: string;
  distance: number; // km from user
  
  // Basic
  players: number;
  dateFrom: string;
  dateTo: string;
  timeSlot: string[]; // morning, afternoon, evening, night
  
  // Price
  priceMin: number;
  priceMax: number;
  priceType: 'per_person' | 'per_session';
  
  // Difficulty & Fear
  difficulty: number[]; // 1-5
  fearLevel: number[]; // 0-5
  
  // Themes
  themes: string[];
  
  // Duration
  durationMin: number;
  durationMax: number;
  
  // Rating
  minRating: number;
  
  // Features
  isAccessible: boolean;
  isFamilyFriendly: boolean;
  hasActorMode: boolean;
  hasBirthdayOption: boolean;
  hasVideoRecording: boolean;
  isNewRoom: boolean; // Launched in last 30 days
  isVerified: boolean;
  
  // Availability
  availableToday: boolean;
  availableThisWeekend: boolean;
  instantBooking: boolean;
  
  // Sort
  sortBy: 'relevance' | 'rating' | 'price_low' | 'price_high' | 'distance' | 'newest' | 'popularity';
}

interface AdvancedFiltersProps {
  lang?: string;
  onFilterChange?: (filters: Partial<FilterState>) => void;
  initialFilters?: Partial<FilterState>;
  themes?: string[];
  cities?: string[];
  provinces?: string[];
  showMobile?: boolean;
  onClose?: () => void;
  hideHeader?: boolean; // Hide internal header when embedded in sidebar with external header
}

// Translations
const translations = {
  es: {
    title: 'Filtros',
    clearAll: 'Limpiar todo',
    apply: 'Aplicar filtros',
    results: 'resultados',
    
    // Sections
    location: 'Ubicación',
    date: 'Fecha y hora',
    players: 'Jugadores',
    price: 'Precio',
    difficulty: 'Dificultad',
    fear: 'Factor miedo',
    themes: 'Temática',
    duration: 'Duración',
    rating: 'Valoración',
    features: 'Características',
    availability: 'Disponibilidad',
    sortBy: 'Ordenar por',
    
    // Location
    allCities: 'Todas las ciudades',
    allProvinces: 'Todas las provincias',
    nearMe: 'Cerca de mí',
    maxDistance: 'Distancia máxima',
    
    // Time slots
    morning: 'Mañana (9-13h)',
    afternoon: 'Tarde (13-18h)',
    evening: 'Noche (18-22h)',
    night: 'Nocturno (22-2h)',
    
    // Price
    perPerson: 'Por persona',
    perSession: 'Por sesión',
    minPrice: 'Mín',
    maxPrice: 'Máx',
    
    // Difficulty
    veryEasy: 'Muy fácil',
    easy: 'Fácil',
    medium: 'Media',
    hard: 'Difícil',
    difficultyExtreme: 'Extrema',
    
    // Fear
    noFear: 'Sin miedo',
    mild: 'Suave',
    moderate: 'Moderado',
    scary: 'Terror',
    fearExtreme: 'Extremo',
    contact: 'Con contacto',
    
    // Duration
    minutes: 'minutos',
    
    // Features
    accessible: 'Accesible',
    familyFriendly: 'Apto familias',
    actorMode: 'Con actor',
    birthdayOption: 'Opción cumpleaños',
    videoRecording: 'Grabación vídeo',
    newRoom: 'Nuevo',
    verified: 'Verificado',
    
    // Availability
    availableToday: 'Disponible hoy',
    availableWeekend: 'Este fin de semana',
    instantBooking: 'Reserva instantánea',
    
    // Sort
    relevance: 'Relevancia',
    ratingSort: 'Mejor valorados',
    priceLow: 'Precio: menor a mayor',
    priceHigh: 'Precio: mayor a menor',
    distance: 'Distancia',
    newest: 'Más nuevos',
    popularity: 'Popularidad'
  },
  en: {
    title: 'Filters',
    clearAll: 'Clear all',
    apply: 'Apply filters',
    results: 'results',
    
    location: 'Location',
    date: 'Date & time',
    players: 'Players',
    price: 'Price',
    difficulty: 'Difficulty',
    fear: 'Fear factor',
    themes: 'Theme',
    duration: 'Duration',
    rating: 'Rating',
    features: 'Features',
    availability: 'Availability',
    sortBy: 'Sort by',
    
    allCities: 'All cities',
    allProvinces: 'All provinces',
    nearMe: 'Near me',
    maxDistance: 'Max distance',
    
    morning: 'Morning (9-13h)',
    afternoon: 'Afternoon (13-18h)',
    evening: 'Evening (18-22h)',
    night: 'Night (22-2h)',
    
    perPerson: 'Per person',
    perSession: 'Per session',
    minPrice: 'Min',
    maxPrice: 'Max',
    
    veryEasy: 'Very easy',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    difficultyExtreme: 'Extreme',
    
    noFear: 'No fear',
    mild: 'Mild',
    moderate: 'Moderate',
    scary: 'Scary',
    fearExtreme: 'Extreme',
    contact: 'With contact',
    
    minutes: 'minutes',
    
    accessible: 'Accessible',
    familyFriendly: 'Family friendly',
    actorMode: 'With actor',
    birthdayOption: 'Birthday option',
    videoRecording: 'Video recording',
    newRoom: 'New',
    verified: 'Verified',
    
    availableToday: 'Available today',
    availableWeekend: 'This weekend',
    instantBooking: 'Instant booking',
    
    relevance: 'Relevance',
    ratingSort: 'Best rated',
    priceLow: 'Price: low to high',
    priceHigh: 'Price: high to low',
    distance: 'Distance',
    newest: 'Newest',
    popularity: 'Popularity'
  }
};

// Available themes with Lucide icons
const AVAILABLE_THEMES = [
  { id: 'terror', icon: Ghost, color: 'bg-red-100 text-red-700' },
  { id: 'aventura', icon: Map, color: 'bg-amber-100 text-amber-700' },
  { id: 'misterio', icon: Search, color: 'bg-purple-100 text-purple-700' },
  { id: 'ciencia_ficcion', icon: Rocket, color: 'bg-blue-100 text-blue-700' },
  { id: 'fantasia', icon: Wand2, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'historico', icon: Landmark, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'crimen', icon: Sword, color: 'bg-gray-100 text-gray-700' },
  { id: 'comedia', icon: Smile, color: 'bg-pink-100 text-pink-700' },
  { id: 'infantil', icon: Balloon, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'zombies', icon: Brain, color: 'bg-green-100 text-green-700' },
  { id: 'espionaje', icon: UserSearch, color: 'bg-slate-100 text-slate-700' },
  { id: 'piratas', icon: Anchor, color: 'bg-orange-100 text-orange-700' }
];

const SPANISH_CITIES = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 
  'Zaragoza', 'Murcia', 'Palma', 'Las Palmas', 'Alicante', 'Córdoba',
  'Valladolid', 'Vigo', 'Gijón', 'Granada', 'A Coruña', 'Vitoria',
  'Santa Cruz de Tenerife', 'Pamplona', 'Almería', 'San Sebastián',
  'Santander', 'Castellón', 'Burgos', 'Albacete', 'Salamanca', 'Logroño'
];

const SPANISH_PROVINCES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz',
  'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ceuta',
  'Ciudad Real', 'Córdoba', 'A Coruña', 'Cuenca', 'Girona', 'Granada', 
  'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Islas Baleares', 
  'Jaén', 'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia',
  'Navarra', 'Ourense', 'Palencia', 'Las Palmas', 'Pontevedra', 'La Rioja',
  'Salamanca', 'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria',
  'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya',
  'Zamora', 'Zaragoza'
];

// Filter Section Component
const FilterSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="flex items-center gap-2 font-bold text-sm text-gray-700">
          {icon}
          {title}
        </span>
        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {isOpen && <div className="pb-4 px-1">{children}</div>}
    </div>
  );
};

// Checkbox component
const FilterCheckbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}> = ({ checked, onChange, label, icon, count }) => (
  <label className="flex items-center gap-2 py-1.5 cursor-pointer group">
    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
      checked 
        ? 'bg-tropical-primary border-tropical-primary' 
        : 'border-gray-300 group-hover:border-tropical-primary/50'
    }`}>
      {checked && <Check size={12} className="text-white" />}
    </div>
    {icon && <span className="text-gray-400">{icon}</span>}
    <span className={`text-sm ${checked ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
    {count !== undefined && (
      <span className="text-xs text-gray-400 ml-auto">({count})</span>
    )}
  </label>
);

// Range Slider component
const RangeSlider: React.FC<{
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  suffix?: string;
  prefix?: string;
}> = ({ min, max, value, onChange, step = 1, suffix = '', prefix = '' }) => (
  <div className="space-y-3">
    <div className="flex gap-3">
      <div className="flex-1">
        <input
          type="number"
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          min={min}
          max={value[1]}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-tropical-primary/20 focus:border-tropical-primary outline-none"
          placeholder={`${prefix}${min}${suffix}`}
        />
      </div>
      <span className="text-gray-400 self-center">—</span>
      <div className="flex-1">
        <input
          type="number"
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          min={value[0]}
          max={max}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-tropical-primary/20 focus:border-tropical-primary outline-none"
          placeholder={`${prefix}${max}${suffix}`}
        />
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[1]}
      onChange={(e) => onChange([value[0], Number(e.target.value)])}
      className="w-full accent-tropical-primary"
    />
  </div>
);

// Main Component
export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  lang = 'es',
  onFilterChange,
  initialFilters = {},
  themes = [],
  cities = SPANISH_CITIES,
  provinces = SPANISH_PROVINCES,
  showMobile = false,
  onClose,
  hideHeader = false
}) => {
  const t = translations[lang as keyof typeof translations] || translations.es;
  
  const [filters, setFilters] = useState<FilterState>({
    city: '',
    province: '',
    distance: 50,
    players: 0,
    dateFrom: '',
    dateTo: '',
    timeSlot: [],
    priceMin: 0,
    priceMax: 100,
    priceType: 'per_person',
    difficulty: [],
    fearLevel: [],
    themes: [],
    durationMin: 30,
    durationMax: 120,
    minRating: 0,
    isAccessible: false,
    isFamilyFriendly: false,
    hasActorMode: false,
    hasBirthdayOption: false,
    hasVideoRecording: false,
    isNewRoom: false,
    isVerified: false,
    availableToday: false,
    availableThisWeekend: false,
    instantBooking: false,
    sortBy: 'relevance',
    ...initialFilters
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.city) count++;
    if (filters.province) count++;
    if (filters.players > 0) count++;
    if (filters.difficulty.length > 0) count++;
    if (filters.fearLevel.length > 0) count++;
    if (filters.themes.length > 0) count += filters.themes.length;
    if (filters.minRating > 0) count++;
    if (filters.priceMax < 100) count++;
    if (filters.isAccessible) count++;
    if (filters.isFamilyFriendly) count++;
    if (filters.hasActorMode) count++;
    if (filters.hasBirthdayOption) count++;
    if (filters.hasVideoRecording) count++;
    if (filters.isNewRoom) count++;
    if (filters.isVerified) count++;
    if (filters.availableToday) count++;
    if (filters.availableThisWeekend) count++;
    if (filters.timeSlot.length > 0) count++;
    if (filters.priceType !== 'per_person') count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Track filter/sort changes
    if (typeof window !== 'undefined' && window.analytics) {
      if (key === 'sortBy') {
        window.analytics.trackSort(value as string);
      } else {
        window.analytics.trackSearch({
          filter_type: key,
          filter_value: String(value),
        });
      }
    }

    if (onFilterChange) {
      onFilterChange(newFilters);
    } else {
      // Navigate with URL params
      navigateWithFilters(newFilters);
    }
  };

  const navigateWithFilters = (newFilters: FilterState) => {
    const params = new URLSearchParams(window.location.search);
    
    if (newFilters.city) params.set('city', newFilters.city);
    else params.delete('city');
    
    if (newFilters.province) params.set('province', newFilters.province);
    else params.delete('province');
    
    if (newFilters.players > 0) params.set('players', String(newFilters.players));
    else params.delete('players');
    
    if (newFilters.difficulty.length > 0) params.set('difficulty', newFilters.difficulty.join(','));
    else params.delete('difficulty');
    
    if (newFilters.fearLevel.length > 0) params.set('fear', newFilters.fearLevel.join(','));
    else params.delete('fear');
    
    if (newFilters.themes.length > 0) params.set('themes', newFilters.themes.join(','));
    else params.delete('themes');
    
    if (newFilters.priceMax < 100) params.set('maxPrice', String(newFilters.priceMax));
    else params.delete('maxPrice');
    
    if (newFilters.priceMin > 0) params.set('minPrice', String(newFilters.priceMin));
    else params.delete('minPrice');
    
    if (newFilters.minRating > 0) params.set('minRating', String(newFilters.minRating));
    else params.delete('minRating');
    
    if (newFilters.priceType !== 'per_person') params.set('pricing', newFilters.priceType);
    else params.delete('pricing');
    
    if (newFilters.sortBy !== 'relevance') params.set('sort', newFilters.sortBy);
    else params.delete('sort');
    
    // Debounce navigation
    clearTimeout((window as any)._filterTimeout);
    (window as any)._filterTimeout = setTimeout(() => {
      window.location.search = params.toString();
    }, 800);
  };

  const toggleArrayFilter = <K extends keyof FilterState>(key: K, value: any) => {
    const current = filters[key] as any[];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, newValue as FilterState[K]);
  };

  const clearAll = () => {
    const emptyFilters: FilterState = {
      city: '',
      province: '',
      distance: 50,
      players: 0,
      dateFrom: '',
      dateTo: '',
      timeSlot: [],
      priceMin: 0,
      priceMax: 100,
      priceType: 'per_person',
      difficulty: [],
      fearLevel: [],
      themes: [],
      durationMin: 30,
      durationMax: 120,
      minRating: 0,
      isAccessible: false,
      isFamilyFriendly: false,
      hasActorMode: false,
      hasBirthdayOption: false,
      hasVideoRecording: false,
      isNewRoom: false,
      isVerified: false,
      availableToday: false,
      availableThisWeekend: false,
      instantBooking: false,
      sortBy: 'relevance'
    };

    // Track filter clear
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackSearch({
        action: 'clear_all_filters',
      });
    }

    setFilters(emptyFilters);
    if (onFilterChange) {
      onFilterChange(emptyFilters);
    } else {
      navigateWithFilters(emptyFilters);
    }
  };

  const containerClass = showMobile 
    ? "fixed inset-0 z-50 bg-white overflow-y-auto pb-safe momentum-scroll" 
    : hideHeader 
      ? "" // No container styling when embedded without header
      : "w-72 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden";

  return (
    <div className={containerClass}>
      {/* Header - hidden when hideHeader prop is true */}
      {!hideHeader && (
        <div className={`sticky top-0 bg-white z-10 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between ${showMobile ? 'pt-safe' : ''}`}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-tropical-primary" />
            <h3 className="font-bold text-gray-900">{t.title}</h3>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-tropical-primary text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-tropical-primary flex items-center gap-1 transition-colors touch-manipulation"
              >
                <RotateCcw size={12} />
                {t.clearAll}
              </button>
            )}
            {showMobile && onClose && (
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation active:scale-95">
                <X size={22} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Content */}
      <div className={`px-4 divide-y divide-gray-100 ${showMobile ? 'pb-28' : ''}`}>
        
        {/* Location */}
        <FilterSection title={t.location} icon={<MapPin size={16} />}>
          <div className="space-y-3">
            <select
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="w-full px-3 py-3 sm:py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-tropical-primary/20 focus:border-tropical-primary outline-none bg-white"
            >
              <option value="">{t.allCities}</option>
              {cities.map(city => (
                <option key={city} value={city.toLowerCase()}>{city}</option>
              ))}
            </select>
            
            <select
              value={filters.province}
              onChange={(e) => updateFilter('province', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-tropical-primary/20 focus:border-tropical-primary outline-none bg-white"
            >
              <option value="">{t.allProvinces}</option>
              {provinces.map(prov => (
                <option key={prov} value={prov.toLowerCase()}>{prov}</option>
              ))}
            </select>
          </div>
        </FilterSection>

        {/* Players */}
        <FilterSection title={t.players} icon={<Users size={16} />}>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <button
                key={num}
                onClick={() => updateFilter('players', filters.players === num ? 0 : num)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                  filters.players === num
                    ? 'bg-tropical-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => updateFilter('players', filters.players === 11 ? 0 : 11)}
              className={`px-3 h-9 rounded-lg text-sm font-bold transition-all ${
                filters.players === 11
                  ? 'bg-tropical-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              10+
            </button>
          </div>
        </FilterSection>

        {/* Time Slot */}
        <FilterSection title={t.date} icon={<Calendar size={16} />} defaultOpen={false}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'morning', label: t.morning, icon: <Sun size={14} /> },
                { id: 'afternoon', label: t.afternoon, icon: <Sun size={14} /> },
                { id: 'evening', label: t.evening, icon: <Moon size={14} /> },
                { id: 'night', label: t.night, icon: <Moon size={14} /> }
              ].map(slot => (
                <button
                  key={slot.id}
                  onClick={() => toggleArrayFilter('timeSlot', slot.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    filters.timeSlot.includes(slot.id)
                      ? 'bg-tropical-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {slot.icon}
                  {slot.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>

        {/* Price */}
        <FilterSection title={t.price} icon={<Euro size={16} />}>
          <div className="space-y-4">
            <RangeSlider
              min={0}
              max={100}
              value={[filters.priceMin, filters.priceMax]}
              onChange={([min, max]) => {
                updateFilter('priceMin', min);
                updateFilter('priceMax', max);
              }}
              suffix="€"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateFilter('priceType', 'per_person')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  filters.priceType === 'per_person'
                    ? 'bg-tropical-primary text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t.perPerson}
              </button>
              <button
                onClick={() => updateFilter('priceType', 'per_session')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  filters.priceType === 'per_session'
                    ? 'bg-tropical-primary text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t.perSession}
              </button>
            </div>
          </div>
        </FilterSection>

        {/* Difficulty */}
        <FilterSection title={t.difficulty} icon={<Zap size={16} />}>
          <div className="flex gap-2">
            {[
              { level: 1, label: t.veryEasy, icon: Leaf },
              { level: 2, label: t.easy, icon: Sparkles },
              { level: 3, label: t.medium, icon: Zap },
              { level: 4, label: t.hard, icon: Skull },
              { level: 5, label: t.difficultyExtreme, icon: Skull }
            ].map(d => (
              <button
                key={d.level}
                onClick={() => toggleArrayFilter('difficulty', d.level)}
                title={d.label}
                className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center ${
                  filters.difficulty.includes(d.level)
                    ? 'bg-tropical-primary text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <d.icon size={18} />
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Fear Level */}
        <FilterSection title={t.fear} icon={<Skull size={16} />}>
          <div className="flex gap-2">
            {[
              { level: 0, label: t.noFear, icon: Smile },
              { level: 1, label: t.mild, icon: Heart },
              { level: 2, label: t.moderate, icon: Zap },
              { level: 3, label: t.scary, icon: Ghost },
              { level: 4, label: t.fearExtreme, icon: Skull },
              { level: 5, label: t.contact, icon: Users }
            ].map(f => (
              <button
                key={f.level}
                onClick={() => toggleArrayFilter('fearLevel', f.level)}
                title={f.label}
                className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${
                  filters.fearLevel.includes(f.level)
                    ? 'bg-red-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <f.icon size={16} />
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Themes */}
        <FilterSection title={t.themes} icon={<Sparkles size={16} />}>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => toggleArrayFilter('themes', theme.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filters.themes.includes(theme.id)
                    ? 'bg-tropical-primary text-white'
                    : theme.color
                }`}
              >
                <theme.icon size={14} />
                {theme.id.replace('_', ' ')}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Duration */}
        <FilterSection title={t.duration} icon={<Clock size={16} />} defaultOpen={false}>
          <RangeSlider
            min={30}
            max={180}
            step={15}
            value={[filters.durationMin, filters.durationMax]}
            onChange={([min, max]) => {
              updateFilter('durationMin', min);
              updateFilter('durationMax', max);
            }}
            suffix=" min"
          />
        </FilterSection>

        {/* Rating */}
        <FilterSection title={t.rating} icon={<Star size={16} />}>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => updateFilter('minRating', filters.minRating === star ? 0 : star)}
                className="p-1"
              >
                <Star 
                  size={24} 
                  className={`transition-colors ${
                    star <= filters.minRating 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              </button>
            ))}
            {filters.minRating > 0 && (
              <span className="ml-2 text-sm text-gray-500 self-center flex items-center gap-1">
                {filters.minRating}+ <Star size={14} className="text-yellow-400 fill-yellow-400" />
              </span>
            )}
          </div>
        </FilterSection>

        {/* Features */}
        <FilterSection title={t.features} icon={<Award size={16} />}>
          <div className="space-y-1">
            <FilterCheckbox
              checked={filters.isAccessible}
              onChange={(v) => updateFilter('isAccessible', v)}
              label={t.accessible}
              icon={<Accessibility size={14} />}
            />
            <FilterCheckbox
              checked={filters.isFamilyFriendly}
              onChange={(v) => updateFilter('isFamilyFriendly', v)}
              label={t.familyFriendly}
              icon={<Baby size={14} />}
            />
            <FilterCheckbox
              checked={filters.hasActorMode}
              onChange={(v) => updateFilter('hasActorMode', v)}
              label={t.actorMode}
              icon={<Theater size={14} />}
            />
            <FilterCheckbox
              checked={filters.hasBirthdayOption}
              onChange={(v) => updateFilter('hasBirthdayOption', v)}
              label={t.birthdayOption}
              icon={<Gift size={14} />}
            />
            <FilterCheckbox
              checked={filters.hasVideoRecording}
              onChange={(v) => updateFilter('hasVideoRecording', v)}
              label={t.videoRecording}
              icon={<Camera size={14} />}
            />
            <FilterCheckbox
              checked={filters.isNewRoom}
              onChange={(v) => updateFilter('isNewRoom', v)}
              label={t.newRoom}
              icon={<Sparkles size={14} />}
            />
            <FilterCheckbox
              checked={filters.isVerified}
              onChange={(v) => updateFilter('isVerified', v)}
              label={t.verified}
              icon={<Shield size={14} />}
            />
          </div>
        </FilterSection>

        {/* Availability */}
        <FilterSection title={t.availability} icon={<Calendar size={16} />} defaultOpen={false}>
          <div className="space-y-1">
            <FilterCheckbox
              checked={filters.availableToday}
              onChange={(v) => updateFilter('availableToday', v)}
              label={t.availableToday}
            />
            <FilterCheckbox
              checked={filters.availableThisWeekend}
              onChange={(v) => updateFilter('availableThisWeekend', v)}
              label={t.availableWeekend}
            />
            <FilterCheckbox
              checked={filters.instantBooking}
              onChange={(v) => updateFilter('instantBooking', v)}
              label={t.instantBooking}
              icon={<Zap size={14} />}
            />
          </div>
        </FilterSection>

        {/* Sort By */}
        <FilterSection title={t.sortBy} icon={<SlidersHorizontal size={16} />} defaultOpen={false}>
          <div className="space-y-1">
            {[
              { id: 'relevance', label: t.relevance },
              { id: 'rating', label: t.ratingSort },
              { id: 'price_low', label: t.priceLow },
              { id: 'price_high', label: t.priceHigh },
              { id: 'distance', label: t.distance },
              { id: 'newest', label: t.newest },
              { id: 'popularity', label: t.popularity }
            ].map(sort => (
              <button
                key={sort.id}
                onClick={() => updateFilter('sortBy', sort.id as FilterState['sortBy'])}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  filters.sortBy === sort.id
                    ? 'bg-tropical-primary text-white font-semibold'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Mobile Apply Button */}
      {showMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-tropical-primary text-white font-bold rounded-xl hover:bg-tropical-primary/90 transition-colors active:scale-[0.98] touch-manipulation shadow-lg"
          >
            {t.apply}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
