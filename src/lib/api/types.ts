/**
 * API Response Types
 */

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    role: "ADMIN" | "OFFICER" | "STAFF";
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  role: "ADMIN" | "OFFICER" | "STAFF";
  email?: string;
}

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string>;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
