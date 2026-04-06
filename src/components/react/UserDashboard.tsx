import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $user, $token } from "../../lib/store";
import { auth } from "../../lib/auth";
import {
  User,
  Calendar,
  Trophy,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  Gift,
  CreditCard,
  Settings,
  LogOut,
  Camera,
  Shield,
  Zap,
  Target,
  Users,
  Heart,
  Bell,
  Sparkles,
  Search,
  GraduationCap,
  Crown,
  Leaf,
  Lock,
  CheckCircle,
  XCircle,
  Mail,
  Award,
  Moon,
} from "lucide-react";
import { NotificationsPanel } from "./NotificationsPanel";

interface Booking {
  id: string;
  room_name: string;
  room_image?: string;
  organization_name: string;
  date: string;
  time: string;
  players: number;
  status: "upcoming" | "completed" | "cancelled";
  escaped?: boolean;
  escape_time_seconds?: number;
  xp_awarded?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconType: string;
  earned_at?: string;
  progress?: number;
  max_progress?: number;
}

interface PlayerStats {
  total_xp: number;
  rank: string;
  discount_percentage: number;
  rooms_played: number;
  rooms_escaped: number;
  escape_rate: number;
  reviews_count: number;
  photos_uploaded: number;
  achievements_count: number;
  squads_count: number;
  credits_balance: number;
  referral_code: string;
}

interface UserDashboardProps {
  lang?: string;
  apiUrl?: string;
}

// Rank configuration - using icon names that will be rendered as React components
const RANKS: Record<
  string,
  { name: string; iconType: string; color: string; minXp: number }
> = {
  newbie: {
    name: "Novato",
    iconType: "leaf",
    color: "from-gray-400 to-gray-500",
    minXp: 0,
  },
  solver: {
    name: "Investigador",
    iconType: "search",
    color: "from-blue-400 to-blue-600",
    minXp: 500,
  },
  mentor: {
    name: "Mentor",
    iconType: "graduation",
    color: "from-purple-400 to-purple-600",
    minXp: 1500,
  },
  master: {
    name: "Maestro",
    iconType: "zap",
    color: "from-amber-400 to-orange-500",
    minXp: 3000,
  },
  legend: {
    name: "Leyenda",
    iconType: "sparkles",
    color: "from-pink-400 to-rose-500",
    minXp: 5000,
  },
  escapemaster: {
    name: "EscapeMaster",
    iconType: "crown",
    color: "from-yellow-400 to-amber-500",
    minXp: 10000,
  },
};

// Rank icon component
const RankIcon: React.FC<{
  iconType: string;
  size?: number;
  className?: string;
}> = ({ iconType, size = 16, className = "" }) => {
  const props = { size, className };
  switch (iconType) {
    case "leaf":
      return <Leaf {...props} />;
    case "search":
      return <Search {...props} />;
    case "graduation":
      return <GraduationCap {...props} />;
    case "zap":
      return <Zap {...props} />;
    case "sparkles":
      return <Sparkles {...props} />;
    case "crown":
      return <Crown {...props} />;
    case "moon":
      return <Moon {...props} />;
    case "target":
      return <Target {...props} />;
    case "trophy":
      return <Trophy {...props} />;
    case "award":
      return <Award {...props} />;
    default:
      return <Star {...props} />;
  }
};

const getProgressWidthClass = (value: number) => {
  if (value <= 0) return "w-0";
  if (value <= 8) return "w-1/12";
  if (value <= 17) return "w-2/12";
  if (value <= 25) return "w-3/12";
  if (value <= 33) return "w-4/12";
  if (value <= 42) return "w-5/12";
  if (value <= 50) return "w-6/12";
  if (value <= 58) return "w-7/12";
  if (value <= 67) return "w-8/12";
  if (value <= 75) return "w-9/12";
  if (value <= 83) return "w-10/12";
  if (value <= 92) return "w-11/12";
  return "w-full";
};

