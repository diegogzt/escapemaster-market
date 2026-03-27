import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Reservation {
  id: string;
  title: string;
  time: string;
  color: string;
}

interface TimeSlot {
   start_time: string;
   is_available: boolean;
}

interface CalendarReservationsProps {
  palette?:
    | "warm"
    | "cool"
    | "contrast"
    | "monochrome"
    | "sunset"
    | "nature"
    | "ocean"
    | "lavender"
    | "tropical"
    | "neon"
    | "fire"
    | "electric"
    | "mint"
    | "purple"
    | "meadow"
    | "twilight"
    | "vista";
  gameId?: string;
  numPeople?: number;
  erdToken?: string;
  erdGameId?: string;
  fetchAvailability?: (gameId: string, date: string, numPeople: number, erdToken?: string, erdGameId?: string) => Promise<any[]>;
  onDateSelect?: (date: Date) => void;
}

const CalendarReservations = ({
  palette = "tropical",
  gameId,
  numPeople = 2,
  erdToken,
  erdGameId,
  fetchAvailability,
  onDateSelect
}: CalendarReservationsProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<{ [key: number]: Reservation[] }>({});
  const [loading, setLoading] = useState(false);
  const [monthCache, setMonthCache] = useState<any>(null);

  // Colores según la paleta
  const paletteColors = {
    warm: { primary: "#FFB5A7", secondary: "#FCD5CE", accent: "#F8EDEB", highlight: "#F9DCC4", dark: "#FEC89A" },
    cool: { primary: "#A7C7E7", secondary: "#B8E0D2", accent: "#D6EADF", highlight: "#C9E4DE", dark: "#95D5B2" },
    contrast: { primary: "#FF6B6B", secondary: "#4ECDC4", accent: "#FFE66D", highlight: "#95E1D3", dark: "#F38181" },
    monochrome: { primary: "#2C3E50", secondary: "#34495E", accent: "#7F8C8D", highlight: "#95A5A6", dark: "#BDC3C7" },
    sunset: { primary: "#FF6B9D", secondary: "#FFA07A", accent: "#FFD700", highlight: "#FFB6C1", dark: "#C73866" },
    nature: { primary: "#2D6A4F", secondary: "#52B788", accent: "#95D5B2", highlight: "#74C69D", dark: "#1B4332" },
    ocean: { primary: "#006D77", secondary: "#83C5BE", accent: "#EDF6F9", highlight: "#FFDDD2", dark: "#003D47" },
    lavender: { primary: "#9D84B7", secondary: "#C8B6E2", accent: "#E8DFF5", highlight: "#D4C5E0", dark: "#6B5B8E" },
    tropical: { primary: "#1F6357", secondary: "#4DB8A8", accent: "#F4E9CD", highlight: "#F4C430", dark: "#F39C12" }, 
    neon: { primary: "#FF00FF", secondary: "#00FFFF", accent: "#FFFF00", highlight: "#00FF00", dark: "#FF0080" },
    fire: { primary: "#FF4500", secondary: "#FFD700", accent: "#FF6347", highlight: "#FFA500", dark: "#8B0000" },
    electric: { primary: "#00D9FF", secondary: "#FF0080", accent: "#FFFF00", highlight: "#00FF7F", dark: "#8A2BE2" },
    mint: { primary: "#1F756E", secondary: "#5DDCC3", accent: "#C8E86C", highlight: "#D3EB70", dark: "#EFEFEF" },
    purple: { primary: "#5856D6", secondary: "#475569", accent: "#E5E7EB", highlight: "#64748B", dark: "#1E293B" },
    meadow: { primary: "#0F5C55", secondary: "#7CE5D3", accent: "#E1F542", highlight: "#B8F1E8", dark: "#083832" },
    twilight: { primary: "#4338CA", secondary: "#6B7280", accent: "#F3F4F6", highlight: "#6366F1", dark: "#111827" },
    vista: { primary: "#D56A34", secondary: "#3F170E", accent: "#F9F7E9", highlight: "#C45A28", dark: "#2A0F08" },
  };

  const colors = paletteColors[palette] || paletteColors.tropical;

  useEffect(() => {
    if (gameId && fetchAvailability) {
       loadMonthAvailability();
    }
  }, [currentDate, gameId, numPeople]);

  const loadMonthAvailability = async () => {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      try {
          // If we have ERD credentials, we use the findbyMonth strategy
          if (erdToken && erdGameId) {
              const payload = {
                  headers: { "accept": "application/json" },
                  token: erdToken,
                  user: 0,
                  game: parseInt(erdGameId),
                  location: 0,
                  month: month.toString(),
                  year: year.toString(),
                  currentStart: `${year}/${month}/1`,
                  currentEnd: `${year}/${month + 1}/1`
              };

              const response = await fetch('https://erdpanel.com/api/bookings/findbyMonth', {
                  method: 'POST',
                  headers: { 
                      'Content-Type': 'application/json;charset=UTF-8',
                      'Accept': 'application/json',
                      'X-Requested-With': 'XMLHttpRequest'
                  },
                  body: JSON.stringify(payload)
              });

              if (response.ok) {
                  const data = await response.json();
                  setMonthCache(data);
                  
                  // Pre-populate reservations for all days returned
                  const newReservations: { [key: number]: Reservation[] } = {};
                  Object.entries(data).forEach(([dateStr, items]: [string, any]) => {
                      if (Array.isArray(items)) {
                          const date = new Date(dateStr);
                          if (date.getMonth() + 1 === month) {
                              const day = date.getDate();
                              newReservations[day] = items.map((slot, idx) => ({
                                  id: `${day}-${idx}`,
                                  title: slot.status === 1 ? 'Disponible' : 'Ocupado',
                                  time: slot.time,
                                  color: slot.status === 1 ? colors.secondary : '#f3f4f6'
                              }));
                          }
                      }
                  });
                  setReservations(newReservations);
              }
          }
      } catch (e) {
          console.error("Error loading month summary:", e);
      } finally {
          setLoading(false);
      }
  };
  
  const handleDayClick = async (day: number) => {
      if(!gameId || !fetchAvailability) return;
      
      setLoading(true);
      try {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          const slots: TimeSlot[] = await fetchAvailability(gameId, dateStr, numPeople);
          
          if(onDateSelect) {
             onDateSelect(new Date(year, month, day));
          }

          // Map slots to reservations for display
          const dayRes: Reservation[] = slots.map((slot, idx) => ({
             id: `${day}-${idx}`,
             title: slot.is_available ? 'Disponible' : 'Ocupado',
             time: new Date(slot.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
             color: slot.is_available ? colors.secondary : '#e5e7eb'
          }));
          
          setReservations(prev => ({
              ...prev,
              [day]: dayRes
          }));

      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[120px]"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayReservations = reservations[day] || [];
    days.push(
      <div
        key={day}
        onClick={() => handleDayClick(day)}
        className="min-h-[120px] border border-gray-200 p-2 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="text-sm font-semibold text-gray-700 mb-1">{day}</div>
        <div className="space-y-1">
            {loading && !dayReservations.length ? (
                <div className="text-[10px] text-gray-300">Cargando...</div>
            ) : (
                <>
                  {dayReservations.slice(0, 4).map((reservation) => (
                    <div
                      key={reservation.id}
                      className="text-xs px-2 py-1 rounded text-white truncate"
                      style={{ backgroundColor: reservation.color }}
                    >
                      <div className="font-medium">{reservation.time}</div>
                    </div>
                  ))}
                   {dayReservations.length > 4 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{dayReservations.length - 4} más
                    </div>
                  )}
                </>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800 capitalize">
          {monthName}
        </h3>
        <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {["dom", "lun", "mar", "mié", "jue", "vie", "sáb"].map((day) => (
          <div
            key={day}
            className="bg-gray-100 border-b border-gray-200 py-2 text-center text-sm font-semibold text-gray-700"
          >
            {day}
          </div>
        ))}
        {days}
      </div>
      
       <div className="mt-4 text-xs text-gray-400 text-center">
            Haz clic en un día para ver disponibilidad
       </div>
    </div>
  );
};

export default CalendarReservations;
