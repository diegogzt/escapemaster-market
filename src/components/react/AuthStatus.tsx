import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { $user, $token } from "../../lib/store";
import { auth } from "../../lib/auth";
import { Button } from "../ui/Button";
import { User, LogOut, ChevronDown, Rocket } from "lucide-react";

interface AuthStatusProps {
  lang?: string;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ lang = "es" }) => {
  const user = useStore($user);
  const token = useStore($token);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If we have a token in localStorage but no user in store, refresh session
    const storedToken = localStorage.getItem("em_token");
    if (storedToken && !user) {
      auth.refreshSession();
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = () => setDropdownOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [dropdownOpen]);

  const handleLogin = () => {
    window.location.href = `/${lang}/login`;
  };

  const handleLogout = () => {
    auth.logout();
  };

  if (!mounted)
    return (
      <div className="h-10 w-24 bg-tropical-primary/10 animate-pulse rounded-xl" />
    );

  if (user && token) {
    const initials = user.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "?";

    const rankColors: Record<string, string> = {
      newbie: "bg-gray-200 text-gray-600",
      explorer: "bg-blue-100 text-blue-600",
      adventurer: "bg-green-100 text-green-600",
      expert: "bg-purple-100 text-purple-600",
      master: "bg-amber-100 text-amber-700",
      legend: "bg-red-100 text-red-600",
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
          className="flex items-center gap-2 hover:bg-tropical-primary/5 p-1.5 pr-3 rounded-xl transition-colors group"
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-tropical-secondary/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-tropical-primary flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-bold text-tropical-text leading-tight">
              {user.name?.split(" ")[0]}
            </span>
            {user.rank && (
              <span
                className={`text-[10px] font-semibold px-1.5 rounded-full capitalize ${rankColors[user.rank] || rankColors.newbie}`}
              >
                {user.rank}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-bold text-tropical-text">
                {user.name}
              </p>
              <p className="text-xs text-gray-400">{user.email}</p>
              {user.xp !== undefined && (
                <p className="text-xs text-tropical-secondary font-semibold mt-1">
                  {user.xp} XP
                </p>
              )}
            </div>
            <a
              href={`/${lang}/profile`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4" />
              Mi Perfil
            </a>
            <a
              href={`/${lang}/profile/favorites`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              Favoritos
            </a>
            <a
              href={`/${lang}/profile/history`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Historial
            </a>
            <div className="h-px bg-gray-100 my-1" />
            <a
              href="https://manager.escapemaster.es"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-tropical-primary font-bold hover:bg-tropical-primary/5 transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Soy Propietario
            </a>
            <div className="h-px bg-gray-100 my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      variant="default"
      size="sm"
      className="shadow-none"
    >
      Iniciar Sesión
    </Button>
  );
};
