import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { auth } from "../../lib/auth";
import { useTranslations } from "../../i18n/ui";

type Step = 1 | 2 | 3;

interface ManagerRoom {
  id: string;
  name: string;
  city?: string;
  description?: string;
}

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || "http://localhost:8000/v1/api";

export function OnboardingEnterpriseWizard({ lang }: { lang: string }) {
  const t = useMemo(
    () => useTranslations((lang === "en" ? "en" : "es") as any),
    [lang],
  );

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Step 1: Manager connection
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [managerToken, setManagerToken] = useState<string | null>(null);
  const [managerRooms, setManagerRooms] = useState<ManagerRoom[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(
    new Set(),
  );
  const [importedRooms, setImportedRooms] = useState<ManagerRoom[]>([]);
  const [connected, setConnected] = useState(false);

  // Step 2: Company data
  const [organizationName, setOrganizationName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    (async () => {
      const session = await auth.getSession();
      if (!session.user || !session.token) {
        window.location.href = `/${lang}/login`;
        return;
      }

      if (session.user.account_type !== "enterprise") {
        window.location.href = `/${lang}/onboarding`;
        return;
      }

      setToken(session.token);
    })();
  }, [lang]);

  // Step 1: Connect to Manager
  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/enterprise/connect-manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: managerEmail,
          password: managerPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || t("onboarding.enterprise.error"),
        );
      }

      setManagerToken(data.token || null);
      setManagerRooms(data.rooms || []);
      setConnected(true);

      // Pre-select all rooms
      const allIds = new Set<string>((data.rooms || []).map((r: ManagerRoom) => r.id));
      setSelectedRoomIds(allIds);
    } catch (e: any) {
      setError(e?.message || t("onboarding.enterprise.error"));
    } finally {
      setLoading(false);
    }
  }

  function toggleRoom(roomId: string) {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  }

  async function handleImportRooms() {
    setError(null);
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/enterprise/import-rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          managerToken,
          roomIds: Array.from(selectedRoomIds),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("onboarding.enterprise.error"));
      }

      setImportedRooms(
        managerRooms.filter((r) => selectedRoomIds.has(r.id)),
      );
      setStep(2);
    } catch (e: any) {
      setError(e?.message || t("onboarding.enterprise.error"));
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Save company data
  async function handleSaveCompanyData(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/enterprise/me/onboarding`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name: organizationName,
          city,
          phone,
          address,
          language: lang === "en" ? "en" : "es",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("onboarding.enterprise.error"));
      }

      setStep(3);
    } catch (e: any) {
      setError(e?.message || t("onboarding.enterprise.error"));
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Complete onboarding
  async function handleComplete() {
    setError(null);
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/enterprise/me/onboarding`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          complete: true,
          language: lang === "en" ? "en" : "es",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("onboarding.enterprise.error"));
      }

      // Update local storage
      try {
        const raw = localStorage.getItem("em_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.onboarding_completed = true;
          localStorage.setItem("em_user", JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }

      window.location.href = `/${lang}/profile`;
    } catch (e: any) {
      setError(e?.message || t("onboarding.enterprise.error"));
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = [
    t("onboarding.enterprise.step1_title"),
    t("onboarding.enterprise.step2_title"),
    t("onboarding.enterprise.step3_title"),
  ];

  return (
    <div className="min-h-svh w-full bg-tropical-bg flex items-stretch justify-stretch">
      <div className="w-full max-w-2xl mx-auto px-4 py-10 sm:py-14">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4 sm:px-12 relative">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="flex flex-col items-center relative z-10 text-center"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= s
                    ? "bg-tropical-primary text-white shadow-lg scale-110"
                    : "bg-tropical-secondary/10 text-tropical-text/40"
                }`}
              >
                {step > s ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium transition-colors hidden sm:block ${step >= s ? "text-tropical-primary" : "text-tropical-text/40"}`}
              >
                {stepTitles[s - 1]}
              </span>
            </div>
          ))}
          {/* Progress line */}
          <div className="absolute top-5 left-[15%] right-[15%] h-0.5 bg-tropical-secondary/10 z-0" />
        </div>

        <div className="bg-white border border-tropical-secondary/15 rounded-3xl p-6 sm:p-8">
          <div className="text-xs font-black uppercase tracking-widest text-tropical-text/50">
            {t("onboarding.enterprise.kicker")} · {step}/3
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-tropical-text">
            {stepTitles[step - 1]}
          </h1>
          <p className="mt-2 text-sm text-tropical-text/70">
            {step === 1 && t("onboarding.enterprise.step1_subtitle")}
            {step === 2 && t("onboarding.enterprise.subtitle")}
            {step === 3 && t("onboarding.enterprise.step3_subtitle")}
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-tropical-accent/20 bg-tropical-accent/5 p-3 text-sm text-tropical-accent font-semibold">
              {error}
            </div>
          )}

          {/* Step 1: Connect Manager */}
          {step === 1 && (
            <div className="mt-6 space-y-4">
              {!connected ? (
                <form onSubmit={handleConnect} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-tropical-text">
                      {t("onboarding.enterprise.step1_email")}
                    </label>
                    <Input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      placeholder="email@manager.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-tropical-text">
                      {t("onboarding.enterprise.step1_password")}
                    </label>
                    <Input
                      type="password"
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-sm font-bold text-tropical-text/50 hover:text-tropical-primary transition-colors"
                    >
                      {t("onboarding.enterprise.step1_skip")}
                    </button>
                    <Button
                      type="submit"
                      variant="tropical"
                      className="h-11 touch-manipulation"
                      disabled={loading}
                    >
                      {loading
                        ? t("onboarding.enterprise.saving")
                        : t("onboarding.enterprise.step1_connect")}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-tropical-secondary/15 bg-tropical-bg p-4">
                    <p className="text-sm font-black text-tropical-text mb-3">
                      {t("onboarding.enterprise.step1_rooms_title")} (
                      {managerRooms.length})
                    </p>
                    {managerRooms.length === 0 ? (
                      <p className="text-sm text-tropical-text/60">
                        {lang === "en"
                          ? "No rooms found in your Manager account."
                          : "No se encontraron salas en tu cuenta del Manager."}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {managerRooms.map((room) => (
                          <label
                            key={room.id}
                            className="flex items-center gap-3 rounded-xl border border-tropical-secondary/15 bg-white p-3 cursor-pointer select-none hover:bg-tropical-secondary/5 transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-tropical-secondary/40 text-tropical-primary focus:ring-tropical-secondary"
                              checked={selectedRoomIds.has(room.id)}
                              onChange={() => toggleRoom(room.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-tropical-text truncate">
                                {room.name}
                              </p>
                              {room.city && (
                                <p className="text-xs text-tropical-text/50">
                                  {room.city}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-sm font-bold text-tropical-text/50 hover:text-tropical-primary transition-colors"
                    >
                      {t("onboarding.enterprise.step1_skip")}
                    </button>
                    <Button
                      type="button"
                      variant="tropical"
                      className="h-11 touch-manipulation"
                      disabled={loading || selectedRoomIds.size === 0}
                      onClick={handleImportRooms}
                    >
                      {loading
                        ? t("onboarding.enterprise.saving")
                        : t("onboarding.enterprise.step1_import")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Company Data */}
          {step === 2 && (
            <form onSubmit={handleSaveCompanyData} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-tropical-text">
                  {t("onboarding.enterprise.org_name")}
                </label>
                <Input
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={t("onboarding.enterprise.org_name_ph")}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-tropical-text">
                    {t("onboarding.enterprise.city")}
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t("onboarding.enterprise.city_ph")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-tropical-text">
                    {t("onboarding.enterprise.phone")}
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("onboarding.enterprise.phone_ph")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-tropical-text">
                  {t("onboarding.enterprise.address")}
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("onboarding.enterprise.address_ph")}
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-bold text-tropical-text/50 hover:text-tropical-primary transition-colors"
                >
                  ← {lang === "en" ? "Back" : "Atrás"}
                </button>
                <Button
                  type="submit"
                  variant="tropical"
                  className="h-11 touch-manipulation"
                  disabled={loading}
                >
                  {loading
                    ? t("onboarding.enterprise.saving")
                    : t("onboarding.enterprise.submit")}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Summary & Complete */}
          {step === 3 && (
            <div className="mt-6 space-y-4">
              {/* Imported rooms summary */}
              {importedRooms.length > 0 && (
                <div className="rounded-2xl border border-tropical-secondary/15 bg-tropical-bg p-4">
                  <p className="text-sm font-black text-tropical-text mb-2">
                    {t("onboarding.enterprise.step3_rooms_imported")} (
                    {importedRooms.length})
                  </p>
                  <ul className="space-y-1">
                    {importedRooms.map((room) => (
                      <li
                        key={room.id}
                        className="text-sm text-tropical-text/80"
                      >
                        • {room.name}
                        {room.city ? ` — ${room.city}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Company data summary */}
              <div className="rounded-2xl border border-tropical-secondary/15 bg-tropical-bg p-4">
                <p className="text-sm font-black text-tropical-text mb-2">
                  {t("onboarding.enterprise.step3_company_data")}
                </p>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-tropical-text/80">
                  <span className="font-semibold text-tropical-text">
                    {t("onboarding.enterprise.org_name")}
                  </span>
                  <span>{organizationName || "—"}</span>
                  <span className="font-semibold text-tropical-text">
                    {t("onboarding.enterprise.city")}
                  </span>
                  <span>{city || "—"}</span>
                  <span className="font-semibold text-tropical-text">
                    {t("onboarding.enterprise.phone")}
                  </span>
                  <span>{phone || "—"}</span>
                  <span className="font-semibold text-tropical-text">
                    {t("onboarding.enterprise.address")}
                  </span>
                  <span>{address || "—"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm font-bold text-tropical-text/50 hover:text-tropical-primary transition-colors"
                >
                  ← {lang === "en" ? "Back" : "Atrás"}
                </button>
                <Button
                  type="button"
                  variant="tropical"
                  className="h-11 touch-manipulation"
                  disabled={loading}
                  onClick={handleComplete}
                >
                  {loading
                    ? t("onboarding.enterprise.saving")
                    : t("onboarding.enterprise.step3_complete")}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href="https://manager.escapemaster.es"
              className="text-xs font-bold text-tropical-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("onboarding.enterprise.manager_link")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
