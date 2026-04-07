import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "../ui/Button";
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Mail,
  User,
  Phone,
  CreditCard,
  Shield,
  AlertCircle,
  MapPin,
} from "lucide-react";

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || "http://localhost:8000/v1/api";

interface BookingWidgetProps {
  roomId: string;
  roomName?: string;
  orgName?: string;
  pricePerPerson?: number;
  duration?: number;
  capacityMin?: number;
  capacityMax?: number;
  city?: string;
  lang?: string;
  pricingModel?: 'per_person' | 'per_session';
  pricePerSession?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  booked: boolean;
  past: boolean;
}

interface AvailabilityResponse {
  slots: TimeSlot[];
  closed: boolean;
  room: {
    name: string;
    duration: number;
    capacity_min: number;
    capacity_max: number;
    price_per_person: number;
    fee_per_player?: number;
    pricing_model?: 'per_person' | 'per_session';
    price_per_session?: number;
  };
}

// Generate dates for the next 30 days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  const dayNames = {
    es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  };
  const monthNames = {
    es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  };
  const shortMonthNames = {
    es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  };

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      date: date.toISOString().split("T")[0],
      day: date.getDate(),
      dayName: {
        es: dayNames.es[date.getDay()],
        en: dayNames.en[date.getDay()],
      },
      month: {
        es: shortMonthNames.es[date.getMonth()],
        en: shortMonthNames.en[date.getMonth()],
      },
      fullMonth: {
        es: monthNames.es[date.getMonth()],
        en: monthNames.en[date.getMonth()],
      },
      year: date.getFullYear(),
      isToday: i === 0,
      isTomorrow: i === 1,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      dayOfWeek: date.getDay(),
    });
  }
  return dates;
};

