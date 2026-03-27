import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Loader2,
  Search,
  ShoppingCart,
} from "lucide-react";

type RouteRoom = {
  id: string;
  name: string;
  image_url: string | null;
  city: string | null;
  duration_minutes: number | null;
  capacity_min: number | null;
  capacity: number | null;
};

type AvailabilitySlot = {
  time: string;
  available: boolean;
  booked: boolean;
  past: boolean;
};

type AvailabilityResponse = {
  slots: AvailabilitySlot[];
  closed: boolean;
};

type RoomAvailabilityState = {
  loading: boolean;
  error: string;
  slots: AvailabilitySlot[];
};

interface RouteBulkBookingProps {
  lang?: string;
  rooms: RouteRoom[];
}

const DEFAULT_ROOM_IMAGE =
  "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=800&q=80";

const getTomorrowISODate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

export const RouteBulkBooking: React.FC<RouteBulkBookingProps> = ({
  lang = "es",
  rooms,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTomorrowISODate());
  const [players, setPlayers] = useState(4);
  const [searching, setSearching] = useState(false);
  const [availabilityByRoom, setAvailabilityByRoom] = useState<
    Record<string, RoomAvailabilityState>
  >({});
  const [selectedSlotByRoom, setSelectedSlotByRoom] = useState<
    Record<string, string>
  >({});

  const labels = useMemo(
    () =>
      lang === "en"
        ? {
            title: "Book Full Route",
            subtitle:
              "First review all rooms in this route and find available date/time for each one.",
            date: "Date",
            players: "Players",
            search: "Search date and time",
            searching: "Searching availability...",
            availableHours: "Available hours",
            noHours: "No hours available for this date",
            reserveAll: "Reserve all route rooms",
            reserveHelp:
              "This opens one tab per room with selected date and time so you can complete each booking.",
            room: "Room",
            duration: "Duration",
            capacity: "Capacity",
            city: "City",
            noRooms: "This route has no rooms yet.",
            selectTime: "Select hour",
            selectBefore:
              "Select one available hour for each room to enable full route booking.",
          }
        : {
            title: "Reservar toda la ruta",
            subtitle:
              "Primero revisa todas las salas de la ruta y busca fecha/hora disponible para cada una.",
            date: "Fecha",
            players: "Jugadores",
            search: "Buscar hora y día",
            searching: "Buscando disponibilidad...",
            availableHours: "Horas disponibles",
            noHours: "Sin horas disponibles para esta fecha",
            reserveAll: "Reservar todo",
            reserveHelp:
              "Se abrirá una pestaña por sala con fecha y hora seleccionadas para completar cada reserva.",
            room: "Sala",
            duration: "Duración",
            capacity: "Capacidad",
            city: "Ciudad",
            noRooms: "Esta ruta todavía no tiene salas.",
            selectTime: "Selecciona hora",
            selectBefore:
              "Selecciona una hora disponible por cada sala para habilitar la reserva completa.",
          },
    [lang],
  );

  const minCapacity = useMemo(() => {
    const values = rooms
      .map((room) => Number(room.capacity_min || 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    return values.length > 0 ? Math.min(...values) : 1;
  }, [rooms]);

  const maxCapacity = useMemo(() => {
    const values = rooms
      .map((room) => Number(room.capacity || 0))
      .filter((value) => Number.isFinite(value) && value > 0);
    return values.length > 0 ? Math.max(...values) : 10;
  }, [rooms]);

  const canReserveAll =
    rooms.length > 0 &&
    rooms.every((room) => {
      const selected = selectedSlotByRoom[room.id];
      return typeof selected === "string" && selected.length > 0;
    });

  const searchAvailability = async () => {
    if (!selectedDate || rooms.length === 0) return;

    setSearching(true);

    const loadingState = rooms.reduce<Record<string, RoomAvailabilityState>>(
      (carry, room) => ({
        ...carry,
        [room.id]: { loading: true, error: "", slots: [] },
      }),
      {},
    );

    setAvailabilityByRoom(loadingState);
    setSelectedSlotByRoom({});

    const nextState = { ...loadingState };

    await Promise.all(
      rooms.map(async (room) => {
        try {
          const response = await fetch(
            `/api/rooms/availability?roomId=${room.id}&date=${selectedDate}`,
          );
          const payload = (await response.json()) as AvailabilityResponse & {
            error?: string;
          };

          if (!response.ok) {
            nextState[room.id] = {
              loading: false,
              error: payload.error || "Error de disponibilidad",
              slots: [],
            };
            return;
          }

          const availableSlots = Array.isArray(payload.slots)
            ? payload.slots.filter((slot) => slot.available)
            : [];

          nextState[room.id] = {
            loading: false,
            error: payload.closed ? labels.noHours : "",
            slots: availableSlots,
          };
        } catch {
          nextState[room.id] = {
            loading: false,
            error: "Error de conexión",
            slots: [],
          };
        }
      }),
    );

    setAvailabilityByRoom(nextState);
    setSearching(false);
  };

  const handleReserveAll = () => {
    if (!canReserveAll) return;

    const bookingLinks = rooms
      .map((room) => {
        const selectedTime = selectedSlotByRoom[room.id];
        if (!selectedTime) return null;
        return `/${lang}/game/${room.id}?bookingDate=${selectedDate}&startTime=${selectedTime}&players=${players}`;
      })
      .filter(Boolean) as string[];

    if (bookingLinks.length === 0) return;

    bookingLinks.slice(1).forEach((url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    });

    window.location.href = bookingLinks[0];
  };

  if (rooms.length === 0) {
    return (
      <section className="bg-white rounded-2xl border border-tropical-secondary/20 p-6">
        <p className="text-tropical-text/60 text-sm font-semibold">
          {labels.noRooms}
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-tropical-secondary/20 shadow-sm p-4 sm:p-6 space-y-5">
      <div>
        <h3 className="text-xl font-black text-tropical-text">
          {labels.title}
        </h3>
        <p className="text-sm text-tropical-text/60 mt-1">{labels.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label className="sm:col-span-2">
          <span className="text-[11px] uppercase font-black tracking-wider text-tropical-text/50">
            {labels.date}
          </span>
          <div className="mt-1 relative">
            <CalendarDays className="w-4 h-4 text-tropical-primary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              className="w-full h-11 rounded-xl border border-tropical-secondary/30 pl-10 pr-3 text-sm font-semibold text-tropical-text outline-none focus:border-tropical-primary"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </label>

        <label className="sm:col-span-1">
          <span className="text-[11px] uppercase font-black tracking-wider text-tropical-text/50">
            {labels.players}
          </span>
          <input
            type="number"
            min={minCapacity}
            max={maxCapacity}
            className="mt-1 w-full h-11 rounded-xl border border-tropical-secondary/30 px-3 text-sm font-semibold text-tropical-text outline-none focus:border-tropical-primary"
            value={players}
            onChange={(event) => {
              const nextValue = Number(event.target.value || minCapacity);
              const boundedValue = Math.min(
                maxCapacity,
                Math.max(minCapacity, nextValue),
              );
              setPlayers(boundedValue);
            }}
          />
        </label>

        <button
          type="button"
          onClick={searchAvailability}
          disabled={searching}
          className="sm:col-span-1 mt-[18px] h-11 rounded-xl bg-tropical-primary text-white text-sm font-black uppercase tracking-wider hover:bg-tropical-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {searching ? labels.searching : labels.search}
        </button>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => {
          const state = availabilityByRoom[room.id] || {
            loading: false,
            error: "",
            slots: [],
          };

          return (
            <article
              key={room.id}
              className="border border-tropical-secondary/20 rounded-2xl p-3 sm:p-4"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <img
                  src={room.image_url || DEFAULT_ROOM_IMAGE}
                  alt={room.name}
                  className="w-full sm:w-28 h-20 object-cover rounded-xl border border-tropical-secondary/20"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-black text-tropical-text truncate">
                    {room.name}
                  </h4>
                  <p className="text-xs text-tropical-text/60 mt-1">
                    {labels.city}: {room.city || "—"} · {labels.duration}:{" "}
                    {room.duration_minutes || 60} min · {labels.capacity}:{" "}
                    {room.capacity_min || 1}-{room.capacity || 10}
                  </p>
                </div>

                <div className="sm:w-72">
                  <label className="text-[11px] uppercase font-black tracking-wider text-tropical-text/50">
                    {labels.availableHours}
                  </label>
                  <div className="mt-1 relative">
                    <Clock3 className="w-4 h-4 text-tropical-primary absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      className="w-full h-11 rounded-xl border border-tropical-secondary/30 pl-10 pr-3 text-sm font-semibold text-tropical-text outline-none focus:border-tropical-primary"
                      value={selectedSlotByRoom[room.id] || ""}
                      onChange={(event) =>
                        setSelectedSlotByRoom((prev) => ({
                          ...prev,
                          [room.id]: event.target.value,
                        }))
                      }
                      disabled={state.loading || state.slots.length === 0}
                    >
                      <option value="">{labels.selectTime}</option>
                      {state.slots.map((slot) => (
                        <option
                          key={`${room.id}-${slot.time}`}
                          value={slot.time}
                        >
                          {slot.time}
                        </option>
                      ))}
                    </select>
                  </div>
                  {state.error && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">
                      {state.error}
                    </p>
                  )}
                  {!state.error &&
                    !state.loading &&
                    state.slots.length === 0 && (
                      <p className="text-[11px] text-tropical-text/50 font-semibold mt-1">
                        {labels.noHours}
                      </p>
                    )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-t border-tropical-secondary/20 pt-4 space-y-3">
        <p className="text-xs text-tropical-text/60 font-semibold">
          {labels.reserveHelp}
        </p>
        <p className="text-xs text-tropical-text/60 font-semibold">
          {labels.selectBefore}
        </p>
        <button
          type="button"
          onClick={handleReserveAll}
          disabled={!canReserveAll}
          className="w-full h-11 rounded-xl bg-tropical-accent text-white text-sm font-black uppercase tracking-wider hover:bg-tropical-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {labels.reserveAll}
        </button>
      </div>
    </section>
  );
};
