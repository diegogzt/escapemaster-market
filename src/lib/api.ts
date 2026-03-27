const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('esc_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
     if (response.status === 401) {
         if (typeof window !== 'undefined') {
             // Redirect to login if unauthorized and client-side
             // window.location.href = '/login'; 
         }
     }
     throw new ApiError(response.statusText, response.status);
  }

  // Some endpoints might return 204 No Content
  if (response.status === 204) {
      return {} as T;
  }

  return response.json();
}

export const api = {
    auth: {
        login: (credentials: any) => request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        me: () => request('/auth/me'),
    },
    rooms: {
        list: (params?: Record<string, string | number>) => {
             const queryParams = new URLSearchParams();
             if (params) {
                 Object.entries(params).forEach(([key, value]) => {
                     if (value !== undefined && value !== null && value !== '') {
                         queryParams.append(key, String(value));
                     }
                 });
             }
             const qs = queryParams.toString();
             return request(`/rooms${qs ? `?${qs}` : ''}`);
        },
        listPublic: async (params?: Record<string, string | number>) => {
            // Fetch all public rooms
            const rooms = await request<any[]>('/rooms/public');
            
            if (!params || Object.keys(params).length === 0) {
                return rooms;
            }

            // Client-side filtering since public endpoint doesn't support all filters yet
            return rooms.filter((room: any) => {
                // Filter by text search (q)
                if (params.q) {
                    const search = String(params.q).toLowerCase();
                    const matchesName = room.name?.toLowerCase().includes(search);
                    const matchesDesc = room.description?.toLowerCase().includes(search);
                    if (!matchesName && !matchesDesc) return false;
                }

                // Filter by players
                if (params.players) {
                    const players = Number(params.players);
                    if (players < room.capacity_min || players > room.capacity_max) {
                        return false;
                    }
                }

                // Filter by city (if room has location data, assuming not for now or checking description/name)
                // If we had a city field we would check it here. For now ignoring city filter or implementing basic check if exists.
                
                // Filter by theme (if room has theme data)
                // Assumed room structure might have theme_id or similar. 
                // Using generic check if field exists, otherwise ignore.

                return true;
            });
        },
        get: (id: string) => request(`/rooms/${id}`),
    },
    themes: {
        list: () => request('/themes'),
    },
    bookings: {
        create: (data: any) => request('/bookings', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    }
};