export const BookingWidget: React.FC<BookingWidgetProps> = ({
  roomId,
  roomName,
  orgName,
  pricePerPerson: propPrice,
  duration: propDuration,
  capacityMin: propCapMin,
  capacityMax: propCapMax,
  city,
  lang = "es",
  pricingModel,
  pricePerSession,
}) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [players, setPlayers] = useState(2);
  const [dateOffset, setDateOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Room info from API or props
  const [roomInfo, setRoomInfo] = useState({
    name: roomName || "",
    duration: propDuration || 60,
    capacity_min: propCapMin || 2,
    capacity_max: propCapMax || 6,
    price_per_person: propPrice || 0,
    fee_per_player: 0.50,
    pricing_model: pricingModel || 'per_person',
    price_per_session: pricePerSession || 0,
  });

  const dates = useMemo(() => generateDates(), []);
  const visibleDates = dates.slice(dateOffset, dateOffset + 7);

  const selectedDateInfo = dates.find((d) => d.date === selectedDate);

  // Load user info from localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem("em_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.email) setCustomerEmail(payload.email);
        if (payload.full_name) setCustomerName(payload.full_name);
      }
    } catch {}

    // Track booking widget view
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackBookingStep('step_1_widget_view', {
        roomId,
        roomName: roomName || 'unknown',
      });
    }
  }, [roomId, roomName]);

  // Fetch availability when date changes
  const fetchAvailability = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("em_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/rooms/availability?roomId=${roomId}&date=${date}`, { headers });
      const data: AvailabilityResponse = await res.json();
      
      if (!res.ok) throw new Error(data.room?.name || "Error");
      
      setSlots(data.slots);
      setIsClosed(data.closed);
      if (data.room) {
        setRoomInfo({
          name: data.room.name || roomName || "",
          duration: data.room.duration || propDuration || 60,
          capacity_min: data.room.capacity_min || propCapMin || 2,
          capacity_max: data.room.capacity_max || propCapMax || 6,
          price_per_person: data.room.price_per_person || propPrice || 0,
          fee_per_player: data.room.fee_per_player || 0.50,
          pricing_model: data.room.pricing_model || pricingModel || 'per_person',
          price_per_session: data.room.price_per_session || pricePerSession || 0,
        });
      }
    } catch (err: any) {
      console.error("[BookingWidget] Availability error:", err);
      setError(err.message || "Error cargando disponibilidad");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [roomId, roomName, propDuration, propCapMin, propCapMax, propPrice]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    fetchAvailability(date);
    setStep(2);

    // Track date selection
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackBookingStep('step_2_date_selected', {
        roomId,
        selectedDate: date,
      });
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);

    // Track time selection
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackBookingStep('step_3_time_selected', {
        roomId,
        selectedTime: time,
        players,
      });
    }
  };

  const handleGoToPayment = () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setError(lang === "en" ? "Name and email are required" : "Nombre y email son obligatorios");
      return;
    }
    if (!acceptTerms) {
      setError(lang === "en" ? "You must accept the terms" : "Debes aceptar los términos");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setError(lang === "en" ? "Invalid email" : "Email no válido");
      return;
    }
    setError(null);

    // Track customer info step completion
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackBookingStep('step_4_info_complete', {
        roomId,
        selectedDate,
        selectedTime,
        players,
        totalPrice,
      });
    }

    setStep(4);
  };

  const isSessionModel = roomInfo.pricing_model === 'per_session';
  const basePrice = isSessionModel ? roomInfo.price_per_session : (roomInfo.price_per_person * players);
  const platformFeePerPlayer = roomInfo.fee_per_player || 0.50;
  const platformFee = Math.round(players * platformFeePerPlayer * 100) / 100;
  const totalPrice = basePrice + platformFee;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Track checkout initiation
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.trackBookingStep('step_5_checkout_initiated', {
          roomId,
          selectedDate,
          selectedTime,
          players,
          totalPrice,
        });
      }

      const token = localStorage.getItem("em_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const startTimeISO = `${selectedDate}T${selectedTime}:00`;

      const apiBase = (import.meta.env.PUBLIC_API_URL as string) || "http://localhost:8000/v1/api";
      const res = await fetch(`${apiBase}/payments/create-checkout`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          gameId: roomId,
          bookingDate: selectedDate,
          startTime: startTimeISO,
          numPlayers: players,
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          lang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la reserva");
      }

      // Track checkout success
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.trackBookingStep('booking_completed', {
          roomId,
          totalPrice,
          players,
        });
      }

      // Submit form to Redsys TPV
      if (data.redsysUrl && data.formParams) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.redsysUrl;
        Object.entries(data.formParams as Record<string, string>).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Fallback: show success
      setStep(5);
    } catch (err: any) {
      console.error("[BookingWidget] Error:", err);

      // Track checkout error
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.trackBookingStep('booking_error', {
          roomId,
          error: err.message,
        });
      }
      setError(err.message || "Error al procesar la reserva");
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    es: {
      title: "Reservar",
      verified: "Reserva directa verificada",
      selectDate: "Fecha",
      selectTime: "Horario",
      yourDetails: "Datos",
      paymentSummary: "Pago",
      closed: "Cerrado este día",
      closedDesc: "Selecciona otro día",
      noSlots: "No hay horarios disponibles",
      available: "Disponible",
      booked: "Ocupado",
      players: "jugadores",
      player: "jugador",
      date: "Fecha",
      time: "Hora",
      duration: "Duración",
      back: "Volver",
      next: "Siguiente",
      today: "Hoy",
      tomorrow: "Mañana",
      name: "Nombre completo",
      email: "Email",
      phone: "Teléfono (opcional)",
      terms: "Acepto los términos y condiciones y la política de cancelación",
      subtotal: "Subtotal",
      serviceFee: "Tarifa de servicio",
      total: "Total a pagar",
      perPerson: "/persona",
      perSession: "/sesión",
      payNow: "Pagar ahora",
      processing: "Procesando...",
      securePayment: "Pago seguro con Redsys TPV",
      cancelPolicy: "Cancelación gratuita hasta 24h antes",
      success: "¡Reserva confirmada!",
      successDesc: "Recibirás un email de confirmación en breve",
      step: "Paso",
      of: "de",
      loadingSlots: "Cargando horarios...",
      min: "min",
    },
    en: {
      title: "Book",
      verified: "Verified direct booking",
      selectDate: "Date",
      selectTime: "Time",
      yourDetails: "Details",
      paymentSummary: "Payment",
      closed: "Closed this day",
      closedDesc: "Select another day",
      noSlots: "No time slots available",
      available: "Available",
      booked: "Booked",
      players: "players",
      player: "player",
      date: "Date",
      time: "Time",
      duration: "Duration",
      back: "Back",
      next: "Next",
      today: "Today",
      tomorrow: "Tomorrow",
      name: "Full name",
      email: "Email",
      phone: "Phone (optional)",
      terms: "I accept the terms and conditions and the cancellation policy",
      subtotal: "Subtotal",
      serviceFee: "Service fee",
      total: "Total",
      perPerson: "/person",
      perSession: "/session",
      payNow: "Pay now",
      processing: "Processing...",
      securePayment: "Secure payment with Redsys TPV",
      cancelPolicy: "Free cancellation up to 24h before",
      success: "Booking confirmed!",
      successDesc: "You'll receive a confirmation email shortly",
      step: "Step",
      of: "of",
      loadingSlots: "Loading times...",
      min: "min",
    },
  };

  const txt = t[lang as keyof typeof t] || t.es;

  const stepLabels = [txt.selectDate, txt.selectTime, txt.yourDetails, txt.paymentSummary];

  return (
    <div className="w-full max-w-lg lg:max-w-5xl mx-auto px-2 sm:px-0">
      {/* Main Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-tropical-secondary/10 overflow-hidden">
        
        {/* Header */}
        <div className="bg-tropical-primary p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur">
                <CalendarIcon size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">{txt.title}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield size={12} className="text-green-300" />
                  <span className="text-[11px] text-white/70 font-medium">{txt.verified}</span>
                </div>
              </div>
            </div>
            {roomInfo.price_per_person > 0 && (
              <div className="text-right">
                <div className="text-2xl font-black">
                  {isSessionModel ? roomInfo.price_per_session : roomInfo.price_per_person}€
                </div>
                <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
                  {isSessionModel ? txt.perSession : txt.perPerson}
                </div>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-all duration-500 ${
                  step >= s ? "bg-white" : "bg-white/20"
                }`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {stepLabels.map((label, i) => (
              <span key={i} className={`text-[9px] font-medium transition-colors ${
                step > i + 1 ? "text-green-300" : step === i + 1 ? "text-white" : "text-white/30"
              }`}>
                {step > i + 1 ? "✓ " : ""}{label}
              </span>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 sm:mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6">
          
          {/* ─── Step 1: Date Selection ─── */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-tropical-text/50">
                  {txt.selectDate}
                </h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDateOffset(Math.max(0, dateOffset - 7))}
                    disabled={dateOffset === 0}
                    className="p-1.5 rounded-lg hover:bg-tropical-primary/10 disabled:opacity-30 transition-all active:scale-95 touch-manipulation"
                  >
                    <ChevronLeft size={18} className="text-tropical-primary" />
                  </button>
                  <button
                    onClick={() => setDateOffset(Math.min(dates.length - 7, dateOffset + 7))}
                    disabled={dateOffset >= dates.length - 7}
                    className="p-1.5 rounded-lg hover:bg-tropical-primary/10 disabled:opacity-30 transition-all active:scale-95 touch-manipulation"
                  >
                    <ChevronRight size={18} className="text-tropical-primary" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 lg:grid-cols-7 gap-1.5 sm:gap-4">
                {visibleDates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => handleDateSelect(d.date)}
                    className={`relative flex flex-col items-center justify-center p-2 sm:p-5 rounded-xl sm:rounded-3xl border-2 transition-all active:scale-95 touch-manipulation ${
                      selectedDate === d.date
                        ? "border-tropical-primary bg-tropical-primary text-white shadow-lg shadow-tropical-primary/25"
                        : d.isWeekend
                          ? "border-tropical-accent/30 bg-tropical-accent/5 hover:border-tropical-primary"
                          : "border-tropical-secondary/20 hover:border-tropical-primary hover:bg-tropical-primary/5"
                    }`}
                  >
                    {(d.isToday || d.isTomorrow) && (
                      <span className={`absolute -top-2 text-[7px] sm:text-[10px] font-black uppercase px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                        selectedDate === d.date
                          ? "bg-white text-tropical-primary"
                          : "bg-tropical-accent text-white"
                      }`}>
                        {d.isToday ? txt.today : txt.tomorrow}
                      </span>
                    )}
                    <span className={`text-[8px] sm:text-xs font-bold uppercase ${
                      selectedDate === d.date ? "text-white/70" : "text-tropical-text/40"
                    }`}>
                      {d.dayName[lang as keyof typeof d.dayName] || d.dayName.es}
                    </span>
                    <span className={`text-lg sm:text-4xl font-black ${
                      selectedDate === d.date ? "text-white" : "text-tropical-text"
                    }`}>
                      {d.day}
                    </span>
                    <span className={`text-[8px] sm:text-xs font-bold uppercase ${
                      selectedDate === d.date ? "text-white/70" : "text-tropical-text/40"
                    }`}>
                      {d.month[lang as keyof typeof d.month] || d.month.es}
                    </span>
                  </button>
                ))}
              </div>

              {/* Room info compact */}
              <div className="flex items-center gap-4 p-3 bg-tropical-card rounded-xl text-xs text-tropical-text/60">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-tropical-secondary" /> {roomInfo.duration} {txt.min}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={13} className="text-tropical-secondary" /> {roomInfo.capacity_min}-{roomInfo.capacity_max} {txt.players}
                </span>
                {city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-tropical-secondary" /> {city}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ─── Step 2: Time & Players ─── */}
          {step === 2 && (
            <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-tropical-text/50">
                  {txt.selectTime}
                </h4>
                <button
                  onClick={() => { setStep(1); setSelectedTime(null); }}
                  className="text-xs font-bold text-tropical-secondary hover:text-tropical-primary flex items-center gap-1 touch-manipulation"
                >
                  <ArrowLeft size={12} /> {txt.back}
                </button>
              </div>

              {/* Selected date pill */}
              {selectedDateInfo && (
                <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-tropical-primary/5 rounded-lg sm:rounded-xl border border-tropical-primary/10">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-tropical-primary text-white rounded-lg sm:rounded-xl flex items-center justify-center font-black text-sm sm:text-base">
                    {selectedDateInfo.day}
                  </div>
                  <div>
                    <p className="font-bold text-tropical-text text-sm sm:text-base">
                      {selectedDateInfo.dayName[lang as keyof typeof selectedDateInfo.dayName]}, {selectedDateInfo.day} {selectedDateInfo.fullMonth[lang as keyof typeof selectedDateInfo.fullMonth]}
                    </p>
                    <p className="text-[10px] sm:text-xs text-tropical-text/50">{selectedDateInfo.year}</p>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {loadingSlots && (
                <div className="flex items-center justify-center py-8 gap-2 text-tropical-text/40">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">{txt.loadingSlots}</span>
                </div>
              )}

              {/* Closed day */}
              {!loadingSlots && isClosed && (
                <div className="text-center py-8 space-y-2">
                  <div className="w-14 h-14 bg-tropical-card rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={24} className="text-tropical-text/40" />
                  </div>
                  <p className="font-bold text-tropical-text">{txt.closed}</p>
                  <p className="text-sm text-tropical-text/50">{txt.closedDesc}</p>
                  <button
                    onClick={() => setStep(1)}
                    className="mt-3 text-sm font-bold text-tropical-primary hover:underline"
                  >
                    ← {txt.selectDate}
                  </button>
                </div>
              )}

              {/* Time slots grid */}
              {!loadingSlots && !isClosed && slots.length > 0 && (
                <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-1.5 sm:gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available ? handleTimeSelect(slot.time) : undefined}
                          disabled={!slot.available}
                          className={`group relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 font-bold transition-all active:scale-95 touch-manipulation text-sm sm:text-base ${
                            selectedTime === slot.time
                              ? "border-tropical-primary bg-tropical-primary text-white shadow-lg"
                              : slot.available
                                ? "border-tropical-secondary/20 hover:border-tropical-primary hover:bg-tropical-primary/5 text-tropical-text"
                                : "border-tropical-secondary/10 bg-tropical-card text-tropical-text/30 cursor-not-allowed line-through"
                          }`}
                        >
                          <Clock size={12} className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 ${
                            selectedTime === slot.time ? "text-white/50" : "text-tropical-secondary/30"
                          }`} />
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 lg:mt-0 space-y-6 lg:sticky lg:top-4">
                    {/* Players selector */}
                    <div className="pt-4 lg:pt-0 border-t lg:border-t-0 border-tropical-secondary/10">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-tropical-text/50 mb-3">
                        {lang === "en" ? "Players" : "Jugadores"}
                      </h4>
                      <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-6 py-2">
                        <button
                          onClick={() => setPlayers(Math.max(roomInfo.capacity_min, players - 1))}
                          disabled={players <= roomInfo.capacity_min}
                          className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-tropical-secondary/10 text-tropical-text font-bold text-xl hover:bg-tropical-primary hover:text-white disabled:opacity-30 transition-all active:scale-95 touch-manipulation"
                        >
                          −
                        </button>
                        <div className="flex items-center gap-2 px-4">
                          <Users size={24} className="text-tropical-primary hidden sm:block" />
                          <span className="text-3xl sm:text-5xl font-black text-tropical-text">{players}</span>
                        </div>
                        <button
                          onClick={() => setPlayers(Math.min(roomInfo.capacity_max, players + 1))}
                          disabled={players >= roomInfo.capacity_max}
                          className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-tropical-secondary/10 text-tropical-text font-bold text-xl hover:bg-tropical-primary hover:text-white disabled:opacity-30 transition-all active:scale-95 touch-manipulation"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-center lg:text-left text-xs text-tropical-text/40 mt-1">
                        {roomInfo.capacity_min}–{roomInfo.capacity_max} {txt.players}
                      </p>
                    </div>

                    {/* Price preview */}
                    {selectedTime && (
                      <div className="p-4 sm:p-5 bg-tropical-card rounded-2xl flex items-center justify-between border-2 border-tropical-primary/10 shadow-sm">
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-tropical-text/80 block">
                            {txt.total}
                          </span>
                          <span className="text-xs text-tropical-text/40">
                            {players} × {roomInfo.price_per_person}€ {txt.perPerson}
                          </span>
                        </div>
                        <span className="text-3xl font-black text-tropical-primary">
                          {basePrice.toFixed(2)}€
                        </span>
                      </div>
                    )}

                    {selectedTime && (
                      <Button
                        variant="cta"
                        className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-tropical-accent/30 hover:scale-[1.02] transition-transform"
                        onClick={() => setStep(3)}
                      >
                        <span className="flex items-center gap-3">
                          {txt.next} <ArrowRight size={24} />
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* No slots */}
              {!loadingSlots && !isClosed && slots.length === 0 && !error && (
                <div className="text-center py-8">
                  <p className="text-tropical-text/40 text-sm">{txt.noSlots}</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Customer Details ─── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-tropical-text/50">
                  {txt.yourDetails}
                </h4>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-tropical-secondary hover:text-tropical-primary flex items-center gap-1 touch-manipulation"
                >
                  <ArrowLeft size={12} /> {txt.back}
                </button>
              </div>

              <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
                <div className="space-y-6">
                  {/* Booking summary compact */}
                  <div className="flex items-center gap-4 p-4 lg:p-6 bg-tropical-primary/5 rounded-xl lg:rounded-2xl border-2 border-tropical-primary/10 text-sm lg:text-base">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <CalendarIcon size={20} className="text-tropical-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-tropical-text block">
                        {selectedDateInfo?.dayName[lang as keyof typeof selectedDateInfo.dayName]} {selectedDateInfo?.day} {selectedDateInfo?.month[lang as keyof typeof selectedDateInfo.month]}
                      </span>
                      <span className="text-tropical-text/60">
                        {selectedTime} · {players} {players === 1 ? txt.player : txt.players}
                      </span>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs lg:text-sm font-bold text-tropical-text/50 mb-1.5 lg:mb-2">{txt.name} *</label>
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tropical-secondary" />
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder={lang === "en" ? "John Doe" : "María García"}
                          className="w-full pl-12 pr-4 py-3.5 lg:py-4 border-2 border-tropical-secondary/20 rounded-xl lg:rounded-2xl text-base text-tropical-text focus:outline-none focus:border-tropical-primary focus:ring-4 focus:ring-tropical-primary/10 transition-all bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs lg:text-sm font-bold text-tropical-text/50 mb-1.5 lg:mb-2">{txt.email} *</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tropical-secondary" />
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="w-full pl-12 pr-4 py-3.5 lg:py-4 border-2 border-tropical-secondary/20 rounded-xl lg:rounded-2xl text-base text-tropical-text focus:outline-none focus:border-tropical-primary focus:ring-4 focus:ring-tropical-primary/10 transition-all bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs lg:text-sm font-bold text-tropical-text/50 mb-1.5 lg:mb-2">{txt.phone}</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tropical-secondary" />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+34 612 345 678"
                          className="w-full pl-12 pr-4 py-3.5 lg:py-4 border-2 border-tropical-secondary/20 rounded-xl lg:rounded-2xl text-base text-tropical-text focus:outline-none focus:border-tropical-primary focus:ring-4 focus:ring-tropical-primary/10 transition-all bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 lg:mt-0 space-y-6 lg:sticky lg:top-4">
                  {/* Terms */}
                  <div className="p-4 lg:p-6 bg-tropical-card rounded-2xl border border-tropical-secondary/10">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-tropical-secondary/40 text-tropical-primary focus:ring-tropical-primary shadow-sm"
                      />
                      <span className="text-sm lg:text-base text-tropical-text/70 leading-relaxed font-medium">{txt.terms}</span>
                    </label>
                  </div>

                  <Button
                    variant="cta"
                    className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-tropical-accent/30 hover:scale-[1.02] transition-transform"
                    onClick={handleGoToPayment}
                  >
                    <span className="flex items-center gap-3">
                      {txt.next} <ArrowRight size={24} />
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 4: Payment Summary & Confirm ─── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-tropical-text/50">
                  {txt.paymentSummary}
                </h4>
                <button
                  onClick={() => setStep(3)}
                  className="text-xs font-bold text-tropical-secondary hover:text-tropical-primary flex items-center gap-1 touch-manipulation"
                >
                  <ArrowLeft size={12} /> {txt.back}
                </button>
              </div>

              <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
                <div className="space-y-6">
                  {/* Summary card */}
                  <div className="bg-tropical-card p-5 lg:p-8 rounded-2xl lg:rounded-3xl space-y-6 border-2 border-tropical-secondary/10 shadow-sm">
                    {/* Room info */}
                    <div className="pb-4 border-b-2 border-tropical-secondary/10">
                      <h5 className="text-xl lg:text-2xl font-black text-tropical-text leading-tight">{roomInfo.name || roomName}</h5>
                      {orgName && <p className="text-sm text-tropical-primary font-bold mt-1 uppercase tracking-wider">{orgName}</p>}
                    </div>
                    
                    {/* Booking details */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between group">
                        <span className="text-tropical-text/60 flex items-center gap-3 text-sm lg:text-base">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:bg-tropical-primary/10 transition-colors">
                            <CalendarIcon size={16} className="text-tropical-secondary" />
                          </div>
                          {txt.date}
                        </span>
                        <span className="font-bold text-tropical-text text-sm lg:text-base">
                          {selectedDateInfo?.dayName[lang as keyof typeof selectedDateInfo.dayName]} {selectedDateInfo?.day} {selectedDateInfo?.month[lang as keyof typeof selectedDateInfo.month]} {selectedDateInfo?.year}
                        </span>
                      </div>
                      <div className="flex items-center justify-between group">
                        <span className="text-tropical-text/60 flex items-center gap-3 text-sm lg:text-base">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:bg-tropical-primary/10 transition-colors">
                            <Clock size={16} className="text-tropical-secondary" />
                          </div>
                          {txt.time}
                        </span>
                        <span className="font-bold text-tropical-text text-sm lg:text-base">{selectedTime}</span>
                      </div>
                      <div className="flex items-center justify-between group">
                        <span className="text-tropical-text/60 flex items-center gap-3 text-sm lg:text-base">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:bg-tropical-primary/10 transition-colors">
                            <Users size={16} className="text-tropical-secondary" />
                          </div>
                          {players === 1 ? txt.player : txt.players}
                        </span>
                        <span className="font-bold text-tropical-text text-sm lg:text-base">{players}</span>
                      </div>
                      <div className="flex items-center justify-between group">
                        <span className="text-tropical-text/60 flex items-center gap-3 text-sm lg:text-base">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:bg-tropical-primary/10 transition-colors">
                            <Clock size={16} className="text-tropical-secondary" />
                          </div>
                          {txt.duration}
                        </span>
                        <span className="font-bold text-tropical-text text-sm lg:text-base">{roomInfo.duration} {txt.min}</span>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="pt-5 border-t-2 border-tropical-secondary/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-tropical-text/50 text-xs lg:text-sm uppercase font-black tracking-widest">{txt.name}</span>
                        <span className="font-bold text-tropical-text text-sm lg:text-base">{customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-tropical-text/50 text-xs lg:text-sm uppercase font-black tracking-widest">{txt.email}</span>
                        <span className="font-bold text-tropical-text text-sm lg:text-base truncate max-w-[180px] lg:max-w-none ml-4">{customerEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 lg:mt-0 space-y-6 lg:sticky lg:top-4">
                  {/* Price breakdown */}
                  <div className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-3xl border-2 border-tropical-primary/10 shadow-xl space-y-4">
                    <div className="space-y-2 text-sm lg:text-base">
                      <div className="flex justify-between items-center text-tropical-text/60">
                        <span>{txt.subtotal}</span>
                        <span className="font-medium">{basePrice.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center text-tropical-text/60">
                        <span>{txt.serviceFee}</span>
                        <span className="font-medium text-green-600">{platformFee.toFixed(2)}€</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t-2 border-tropical-secondary/10 flex justify-between items-end">
                      <div className="space-y-0.5">
                        <div className="text-xs lg:text-sm font-black text-tropical-text/40 uppercase tracking-widest">{txt.total}</div>
                        <div className="text-4xl lg:text-5xl font-black text-tropical-text tracking-tighter">
                          {totalPrice.toFixed(2)}<span className="text-2xl lg:text-3xl">€</span>
                        </div>
                      </div>
                      <div className="hidden lg:block pb-1.5">
                        <CreditCard size={32} className="text-tropical-primary/20" />
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      <Button
                        variant="cta"
                        className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-tropical-accent/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
                        onClick={handleConfirm}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <><Loader2 className="animate-spin" size={24} /> {txt.processing}</>
                        ) : (
                          <><CreditCard size={24} /> {txt.payNow}</>
                        )}
                      </Button>
                      
                      <div className="flex items-center justify-center gap-4 py-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                        <Shield size={16} className="text-green-600" />
                        <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-tropical-text">{txt.securePayment}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cancel policy hint */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
                    <Check size={18} className="text-green-600 flex-shrink-0" />
                    <p className="text-xs lg:text-sm font-medium text-green-800">{txt.cancelPolicy}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 5: Success ─── */}
          {step === 5 && (
            <div className="py-12 lg:py-24 text-center space-y-6 lg:space-y-8 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white">
                <Check size={48} className="lg:w-16 lg:h-16" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl lg:text-5xl font-black text-tropical-text tracking-tight">{txt.success}</h3>
                <p className="text-tropical-text/60 max-w-sm lg:max-w-md mx-auto text-base lg:text-xl font-medium leading-relaxed">
                  {txt.successDesc}
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => window.location.href = `/${lang}/profile/history`}
                  className="px-8 h-14 rounded-2xl bg-tropical-primary text-white font-bold text-lg hover:bg-tropical-primary/90 shadow-lg"
                >
                  {lang === "en" ? "View my bookings" : "Ver mis reservas"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
