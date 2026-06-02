/**
 * User Service
 * Handles all user-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { User } from "@/lib/api/types";

export const userService = {
  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get(endpoints.user.me);
    return data;
  },

  /**
   * Get user profile
   */
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get(endpoints.user.profile);
    return data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profile: Partial<User>): Promise<User> => {
    const { data } = await apiClient.put(endpoints.user.updateProfile, profile);
    return data;
  },
};
