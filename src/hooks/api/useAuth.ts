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
import { LoginCredentials, AuthResponse, User } from "@/lib/api/types";
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
      // Save user and token to store
      setAuthData(data.user, data.access_token);
      // Show success toast
      toast.success(`Welcome back, ${data.user.name}!`);
      // Redirect to dashboard
      router.push("/dashboard");
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      console.error("Login failed:", error);
    },
  });
};

/**
 * Logout Mutation Hook
 */
export const useLogout = () => {
  const router = useRouter();
  const { logout: clearAuthData } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuthData();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      console.error("Logout failed:", error);
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
