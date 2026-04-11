import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "../../i18n/ui";

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || "http://localhost:8000/v1/api";

type Org = {
  id: string;
  name: string;
  slug?: string | null;
  city?: string | null;
  is_active?: boolean | null;
} | null;

type DashboardData = {
  organizationId: string | null;
  roomsCount: number;
  bookings30: number;
  revenue30: number;
  upcoming: number;
  recentBookings?: Array<{
    id: string;
    reference_number: string | null;
    room_name: string | null;
    user_name: string | null;
    user_email: string | null;
    start_time: string | null;
    total_price: number;
    payment_status: string | null;
    status: string | null;
    created_at: string | null;
  }>;
  dailySeries?: Array<{
    day: string;
    dayISO: string;
    bookings: number;
    revenue: number;
  }>;
};

interface ErdRoom {
  id: string;
  name: string;
  erd_game_id?: number;
  price?: string | null;
  schedule?: string | null;
  raw_data?: string[];
}

export function EnterpriseDashboard({ lang }: { lang: string }) {
  const t = useMemo(
    () => useTranslations((lang === "en" ? "en" : "es") as any),
    [lang],
  );

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [org, setOrg] = useState<Org>(null);
  const [dash, setDash] = useState<DashboardData | null>(null);

  // ERD import state
  const [showErdImport, setShowErdImport] = useState(false);
  const [erdEmail, setErdEmail] = useState("");
  const [erdPassword, setErdPassword] = useState("");
  const [erdRooms, setErdRooms] = useState<ErdRoom[]>([]);
  const [selectedErdRoomIds, setSelectedErdRoomIds] = useState<Set<string>>(new Set());
  const [erdApiToken, setErdApiToken] = useState<string | null>(null);
  const [importingEr, setImportingEr] = useState(false);
  const [erdError, setErdError] = useState<string | null>(null);
  const [erdSuccess, setErdSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    (async () => {
      try {
        const token = localStorage.getItem("em_token");
        if (!token) {
          setError(t("enterprise.dashboard.error"));
          setLoading(false);
          return;
        }

        const [orgRes, dashRes] = await Promise.all([
          fetch(`${API_BASE}/enterprise/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/enterprise/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const orgJson = await orgRes.json().catch(() => ({}));
        const dashJson = await dashRes.json().catch(() => ({}));

        if (!orgRes.ok || !dashRes.ok) {
          throw new Error(
            orgJson?.error || dashJson?.error || t("enterprise.dashboard.error"),
          );
        }

        setOrg(orgJson?.data?.organization || null);
        setDash(dashJson?.data || null);
        setLoading(false);
      } catch (e: any) {
        setError(e?.message || t("enterprise.dashboard.error"));
        setLoading(false);
      }
    })();
  }, [t]);

  // Connect to ERD Panel and fetch rooms
  async function handleConnectErd(e: React.FormEvent) {
    e.preventDefault();
    setErdError(null);
    setErdSuccess(null);
    setErdRooms([]);
    setImportingEr(true);

    try {
      const token = localStorage.getItem("em_token");
      if (!token) {
        setErdError(t("enterprise.dashboard.error"));
        return;
      }

      const res = await fetch(`${API_BASE}/enterprise/connect-erd`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: erdEmail, password: erdPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error conectando con ERD Panel");
      }

      const rooms = data.rooms || [];
      setErdRooms(rooms);
      setErdApiToken(data.erd_api_token || null);
      const allIds = new Set<string>(rooms.map((r: ErdRoom) => r.id));
      setSelectedErdRoomIds(allIds);
    } catch (e: any) {
      setErdError(e?.message || "Error conectando con ERD Panel");
    } finally {
      setImportingEr(false);
    }
  }

  function toggleErdRoom(roomId: string) {
    setSelectedErdRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  }

  async function handleImportErdRooms() {
    setErdError(null);
    setErdSuccess(null);

    try {
      const token = localStorage.getItem("em_token");
      if (!token) {
        setErdError(t("enterprise.dashboard.error"));
        return;
      }

      setImportingEr(true);
      const roomsToImport = erdRooms.filter((r) => selectedErdRoomIds.has(r.id));

      const res = await fetch(`${API_BASE}/enterprise/import-erd-rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          erdRooms: roomsToImport,
          erd_api_token: erdApiToken,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error importando salas");
      }

      setErdSuccess(`${data.imported || roomsToImport.length} salas importadas`);
      setShowErdImport(false);
      // Reload dashboard data to reflect new room count
      window.location.reload();
    } catch (e: any) {
      setErdError(e?.message || "Error importando salas");
    } finally {
      setImportingEr(false);
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="mt-6 rounded-2xl border border-tropical-secondary/15 bg-white p-6">
        <div className="h-5 w-40 rounded bg-tropical-card animate-pulse" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-tropical-secondary/10 bg-tropical-card animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-tropical-secondary/15 bg-white p-6">
        <div className="h-5 w-40 rounded bg-tropical-card animate-pulse" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-tropical-secondary/10 bg-tropical-card animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border border-tropical-accent/20 bg-tropical-accent/5 p-4 text-sm font-semibold text-tropical-accent">
        {error}
      </div>
    );
  }

  const revenue = dash?.revenue30 ?? 0;
  const revenueLabel =
    revenue >= 1000
      ? `€${(revenue / 1000).toFixed(1)}k`
      : `€${Math.round(revenue).toLocaleString(lang === "en" ? "en-GB" : "es-ES")}`;

  const cards = [
    {
      label: t("enterprise.dashboard.rooms"),
      value: String(dash?.roomsCount ?? 0),
    },
    {
      label: t("enterprise.dashboard.bookings_30"),
      value: String(dash?.bookings30 ?? 0),
    },
    {
      label: t("enterprise.dashboard.revenue_30"),
      value: revenueLabel,
    },
    {
      label: t("enterprise.dashboard.upcoming"),
      value: String(dash?.upcoming ?? 0),
    },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(lang === "en" ? "en-GB" : "es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatCompactDateTime = (value: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const series7 = (() => {
    const raw = dash?.dailySeries ?? [];
    const byDayISO = new Map(
      raw.filter((d) => !!d.dayISO).map((d) => [d.dayISO, d]),
    );

    const days: Array<{ dayISO: string; label: string; bookings: number; revenue: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const dayISO = day.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", {
        day: "2-digit",
        month: "short",
      }).format(day);
      const found = byDayISO.get(dayISO);
      days.push({
        dayISO,
        label,
        bookings: found?.bookings ?? 0,
        revenue: found?.revenue ?? 0,
      });
    }

    const maxBookings = Math.max(1, ...days.map((d) => d.bookings));
    return { days, maxBookings };
  })();

  const getBadgeClasses = (kind: "status" | "payment", value: string | null) => {
    const normalized = (value || "").toLowerCase();

    if (kind === "payment") {
      if (["paid", "succeeded", "completed"].includes(normalized)) {
        return "border border-tropical-secondary/25 bg-tropical-secondary/10 text-tropical-text";
      }
      if (["pending", "requires_payment", "requires_action"].includes(normalized)) {
        return "border border-tropical-accent/25 bg-tropical-accent/10 text-tropical-accent";
      }
      if (["failed", "canceled", "cancelled", "refunded"].includes(normalized)) {
        return "border border-tropical-accent/30 bg-tropical-accent/10 text-tropical-accent";
      }
    }

    if (kind === "status") {
      if (["confirmed", "active", "booked"].includes(normalized)) {
        return "border border-tropical-secondary/25 bg-tropical-secondary/10 text-tropical-text";
      }
      if (["pending", "requested"].includes(normalized)) {
        return "border border-tropical-accent/25 bg-tropical-accent/10 text-tropical-accent";
      }
      if (["cancelled", "canceled"].includes(normalized)) {
        return "border border-tropical-accent/30 bg-tropical-accent/10 text-tropical-accent";
      }
    }

    return "border border-tropical-secondary/20 bg-tropical-card/60 text-tropical-text";
  };

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-tropical-secondary/15 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-tropical-text/50">
              {t("enterprise.dashboard.kicker")}
            </div>
            <div className="mt-1 text-lg font-black text-tropical-text">
              {org?.name || t("enterprise.dashboard.no_org")}
            </div>
            <div className="text-sm text-tropical-text/70">
              {org?.slug ? `slug: ${org.slug}` : ""}
              {org?.city ? (org?.slug ? ` · ${org.city}` : org.city) : ""}
            </div>
          </div>

          <a
            href="https://manager.escapemaster.es"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-tropical-primary text-white font-bold touch-manipulation"
          >
            {t("enterprise.dashboard.open_manager")}
          </a>

          <button
            type="button"
            onClick={() => setShowErdImport(!showErdImport)}
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-tropical-secondary text-white font-bold touch-manipulation"
          >
            {lang === "en" ? "Import from ERD" : "Importar de ERD"}
          </button>
        </div>

        {showErdImport && (
          <div className="mt-4 rounded-2xl border border-tropical-secondary/20 bg-tropical-bg p-4">
            <form onSubmit={handleConnectErd} className="space-y-3">
              <div className="text-sm font-black text-tropical-text mb-2">
                {lang === "en" ? "Connect to ERD Panel" : "Conectar a ERD Panel"}
              </div>
              <input
                type="email"
                value={erdEmail}
                onChange={(e) => setErdEmail(e.target.value)}
                placeholder="email@erdpanel.com"
                className="w-full h-11 px-4 rounded-xl border border-tropical-secondary/20 bg-white text-tropical-text"
                required
              />
              <input
                type="password"
                value={erdPassword}
                onChange={(e) => setErdPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl border border-tropical-secondary/20 bg-white text-tropical-text"
                required
              />
              {erdError && (
                <div className="text-sm text-tropical-accent">{erdError}</div>
              )}
              {erdSuccess && (
                <div className="text-sm text-tropical-secondary">{erdSuccess}</div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={importingEr || erdRooms.length > 0}
                  className="h-11 px-5 rounded-xl bg-tropical-primary text-white font-bold disabled:opacity-50"
                >
                  {importingEr
                    ? "..."
                    : lang === "en"
                    ? "Connect"
                    : "Conectar"}
                </button>
                {erdRooms.length > 0 && (
                  <button
                    type="button"
                    onClick={handleImportErdRooms}
                    disabled={importingEr || selectedErdRoomIds.size === 0}
                    className="h-11 px-5 rounded-xl bg-tropical-accent text-white font-bold disabled:opacity-50"
                  >
                    {importingEr
                      ? "..."
                      : lang === "en"
                      ? `Import ${selectedErdRoomIds.size} rooms`
                      : `Importar ${selectedErdRoomIds.size} salas`}
                  </button>
                )}
              </div>
            </form>

            {erdRooms.length > 0 && (
              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                <div className="text-xs font-black uppercase tracking-widest text-tropical-text/50 mb-2">
                  {lang === "en" ? "Available rooms (select all to import)" : "Salas disponibles (selecciona las que quieras importar)"}
                </div>
                {erdRooms.map((room) => (
                  <label
                    key={room.id}
                    className={`flex items-start gap-3 rounded-xl border bg-white p-3 cursor-pointer transition-all ${
                      selectedErdRoomIds.has(room.id)
                        ? "border-tropical-secondary/40 shadow-sm"
                        : "border-tropical-secondary/15 hover:border-tropical-secondary/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded mt-0.5"
                      checked={selectedErdRoomIds.has(room.id)}
                      onChange={() => toggleErdRoom(room.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-tropical-text">{room.name}</span>
                        <span className="text-[10px] font-mono text-tropical-text/40 shrink-0">#{room.erd_game_id || room.id}</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5">
                        {room.price && (
                          <span className="text-xs text-tropical-text/60">
                            <span className="font-semibold">{lang === "en" ? "Price" : "Precio"}:</span> {room.price}
                          </span>
                        )}
                        {room.schedule && (
                          <span className="text-xs text-tropical-text/60">
                            <span className="font-semibold">{lang === "en" ? "Schedule" : "Horario"}:</span> {room.schedule}
                          </span>
                        )}
                        {room.raw_data && room.raw_data.length > 0 && (
                          <span className="text-xs text-tropical-text/40 col-span-2">
                            {room.raw_data.slice(1, 4).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
                <div className="text-xs text-tropical-text/40 text-center pt-1">
                  {selectedErdRoomIds.size}/{erdRooms.length} {lang === "en" ? "selected" : "seleccionadas"}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-tropical-secondary/10 bg-tropical-card/40 p-4"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-tropical-text/50">
                {c.label}
              </div>
              <div className="mt-2 text-2xl font-black text-tropical-text">
                {c.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="https://manager.escapemaster.es/rooms"
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 inline-flex items-center justify-center rounded-xl border border-tropical-secondary/20 bg-white font-bold text-tropical-text touch-manipulation"
          >
            {t("enterprise.dashboard.link_rooms")}
          </a>
          <a
            href="https://manager.escapemaster.es/bookings"
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 inline-flex items-center justify-center rounded-xl border border-tropical-secondary/20 bg-white font-bold text-tropical-text touch-manipulation"
          >
            {t("enterprise.dashboard.link_bookings")}
          </a>
          <a
            href="https://manager.escapemaster.es/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 inline-flex items-center justify-center rounded-xl border border-tropical-secondary/20 bg-white font-bold text-tropical-text touch-manipulation"
          >
            {t("enterprise.dashboard.link_settings")}
          </a>
          <a
            href={`/${lang}/onboarding`}
            className="h-11 inline-flex items-center justify-center rounded-xl border border-tropical-secondary/20 bg-white font-bold text-tropical-text touch-manipulation"
          >
            {t("enterprise.dashboard.link_onboarding")}
          </a>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-tropical-secondary/10 bg-tropical-card/30 p-4">
            <div className="text-xs font-black uppercase tracking-widest text-tropical-text/60">
              {t("enterprise.dashboard.recent_title")}
            </div>

            {(dash?.recentBookings?.length || 0) === 0 ? (
              <div className="mt-3 text-sm text-tropical-text/70">
                {t("enterprise.dashboard.recent_empty")}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {(dash?.recentBookings ?? []).slice(0, 10).map((b) => {
                  const when =
                    formatCompactDateTime(b.start_time) ||
                    formatCompactDateTime(b.created_at);
                  const ref = b.reference_number || b.id.slice(0, 8);
                  const title = b.room_name || `#${ref}`;
                  return (
                    <div
                      key={b.id}
                      className="rounded-xl border border-tropical-secondary/10 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-tropical-text truncate">
                            {title}
                          </div>
                          <div className="mt-0.5 text-xs text-tropical-text/60">
                            <span className="font-semibold">#{ref}</span>
                            {when ? ` · ${when}` : ""}
                          </div>
                          <div className="mt-1 text-xs text-tropical-text/70 truncate">
                            {b.user_name || b.user_email || ""}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-sm font-black text-tropical-text">
                            {formatCurrency(b.total_price)}
                          </div>
                          <div className="mt-1 flex items-center justify-end gap-1">
                            {b.payment_status ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getBadgeClasses(
                                  "payment",
                                  b.payment_status,
                                )}`}
                              >
                                {b.payment_status}
                              </span>
                            ) : null}
                            {b.status ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getBadgeClasses(
                                  "status",
                                  b.status,
                                )}`}
                              >
                                {b.status}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-tropical-secondary/10 bg-tropical-card/30 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-xs font-black uppercase tracking-widest text-tropical-text/60">
                {t("enterprise.dashboard.last7_title")}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-tropical-text/50">
                {t("enterprise.dashboard.last7_bookings")} / {t("enterprise.dashboard.last7_revenue")}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2 items-end">
              {series7.days.map((d) => {
                const h = Math.round((d.bookings / series7.maxBookings) * 52);
                return (
                  <div key={d.dayISO} className="flex flex-col items-center">
                    <div
                      className="relative w-full rounded-lg border border-tropical-secondary/15 bg-white overflow-hidden"
                      style={{ height: 56 }}
                      aria-label={`${d.label}: ${d.bookings} ${t("enterprise.dashboard.last7_bookings")}`}
                    >
                      <div
                        className="absolute bottom-0 left-0 w-full bg-tropical-primary/80"
                        style={{ height: Math.max(6, h) }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] font-black text-tropical-text/70">
                      {d.bookings}
                    </div>
                    <div className="text-[10px] text-tropical-text/60">{d.label}</div>
                    <div className="text-[10px] text-tropical-text/60">
                      {formatCurrency(d.revenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
