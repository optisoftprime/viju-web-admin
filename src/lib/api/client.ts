/**
 * Centralized Axios Instance
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import Cookie from "js-cookie";
import { DEACTIVATED_ACCOUNT_MESSAGE } from "./types";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Where the login screen picks up the reason a session ended.
 * sessionStorage rather than a query param so the message cannot be forged
 * into the URL, and so it clears itself when the tab closes.
 */
export const SESSION_ENDED_KEY = "viju:session-ended-message";

/** Clears every trace of the session. Safe to call more than once. */
const clearSession = () => {
  Cookie.remove("access_token");
  Cookie.remove("refresh_token");
  Cookie.remove("user");
  Cookie.remove("token_expires_in");
};

/**
 * Ends the session and sends the user to login with a reason to render.
 *
 * Guarded against re-entry: a page with several requests in flight will fail
 * them all at once, and without this each one would trigger its own redirect.
 */
let isTerminating = false;
const terminateSession = (message?: string) => {
  if (typeof window === "undefined") return;

  clearSession();

  if (isTerminating) return;
  isTerminating = true;

  try {
    if (message) window.sessionStorage.setItem(SESSION_ENDED_KEY, message);
  } catch {
    // A blocked sessionStorage must not stop the redirect
  }

  window.location.href = "/auth/login";
};

/**
 * True once an admin has deactivated this account.
 *
 * The same message arrives as a 401 on any authenticated request and as a 403
 * on POST /auth/refresh, and the access token stops working on the very next
 * request rather than at the end of its lifetime. Refreshing is pointless in
 * both cases - the refresh tokens were revoked in the same transaction.
 */
const isDeactivated = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status !== 401 && status !== 403) return false;

  const message = (error.response?.data as { message?: unknown })?.message;
  return (
    (typeof message === "string" ? message.trim() : "") ===
    DEACTIVATED_ACCOUNT_MESSAGE
  );
};

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
    // 403 on /auth/refresh with the deactivation message: the admin revoked
    // every refresh token, so there is nothing left to retry.
    if (isDeactivated(error)) {
      terminateSession(DEACTIVATED_ACCOUNT_MESSAGE);
      return null;
    }

    if (
      axios.isAxiosError(error) &&
      error?.response?.data?.message === "Invalid or expired refresh token."
    ) {
      terminateSession();
    }

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

      /**
       * FormData must not inherit this instance's default JSON content type.
       *
       * axios decides how to serialise the body from the Content-Type header:
       *
       *   if (isFormData) return hasJSONContentType
       *     ? JSON.stringify(formDataToJSON(data))   // <- silently destroys it
       *     : data;
       *
       * With "application/json" set as an instance default, every FormData is
       * flattened to a plain object and stringified - a File becomes `{}` and
       * the server replies "No file provided". Clearing the header lets the
       * browser set "multipart/form-data" with the boundary the parser needs.
       */
      if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        delete config.headers["Content-Type"];
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

      /**
       * Deactivated account (managed-user handoff, section 7).
       *
       * The admin's PATCH revoked every refresh token in the same
       * transaction, so the still-unexpired access token stops working on the
       * very next request. Refreshing cannot succeed - end the session and
       * put the API's own wording on the login screen rather than a generic
       * "session expired", which would send the user round a retry loop.
       */
      if (isDeactivated(error)) {
        terminateSession(DEACTIVATED_ACCOUNT_MESSAGE);
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized - Try to refresh token
      if (statusCode === 401 && !originalRequest?._retry) {
        originalRequest._retry = true;

        // Collapse concurrent 401s onto a single refresh
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken().then((newToken) => {
            isRefreshing = false;
            refreshPromise = null;
            return newToken;
          });
        }

        try {
          const newToken = await refreshPromise;

          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }

          // Refresh failed and did not already redirect - end the session
          if (Cookie.get("access_token")) {
            terminateSession();
          }
          return Promise.reject(error);
        } catch (refreshError) {
          if (Cookie.get("access_token")) {
            terminateSession();
          }
          return Promise.reject(refreshError);
        }
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
