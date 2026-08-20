/**
 * Auth Store - Zustand
 * Centralized authentication state management
 */

import { create } from "zustand";
import { User } from "@/lib/api/types";
import Cookie from "js-cookie";

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresIn: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  login: (
    user: User,
    token: string,
    refreshToken?: string,
    expiresIn?: number,
  ) => void;
  logout: () => void;
  initializeAuth: () => void;
  /** Merge fresh fields from GET /users/me (notably `region`) into the store */
  syncUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  tokenExpiresIn: null,
  isAuthenticated: false,
  isLoading: true,
  hasInitialized: false,

  setUser: (user) => set({ user }),

  setToken: (token) => set({ token }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  login: (user, token, refreshToken, expiresIn) => {
    // Store in cookies (persistent across browser sessions)
    Cookie.set("access_token", token, { expires: 7 });
    if (refreshToken) {
      Cookie.set("refresh_token", refreshToken, { expires: 30 });
    }
    Cookie.set("user", JSON.stringify(user), { expires: 7 });
    if (expiresIn) {
      Cookie.set("token_expires_in", String(expiresIn), { expires: 7 });
    }

    set({
      user,
      token,
      refreshToken: refreshToken || null,
      tokenExpiresIn: expiresIn || null,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    // Clear cookies
    Cookie.remove("access_token");
    Cookie.remove("refresh_token");
    Cookie.remove("user");
    Cookie.remove("token_expires_in");

    set({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresIn: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  syncUser: (partial) =>
    set((state) => {
      if (!state.user || !partial) return {};

      const merged = { ...state.user, ...partial };
      // Keep the cookie in step so a refresh does not lose the region
      try {
        Cookie.set("user", JSON.stringify(merged), { expires: 7 });
      } catch {
        // A serialisation failure must not break the session
      }
      return { user: merged };
    }),

  initializeAuth: () => {
    const state = useAuthStore.getState();

    // 👇 prevent multiple runs
    if (state.hasInitialized) return;

    try {
      const token = Cookie.get("access_token");
      const refreshToken = Cookie.get("refresh_token");
      const userJson = Cookie.get("user");
      const expiresInStr = Cookie.get("token_expires_in");

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        const expiresIn = expiresInStr ? parseInt(expiresInStr) : null;

        set({
          user,
          token,
          refreshToken: refreshToken || null,
          tokenExpiresIn: expiresIn,
          isAuthenticated: true,
          isLoading: false,
          hasInitialized: true,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          hasInitialized: true,
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        hasInitialized: true,
      });
    }
  },
}));
