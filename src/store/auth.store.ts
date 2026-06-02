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
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user }),

  setToken: (token) => set({ token }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  login: (user, token) => {
    // Store in cookies (persistent across browser sessions)
    Cookie.set("access_token", token, { expires: 7 });
    Cookie.set("user", JSON.stringify(user), { expires: 7 });

    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    // Clear cookies
    Cookie.remove("access_token");
    Cookie.remove("user");

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initializeAuth: () => {
    // Try to restore auth from cookies on app initialization
    try {
      const token = Cookie.get("access_token");
      const userJson = Cookie.get("user");

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to restore auth:", error);
      set({ isLoading: false });
    }
  },
}));
