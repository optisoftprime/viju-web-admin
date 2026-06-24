/**
 * Auth Service
 * Handles all authentication API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  AuthResponse,
  LoginCredentials,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  LoginTwoCredentials,
  VerifyOTPRequest,
  VerifyOTPResponse,
} from "@/lib/api/types";

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post(endpoints.auth.login, credentials);
      return data;
    } catch (error) {
      console.log({ error });
      throw error;
    }
  },

  /**
   * Login 2 with username and passcode for account officer
   */
  loginTwo: async (credentials: LoginTwoCredentials): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post(
        endpoints.auth.loginTwo,
        credentials,
      );
      return data;
    } catch (error) {
      console.log({ error });
      throw error;
    }
  },

  /**
   * Logout user with refresh token
   */
  logout: async (refreshToken: string): Promise<void> => {
    try {
      const payload: LogoutRequest = { refresh_token: refreshToken };
      await apiClient.post(endpoints.auth.logout, payload);
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

  /**
   * Request password reset with email/identifier
   */
  forgotPassword: async (
    payload: ForgotPasswordRequest,
  ): Promise<{ message: string }> => {
    try {
      const { data } = await apiClient.post(
        endpoints.auth.forgotPassword,
        payload,
      );
      return data;
    } catch (error) {
      console.log({ error });
      throw error;
    }
  },

  /**
   * Verify OTP code and get reset token
   */
  verifyOTP: async (payload: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    try {
      const { data } = await apiClient.post(endpoints.auth.verifyOTP, payload);
      return data;
    } catch (error) {
      console.log({ error });
      throw error;
    }
  },

  /**
   * Confirm password reset with OTP and new password
   */
  resetPassword: async (
    payload: ResetPasswordRequest,
  ): Promise<{ message: string }> => {
    try {
      const { data } = await apiClient.post(
        endpoints.auth.resetPassword,
        payload,
      );
      return data;
    } catch (error) {
      console.log({ error });
      throw error;
    }
  },
};