// Tab Button Component
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all shrink-0 ${
      active
        ? "bg-tropical-primary text-white shadow-lg shadow-tropical-primary/20"
        : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
    }`}
  >
    {icon}
    <span className="whitespace-nowrap">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span
        className={`px-1.5 py-0.5 text-[10px] sm:text-xs font-bold rounded-full ${
          active
            ? "bg-white/20 text-white"
            : "bg-tropical-primary/10 text-tropical-primary"
        }`}
      >
        {badge}
      </span>
    )}
  </button>
);

// Booking Card Component
const BookingCard: React.FC<{ booking: Booking; lang: string }> = ({
  booking,
  lang,
}) => {
  const statusColors = {
    upcoming: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  const statusLabels = {
    upcoming: lang === "en" ? "Upcoming" : "Próxima",
    completed: lang === "en" ? "Completed" : "Completada",
    cancelled: lang === "en" ? "Cancelled" : "Cancelada",
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg active:scale-[0.99] transition-all group">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-28 md:w-32 h-32 sm:h-28 md:h-32 bg-tropical-primary shrink-0">
          {booking.room_image ? (
            <img
              src={booking.room_image}
              alt={booking.room_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Lock size={32} className="text-white/70" />
            </div>
          )}
        </div>

        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-tropical-primary transition-colors truncate">
                  {booking.room_name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {booking.organization_name}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium shrink-0 ${statusColors[booking.status]}`}
              >
                {statusLabels[booking.status]}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                {booking.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                {booking.time}
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} className="sm:w-3.5 sm:h-3.5" />
                {booking.players}
              </span>
            </div>

            {booking.status === "completed" && (
              <div className="flex items-center gap-2">
                {booking.escaped !== undefined && (
                  <span
                    className={`text-[10px] sm:text-xs font-medium flex items-center gap-1 ${booking.escaped ? "text-green-600" : "text-red-500"}`}
                  >
                    {booking.escaped ? (
                      <>
                        <CheckCircle size={12} />{" "}
                        {lang === "en" ? "Escaped!" : "¡Escapaste!"}
                      </>
                    ) : (
                      <>
                        <XCircle size={12} />{" "}
                        {lang === "en" ? "Didn't escape" : "No escapaste"}
                      </>
                    )}
                  </span>
                )}
                {booking.xp_awarded && (
                  <span className="text-[10px] sm:text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Zap size={12} />+{booking.xp_awarded} XP
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Achievement Card Component
const AchievementCard: React.FC<{ achievement: Achievement }> = ({
  achievement,
}) => {
  const isUnlocked = !!achievement.earned_at;
  const hasProgress =
    achievement.progress !== undefined && achievement.max_progress;
  const progressPercent = hasProgress
    ? (achievement.progress! / achievement.max_progress!) * 100
    : 0;

  return (
    <div
      className={`relative rounded-xl sm:rounded-2xl border p-3 sm:p-4 transition-all ${
        isUnlocked
          ? "bg-amber-50 border-amber-200"
          : "bg-gray-50 border-gray-200 opacity-60"
      }`}
    >
      {isUnlocked && (
        <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 sm:w-6 h-5 sm:h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
          <Sparkles size={10} className="sm:w-3 sm:h-3 text-white" />
        </div>
      )}

      <div
        className={`w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 ${
          isUnlocked ? "bg-white shadow-lg" : "bg-gray-200"
        }`}
      >
        <RankIcon
          iconType={achievement.iconType}
          size={28}
          className={isUnlocked ? "text-amber-500" : "text-gray-400"}
        />
      </div>

      <h4
        className={`font-bold text-xs sm:text-sm ${isUnlocked ? "text-gray-900" : "text-gray-500"}`}
      >
        {achievement.name}
      </h4>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-2">
        {achievement.description}
      </p>

      {hasProgress && !isUnlocked && (
        <div className="mt-2 sm:mt-3">
          <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mb-1">
            <span>Progreso</span>
            <span>
              {achievement.progress}/{achievement.max_progress}
            </span>
          </div>
          <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-tropical-primary rounded-full transition-all ${getProgressWidthClass(progressPercent)}`}
            />
          </div>
        </div>
      )}

      {isUnlocked && (
        <p className="text-[10px] sm:text-xs text-amber-600 mt-1.5 sm:mt-2 font-medium">
          ✨ {new Date(achievement.earned_at!).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

// Main Dashboard Component
export const UserDashboard: React.FC<UserDashboardProps> = ({
  lang = "es",
}) => {
  const user = useStore($user);
  const token = useStore($token);

  // Read initial tab from URL ?tab= param
  const initialTab = (() => {
    if (typeof window === 'undefined') return 'bookings';
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t === 'notifications' || t === 'routes' || t === 'achievements' || t === 'credits' || t === 'settings') return t;
    return 'bookings';
  })();

  const [activeTab, setActiveTab] = useState<
    "bookings" | "routes" | "achievements" | "credits" | "settings" | "notifications"
  >(initialTab as any);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState<
    "all" | "upcoming" | "completed" | "cancelled"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [userRoutes, setUserRoutes] = useState<any[]>([]);

  // Labels
  const labels = {
    bookings: lang === "en" ? "My Bookings" : "Mis Reservas",
    routes: lang === "en" ? "My Routes" : "Mis Rutas",
    achievements: lang === "en" ? "Achievements" : "Logros",
    credits: lang === "en" ? "Credits" : "Créditos",
    settings: lang === "en" ? "Settings" : "Ajustes",
    upcoming: lang === "en" ? "Upcoming" : "Próximas",
    completed: lang === "en" ? "Completed" : "Completadas",
    cancelled: lang === "en" ? "Cancelled" : "Canceladas",
    all: lang === "en" ? "All" : "Todas",
    noBookings:
      lang === "en" ? "No bookings yet" : "No tienes reservas todavía",
    explore: lang === "en" ? "Explore rooms" : "Explorar salas",
    balance: lang === "en" ? "Available balance" : "Saldo disponible",
    referralTitle: lang === "en" ? "Invite friends" : "Invita amigos",
    referralDesc:
      lang === "en"
        ? "Share your code and earn XP"
        : "Comparte tu código y gana XP",
    copied: lang === "en" ? "Copied!" : "¡Copiado!",
    copy: lang === "en" ? "Copy" : "Copiar",
    logout: lang === "en" ? "Log Out" : "Cerrar Sesión",
    yourRank: lang === "en" ? "Your Rank" : "Tu Rango",
    nextRank: lang === "en" ? "Next rank" : "Siguiente rango",
    played: lang === "en" ? "Played" : "Jugadas",
    escaped: lang === "en" ? "Escaped" : "Escapadas",
    escapeRate: lang === "en" ? "Escape rate" : "Tasa de éxito",
    reviews: lang === "en" ? "Reviews" : "Reseñas",
    photos: lang === "en" ? "Photos" : "Fotos",
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const session = await auth.getSession();
        const authToken = token || session.token;

        if (!authToken) {
          setIsLoading(false);
          return;
        }

        const [meRes, historyRes, routesRes] = await Promise.all([
          fetch("/api/players/me", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/players/me/history", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/routes/user", {
            headers: { Authorization: `Bearer ${authToken}` },
          }).catch(() => null),
        ]);

        if (meRes.ok) {
          const me = await meRes.json();
          setStats({
            total_xp: me.total_xp || 0,
            rank: me.rank || "newbie",
            discount_percentage: me.discount_percentage || 0,
            rooms_played: me.rooms_played || 0,
            rooms_escaped: me.rooms_escaped || 0,
            escape_rate: me.escape_rate || 0,
            reviews_count: me.reviews_count || 0,
            photos_uploaded: me.photos_uploaded || 0,
            achievements_count: me.achievements_count || 0,
            squads_count: me.squads_count || 0,
            credits_balance: me.credits_balance || 0,
            referral_code: me.referral_code || "",
          });

          const unlocked = me.achievements_count || 0;
          setAchievements([
            {
              id: "a1",
              name: lang === "en" ? "First Escape" : "Primer Escape",
              description:
                lang === "en"
                  ? "Complete your first room"
                  : "Completa tu primera sala",
              iconType: "leaf",
              earned_at: unlocked > 0 ? new Date().toISOString() : undefined,
            },
            {
              id: "a2",
              name: lang === "en" ? "Speed Runner" : "Velocista",
              description:
                lang === "en"
                  ? "Escape in less than 45 minutes"
                  : "Escapa en menos de 45 minutos",
              iconType: "zap",
              earned_at: unlocked > 1 ? new Date().toISOString() : undefined,
            },
            {
              id: "a3",
              name: lang === "en" ? "Sherlock" : "Sherlock",
              description:
                lang === "en"
                  ? "Escape without hints"
                  : "Escapa sin pedir pistas",
              iconType: "search",
              earned_at: unlocked > 2 ? new Date().toISOString() : undefined,
            },
            {
              id: "a4",
              name: lang === "en" ? "Route Master" : "Maestro de Rutas",
              description:
                lang === "en"
                  ? "Complete 3 route rooms"
                  : "Completa 3 salas de ruta",
              iconType: "target",
              progress: Math.min(me.rooms_played || 0, 3),
              max_progress: 3,
              earned_at:
                (me.rooms_played || 0) >= 3
                  ? new Date().toISOString()
                  : undefined,
            },
          ]);
        }

        if (historyRes.ok) {
          const history = await historyRes.json();
          const normalizedBookings: Booking[] = history.map((item: any) => {
            const playedDate = new Date(item.played_at);
            return {
              id: item.booking_id,
              room_name: item.room?.name || "Escape Room",
              room_image: item.room?.image_url || undefined,
              organization_name:
                item.room?.company_name || "EscapeMaster Partner",
              date: playedDate.toLocaleDateString(
                lang === "en" ? "en-US" : "es-ES",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              ),
              time: playedDate.toLocaleTimeString(
                lang === "en" ? "en-US" : "es-ES",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              ),
              players: 4,
              status: "completed",
              escaped: item.escaped,
              escape_time_seconds: item.time_used
                ? item.time_used * 60
                : undefined,
              xp_awarded: item.xp_awarded || 0,
            };
          });
          setBookings(normalizedBookings);
        } else {
          setBookings([]);
        }

        if (routesRes && routesRes.ok) {
          const routesData = await routesRes.json();
          setUserRoutes(routesData.routes || []);
        } else {
          setUserRoutes([]);
        }
      } catch (error) {
        console.error("[UserDashboard] load error", error);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token, lang]);

  if (!user && !token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-4xl">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Acceso restringido
          </h2>
          <p className="text-gray-500">Inicia sesión para ver tu panel</p>
          <a
            href={`/${lang}/login`}
            className="inline-block px-6 py-3 bg-tropical-primary text-white font-bold rounded-xl"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-tropical-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentRank = RANKS[stats?.rank || "newbie"] || RANKS.newbie;
  const nextRankKey = Object.keys(RANKS).find(
    (key) => RANKS[key].minXp > (stats?.total_xp || 0),
  );
  const nextRank = nextRankKey ? RANKS[nextRankKey] : null;
  const xpToNextRank = nextRank ? nextRank.minXp - (stats?.total_xp || 0) : 0;
  const xpProgress = nextRank
    ? (((stats?.total_xp || 0) - currentRank.minXp) /
        (nextRank.minXp - currentRank.minXp)) *
      100
    : 100;

  const filteredBookings =
    bookingFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === bookingFilter);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(stats?.referral_code || "");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Rank */}
      <div className="bg-white rounded-xl sm:rounded-3xl border border-gray-100 overflow-hidden mb-6 sm:mb-8">
        <div className={`${currentRank.color} p-4 sm:p-6 text-white`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 sm:w-20 h-14 sm:h-20 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-4xl border-2 border-white/30 shrink-0">
                <RankIcon
                  iconType={currentRank.iconType}
                  size={32}
                  className="text-white"
                />
              </div>
              <div className="min-w-0">
                <p className="text-white/70 text-xs sm:text-sm font-medium">
                  {labels.yourRank}
                </p>
                <h2 className="text-xl sm:text-2xl font-bold truncate">
                  {currentRank.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Zap size={14} className="sm:w-4 sm:h-4" />
                  <span className="font-bold text-sm sm:text-base">
                    {stats?.total_xp?.toLocaleString()} XP
                  </span>
                  {stats?.discount_percentage &&
                    stats.discount_percentage > 0 && (
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] sm:text-xs font-bold">
                        -{stats.discount_percentage}%
                      </span>
                    )}
                </div>
              </div>
            </div>

            {nextRank && (
              <div className="w-full sm:flex-1 sm:max-w-xs">
                <div className="flex justify-between text-xs sm:text-sm mb-1">
                  <span className="text-white/70">
                    {labels.nextRank}: {nextRank.name}
                  </span>
                  <span className="font-bold">{xpToNextRank} XP</span>
                </div>
                <div className="h-2 sm:h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white rounded-full transition-all ${getProgressWidthClass(xpProgress)}`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-gray-100">
          {[
            {
              label: labels.played,
              value: stats?.rooms_played || 0,
              icon: <Target size={16} className="sm:w-4.5 sm:h-4.5" />,
            },
            {
              label: labels.escaped,
              value: stats?.rooms_escaped || 0,
              icon: <Trophy size={16} className="sm:w-4.5 sm:h-4.5" />,
            },
            {
              label: labels.escapeRate,
              value: `${stats?.escape_rate || 0}%`,
              icon: <Zap size={16} className="sm:w-4.5 sm:h-4.5" />,
            },
            {
              label: labels.reviews,
              value: stats?.reviews_count || 0,
              icon: <Star size={16} className="sm:w-4.5 sm:h-4.5" />,
              hideOnMobile: true,
            },
            {
              label: labels.photos,
              value: stats?.photos_uploaded || 0,
              icon: <Camera size={16} className="sm:w-4.5 sm:h-4.5" />,
              hideOnMobile: true,
            },
          ].map((stat, i) => (
            <div key={i} className="p-3 sm:p-4 text-center">
              <div className="text-gray-400 mb-1 flex justify-center">
                {stat.icon}
              </div>
              <div className="text-lg sm:text-xl font-bold text-tropical-primary">
                {stat.value}
              </div>
              <div className="text-[9px] sm:text-xs text-gray-500 font-medium truncate">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scroll-x-smooth no-scrollbar -mx-1 px-1">
        <TabButton
          active={activeTab === "bookings"}
          onClick={() => setActiveTab("bookings")}
          icon={<Calendar size={16} className="sm:w-4.5 sm:h-4.5" />}
          label={labels.bookings}
          badge={bookings.filter((b) => b.status === "upcoming").length}
        />
        <TabButton
          active={activeTab === "routes"}
          onClick={() => setActiveTab("routes")}
          icon={<MapPin size={16} className="sm:w-4.5 sm:h-4.5" />}
          label={labels.routes}
          badge={userRoutes.filter((r) => r.status === "active").length}
        />
        <TabButton
          active={activeTab === "achievements"}
          onClick={() => setActiveTab("achievements")}
          icon={<Trophy size={16} className="sm:w-4.5 sm:h-4.5" />}
          label={labels.achievements}
          badge={achievements.filter((a) => a.earned_at).length}
        />
        <TabButton
          active={activeTab === "credits"}
          onClick={() => setActiveTab("credits")}
          icon={<CreditCard size={16} className="sm:w-4.5 sm:h-4.5" />}
          label={labels.credits}
        />
        <TabButton
          active={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          icon={<Bell size={16} className="sm:w-4.5 sm:h-4.5" />}
          label={lang === 'en' ? 'Notifications' : 'Avisos'}
        />
        <TabButton
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
          icon={<Settings size={16} className="sm:w-4.5 sm:h-4.5" />}
          label={labels.settings}
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-75 sm:min-h-100">
        {/* Bookings */}
        {activeTab === "bookings" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex gap-2 flex-nowrap overflow-x-auto pb-2 scroll-x-smooth no-scrollbar -mx-1 px-1">
              {(["all", "upcoming", "completed", "cancelled"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setBookingFilter(filter)}
                    className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                      bookingFilter === filter
                        ? "bg-tropical-primary/10 text-tropical-primary"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                    }`}
                  >
                    {labels[filter]} (
                    {filter === "all"
                      ? bookings.length
                      : bookings.filter((b) => b.status === filter).length}
                    )
                  </button>
                ),
              )}
            </div>

            {filteredBookings.length > 0 ? (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} lang={lang} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl sm:rounded-2xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-gray-100">
                  <Mail size={28} className="text-gray-400" />
                </div>
                <p className="text-sm sm:text-base text-gray-500">
                  {labels.noBookings}
                </p>
                <a
                  href={`/${lang}/search`}
                  className="inline-block mt-4 px-5 sm:px-6 py-2.5 sm:py-3 bg-tropical-primary text-white font-bold rounded-xl text-sm sm:text-base active:scale-95 transition-transform"
                >
                  {labels.explore}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Routes */}
        {activeTab === "routes" && (
          <div className="space-y-4">
            {userRoutes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">
                  {lang === "en" ? "No routes started" : "Sin rutas activas"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {lang === "en"
                    ? "Start a route to track your progress"
                    : "Comienza una ruta para seguir tu progreso"}
                </p>
                <a
                  href={`/${lang}/routes`}
                  className="inline-block px-5 py-2 bg-tropical-primary text-white text-sm font-semibold rounded-xl"
                >
                  {lang === "en" ? "Explore Routes" : "Explorar Rutas"}
                </a>
              </div>
            ) : (
              userRoutes.map((route: any) => {
                const progress = route.total_rooms
                  ? Math.round(
                      (route.completed_rooms / route.total_rooms) * 100,
                    )
                  : 0;
                return (
                  <a
                    key={route.id}
                    href={`/${lang}/routes/${route.slug}`}
                    className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      {route.cover_image_url ? (
                        <img
                          src={route.cover_image_url}
                          alt=""
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-tropical-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-6 h-6 text-tropical-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-tropical-primary transition-colors">
                            {route.collection_title}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${route.status === "active" ? "bg-green-100 text-green-700" : route.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {route.status === "active"
                              ? lang === "en"
                                ? "Active"
                                : "Activa"
                              : route.status === "completed"
                                ? lang === "en"
                                  ? "Completed"
                                  : "Completada"
                                : lang === "en"
                                  ? "Abandoned"
                                  : "Abandonada"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {route.mode === "solo" ? "🧑 Solo" : "👥 Equipo"} ·{" "}
                          {route.completed_rooms}/{route.total_rooms}{" "}
                          {lang === "en" ? "rooms" : "salas"}
                        </p>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-tropical-primary rounded-full transition-all ${getProgressWidthClass(progress)}`}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {progress}%{" "}
                          {lang === "en" ? "complete" : "completado"}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        )}

        {/* Achievements */}
        {activeTab === "achievements" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}

        {/* Credits */}
        {activeTab === "credits" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-tropical-primary rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
              <p className="text-white/70 text-xs sm:text-sm">
                {labels.balance}
              </p>
              <p className="text-3xl sm:text-4xl font-bold mt-1">
                {stats?.credits_balance?.toFixed(2)}€
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                  🎁
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">
                    {labels.referralTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {labels.referralDesc}
                  </p>
                  <div className="mt-3 sm:mt-4 flex items-center gap-2">
                    <div className="flex-1 px-3 sm:px-4 py-2 bg-gray-100 rounded-lg sm:rounded-xl font-mono font-bold text-sm sm:text-base text-gray-900 truncate">
                      {stats?.referral_code}
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shrink-0 active:scale-95 transition-transform ${codeCopied ? "bg-green-500 text-white" : "bg-tropical-primary text-white"}`}
                    >
                      {codeCopied ? labels.copied : labels.copy}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <NotificationsPanel lang={lang} />
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {[
              {
                icon: <User size={18} className="sm:w-5 sm:h-5" />,
                label: "Editar perfil",
                href: `/${lang}/profile/edit`,
              },
              {
                icon: <Bell size={18} className="sm:w-5 sm:h-5" />,
                label: lang === 'en' ? 'Notifications' : 'Notificaciones',
                href: `/${lang}/profile?tab=notifications`,
              },
              {
                icon: <Shield size={18} className="sm:w-5 sm:h-5" />,
                label: "Privacidad",
                href: `/${lang}/profile/settings`,
              },
              {
                icon: <Heart size={18} className="sm:w-5 sm:h-5" />,
                label: "Preferencias",
                href: `/${lang}/profile/settings`,
              },
              {
                icon: <LogOut size={18} className="sm:w-5 sm:h-5" />,
                label: labels.logout,
                href: "#logout",
                danger: true,
              },
            ].map((item, i) => (
              <a
                key={i}
                href={item.href}
                onClick={
                  item.href === "#logout"
                    ? (e) => {
                        e.preventDefault();
                        auth.logout();
                      }
                    : undefined
                }
                className={`flex items-center justify-between p-3.5 sm:p-4 hover:bg-gray-50 active:bg-gray-100 ${item.danger ? "text-red-500" : "text-gray-700"}`}
              >
                <span className="flex items-center gap-2.5 sm:gap-3 text-sm sm:text-base">
                  {item.icon}
                  {item.label}
                </span>
                <ChevronRight
                  size={16}
                  className="sm:w-4.5 sm:h-4.5 text-gray-400"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
