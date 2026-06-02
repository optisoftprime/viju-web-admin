/**
 * Auth Service
 * Handles all authentication API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { AuthResponse, LoginCredentials } from "@/lib/api/types";

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log({ credentials });
    try {
      const { data } = await apiClient.post(endpoints.auth.login, credentials);
      return data;
    } catch (error) {
      console.log({ error });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post(endpoints.auth.logout);
    } catch (error) {
      console.log({ error });
      throw error;
    }
  },

  /**
   * Refresh authentication token
   */
  refresh: async (): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post(endpoints.auth.refresh);
      return data;
    } catch (error) {
      console.log({ error });
      throw error;
    }
  },
};
