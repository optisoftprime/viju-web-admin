/**
 * Auth Hooks - React Query
 * Reusable hooks for authentication operations
 */

"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/auth.store";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  LoginCredentials,
  AuthResponse,
  User,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyOTPRequest,
  VerifyOTPResponse,
} from "@/lib/api/types";
import { getErrorMessage } from "@/utils/apiError";

/**
 * Login Mutation Hook
 */
export const useLogin = () => {
  const router = useRouter();
  const { login: setAuthData } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      // Save user and token to store (including refresh token if provided)
      setAuthData(
        data.user,
        data.access_token,
        data.refresh_token,
        data.expires_in,
      );
      // Show success toast
      toast.success(`Welcome back, ${data?.user?.name}!`);
      // Redirect to dashboard
      router.push("/dashboard");
    },
    onError: async (error: unknown, payload: LoginCredentials) => {
      const loginTwo = await authService.loginTwo({
        username: payload.email,
        code: payload.password,
      });

      if (loginTwo) {
        // Save user and token to store (including refresh token if provided)
        setAuthData(
          loginTwo.user,
          loginTwo.access_token,
          loginTwo.refresh_token,
          loginTwo.expires_in,
        );
        // Show success toast
        toast.success(`Welcome back, ${loginTwo?.user?.name}!`);
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage);
        console.log("Login failed:", error);
      }
    },
  });
};

/**
 * Logout Mutation Hook
 */
export const useLogout = () => {
  const router = useRouter();
  const { logout: clearAuthData, refreshToken } = useAuthStore();

  return useMutation({
    mutationFn: () => {
      // Use refresh token from store, or empty string if not available
      return authService.logout(refreshToken || "");
    },
    onSuccess: () => {
      clearAuthData();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    },
    onError: (error: unknown) => {
      // Even if logout fails, clear auth data locally
      clearAuthData();
      const errorMessage = getErrorMessage(error);
      console.log("Logout failed:", error);
      router.push("/auth/login");
    },
  });
};

/**
 * Forgot Password Mutation Hook
 */
export const useForgotPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      authService.forgotPassword(payload),
    onSuccess: () => {
      toast.success("Password reset code sent to your email");
      // Redirect to OTP page
      router.push("/auth/otp");
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      console.log("Forgot password failed:", error);
    },
  });
};

/**
 * Verify OTP Mutation Hook
 */
export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: (payload: VerifyOTPRequest): Promise<VerifyOTPResponse> =>
      authService.verifyOTP(payload),
    onSuccess: () => {
      toast.success("OTP verified successfully");
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      console.log("OTP verification failed:", error);
    },
  });
};

/**
 * Reset Password Mutation Hook
 */
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authService.resetPassword(payload),
    onSuccess: () => {
      toast.success("Password reset successfully");
      // Redirect to login page
      router.push("/auth/login");
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      console.log("Password reset failed:", error);
    },
  });
};

/**
 * Get Current User Query Hook
 */
export const useCurrentUser = () => {
  const { user: storedUser } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: userService.getCurrentUser,
    enabled: !!storedUser, // Only run if user is logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get User Profile Query Hook
 */
export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.users.profile,
    queryFn: userService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
