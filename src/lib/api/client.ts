/**
 * Centralized Axios Instance
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import Cookie from "js-cookie";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

/**
 * Create and configure the Axios instance
 */
export const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      //   Accept: "application/json",
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
    (error) => {
      const statusCode = error.response?.status;

      // Handle 401 Unauthorized
      if (statusCode === 401) {
        // Clear token and redirect to login
        Cookie.remove("access_token");
        Cookie.remove("user");

        // Redirect to login page if not already there
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }

      // Handle 403 Forbidden
      if (statusCode === 403) {
        console.error("Access forbidden");
      }

      // Log errors in development mode
      if (process.env.NODE_ENV === "development") {
        console.error("API Error:", {
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
