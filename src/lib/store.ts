import { atom } from "nanostores";

export interface UserData {
  id: string;
  email: string;
  name: string;
  account_type?: "enterprise" | "customer";
  avatar?: string;
  player_id?: string;
  xp?: number;
  rank?: string;
  username?: string;
  onboarding_completed?: boolean;
}

export const $user = atom<UserData | null>(null);
export const $token = atom<string | null>(null);

// Cart Store (placeholder)
export const $cart = atom<any[]>([]);

const TOKEN_KEY = "em_token";
const USER_KEY = "em_user";

// Initialize state from localStorage on client
if (typeof window !== "undefined") {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);

  if (token && userStr) {
    $token.set(token);
    try {
      const parsed = JSON.parse(userStr);
      $user.set({
        id: parsed.id,
        email: parsed.email,
        name: parsed.full_name || parsed.name,
        account_type: parsed.account_type,
        avatar: parsed.avatar_url || parsed.avatar,
        player_id: parsed.player_id,
        xp: parsed.xp,
        rank: parsed.rank,
        username: parsed.username,
        onboarding_completed: parsed.onboarding_completed,
      });
    } catch {
      // Corrupted data, clear
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }
}
