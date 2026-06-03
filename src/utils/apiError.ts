/**
 * API Error Handler
 */

import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/lib/api/types";

export class ApiError extends Error {
  public statusCode?: number;
  public errors?: Record<string, string>;

  constructor(
    message: string,
    statusCode?: number,
    errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Parse Axios error into a user-friendly message
 */
export const parseApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse | undefined;
    const message = response?.message || error.message || "An error occurred";
    const statusCode = error.response?.status;
    const errors = response?.errors;

    return new ApiError(message, statusCode, errors);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("An unexpected error occurred");
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  const apiError = parseApiError(error);

  switch (apiError.statusCode) {
    case 401:
      return "Unauthorized. Please login again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "Resource not found.";
    case 422:
      return apiError.message || "Validation error. Please check your input.";
    case 500:
      return "Server error. Please try again later.";
    default:
      return apiError.message || "An error occurred";
  }
};
