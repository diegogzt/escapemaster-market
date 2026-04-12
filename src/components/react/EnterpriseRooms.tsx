import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "../../i18n/ui";

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || '';

type Room = {
  id: string;
  name: string;
  city: string;
  is_active: boolean;
  price_per_person: number;
  capacity_min: number | null;
  capacity: number | null;
  duration_minutes: number | null;
  booking_manager: string;
  erd_url: string | null;
  erd_token: string | null;
  erd_game_id: string | null;
  image_url: string | null;
  calendar_id: string | null;
  calendar_name: string | null;
  theme: string;
  slogan: string;
  description: string;
  min_age: number | null;
  max_age: number | null;
  physical_rating: string | null;
  fear_level: string | null;
  address: string;
  province: string;
  community: string;
  latitude: string;
  longitude: string;
  google_rating: string | null;
  tripadvisor_rating: string | null;
  average_rating: number;
  total_reviews: number;
  success_rate: number;
  success_rate_percentage: number;
  supports_video_recording: boolean;
  supports_actor_mode: boolean;
  is_family_friendly: boolean;
  with_actors: boolean;
  with_fathers: boolean;
  with_monitor: boolean;
  min_age_accompanied: string | null;
  min_age_alone: string | null;
  difficulty_level: number | null;
  video_url: string | null;
  color: string | null;
  key_features: string;
  synopsis: string;
  verification_status: string;
  created_at: string | null;
  updated_at: string | null;
};

type RoomDetail = Room & {
  photos: Array<{ id: string; image_url: string; caption: string | null; is_featured: boolean }>;
  schedules: Array<{ day_of_week: number; open_time: string | null; close_time: string | null; is_open: boolean }>;
  buffer: { buffer_minutes: number } | null;
  pricing: Array<{ id: string; day_of_week: number; start_time: string | null; end_time: string | null; price_multiplier: number; is_active: boolean }>;
  calendar: {
    id: string;
    name: string;
    type: string;
    style_settings: Record<string, any>;
    erd_token: string | null;
    erd_game_id: string | null;
  } | null;
};

type View = "list" | "detail" | "edit";

