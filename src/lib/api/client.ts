/**
 * Centralized Axios Instance
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import Cookie from "js-cookie";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Track if we're already refreshing to avoid multiple refresh requests
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using refresh token
 */
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = Cookie.get("refresh_token");

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // Create a new axios instance for refresh to avoid interceptor recursion
    const refreshInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await refreshInstance.post("/auth/refresh", {
      refresh_token: refreshToken,
    });

    const newAccessToken = response.data.access_token;

    // Update the stored token
    if (newAccessToken) {
      Cookie.set("access_token", newAccessToken, { expires: 1 });
      if (response.data.refresh_token) {
        Cookie.set("refresh_token", response.data.refresh_token, {
          expires: 30,
        });
      }
    }

    return newAccessToken;
  } catch (error) {
    console.log("Failed to refresh token:", error);
    return null;
  }
};

/**
 * Create and configure the Axios instance
 */
export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    timeout: 30000,
  });

  // Request Interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = Cookie.get("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const statusCode = error.response?.status;
      const originalRequest = error.config;

      // Handle 401 Unauthorized - Try to refresh token
      if (statusCode === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // If already refreshing, wait for it to complete
        if (isRefreshing) {
          return refreshPromise?.then((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            } else {
              // Refresh failed, redirect to login
              if (
                statusCode === 401 &&
                !originalRequest._retry &&
                Cookie.get("access_token")
              ) {
                Cookie.remove("access_token");
                Cookie.remove("refresh_token");
                Cookie.remove("user");
                window.location.href = "/auth/login";
              }
              return Promise.reject(error);
            }
          });
        }

        // Start refreshing
        isRefreshing = true;
        refreshPromise = refreshAccessToken().then((newToken) => {
          isRefreshing = false;
          refreshPromise = null;
          return newToken;
        });

        try {
          const newToken = await refreshPromise;

          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } else {
            // Refresh failed, redirect to login
            if (
              statusCode === 401 &&
              !originalRequest._retry &&
              Cookie.get("access_token")
            ) {
              Cookie.remove("access_token");
              Cookie.remove("refresh_token");
              Cookie.remove("user");
              window.location.href = "/auth/login";
            }
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          if (
            statusCode === 401 &&
            !originalRequest._retry &&
            Cookie.get("access_token")
          ) {
            Cookie.remove("access_token");
            Cookie.remove("refresh_token");
            Cookie.remove("user");
            window.location.href = "/auth/login";
          }
          return Promise.reject(refreshError);
        }
      }

      // Handle 403 Forbidden
      if (statusCode === 403) {
        console.log("Access forbidden");
      }

      // Log errors in development mode
      if (process.env.NODE_ENV === "development") {
        console.log("API Error:", {
          status: statusCode,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
        });
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

export const apiClient = createAxiosInstance();
