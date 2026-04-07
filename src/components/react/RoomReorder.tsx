import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, GripVertical, Save, Check } from 'lucide-react';

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || 'http://localhost:8000/v1/api';

interface ReorderRoom {
  id: string;
  name: string;
  city: string;
  image_url?: string;
  org_name?: string;
}

interface RoomReorderProps {
  rooms: ReorderRoom[];
  collectionId: string;
  lang?: string;
}

export const RoomReorder: React.FC<RoomReorderProps> = ({ rooms: initialRooms, collectionId, lang = 'es' }) => {
  const [rooms, setRooms] = useState(initialRooms);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const moveRoom = useCallback((index: number, direction: 'up' | 'down') => {
    const newRooms = [...rooms];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRooms.length) return;
    [newRooms[index], newRooms[targetIndex]] = [newRooms[targetIndex], newRooms[index]];
    setRooms(newRooms);
    setSaved(false);
  }, [rooms]);

  const saveOrder = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError(lang === 'en' ? 'You must be logged in' : 'Debes iniciar sesión');
        return;
      }

      const res = await fetch(`${API_BASE}/routes/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          collectionId,
          roomOrder: rooms.map(r => r.id)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error');
        return;
      }

      setSaved(true);
      setTimeout(() => {
        setIsEditing(false);
        setSaved(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
        <GripVertical size={16} />
        {lang === 'en' ? 'Customize order' : 'Personalizar orden'}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-sm">
          {lang === 'en' ? 'Room order' : 'Orden de las salas'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsEditing(false); setRooms(initialRooms); }}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {lang === 'en' ? 'Cancel' : 'Cancelar'}
          </button>
          <button
            onClick={saveOrder}
            disabled={saving || saved}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded-xl transition-all ${
              saved 
                ? 'bg-green-500 text-white' 
                : 'bg-tropical-primary text-white hover:bg-tropical-primary/90 active:scale-95'
            } disabled:opacity-70`}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? '...' : saved ? (lang === 'en' ? 'Saved' : 'Guardado') : (lang === 'en' ? 'Save' : 'Guardar')}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-3">{error}</p>
      )}

      <div className="space-y-1.5">
        {rooms.map((room, idx) => (
          <div
            key={room.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            {/* Order number */}
            <span className="w-7 h-7 bg-tropical-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {idx + 1}
            </span>

            {/* Room image */}
            {room.image_url && (
              <img 
                src={room.image_url} 
                alt={room.name} 
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            )}

            {/* Room info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{room.name}</p>
              <p className="text-xs text-gray-500 truncate">{room.org_name} · {room.city}</p>
            </div>

            {/* Move buttons */}
            <div className="flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => moveRoom(idx, 'up')}
                disabled={idx === 0}
                className="p-1 rounded hover:bg-white disabled:opacity-20 transition-colors"
                title={lang === 'en' ? 'Move up' : 'Mover arriba'}
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => moveRoom(idx, 'down')}
                disabled={idx === rooms.length - 1}
                className="p-1 rounded hover:bg-white disabled:opacity-20 transition-colors"
                title={lang === 'en' ? 'Move down' : 'Mover abajo'}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomReorder;
