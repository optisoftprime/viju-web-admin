/**
 * Auth Hooks - React Query
 * Reusable hooks for authentication operations
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { chatService } from "@/services/chat.service";
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
  ChangePasswordRequest,
} from "@/lib/api/types";
import { getErrorMessage, getErrorStatus } from "@/utils/apiError";

/**
 * Login Mutation Hook
 *
 * One form, one request. POST /auth/staff/web-login still takes
 * { username, code } - the KEYS did not change - but for the four managed
 * roles those now carry an email address and a password. The same route
 * still serves an ERP WAREHOUSE_OFFICER; the backend decides which path to
 * take from the account it finds.
 *
 * There is deliberately no second attempt on failure: a wrong password can no
 * longer fall through to the ERP, so retrying only turns one clear error into
 * a confusing one.
 */
export const useLogin = () => {
  const router = useRouter();
  const { login: setAuthData } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.loginTwo({
        username: credentials.email.trim(),
        code: credentials.password,
      }),
    onSuccess: (data: AuthResponse) => {
      setAuthData(
        data.user as User,
        data.access_token,
        data.refresh_token,
        data.expires_in,
      );
      toast.success(`Welcome back, ${data?.user?.name}!`);
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      // The API's wording is written for the user - 403 "deactivated",
      // 401 "no account exists", 401 "no password yet" all need to reach them
      // verbatim. The form renders it inline; the toast is the echo.
      toast.error(getLoginErrorMessage(error));
    },
  });
};

/**
 * Turns a failed sign-in into the message to show.
 *
 * Every documented failure carries wording meant to be rendered as-is; only a
 * transport failure with no body needs one of our own.
 */
export const getLoginErrorMessage = (error: unknown): string => {
  const message = getErrorMessage(error);
  if (message) {
    // Soften only the generic credential rejection, which is written in the
    // API's own vocabulary ("username or code") rather than the user's.
    return message === "Invalid username or code."
      ? "Incorrect email or password."
      : message;
  }

  return getErrorStatus(error)
    ? "Could not sign you in. Please try again."
    : "Could not reach the server. Check your connection and try again.";
};

/**
 * True for the account that exists but has never had a local password - the
 * login screen surfaces the "Forgot password" link prominently for it.
 */
export const isPasswordNotSetError = (error: unknown): boolean =>
  getErrorMessage(error).startsWith("This account has no password yet.");

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
      toast.error(errorMessage || "Failed to logout");
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
 * Spec 42 (PR-1): upload and set the signed-in user's profile photo.
 *
 * The new URL is folded straight into the session, so the avatar in the
 * navbar and anywhere else reading `user.profilePhotoUrl` changes immediately
 * rather than on the next sign-in.
 */
export const useUpdateProfilePhoto = () => {
  const queryClient = useQueryClient();
  const { syncUser } = useAuthStore();

  return useMutation({
    mutationFn: async (file: File) => {
      // Reuses the shared upload pipeline; `readUploadedUrl` rejects the
      // placeholder:// URL a storage outage returns with a 2xx
      const url = await chatService.uploadFile(file, "profile-photos");
      return userService.updateProfilePhoto(url);
    },
    onSuccess: (profile) => {
      const photo = profile?.profilePhotoUrl;
      if (photo) syncUser({ profilePhotoUrl: photo });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile });
    },
    // No toast: the profile form renders the failure inline, next to the
    // control that caused it
  });
};

/**
 * Spec 42 (PR-2): change your own password with the current one as proof.
 *
 * Deliberately NOT toasted either - `INVALID_CURRENT_PASSWORD` belongs on the
 * current-password field, where the person can see which box to correct.
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (request: ChangePasswordRequest) =>
      userService.changePassword(request),
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
