import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $user, $token } from "../lib/store";
import { auth } from "../lib/auth";
import { AuthStatus } from "./react/AuthStatus";
import {
  Globe,
  Rocket,
  Menu,
  X,
  Search,
  Heart,
  User,
  LogOut,
  Users,
  MapPin,
  Tag,
  MessageCircle,
  Bell,
} from "lucide-react";

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || '';

interface HeaderProps {
  lang?: string;
  translations?: {
    search: string;
    marketplace: string;
    teams: string;
    routes: string;
    offers: string;
    explore?: string;
    owner: string;
    login: string;
    profile?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  lang = "es",
  translations,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const user = useStore($user);
  const token = useStore($token);
  const [mounted, setMounted] = useState(false);

  const defaultTranslations = {
    search: "Buscador",
    teams: "Equipos",
    routes: "Rutas",
    offers: "Ofertas",
    marketplace: "Mercadillo",
    explore: "Explorar",
    owner: "Soy Propietario",
    login: "Iniciar Sesión",
    profile: "Mi Perfil",
  };

  const t = { ...defaultTranslations, ...translations };
  const isLoggedIn = mounted && !!(user && token);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Capture current path for language switching
    const path = window.location.pathname;
    const pathParts = path.split("/").filter(Boolean);
    if (pathParts.length > 0 && ["es", "en"].includes(pathParts[0])) {
      setCurrentPath("/" + pathParts.slice(1).join("/"));
    } else {
      setCurrentPath(path);
    }

    setMounted(true);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    auth.logout();
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Poll unread messages
  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {
        /* silent */
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const fetchUnreadNotifications = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/players/me/notifications?count_only=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setUnreadNotifications(data.unread_count || 0);
        }
      } catch {}
    };

    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const navLinks = [
    { name: t.search, href: `/${lang}/search` },
    { name: t.marketplace, href: `/${lang}/marketplace` },
    { name: t.teams, href: `/${lang}/teams` },
    { name: t.routes, href: `/${lang}/routes` },
    { name: t.offers, href: `/${lang}/offers` },
  ];

  return (
    <>
      {/* ─── Top Header Bar ─── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-sm"
            : "bg-white/80 backdrop-blur-xl"
        } border-b border-tropical-secondary/20 safe-top`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <a
            href={`/${lang}`}
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg shadow-tropical-primary/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
              <img
                src="/logo.png"
                alt="EscapeMaster"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold text-tropical-primary tracking-tight leading-none">
                EscapeMaster
              </h1>
              <span className="text-tropical-secondary text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase opacity-70 mt-0.5 hidden sm:block">
                Marketplace
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-tropical-text/70 hover:text-tropical-primary hover:bg-tropical-primary/5 transition-all"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Action Bar */}
          <div className="hidden sm:flex items-center gap-4 lg:gap-6">
            {/* Language Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-tropical-secondary/20 shadow-sm">
              <Globe className="w-3.5 h-3.5 text-tropical-text/40" />
              <div className="flex gap-2 text-[10px] font-bold tracking-widest">
                <a
                  href={`/es${currentPath}`}
                  className={
                    lang === "es"
                      ? "text-tropical-primary"
                      : "text-tropical-text/30 hover:text-tropical-text"
                  }
                >
                  ES
                </a>
                <span className="text-tropical-secondary/30">|</span>
                <a
                  href={`/en${currentPath}`}
                  className={
                    lang === "en"
                      ? "text-tropical-primary"
                      : "text-tropical-text/30 hover:text-tropical-text"
                  }
                >
                  EN
                </a>
              </div>
            </div>

            {/* Chat Link */}
            {isLoggedIn && (
              <a
                href={`/${lang}/profile?tab=notifications`}
                className="relative p-2 rounded-xl text-tropical-text/60 hover:text-tropical-primary hover:bg-tropical-primary/5 transition-all"
                title={lang === "en" ? "Notifications" : "Notificaciones"}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tropical-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </a>
            )}

            {isLoggedIn && (
              <a
                href={`/${lang}/chat`}
                className="relative p-2 rounded-xl text-tropical-text/60 hover:text-tropical-primary hover:bg-tropical-primary/5 transition-all"
                title={lang === "en" ? "Messages" : "Mensajes"}
              >
                <MessageCircle className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-tropical-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </a>
            )}

            {/* Owner Link */}
            {!isLoggedIn && (
              <a
                href={`/${lang}/manager`}
                className="hidden md:flex items-center gap-2 text-xs font-bold text-tropical-primary/60 hover:text-tropical-primary uppercase tracking-wider transition-colors"
              >
                <Rocket className="w-4 h-4" />
                {t.owner}
              </a>
            )}

            {/* Auth Status */}
            <AuthStatus lang={lang} />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-tropical-primary/5 text-tropical-primary active:scale-95 transition-transform"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* ─── Mobile Menu Overlay ─── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── Mobile Menu Panel ─── */}
      <div
        className={`fixed top-16 left-0 right-0 bottom-0 z-40 bg-white sm:hidden transform transition-transform duration-300 ease-out ${
          mobileMenuOpen
            ? "translate-y-0"
            : "-translate-y-full pointer-events-none"
        }`}
      >
        <div className="h-full overflow-y-auto momentum-scroll safe-bottom pb-20">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100">
            <a
              href={`/${lang}/search`}
              className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-500"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Search className="w-5 h-5" />
              <span className="text-sm">Buscar escape rooms...</span>
            </a>
          </div>

          {/* User info card (if logged in) */}
          {isLoggedIn && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 bg-tropical-primary/5 rounded-xl p-3">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-tropical-secondary/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-tropical-primary flex items-center justify-center text-white font-bold">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <p className="font-bold text-tropical-text">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  {user?.rank && (
                    <span className="text-[10px] font-semibold bg-tropical-secondary/20 text-tropical-primary px-2 py-0.5 rounded-full capitalize mt-1 inline-block">
                      {user.rank} · {user.xp || 0} XP
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { name: "Explorar", href: `/${lang}/search`, icon: Search },
              { name: t.teams, href: `/${lang}/teams`, icon: Users },
              { name: t.routes, href: `/${lang}/routes`, icon: MapPin },
              {
                name: lang === "en" ? "Notifications" : "Notificaciones",
                href: `/${lang}/profile?tab=notifications`,
                icon: Bell,
                badge: unreadNotifications,
              },
              {
                name: lang === "en" ? "Messages" : "Mensajes",
                href: `/${lang}/chat`,
                icon: MessageCircle,
                badge: unreadCount,
              },
              { name: t.offers, href: `/${lang}/offers`, icon: Tag },
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium text-tropical-text hover:bg-tropical-primary/5 active:bg-tropical-primary/10 transition-colors"
              >
                {link.icon && (
                  <link.icon className="w-5 h-5 text-tropical-primary" />
                )}
                {link.name}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-tropical-accent text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          <div className="h-px bg-gray-100 mx-4" />

          {/* User Section — dynamic based on auth state */}
          <div className="p-4 space-y-1">
            {isLoggedIn ? (
              <>
                <a
                  href={`/${lang}/profile`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium text-tropical-text hover:bg-tropical-primary/5 active:bg-tropical-primary/10 transition-colors"
                >
                  <User className="w-5 h-5 text-tropical-primary" />
                  {t.profile}
                </a>
                <a
                  href={`/${lang}/profile/favorites`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium text-tropical-text hover:bg-tropical-primary/5 active:bg-tropical-primary/10 transition-colors"
                >
                  <Heart className="w-5 h-5 text-tropical-primary" />
                  Favoritos
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium text-red-500 hover:bg-red-50 w-full text-left transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <a
                  href={`/${lang}/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium text-tropical-primary hover:bg-tropical-primary/5 active:bg-tropical-primary/10 transition-colors"
                >
                  <User className="w-5 h-5" />
                  {t.login}
                </a>
                <a
                  href={`/${lang}/register`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium text-tropical-text hover:bg-tropical-primary/5 active:bg-tropical-primary/10 transition-colors"
                >
                  Crear Cuenta
                </a>
              </>
            )}
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Owner & Language */}
          <div className="p-4 space-y-4">
            <a
              href={`/${lang}/manager`}
              className="flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium text-tropical-primary/70"
            >
              <Rocket className="w-5 h-5" />
              {t.owner}
            </a>

            <div className="flex items-center justify-center gap-4 py-4">
              <Globe className="w-4 h-4 text-gray-400" />
              <a
                href={`/es${currentPath}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${lang === "es" ? "bg-tropical-primary text-white" : "text-gray-500"}`}
              >
                Español
              </a>
              <a
                href={`/en${currentPath}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${lang === "en" ? "bg-tropical-primary text-white" : "text-gray-500"}`}
              >
                English
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 sm:hidden safe-bottom">
        <div className="flex items-center justify-around h-16">
          <a
            href={`/${lang}`}
            className="flex flex-col items-center justify-center w-14 h-full text-gray-500 hover:text-tropical-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">Inicio</span>
          </a>
          <a
            href={`/${lang}/search`}
            className="flex flex-col items-center justify-center w-14 h-full text-gray-500 hover:text-tropical-primary"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Explorar</span>
          </a>
          <a
            href={`/${lang}/teams`}
            className="flex flex-col items-center justify-center w-14 h-full text-gray-500 hover:text-tropical-primary"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Equipos</span>
          </a>
          <a
            href={`/${lang}/chat`}
            className="relative flex flex-col items-center justify-center w-14 h-full text-gray-500 hover:text-tropical-primary"
          >
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-tropical-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="text-[10px] font-medium mt-0.5">Chat</span>
          </a>
          <a
            href={`/${lang}/profile?tab=notifications`}
            className="relative flex flex-col items-center justify-center w-14 h-full text-gray-500 hover:text-tropical-primary"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-tropical-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
            <span className="text-[10px] font-medium mt-0.5">Avisos</span>
          </a>
          <a
            href={isLoggedIn ? `/${lang}/profile` : `/${lang}/login`}
            className="flex flex-col items-center justify-center w-14 h-full text-gray-500 hover:text-tropical-primary"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">
              {isLoggedIn ? "Perfil" : "Entrar"}
            </span>
          </a>
        </div>
      </nav>
    </>
  );
};
