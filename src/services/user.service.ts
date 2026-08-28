/**
 * User Service
 * Handles all user-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  User,
  CurrentUser,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdateProfilePhotoRequest,
} from "@/lib/api/types";

export const userService = {
  /**
   * Get current authenticated user (RA-03).
   * Now carries `region` - the region this user's data is scoped to.
   * region is null for an org-wide ADMIN.
   */
  getCurrentUser: async (): Promise<CurrentUser> => {
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

  /**
   * Spec 42 (PR-1): set the signed-in user's own profile photo.
   *
   * Two steps on purpose - POST /uploads first, then this with the URL it
   * returned. That reuses the upload pipeline (and its Cloudinary handling)
   * rather than adding a second multipart route, and it means a failed save
   * leaves an orphaned upload rather than a half-written profile.
   *
   * Answers the refreshed profile, so the caller can fold the new photo into
   * the session without a second read.
   */
  updateProfilePhoto: async (profilePhotoUrl: string): Promise<CurrentUser> => {
    const body: UpdateProfilePhotoRequest = { profilePhotoUrl };
    const { data } = await apiClient.patch(endpoints.user.photo, body);
    return data;
  },

  /**
   * Spec 42 (PR-2): change your own password.
   *
   * The current password is proof of identity, so it is REQUIRED - this is not
   * the forgot-password flow, which proves control of an inbox instead. The
   * server compares it against the stored hash and answers 400
   * INVALID_CURRENT_PASSWORD when it does not match; that is a field error on
   * the current-password input, never a toast.
   */
  changePassword: async (
    request: ChangePasswordRequest,
  ): Promise<ChangePasswordResponse> => {
    const { data } = await apiClient.patch(endpoints.user.changePassword, {
      currentPassword: request.currentPassword,
      newPassword: request.newPassword,
    });
    return data ?? {};
  },
};
