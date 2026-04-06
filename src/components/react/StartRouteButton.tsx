import React, { useState, useEffect } from 'react';
import { Play, Users, User, Loader2, Check, ChevronDown } from 'lucide-react';

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || "http://localhost:8000/v1/api";

interface StartRouteButtonProps {
    collectionId: string;
    lang?: string;
}

export const StartRouteButton: React.FC<StartRouteButtonProps> = ({ collectionId, lang = 'es' }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeRoute, setActiveRoute] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [showTeamSelect, setShowTeamSelect] = useState(false);
    const [error, setError] = useState('');

    const labels = lang === 'en' ? {
        start: 'Start Route',
        solo: 'Solo',
        soloDesc: 'Play at your own pace',
        team: 'With Team',
        teamDesc: 'Play with your team',
        active: 'Route in progress',
        progress: 'Progress',
        selectTeam: 'Select team',
        noTeams: 'No teams. Create one first.',
        confirm: 'Start',
    } : {
        start: 'Comenzar Ruta',
        solo: 'Solo',
        soloDesc: 'Juega a tu ritmo',
        team: 'Con Equipo',
        teamDesc: 'Juega con tu equipo',
        active: 'Ruta en progreso',
        progress: 'Progreso',
        selectTeam: 'Selecciona equipo',
        noTeams: 'Sin equipos. Crea uno primero.',
        confirm: 'Comenzar',
    };

    useEffect(() => {
        checkActiveRoute();
    }, []);

    const getToken = () => {
        try {
            const stored = localStorage.getItem('escapemaster_user');
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.token;
            }
        } catch { }
        return null;
    };

    const checkActiveRoute = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE}/routes/start?collectionId=${collectionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const active = data.routes?.find((r: any) => r.status === 'active');
            if (active) setActiveRoute(active);
        } catch { }
    };

    const fetchTeams = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`/teams/my-teams', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTeams(data.teams || []);
        } catch { }
    };

    const startRoute = async (mode: 'solo' | 'team') => {
        const token = getToken();
        if (!token) {
            window.location.href = `/${lang}/login`;
            return;
        }

        if (mode === 'team' && !showTeamSelect) {
            setShowTeamSelect(true);
            fetchTeams();
            return;
        }

        if (mode === 'team' && !selectedTeam) {
            setError(labels.selectTeam);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/routes/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ collectionId, mode, teamId: mode === 'team' ? selectedTeam : undefined })
            });

            const data = await res.json();

            if (res.ok) {
                setActiveRoute(data.route);
                setShowOptions(false);
                setShowTeamSelect(false);
            } else {
                if (res.status === 409) {
                    setActiveRoute({ id: data.routeId, status: 'active' });
                    setShowOptions(false);
                } else {
                    setError(data.error || 'Error al iniciar ruta');
                }
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    // Show active route progress
    if (activeRoute) {
        const progress = activeRoute.total_rooms 
            ? Math.round((activeRoute.completed_rooms / activeRoute.total_rooms) * 100) 
            : 0;

        return (
            <div className="bg-tropical-primary/5 border border-tropical-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-tropical-primary" />
                    <span className="text-sm font-semibold text-tropical-primary">{labels.active}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                        {activeRoute.mode === 'solo' ? '🧑 Solo' : '👥 Equipo'}
                    </span>
                </div>
                {activeRoute.total_rooms && (
                    <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{labels.progress}</span>
                            <span>{activeRoute.completed_rooms}/{activeRoute.total_rooms}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-tropical-primary rounded-full transition-all duration-500" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            {!showOptions ? (
                <button 
                    onClick={() => setShowOptions(true)}
                    className="w-full bg-tropical-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-tropical-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                    <Play className="w-4 h-4" />
                    {labels.start}
                </button>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-lg">
                    <div className="flex gap-3">
                        <button 
                            onClick={() => startRoute('solo')}
                            disabled={loading}
                            className="flex-1 border border-gray-200 rounded-xl p-4 hover:border-tropical-primary hover:bg-tropical-primary/5 transition-all text-left group"
                        >
                            <User className="w-5 h-5 text-gray-400 group-hover:text-tropical-primary mb-2" />
                            <p className="font-semibold text-sm text-gray-900">{labels.solo}</p>
                            <p className="text-xs text-gray-500">{labels.soloDesc}</p>
                        </button>
                        <button 
                            onClick={() => startRoute('team')}
                            disabled={loading}
                            className="flex-1 border border-gray-200 rounded-xl p-4 hover:border-tropical-primary hover:bg-tropical-primary/5 transition-all text-left group"
                        >
                            <Users className="w-5 h-5 text-gray-400 group-hover:text-tropical-primary mb-2" />
                            <p className="font-semibold text-sm text-gray-900">{labels.team}</p>
                            <p className="text-xs text-gray-500">{labels.teamDesc}</p>
                        </button>
                    </div>

                    {showTeamSelect && (
                        <div className="space-y-2">
                            <select 
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                value={selectedTeam}
                                onChange={(e) => { setSelectedTeam(e.target.value); setError(''); }}
                            >
                                <option value="">{labels.selectTeam}</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            {teams.length === 0 && <p className="text-xs text-gray-400">{labels.noTeams}</p>}
                            {selectedTeam && (
                                <button 
                                    onClick={() => startRoute('team')}
                                    disabled={loading}
                                    className="w-full bg-tropical-primary text-white font-semibold py-2 rounded-lg text-sm hover:bg-tropical-primary/90 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {labels.confirm}
                                </button>
                            )}
                        </div>
                    )}

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <button 
                        onClick={() => { setShowOptions(false); setShowTeamSelect(false); setError(''); }}
                        className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
                    >
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};
