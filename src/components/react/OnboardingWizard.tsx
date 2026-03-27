import { useState, useEffect, useMemo } from "react";
import { auth } from "../../lib/auth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

type Step = 1 | 2 | 3 | 4;

export function OnboardingWizard({ lang }: { lang: string }) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Step state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [city, setCity] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(lang === "en" ? "en" : "es");
  const [preferredDifficulty, setPreferredDifficulty] = useState("medium");
  const [preferredThemes, setPreferredThemes] = useState<string[]>([]);
  const [lookingForTeam, setLookingForTeam] = useState(true);
  const [lookingForPlayers, setLookingForPlayers] = useState(false);

  // Preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);

  const themesCatalog = useMemo(() => [
    { id: "mystery", label: lang === "en" ? "Mystery" : "Misterio" },
    { id: "terror", label: lang === "en" ? "Horror" : "Terror" },
    { id: "adventure", label: lang === "en" ? "Adventure" : "Aventura" },
    { id: "sci-fi", label: lang === "en" ? "Sci‑Fi" : "Ciencia ficción" },
    { id: "family", label: lang === "en" ? "Family" : "Familiar" },
  ], [lang]);

  useEffect(() => {
    (async () => {
      const session = await auth.getSession();
      if (!session.user || !session.token) {
        window.location.href = `/${lang}/login`;
        return;
      }
      setToken(session.token);
      setEmail(session.user.email);
      if (session.user.onboarding_completed) {
        window.location.href = `/${lang}/profile`;
        return;
      }
      if (session.user.avatar_url) setAvatarUrl(session.user.avatar_url);
    })();
  }, [lang]);

  useEffect(() => {
    if (!avatarFile) return;
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const usernameError = useMemo(() => validateUsername(normalizeUsername(username)), [username]);

  async function handleNextFromAvatar() {
    setError(null);
    if (!token) return;
    if (!avatarFile && !avatarUrl) {
      setError(lang === "en" ? "Profile photo is required" : "La foto de perfil es obligatoria");
      return;
    }
    setLoading(true);
    try {
      if (avatarFile) {
        const url = await uploadAvatar(avatarFile, token);
        setAvatarUrl(url);
      }
      setStep(2);
    } catch (e: any) { setError(e.message || "Error"); } finally { setLoading(false); }
  }

  async function handleNextFromUsername() {
    setError(null);
    const normalized = normalizeUsername(username);
    const err = validateUsername(normalized);
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const available = await checkUsernameAvailable(normalized);
      setUsernameAvailable(available);
      if (!available) {
        setError(lang === "en" ? "That username is taken" : "Ese username ya está ocupado");
        return;
      }
      setStep(3);
    } catch (e: any) { setError(e.message || "Error"); } finally { setLoading(false); }
  }

  const toggleTheme = (id: string) => setPreferredThemes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  async function handleSubmit() {
    setError(null);
    if (!token) return;
    const normalized = normalizeUsername(username);
    if (!avatarUrl || !city || city.trim().length < 2 || preferredThemes.length === 0) {
       setError(lang === 'en' ? 'Incomplete data' : 'Datos incompletos');
       return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/players/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          username: normalized, avatar_url: avatarUrl, city: city.trim(), language: preferredLanguage,
          preferred_difficulty: preferredDifficulty, preferred_themes: preferredThemes,
          looking_for_team: lookingForTeam, looking_for_players: lookingForPlayers,
          email_notifications: emailNotifs, push_notifications: pushNotifs, profile_public: profilePublic,
        }),
      });
      if (!res.ok) throw new Error("Error saving profile");
      const userStr = localStorage.getItem("em_user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        parsed.onboarding_completed = true;
        parsed.username = normalized;
        if (avatarUrl) parsed.avatar_url = avatarUrl;
        localStorage.setItem("em_user", JSON.stringify(parsed));
      }
      setStep(4);
    } catch (e: any) { setError(e.message || "Error"); } finally { setLoading(false); }
  }

  function finish() {
    window.location.href = `/${lang}/profile`;
  }

  const stepTitles = [
    lang === "en" ? "Profile" : "Perfil",
    lang === "en" ? "Username" : "Nombre",
    lang === "en" ? "Setup" : "Ajustes",
    lang === "en" ? "Welcome" : "Inicio",
  ];

  return (
    <div className="min-h-svh w-full bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dynamic Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-tropical-primary/30 to-transparent blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[15%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-tropical-accent/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-tropical-secondary/20 to-transparent blur-[80px]" />
      </div>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="w-full max-w-xl relative z-10">
        {/* Superior Progress Bar */}
        <div className="flex justify-between items-center mb-12 px-8 relative">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2 relative z-10 group">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-700 ${
                  step >= s
                    ? "bg-tropical-primary text-white shadow-[0_12px_24px_-8px_rgba(0,151,178,0.5)] scale-110"
                    : "bg-white/40 backdrop-blur-md text-tropical-text/30 border border-white/60"
                }`}
              >
                {step > s ? (
                   <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : s}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${step >= s ? "text-tropical-primary" : "text-tropical-text/20 opacity-0"}`}>
                {stepTitles[s-1]}
              </span>
            </div>
          ))}
          <div className="absolute top-6 left-[15%] right-[15%] h-[1px] bg-white/40 -z-10" />
        </div>

        {/* Glassmorphic Onboarding Card */}
        <div className="bg-white/70 backdrop-blur-[40px] border border-white/60 rounded-[48px] p-10 sm:p-14 shadow-[0_40px_80px_-20px_rgba(0,151,178,0.1)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-12">
          
          <div className="mb-10 text-center">
             <div className="inline-block px-4 py-1.5 rounded-full bg-tropical-primary/10 text-[10px] font-black uppercase tracking-[0.2em] text-tropical-primary mb-6 animate-in slide-in-from-top-4 duration-700">
                Phase {step} of 4
             </div>
             <h1 className="text-3xl sm:text-4xl font-black text-tropical-text font-['Outfit',sans-serif] tracking-tight leading-none mb-4">
               {step === 1 && (lang === 'en' ? 'Profile Picture' : 'Tu Nueva Imagen')}
               {step === 2 && (lang === 'en' ? 'Identity' : 'Tu Identidad')}
               {step === 3 && (lang === 'en' ? 'Customization' : 'Personalización')}
               {step === 4 && (lang === 'en' ? 'Ready to Play' : '¡Todo Listo!')}
             </h1>
             <p className="text-sm text-tropical-text/50 font-semibold px-4">
                {step === 1 && (lang === 'en' ? 'Let everyone know who you are with a strike avatar.' : 'Haz que tu perfil destaque con una gran foto.')}
                {step === 2 && (lang === 'en' ? 'Choose a handle that represents your player spirit.' : 'Elige un nombre de usuario único en el sistema.')}
                {step === 3 && (lang === 'en' ? 'Tell us what you like to personalize your experience.' : 'Dinos qué te gusta para personalizar tu experiencia.')}
                {step === 4 && (lang === 'en' ? 'Welcome to the ultimate escape room community.' : 'Bienvenido a la comunidad definitiva de escape rooms.')}
             </p>
          </div>

          <div className="space-y-10 group">
             {error && (
               <div className="bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-3xl text-red-600 text-sm font-bold animate-in bounce-in">
                  {error}
               </div>
             )}

             {step === 1 && (
               <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in-95 duration-700">
                  <div className="relative">
                    <label
                      htmlFor="avatar_input"
                      className="block w-36 h-36 sm:w-44 sm:h-44 rounded-[40px] bg-white p-1 shadow-2xl overflow-hidden border-2 border-white/80 cursor-pointer group relative transition-all duration-300 hover:shadow-[0_20px_60px_-10px_rgba(0,151,178,0.35)] hover:border-tropical-primary/30 hover:scale-[1.03] active:scale-[0.98]"
                    >
                       {avatarPreview || avatarUrl ? (
                          <img src={avatarPreview || avatarUrl || ""} className="w-full h-full object-cover rounded-[36px]" alt="avatar" />
                       ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-[36px]">
                             <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-tropical-text/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                       )}
                       {/* Overlay hover — aparece al pasar el ratón */}
                       <div className="absolute inset-0 rounded-[36px] bg-tropical-primary/0 group-hover:bg-tropical-primary/40 group-active:bg-tropical-primary/60 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                               <circle cx="12" cy="13" r="4"/>
                             </svg>
                             <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow">
                               {lang === 'en' ? 'Change' : 'Cambiar'}
                             </span>
                          </div>
                       </div>
                       <input id="avatar_input" type="file" accept="image/*" className="hidden" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
                    </label>
                    {/* Indicador de clic si no hay foto */}
                    {!avatarPreview && !avatarUrl && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-tropical-primary/60 animate-pulse pointer-events-none">
                        {lang === 'en' ? 'Tap to upload' : 'Toca para subir'}
                      </div>
                    )}
                  </div>
                  <Button className="w-full h-16 rounded-3xl text-lg font-black bg-tropical-primary hover:bg-tropical-secondary shadow-lg shadow-tropical-primary/20" onClick={handleNextFromAvatar} disabled={loading}>
                     {loading ? (lang === 'en' ? 'Uploading...' : 'Subiendo...') : (lang === 'en' ? 'Next Step' : 'Siguiente Paso')}
                  </Button>
               </div>
             )}

             {step === 2 && (
               <div className="space-y-8 animate-in slide-in-from-right-12 duration-700">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-tropical-text/30 ml-4">Gamer Handle</label>
                     <Input 
                        placeholder="@legendary_player" 
                        value={username}
                        onChange={e => { setUsername(e.target.value); setUsernameAvailable(null); }}
                        className="h-16 px-8 rounded-3xl text-xl font-bold bg-white/40 border-white/60 focus:bg-white shadow-inner transition-all" 
                     />
                  </div>
                  {usernameAvailable === true && (
                     <div className="flex items-center gap-2 px-4 animate-in fade-in slide-in-from-left-4">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{lang === 'en' ? 'Handle Available' : 'Nombre Disponible'}</span>
                     </div>
                  )}
                  <Button className="w-full h-16 rounded-3xl text-lg font-black" onClick={handleNextFromUsername} disabled={loading || !username || !!usernameError}>
                     {loading ? '...' : (lang === 'en' ? 'Continue Identity' : 'Confirmar Identidad')}
                  </Button>
               </div>
             )}

             {step === 3 && (
               <div className="space-y-10 animate-in slide-in-from-right-12 duration-700">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-tropical-text/30 ml-4">Current City</label>
                        <Input placeholder="Barcelona" value={city} onChange={e => setCity(e.target.value)} className="h-14 px-6 rounded-2xl font-bold bg-white/40" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-tropical-text/30 ml-4">Preferred UI</label>
                        <select value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} className="w-full h-14 px-4 rounded-2xl font-bold bg-white/40 border border-white/60 outline-none">
                           <option value="es">Castellano</option>
                           <option value="en">English</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-tropical-text/30 ml-4">Adventure Themes</label>
                     <div className="flex flex-wrap gap-2.5">
                        {themesCatalog.map(th => {
                           const active = preferredThemes.includes(th.id);
                           return (
                              <button key={th.id} onClick={() => toggleTheme(th.id)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${active ? 'bg-tropical-primary border-tropical-primary text-white shadow-lg shadow-tropical-primary/30' : 'bg-white/30 border-white/60 text-tropical-text/50 hover:bg-white/60'}`}>
                                 {th.label}
                              </button>
                           );
                        })}
                     </div>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-white/40">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                           { lbl: lang==='en'?'Join Teams':'Unirme a Equipos', val: lookingForTeam, set: setLookingForTeam },
                           { lbl: lang==='en'?'Open to Chat':'Abierto a Chatear', val: lookingForPlayers, set: setLookingForPlayers }
                        ].map((o, idx) => (
                           <label key={idx} className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all cursor-pointer ${o.val ? 'bg-tropical-primary/5 border-tropical-primary/30 shadow-sm' : 'bg-white/30 border-white/10'}`}>
                              <span className="text-sm font-black text-tropical-text/70">{o.lbl}</span>
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${o.val ? 'bg-tropical-primary border-tropical-primary' : 'border-tropical-text/20 bg-white/20'}`}>
                                 {o.val && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                 <input type="checkbox" className="hidden" checked={o.val} onChange={e => o.set(e.target.checked)} />
                              </div>
                           </label>
                        ))}
                     </div>
                  </div>

                  <Button className="w-full h-16 rounded-3xl text-lg font-black shadow-2xl shadow-tropical-primary/40" onClick={handleSubmit} disabled={loading}>
                     {loading ? '...' : (lang === 'en' ? 'Deploy Profile' : 'Lanzar Perfil')}
                  </Button>
               </div>
             )}

             {step === 4 && (
               <div className="text-center py-6 animate-in zoom-in-95 duration-1000">
                  <div className="w-28 h-28 mx-auto bg-gradient-to-br from-tropical-primary to-tropical-secondary rounded-[44px] flex items-center justify-center shadow-2xl shadow-tropical-primary/40 mb-10 rotate-12 hover:rotate-0 transition-transform duration-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h2 className="text-3xl font-black text-tropical-text font-['Outfit',sans-serif] tracking-tight mb-4">{lang === 'en' ? 'Protocol Completed' : 'Protocolo Completado'}</h2>
                  <p className="text-sm text-tropical-text/40 font-bold mb-12 max-w-[280px] mx-auto leading-relaxed">
                     {lang === 'en' ? 'Your operative profile is now live. Welcome to the grid.' : 'Tu perfil operativo está activo. Bienvenido a la red.'}
                  </p>
                  <Button className="w-full h-16 rounded-3xl text-lg font-black" onClick={finish}>
                     {lang === 'en' ? 'Enter EscapeMaster' : 'Entrar en el Sistema'}
                  </Button>
               </div>
             )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center pointer-events-none">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-tropical-text/20">
              EscapeMaster · OS 0.3.1 · {new Date().getFullYear()}
           </p>
        </div>
      </div>
    </div>
  );
}

// Logic Helpers

function normalizeUsername(val: string) {
  return val.toLowerCase().trim().replace(/\s+/g, ".");
}

function validateUsername(val: string) {
  if (val.length < 3) return "Min 3 chars";
  if (!/^[a-z0-9.]+$/.test(val)) return "Only letters, numbers and dots";
  return null;
}

async function uploadAvatar(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads/avatar", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
}

async function checkUsernameAvailable(username: string) {
  const res = await fetch(`/api/auth/username-available?username=${username}`);
  if (!res.ok) return false;
  const data = await res.json();
  return data.available;
}