async function fetchWithAuth(url: string, options?: RequestInit) {
  const token = localStorage.getItem("em_token");
  return fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || ""}`,
    },
  });
}

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function EnterpriseRooms({ lang }: { lang: string }) {
  const t = useTranslations(lang === "en" ? "en" : "es");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetail | null>(null);
  const [view, setView] = useState<View>("list");
  const [showCalendar, setShowCalendar] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Room>>({});
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE}/enterprise/rooms`);
      if (!res.ok) throw new Error("Error cargando salas");
      const data = await res.json();
      setRooms(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const toggleActive = async (room: Room) => {
    setTogglingId(room.id);
    try {
      const res = await fetchWithAuth(`${API_BASE}/enterprise/rooms/${room.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !room.is_active }),
      });
      if (res.ok) {
        setRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, is_active: !r.is_active } : r))
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  const openDetail = async (room: Room) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/enterprise/rooms/${room.id}`);
      if (!res.ok) throw new Error("Error cargando sala");
      const data = await res.json();
      setSelectedRoom(data.data);
      setEditForm(data.data);
      setView("detail");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => setView("edit");
  const closeDetail = () => {
    setSelectedRoom(null);
    setView("list");
  };

  const handleFieldChange = (field: keyof Room, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!selectedRoom) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/enterprise/rooms/${selectedRoom.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        await loadRooms();
        const updated = await res.json();
        setSelectedRoom((prev) => prev ? { ...prev, ...updated.data } : null);
        setView("detail");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tropical-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-tropical-secondary/15 p-8 text-center">
        <div className="w-16 h-16 bg-tropical-card rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tropical-secondary"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h3 className="font-bold text-tropical-text text-lg mb-2">
          {lang === "en" ? "No rooms yet" : "No tienes salas todavía"}
        </h3>
        <p className="text-tropical-text/60 text-sm">
          {lang === "en"
            ? "Import your first room from the ERD Panel or Manager API."
            : "Importa tu primera sala desde el Panel ERD o la API del Manager."}
        </p>
      </div>
    );
  }

  if (view === "detail" && selectedRoom) {
    return <RoomDetailView room={selectedRoom} lang={lang} onBack={closeDetail} onEdit={openEdit} onCalendar={() => setShowCalendar(true)} />;
  }

  if (view === "edit" && selectedRoom) {
    return <RoomEditView room={selectedRoom} form={editForm} lang={lang} onBack={() => setView("detail")} onFieldChange={handleFieldChange} onSave={saveEdit} saving={saving} />;
  }

  return (
    <div>
      {/* Rooms Table */}
      <div className="bg-white rounded-2xl border border-tropical-secondary/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tropical-secondary/10">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-tropical-text/50">
                  {lang === "en" ? "Name" : "Nombre"}
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-tropical-text/50 hidden sm:table-cell">
                  {lang === "en" ? "City" : "Ciudad"}
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-tropical-text/50 hidden md:table-cell">
                  {lang === "en" ? "Price" : "Precio"}
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-tropical-text/50">
                  {lang === "en" ? "Status" : "Estado"}
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-tropical-text/50 hidden lg:table-cell">
                  {lang === "en" ? "Calendar" : "Calendario"}
                </th>
                <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-tropical-text/50">
                  {lang === "en" ? "Actions" : "Acciones"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tropical-secondary/10">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-tropical-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {room.image_url ? (
                        <img src={room.image_url} alt={room.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-tropical-card shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-tropical-text text-sm truncate">{room.name}</div>
                        {room.booking_manager === "erdirector" && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-tropical-accent/10 text-tropical-accent border border-tropical-accent/20">
                            ERD
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-tropical-text/70 hidden sm:table-cell">
                    {room.city || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-tropical-text/70 hidden md:table-cell">
                    {room.price_per_person > 0 ? `€${room.price_per_person}/pers` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(room)}
                      disabled={togglingId === room.id}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
                        room.is_active
                          ? "bg-green-50 text-green-600 border border-green-500/20"
                          : "bg-red-50 text-red-500 border border-red-500/20"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${room.is_active ? "bg-green-500" : "bg-red-400"}`} />
                      {room.is_active ? (lang === "en" ? "Active" : "Activa") : (lang === "en" ? "Inactive" : "Inactiva")}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-tropical-text/50 hidden lg:table-cell">
                    {room.calendar_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDetail(room)}
                        className="p-2 rounded-lg hover:bg-tropical-card/60 text-tropical-text/50 hover:text-tropical-text transition-colors"
                        title={lang === "en" ? "View" : "Ver"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button
                        onClick={() => openDetail(room)}
                        className="p-2 rounded-lg hover:bg-tropical-primary/10 text-tropical-text/50 hover:text-tropical-primary transition-colors"
                        title={lang === "en" ? "Edit" : "Editar"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button
                        onClick={() => { openDetail(room); setShowCalendar(true); }}
                        className="p-2 rounded-lg hover:bg-tropical-secondary/10 text-tropical-text/50 hover:text-tropical-secondary transition-colors"
                        title={lang === "en" ? "Calendar" : "Calendario"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && selectedRoom && (
        <CalendarModal
          room={selectedRoom}
          lang={lang}
          apiBase={API_BASE}
          onClose={() => setShowCalendar(false)}
          onSave={() => { setShowCalendar(false); loadRooms(); }}
        />
      )}
    </div>
  );
}

// ─── Room Detail View ───────────────────────────────────────────────

function RoomDetailView({ room, lang, onBack, onEdit, onCalendar }: { room: RoomDetail; lang: string; onBack: () => void; onEdit: () => void; onCalendar: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-tropical-card/60 transition-colors text-tropical-text/60 hover:text-tropical-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-tropical-primary truncate">{room.name}</h2>
          <p className="text-sm text-tropical-text/60">{room.city}</p>
        </div>
        <button
          onClick={onCalendar}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-tropical-secondary/20 text-tropical-text font-semibold text-sm bg-white hover:bg-tropical-card/60 transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          {room.calendar_name || (lang === "en" ? "Calendar" : "Calendario")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Main image */}
        {room.image_url && (
          <div className="rounded-2xl overflow-hidden bg-tropical-card">
            <img src={room.image_url} alt={room.name} className="w-full h-48 object-cover" />
          </div>
        )}
        {/* Photos gallery */}
        {room.photos && room.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {room.photos.map((photo) => (
              <img key={photo.id} src={photo.image_url} alt={photo.caption || ""} className="rounded-lg object-cover w-full h-24" />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: lang === "en" ? "Price" : "Precio", value: room.price_per_person > 0 ? `€${room.price_per_person}/pers` : "—" },
          { label: lang === "en" ? "Capacity" : "Capacidad", value: room.capacity ? `${room.capacity} pers` : "—" },
          { label: lang === "en" ? "Duration" : "Duración", value: room.duration_minutes ? `${room.duration_minutes} min` : "—" },
          { label: lang === "en" ? "Difficulty" : "Dificultad", value: room.difficulty_level ? `${room.difficulty_level}/5` : "—" },
          { label: lang === "en" ? "Min Age" : "Edad mín.", value: room.min_age ? `${room.min_age}` : "—" },
          { label: lang === "en" ? "City" : "Ciudad", value: room.city || "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-tropical-secondary/10 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-tropical-text/40">{label}</div>
            <div className="font-bold text-tropical-text text-sm mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      {room.description && (
        <div className="bg-white rounded-2xl border border-tropical-secondary/10 p-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-2">
            {lang === "en" ? "Description" : "Descripción"}
          </h3>
          <p className="text-sm text-tropical-text/80 leading-relaxed">{room.description}</p>
        </div>
      )}

      {/* Schedules */}
      {room.schedules && room.schedules.length > 0 && (
        <div className="bg-white rounded-2xl border border-tropical-secondary/10 p-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-3">
            {lang === "en" ? "Schedule" : "Horario"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {room.schedules.map((s) => (
              <div key={s.day_of_week} className={`rounded-xl p-2.5 text-center ${s.is_open ? "bg-tropical-card" : "bg-gray-50"}`}>
                <div className="text-[10px] font-bold text-tropical-text/40 uppercase tracking-wider">{DAY_NAMES[s.day_of_week]}</div>
                <div className="mt-1 text-xs font-semibold text-tropical-text">
                  {s.is_open && s.open_time && s.close_time
                    ? `${s.open_time.slice(0, 5)} - ${s.close_time.slice(0, 5)}`
                    : (lang === "en" ? "Closed" : "Cerrado")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking info */}
      {room.booking_manager === "erdirector" && (
        <div className="bg-tropical-accent/5 rounded-2xl border border-tropical-accent/15 p-5 mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-tropical-accent mb-2">
            {lang === "en" ? "ERD Configuration" : "Configuración ERD"}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {room.erd_token && (
              <div><span className="font-semibold text-tropical-text/60">Token:</span> <span className="font-mono text-tropical-text">{room.erd_token.slice(0, 12)}***</span></div>
            )}
            {room.erd_game_id && (
              <div><span className="font-semibold text-tropical-text/60">Game ID:</span> <span className="text-tropical-text">{room.erd_game_id}</span></div>
            )}
            {room.erd_url && (
              <div className="col-span-2"><span className="font-semibold text-tropical-text/60">URL:</span> <span className="text-tropical-text">{room.erd_url}</span></div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onEdit}
        className="w-full h-12 rounded-2xl bg-tropical-primary text-white font-bold text-sm hover:bg-tropical-secondary transition-colors flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        {lang === "en" ? "Edit Room" : "Editar Sala"}
      </button>
    </div>
  );
}

// ─── Room Edit View ─────────────────────────────────────────────────

const INPUT_CLASS = "w-full h-11 px-4 rounded-xl border border-tropical-secondary/20 bg-white text-tropical-text text-sm font-medium placeholder:text-tropical-text/30 focus:outline-none focus:ring-2 focus:ring-tropical-primary/30 focus:border-tropical-primary transition-colors";

function RoomEditView({ room, form, lang, onBack, onFieldChange, onSave, saving }: { room: RoomDetail; form: Partial<Room>; lang: string; onBack: () => void; onFieldChange: (f: keyof Room, v: any) => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-tropical-card/60 transition-colors text-tropical-text/60 hover:text-tropical-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-lg font-black text-tropical-primary">{lang === "en" ? "Edit Room" : "Editar Sala"}</h2>
      </div>

      <div className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-tropical-secondary/10 p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-4">
            {lang === "en" ? "Basic Information" : "Información Básica"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">
                {lang === "en" ? "Name" : "Nombre"}
              </label>
              <input type="text" value={form.name || ""} onChange={(e) => onFieldChange("name", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">
                {lang === "en" ? "City" : "Ciudad"}
              </label>
              <input type="text" value={form.city || ""} onChange={(e) => onFieldChange("city", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">
                {lang === "en" ? "Description" : "Descripción"}
              </label>
              <textarea value={form.description || ""} onChange={(e) => onFieldChange("description", e.target.value)} rows={3} className={`${INPUT_CLASS} resize-none h-auto py-3`} />
            </div>
          </div>
        </div>

        {/* Game Parameters */}
        <div className="bg-white rounded-2xl border border-tropical-secondary/10 p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-4">
            {lang === "en" ? "Game Parameters" : "Parámetros de Juego"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Capacity Min" : "Capacidad mín."}</label>
              <input type="number" value={form.capacity_min ?? ""} onChange={(e) => onFieldChange("capacity_min", e.target.value ? Number(e.target.value) : null)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Capacity" : "Capacidad"}</label>
              <input type="number" value={form.capacity ?? ""} onChange={(e) => onFieldChange("capacity", e.target.value ? Number(e.target.value) : null)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Duration (min)" : "Duración (min)"}</label>
              <input type="number" value={form.duration_minutes ?? ""} onChange={(e) => onFieldChange("duration_minutes", e.target.value ? Number(e.target.value) : null)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Difficulty" : "Dificultad"}</label>
              <select value={form.difficulty_level ?? ""} onChange={(e) => onFieldChange("difficulty_level", e.target.value ? Number(e.target.value) : null)} className={INPUT_CLASS}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}/5</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-tropical-secondary/10 p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-4">
            {lang === "en" ? "Pricing" : "Comercial"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Price / Person" : "Precio / Persona"} (€)</label>
              <input type="number" step="0.01" value={form.price_per_person ?? ""} onChange={(e) => onFieldChange("price_per_person", e.target.value ? Number(e.target.value) : 0)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Min Age" : "Edad mín."}</label>
              <input type="number" value={form.min_age ?? ""} onChange={(e) => onFieldChange("min_age", e.target.value ? Number(e.target.value) : null)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Max Age" : "Edad máx."}</label>
              <input type="number" value={form.max_age ?? ""} onChange={(e) => onFieldChange("max_age", e.target.value ? Number(e.target.value) : null)} className={INPUT_CLASS} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-tropical-secondary/10 p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-4">
            {lang === "en" ? "Location" : "Ubicación"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Address" : "Dirección"}</label>
              <input type="text" value={form.address || ""} onChange={(e) => onFieldChange("address", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Province" : "Provincia"}</label>
              <input type="text" value={form.province || ""} onChange={(e) => onFieldChange("province", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Community" : "Comunidad"}</label>
              <input type="text" value={form.community || ""} onChange={(e) => onFieldChange("community", e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>
        </div>

        {/* ERD Config */}
        {form.booking_manager === "erdirector" && (
          <div className="bg-tropical-accent/5 rounded-2xl border border-tropical-accent/15 p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-tropical-accent mb-4">
              {lang === "en" ? "ERD Configuration" : "Configuración ERD"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">ERD Token</label>
                <input type="text" value={form.erd_token || ""} onChange={(e) => onFieldChange("erd_token", e.target.value)} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">ERD Game ID</label>
                <input type="text" value={form.erd_game_id || ""} onChange={(e) => onFieldChange("erd_game_id", e.target.value)} className={INPUT_CLASS} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">ERD URL</label>
                <input type="text" value={form.erd_url || ""} onChange={(e) => onFieldChange("erd_url", e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>
          </div>
        )}

        {/* Image URL */}
        <div className="bg-white rounded-2xl border border-tropical-secondary/10 p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-4">
            {lang === "en" ? "Image" : "Imagen"}
          </h3>
          <div>
            <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">URL de imagen principal</label>
            <input type="text" value={form.image_url || ""} onChange={(e) => onFieldChange("image_url", e.target.value)} className={INPUT_CLASS} placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="flex-1 h-12 rounded-2xl border border-tropical-secondary/20 text-tropical-text font-bold text-sm hover:bg-tropical-card/60 transition-colors">
          {lang === "en" ? "Cancel" : "Cancelar"}
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 h-12 rounded-2xl bg-tropical-primary text-white font-bold text-sm hover:bg-tropical-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          )}
          {saving ? (lang === "en" ? "Saving..." : "Guardando...") : (lang === "en" ? "Save Changes" : "Guardar Cambios")}
        </button>
      </div>
    </div>
  );
}

// ─── Calendar Modal ─────────────────────────────────────────────────

function CalendarModal({ room, lang, apiBase, onClose, onSave }: { room: RoomDetail; lang: string; apiBase: string; onClose: () => void; onSave: () => void }) {
  const [settings, setSettings] = useState<Record<string, any>>(room.calendar?.style_settings || {});
  const [saving, setSaving] = useState(false);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newCalName, setNewCalName] = useState("");
  const [newCalType, setNewCalType] = useState<"erd" | "escapemaster">("erd");
  const [newCalToken, setNewCalToken] = useState("");
  const [newCalGameId, setNewCalGameId] = useState(room.erd_game_id || "");

  // Load calendars
  useEffect(() => {
    if (!room.calendar_id) {
      setLoadingCalendars(true);
      fetchWithAuth(`${apiBase}/enterprise/calendars`)
        .then(r => r.json())
        .then(data => {
          if (data.success) setCalendars(data.data || []);
        })
        .catch(console.error)
        .finally(() => setLoadingCalendars(false));
    }
  }, [apiBase, room.calendar_id]);

  const save = async () => {
    setSaving(true);
    try {
      if (room.calendar_id) {
        await fetchWithAuth(`${apiBase}/enterprise/calendars/${room.calendar_id}`, {
          method: "PUT",
          body: JSON.stringify({ style_settings: settings }),
        });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  const selectCalendar = async (calendarId: string) => {
    setSaving(true);
    try {
      await fetchWithAuth(`${apiBase}/enterprise/rooms/${room.id}`, {
        method: "PUT",
        body: JSON.stringify({ calendar_id: calendarId }),
      });
      onSave();
    } finally {
      setSaving(false);
    }
  };

  const createCalendar = async () => {
    if (!newCalName.trim()) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${apiBase}/enterprise/calendars`, {
        method: "POST",
        body: JSON.stringify({
          name: newCalName.trim(),
          type: newCalType,
          erd_token: newCalType === "erd" ? newCalToken : undefined,
          erd_game_id: newCalType === "erd" ? newCalGameId : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        // Assign to room
        await fetchWithAuth(`${apiBase}/enterprise/rooms/${room.id}`, {
          method: "PUT",
          body: JSON.stringify({ calendar_id: data.data.id }),
        });
        onSave();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // If room has no calendar assigned, show selection/creation UI
  if (!room.calendar_id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="sticky top-0 bg-white border-b border-tropical-secondary/10 px-5 py-4 flex items-center justify-between rounded-t-2xl">
            <h3 className="font-black text-tropical-primary">
              {lang === "en" ? "Assign Calendar" : "Asignar Calendario"}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-tropical-card transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {!showCreate ? (
              <>
                <p className="text-sm text-tropical-text/70">
                  {lang === "en"
                    ? "Select an existing calendar or create a new one for this room."
                    : "Selecciona un calendario existente o crea uno nuevo para esta sala."}
                </p>

                {loadingCalendars ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin w-8 h-8 text-tropical-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  </div>
                ) : calendars.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-tropical-text/50">
                      {lang === "en" ? "Available Calendars" : "Calendarios Disponibles"}
                    </h4>
                    {calendars.map(cal => (
                      <button
                        key={cal.id}
                        onClick={() => selectCalendar(cal.id)}
                        disabled={saving}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-tropical-secondary/20 hover:border-tropical-primary/50 hover:bg-tropical-card/50 transition-colors text-left disabled:opacity-50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-tropical-primary/10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tropical-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-tropical-text truncate">{cal.name}</div>
                          <div className="text-xs text-tropical-text/50">{cal.type === "erd" ? "ERD Panel" : "EscapeMaster"}</div>
                        </div>
                        {cal.is_default && (
                          <span className="text-xs bg-tropical-secondary/20 text-tropical-secondary px-2 py-0.5 rounded-full">
                            {lang === "en" ? "Default" : "Por defecto"}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-tropical-text/50 text-center py-4">
                    {lang === "en" ? "No calendars yet. Create one below." : "No hay calendarios. Crea uno abajo."}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 h-11 rounded-xl border border-tropical-secondary/20 text-tropical-text font-semibold text-sm hover:bg-tropical-card/60 transition-colors"
                  >
                    {lang === "en" ? "Cancel" : "Cancelar"}
                  </button>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex-1 h-11 rounded-xl bg-tropical-primary text-white font-bold text-sm hover:bg-tropical-secondary transition-colors"
                  >
                    {lang === "en" ? "Create New" : "Crear Nuevo"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-tropical-text/70">
                  {lang === "en" ? "Create a new calendar for this room." : "Crea un nuevo calendario para esta sala."}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">
                      {lang === "en" ? "Calendar Name" : "Nombre del Calendario"}
                    </label>
                    <input
                      type="text"
                      value={newCalName}
                      onChange={e => setNewCalName(e.target.value)}
                      placeholder={lang === "en" ? "e.g. Sala Barcelona" : "ej. Sala Barcelona"}
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">
                      {lang === "en" ? "Type" : "Tipo"}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCalType("erd")}
                        className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors ${newCalType === "erd" ? "bg-tropical-primary text-white border-tropical-primary" : "bg-white text-tropical-text border-tropical-secondary/20 hover:border-tropical-primary/30"}`}
                      >
                        ERD Panel
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCalType("escapemaster")}
                        className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors ${newCalType === "escapemaster" ? "bg-tropical-primary text-white border-tropical-primary" : "bg-white text-tropical-text border-tropical-secondary/20 hover:border-tropical-primary/30"}`}
                      >
                        EscapeMaster
                      </button>
                    </div>
                  </div>

                  {newCalType === "erd" && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">
                          {lang === "en" ? "ERD Token" : "Token ERD"}
                        </label>
                        <input
                          type="text"
                          value={newCalToken}
                          onChange={e => setNewCalToken(e.target.value)}
                          placeholder={lang === "en" ? "Your ERD Panel token" : "Token de tu Panel ERD"}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">
                          {lang === "en" ? "ERD Game ID" : "ID Juego ERD"}
                        </label>
                        <input
                          type="text"
                          value={newCalGameId}
                          onChange={e => setNewCalGameId(e.target.value)}
                          placeholder={room.erd_game_id || "e.g. 221"}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreate(false)}
                    disabled={saving}
                    className="flex-1 h-11 rounded-xl border border-tropical-secondary/20 text-tropical-text font-semibold text-sm hover:bg-tropical-card/60 transition-colors disabled:opacity-50"
                  >
                    {lang === "en" ? "Back" : "Volver"}
                  </button>
                  <button
                    onClick={createCalendar}
                    disabled={saving || !newCalName.trim()}
                    className="flex-1 h-11 rounded-xl bg-tropical-primary text-white font-bold text-sm hover:bg-tropical-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                    {lang === "en" ? "Create & Assign" : "Crear y Asignar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4">
        <div className="sticky top-0 bg-white border-b border-tropical-secondary/10 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-black text-tropical-primary">
            {lang === "en" ? "Calendar Styles" : "Estilos del Calendario"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-tropical-card transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Calendar info */}
          <div className="flex items-center gap-3 p-3 bg-tropical-card/50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-tropical-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tropical-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
            <div>
              <div className="font-semibold text-tropical-text">{room.calendar?.name || "Calendario"}</div>
              <div className="text-xs text-tropical-text/50">{room.calendar?.type === "erd" ? "ERD Panel" : "EscapeMaster"}</div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-3">{lang === "en" ? "Colors" : "Colores"}</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "primaryColor", label: lang === "en" ? "Primary" : "Primario" },
                { key: "secondaryColor", label: lang === "en" ? "Secondary" : "Secundario" },
                { key: "accentColor", label: lang === "en" ? "Accent" : "Acento" },
                { key: "backgroundColor", label: lang === "en" ? "Background" : "Fondo" },
                { key: "surfaceColor", label: lang === "en" ? "Surface" : "Superficie" },
                { key: "textColor", label: lang === "en" ? "Text" : "Texto" },
                { key: "borderColor", label: lang === "en" ? "Border" : "Borde" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{label}</label>
                  <div className="flex gap-2">
                    <input type="color" value={settings[key] || "#0097b2"} onChange={(e) => updateSetting(key, e.target.value)} className="w-10 h-10 rounded-lg border border-tropical-secondary/20 cursor-pointer shrink-0" />
                    <input type="text" value={settings[key] || ""} onChange={(e) => updateSetting(key, e.target.value)} className={INPUT_CLASS} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-3">{lang === "en" ? "Typography" : "Tipografía"}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Display Font" : "Fuente Display"}</label>
                <select value={settings.fontDisplay || "Outfit"} onChange={(e) => updateSetting("fontDisplay", e.target.value)} className={INPUT_CLASS}>
                  {["Outfit", "Inter", "Playfair Display", "Cinzel", "Roboto", "Open Sans", "Montserrat", "Poppins"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Body Font" : "Fuente Cuerpo"}</label>
                <select value={settings.fontBody || "Inter"} onChange={(e) => updateSetting("fontBody", e.target.value)} className={INPUT_CLASS}>
                  {["Outfit", "Inter", "Playfair Display", "Cinzel", "Roboto", "Open Sans", "Montserrat", "Poppins"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-3">{lang === "en" ? "Border Radius" : "Radio de Borde"}</h4>
            <div className="flex flex-wrap gap-2">
              {["0", "0.375rem", "0.5rem", "0.75rem", "1rem", "1.5rem", "9999px"].map((r) => (
                <button key={r} onClick={() => updateSetting("borderRadius", r)} className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${settings.borderRadius === r ? "bg-tropical-primary text-white border-tropical-primary" : "bg-white text-tropical-text border-tropical-secondary/20 hover:border-tropical-primary/30"}`}>
                  {r === "9999px" ? "Píldora" : r === "0" ? "0" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-3">{lang === "en" ? "Layout" : "Diseño"}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Max Width" : "Ancho máx."}</label>
                <input type="text" value={settings.maxWidth || "860px"} onChange={(e) => updateSetting("maxWidth", e.target.value)} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="text-xs font-semibold text-tropical-text/60 mb-1.5 block">{lang === "en" ? "Spacing" : "Espaciado"}</label>
                <select value={settings.spacing || "default"} onChange={(e) => updateSetting("spacing", e.target.value)} className={INPUT_CLASS}>
                  <option value="compact">{lang === "en" ? "Compact" : "Compacto"}</option>
                  <option value="default">{lang === "en" ? "Normal" : "Normal"}</option>
                  <option value="spacious">{lang === "en" ? "Spacious" : "Espacioso"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-3">{lang === "en" ? "Branding" : "Branding"}</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.showTitle ?? true} onChange={(e) => updateSetting("showTitle", e.target.checked)} className="w-4 h-4 rounded border-tropical-secondary/30 text-tropical-primary" />
                <span className="text-sm font-medium text-tropical-text">{lang === "en" ? "Show Title" : "Mostrar Título"}</span>
              </label>
              {settings.showTitle && (
                <input type="text" value={settings.titleText || "Reservas"} onChange={(e) => updateSetting("titleText", e.target.value)} placeholder={lang === "en" ? "Title text" : "Texto del título"} className={INPUT_CLASS} />
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.showLogo ?? false} onChange={(e) => updateSetting("showLogo", e.target.checked)} className="w-4 h-4 rounded border-tropical-secondary/30 text-tropical-primary" />
                <span className="text-sm font-medium text-tropical-text">{lang === "en" ? "Show Logo" : "Mostrar Logo"}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-tropical-secondary/10 px-5 py-4 flex gap-3 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-tropical-secondary/20 text-tropical-text font-semibold text-sm hover:bg-tropical-card/60 transition-colors">
            {lang === "en" ? "Cancel" : "Cancelar"}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-tropical-primary text-white font-bold text-sm hover:bg-tropical-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            {saving ? (lang === "en" ? "Saving..." : "Guardando...") : (lang === "en" ? "Save Styles" : "Guardar Estilos")}
          </button>
        </div>
      </div>
    </div>
  );
}
