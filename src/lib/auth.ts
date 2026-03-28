// Auth client library — calls API server endpoints
// All auth runs against PostgreSQL via the API server (no Supabase)

import { $user, $token, type UserData } from "./store";

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || "http://localhost:8000/v1/api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  account_type: "enterprise" | "customer";
  organization_id?: string | null;
  avatar_url?: string;
  username?: string;
  onboarding_completed?: boolean;
  player_id?: string;
  xp?: number;
  rank?: string;
  total_games_played?: number;
  total_escapes?: number;
  is_premium?: boolean;
  referral_code?: string;
}

export interface AuthSession {
  user: User | null;
  token: string | null;
}

const TOKEN_KEY = "em_token";
const USER_KEY = "em_user";

function saveSession(token: string, user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  $token.set(token);
  $user.set({
    id: user.id,
    email: user.email,
    name: user.full_name,
    account_type: user.account_type,
    avatar: user.avatar_url,
    player_id: user.player_id,
    xp: user.xp,
    rank: user.rank,
    username: user.username,
    onboarding_completed: user.onboarding_completed,
  });
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  $token.set(null);
  $user.set(null);
}

async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Error desconocido");
  }
  return data;
}

export const auth = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Track login failure
      if (typeof window !== 'undefined' && window.analytics) {
        window.analytics.trackAuth('login_failed', {
          error: data.error || 'unknown',
        });
      }

      // If requires verification, include that flag in the error
      if (data.requiresVerification) {
        const err: any = new Error(data.error);
        err.requiresVerification = true;
        err.email = data.email;
        throw err;
      }
      throw new Error(data.error || "Error al iniciar sesión");
    }

    saveSession(data.access_token, data.user);

    // Track successful login
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackAuth('user_login', {
        account_type: data.user.account_type,
      });
    }

    return data;
  },

  async register(data: {
    email: string;
    password: string;
    full_name: string;
    organization_name?: string;
  }) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await handleResponse(response);

    // Track registration
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackAuth('user_register', {
        has_organization: !!data.organization_name,
      });
    }

    return result;
  },

  async verifyEmailCode(email: string, code: string) {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await handleResponse(response);
    saveSession(data.access_token, data.user);

    // Track email verification
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackAuth('email_verified', {});
    }

    return data;
  },

  async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    return handleResponse(response);
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    });

    return handleResponse(response);
  },

  async verifyResetCode(email: string, code: string) {
    const response = await fetch(`${API_BASE}/auth/verify-reset-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    return handleResponse(response);
  },

  async resendVerification(email: string) {
    const response = await fetch(`${API_BASE}/auth/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    return handleResponse(response);
  },

  async getSession(): Promise<AuthSession> {
    if (typeof window === "undefined") return { user: null, token: null };

    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (!token || !userStr) return { user: null, token: null };

    try {
      return { user: JSON.parse(userStr), token };
    } catch {
      return { user: null, token: null };
    }
  },

  async refreshSession(): Promise<AuthSession> {
    if (typeof window === "undefined") return { user: null, token: null };

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { user: null, token: null };

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        clearSession();
        return { user: null, token: null };
      }

      const data = await response.json();
      saveSession(token, data.user);
      return { user: data.user, token };
    } catch {
      clearSession();
      return { user: null, token: null };
    }
  },

  logout() {
    // Track logout
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.trackAuth('user_logout', {});
    }

    clearSession();
    if (typeof window !== "undefined") {
      const currentLang = window.location.pathname.split("/")[1] || "es";
      const lang = ["es", "en"].includes(currentLang) ? currentLang : "es";
      window.location.href = `/${lang}/`;
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  isLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },

  async loginWithGoogle(
    idToken: string,
    options?: {
      accountType?: "customer" | "enterprise";
      organizationName?: string;
    },
  ) {
    const response = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        accountType: options?.accountType,
        organizationName: options?.organizationName,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Error al iniciar sesión con Google");
    }

    saveSession(data.access_token, data.user);
    return data;
  },

  async switchToEnterprise() {
    const token = this.getToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_BASE}/auth/switch-to-enterprise`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Error al cambiar a cuenta de empresa");
    }

    // Access token is usually the same or re-issued
    if (data.access_token) {
      saveSession(data.access_token, data.user);
    } else {
      saveSession(token, data.user);
    }
    
    return data;
  },
};
