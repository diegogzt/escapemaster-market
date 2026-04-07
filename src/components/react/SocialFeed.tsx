import React, { useState, useEffect } from 'react';
import { Trophy, Users, MapPin, Star, Zap, Clock } from 'lucide-react';

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || 'http://localhost:8000/v1/api';

interface Activity {
  id: string;
  type: 'game_completed' | 'team_created' | 'route_started' | 'review_posted' | 'achievement';
  player_name: string;
  player_id: string;
  detail: string;
  extra?: string;
  created_at: string;
}

interface SocialFeedProps {
  lang?: string;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ lang = 'es' }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(`${API_BASE}/social/feed`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch {
        // use empty state
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'game_completed': return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'team_created': return <Users className="w-4 h-4 text-tropical-primary" />;
      case 'route_started': return <MapPin className="w-4 h-4 text-purple-500" />;
      case 'review_posted': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'achievement': return <Zap className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return lang === 'en' ? 'just now' : 'ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        {lang === 'en' ? 'No recent activity' : 'Sin actividad reciente'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <a
                href={`/${lang}/player/${activity.player_id}`}
                className="font-bold text-tropical-primary hover:underline"
              >
                {activity.player_name}
              </a>
              {' '}{activity.detail}
            </p>
            {activity.extra && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{activity.extra}</p>
            )}
          </div>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {formatTime(activity.created_at)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SocialFeed;
