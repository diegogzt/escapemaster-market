import React, { useEffect, useState } from 'react';
import { Bell, Trophy, Star, Zap, CalendarCheck, CalendarX, Clock, Gift } from 'lucide-react';
import { $token } from '../../lib/store';
import { cn } from '../../lib/utils';

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || 'http://localhost:8000/v1/api';

// Tipos de las notificaciones
interface Notification {
  id: string;
  type: string;
  message: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationsPanel({ lang }: { lang: "es" | "en" }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = lang === 'en' ? {
    empty: 'No notifications yet',
    emptyDesc: 'Your booking updates and achievements will appear here',
    markAllRead: 'Mark all as read',
    today: 'Today',
    yesterday: 'Yesterday',
    earlier: 'Earlier',
    types: {
      booking_confirmed: 'Booking Confirmed',
      booking_reminder: 'Reminder',
      booking_cancelled: 'Booking Cancelled',
      achievement_unlocked: 'Achievement Unlocked',
      xp_earned: 'XP Earned',
      level_up: 'Level Up!',
      review_reminder: 'Leave a Review',
      promo: 'Special Offer'
    }
  } : {
    empty: 'Sin notificaciones',
    emptyDesc: 'Las actualizaciones de tus reservas y logros aparecerán aquí',
    markAllRead: 'Marcar todo como leído',
    today: 'Hoy',
    yesterday: 'Ayer',
    earlier: 'Anteriores',
    types: {
      booking_confirmed: 'Reserva Confirmada',
      booking_reminder: 'Recordatorio',
      booking_cancelled: 'Reserva Cancelada',
      achievement_unlocked: 'Logro Desbloqueado',
      xp_earned: 'XP Ganado',
      level_up: '¡Subiste de Nivel!',
      review_reminder: 'Deja una Reseña',
      promo: 'Oferta Especial'
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed': return <CalendarCheck className="text-green-600" size={20} />;
      case 'booking_reminder': return <Clock className="text-amber-600" size={20} />;
      case 'booking_cancelled': return <CalendarX className="text-red-600" size={20} />;
      case 'achievement_unlocked': return <Trophy className="text-purple-600" size={20} />;
      case 'xp_earned': return <Zap className="text-yellow-600" size={20} />;
      case 'level_up': return <Star className="text-indigo-600" size={20} />;
      case 'review_reminder': return <Star className="text-blue-600" size={20} />;
      case 'promo': return <Gift className="text-pink-600" size={20} />;
      default: return <Bell className="text-tropical-primary" size={20} />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'booking_confirmed': return 'bg-green-100';
      case 'booking_reminder': return 'bg-amber-100';
      case 'booking_cancelled': return 'bg-red-100';
      case 'achievement_unlocked': return 'bg-purple-100';
      case 'xp_earned': return 'bg-yellow-100';
      case 'level_up': return 'bg-indigo-100';
      case 'review_reminder': return 'bg-blue-100';
      case 'promo': return 'bg-pink-100';
      default: return 'bg-tropical-primary/10';
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = $token.get() || localStorage.getItem('em_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/players/me/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Error cargando notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = $token.get() || localStorage.getItem('em_token');
      if (!token) return;

      await fetch(`${API_BASE}/players/me/notifications/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const groupNotifications = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { today: Notification[], yesterday: Notification[], earlier: Notification[] } = {
      today: [], yesterday: [], earlier: []
    };

    notifications.forEach(notif => {
      const d = new Date(notif.created_at);
      if (d >= today) {
        groups.today.push(notif);
      } else if (d >= yesterday) {
        groups.yesterday.push(notif);
      } else {
        groups.earlier.push(notif);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-tropical-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const groups = groupNotifications();
  const hasNotifications = notifications.length > 0;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-tropical-primary">
          {lang === 'en' ? 'Notifications' : 'Notificaciones'}
        </h2>
        {hasNotifications && (
          <button 
            onClick={handleMarkAllRead} 
            className="text-sm font-medium text-tropical-secondary hover:text-tropical-primary hover:underline transition-all"
          >
            {t.markAllRead}
          </button>
        )}
      </div>

      {!hasNotifications ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Bell size={24} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t.empty}</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">{t.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { key: 'today', items: groups.today, title: t.today },
            { key: 'yesterday', items: groups.yesterday, title: t.yesterday },
            { key: 'earlier', items: groups.earlier, title: t.earlier }
          ].map(group => group.items.length > 0 && (
            <div key={group.key}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                {group.title}
              </h3>
              <div className="space-y-3">
                {group.items.map(notif => {
                  const typeLabel = (t.types as Record<string, string>)[notif.type] || notif.type;
                  const time = new Date(notif.created_at).toLocaleTimeString(lang === 'en' ? 'en-US' : 'es-ES', {
                    hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <div 
                      key={notif.id} 
                      className={cn(
                        "relative flex gap-4 p-4 rounded-xl border transition-colors",
                        notif.read ? "bg-white border-gray-100" : "bg-tropical-card/10 border-tropical-secondary/20"
                      )}
                    >
                      {!notif.read && (
                        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-tropical-accent animate-pulse" />
                      )}
                      
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        getColorClass(notif.type)
                      )}>
                        {getIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="text-sm font-bold text-tropical-text truncate pr-4">
                            {typeLabel}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap pt-0.5">
                            {time}
                          </span>
                        </div>
                        <p className={cn("text-sm", notif.read ? "text-gray-500" : "text-tropical-text")}>
                          {notif.message}
                        </p>
                        
                        {notif.action_url && (
                          <a 
                            href={notif.action_url}
                            className="inline-block mt-3 text-xs font-bold text-tropical-secondary hover:text-tropical-primary"
                          >
                            {lang === 'en' ? 'View Details →' : 'Ver Detalles →'}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}