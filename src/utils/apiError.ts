/**
 * API Error Handler
 */

import { AxiosError } from "axios";
import {
  ApiErrorResponse,
  DEACTIVATED_ACCOUNT_MESSAGE,
} from "@/lib/api/types";

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
    const message =
      (Array.isArray(response?.message)
        ? response?.message.filter(Boolean).join(". ")
        : response?.message) ||
      error.message ||
      "An error occurred";
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
 * The raw error body, whatever shape it arrived in.
 * Every admin route returns one of two: a pipe validation failure with a
 * `message` ARRAY, or a business rule with a `message` string plus a `code`.
 */
export const getErrorBody = (error: unknown): ApiErrorResponse | undefined => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  const body = axiosError?.response?.data;
  return body && typeof body === "object" ? body : undefined;
};

/**
 * Get user-friendly error message.
 *
 * Handles Array.isArray(body.message) before rendering, per the managed-user
 * handoff - a validation failure otherwise stringifies as "a,b,c".
 */
export const getErrorMessage = (error: unknown, fallback = ""): string => {
  const message = getErrorBody(error)?.message;

  if (Array.isArray(message)) {
    return message.filter(Boolean).join(". ") || fallback;
  }
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }
  return fallback;
};

/**
 * Every validation message as a list, for rendering inline under a form.
 * A business-rule error yields a single-entry list.
 */
export const getErrorMessages = (error: unknown): string[] => {
  const message = getErrorBody(error)?.message;
  if (Array.isArray(message)) return message.filter(Boolean);
  return typeof message === "string" && message.trim() ? [message.trim()] : [];
};

/**
 * The business-rule code, e.g. EMAIL_IN_USE or OFFICER_HAS_CUSTOMERS.
 * Branch on this, never on the message text.
 */
export const getErrorCode = (error: unknown): string | undefined =>
  getErrorBody(error)?.code;

/** The input the API wants highlighted, when it names one */
export const getErrorField = (error: unknown): string | undefined =>
  getErrorBody(error)?.field;

/** HTTP status, when the failure reached the server at all */
export const getErrorStatus = (error: unknown): number | undefined =>
  (error as AxiosError)?.response?.status;

/**
 * Business-rule codes the 22 Aug 2026 backend handoff introduced or
 * formalised. Every error body is `{ message, code, statusCode }` - branch on
 * the code, never on the message text.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CUSTOMER_NOT_FOUND: "CUSTOMER_NOT_FOUND",
  OFFICER_NOT_FOUND: "OFFICER_NOT_FOUND",
  /** Re-sending the officer a customer already holds as primary - a no-op */
  ALREADY_ASSIGNED: "ALREADY_ASSIGNED",
  /** A REGIONAL_ADMIN sent `region` on a route that derives it from the token */
  REGION_NOT_ALLOWED: "REGION_NOT_ALLOWED",
  /** A REGIONAL_ADMIN whose staff record carries no region at all */
  REGION_NOT_SET: "REGION_NOT_SET",
} as const;

/**
 * RA-07: the 403 messages GET /regional/customers answers with.
 *
 * That route's error body is `{ message, error, statusCode }` with no `code`,
 * so these three are told apart by their message text - the frontend guide
 * names them verbatim. They mean three different things to the operator:
 * a region-scope mistake, an unconfigured account, and a wrong-role token.
 */
export const REGION_SCOPE_MESSAGES = {
  /** A REGIONAL_ADMIN sent a `region` that is not theirs. Fix: stop sending it */
  OUTSIDE_REGION: "You cannot access data outside your assigned region.",
  /** The caller's staff record carries no region - a configuration problem */
  REGION_NOT_SET: "Your account has no region assigned. Contact admin.",
  /** An ADMIN called a regional route without naming a region */
  ADMIN_REGION_REQUIRED: "Admin must specify ?region= for regional endpoints.",
  /** The role gate refused the token outright */
  ROLE_FORBIDDEN: "You do not have permission to perform this action.",
} as const;

/** Case- and whitespace-insensitive match against one of the messages above */
const messageIs = (error: unknown, expected: string): boolean =>
  getErrorMessage(error).trim().toLowerCase() === expected.toLowerCase();

/**
 * True for the misconfigured-account 403 a region-scoped route answers when
 * the signed-in regional admin has no region on their staff record.
 *
 * It reads as an empty screen otherwise, so every region-scoped list branches
 * on this and says "no region is set on your account" rather than
 * "no results".
 *
 * /admin/customers carries the REGION_NOT_SET code; /regional/customers sends
 * the message only, so both are accepted.
 */
export const isRegionNotSetError = (error: unknown): boolean =>
  getErrorCode(error) === ERROR_CODES.REGION_NOT_SET ||
  messageIs(error, REGION_SCOPE_MESSAGES.REGION_NOT_SET);

/**
 * True when a REGIONAL_ADMIN asked for a region that is not their own. On
 * /regional/customers this can only happen if a shared query builder attached
 * `region` - the fix is to stop sending it, not to retry.
 */
export const isOutsideRegionError = (error: unknown): boolean =>
  getErrorCode(error) === ERROR_CODES.REGION_NOT_ALLOWED ||
  messageIs(error, REGION_SCOPE_MESSAGES.OUTSIDE_REGION);

/**
 * True when an ADMIN called a regional route without `region`. An admin has no
 * home region, so on these routes they must name the one they are previewing.
 */
export const isAdminRegionRequiredError = (error: unknown): boolean =>
  messageIs(error, REGION_SCOPE_MESSAGES.ADMIN_REGION_REQUIRED);

/**
 * True when the role gate refused the token - i.e. the wrong token for this
 * route, not a region problem.
 */
export const isRoleForbiddenError = (error: unknown): boolean =>
  getErrorStatus(error) === 403 &&
  messageIs(error, REGION_SCOPE_MESSAGES.ROLE_FORBIDDEN);

/**
 * True when the customer already holds the officer being assigned. The API
 * refuses it with a 409 rather than quietly succeeding; the UI treats it as a
 * no-op, not a failure.
 */
export const isAlreadyAssignedError = (error: unknown): boolean =>
  getErrorCode(error) === ERROR_CODES.ALREADY_ASSIGNED;

/**
 * True once an admin has deactivated the signed-in account. The same message
 * arrives as a 401 on any authenticated request and as a 403 on
 * POST /auth/refresh, so the status alone is not enough to tell them apart
 * from an ordinary expiry.
 */
export const isDeactivatedAccountError = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  if (status !== 401 && status !== 403) return false;
  return getErrorMessage(error) === DEACTIVATED_ACCOUNT_MESSAGE;
};

// const apiError = parseApiError(error);
// switch (apiError.statusCode) {
//   case 401:
//     return "Unauthorized. Please login again.";
//   case 403:
//     return "You do not have permission to perform this action.";
//   case 404:
//     return "Resource not found.";
//   case 422:
//     return apiError.message || "Validation error. Please check your input.";
//   case 500:
//     return "Server error. Please try again later.";
//   default:
//     return apiError.message || "An error occurred";
// }
