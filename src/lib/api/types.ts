/**
 * API Response Types
 */

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  user: {
    id: string;
    name: string;
    role: "ADMIN" | "OFFICER" | "STAFF" | "REGIONAL_ADMIN";
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface ResetPasswordRequest {
  identifier: string;
  code: string;
  newPassword: string;
}

export interface User {
  id: string;
  name: string;
  role: "ADMIN" | "OFFICER" | "STAFF" | "REGIONAL_ADMIN";
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

// Dashboard Stats Types
export interface AdminDashboardStats {
  totalCustomers: number;
  unReadMessage: number;
  openTickets: number;
  totalOutstandingBalance: number;
}

export interface OfficerDashboardStats {
  totalDistributors: number;
  overdueBalances: number;
  openTickets: number;
  unreadMessages: number;
}

export interface RegionalDashboardStats {
  totalDistributors?: number;
  overdueBalances?: number;
  openTickets?: number;
  unreadMessages?: number;
}

export type DashboardStats =
  | AdminDashboardStats
  | OfficerDashboardStats
  | RegionalDashboardStats;

export interface LogoutRequest {
  refresh_token: string;
}

// Dashboard Table Data Types
export interface OfficerCustomer {
  id: string;
  name: string;
  accountNumber: string;
  phone: string;
  region: string;
  walletBalance: number;
  accountStatus: string;
  openTickets: number;
  lastPurchaseDate: string;
  lastContactDate: string;
}

export interface PendingLoadingRequest {
  id: string;
  reference: string;
  distributorName: string;
  orderId: string;
  loadingDate: string;
  truckPlateNumber: string;
  driverName: string;
  quantityCartons: number;
  status: string;
  submittedAt: string;
}

export interface RegionalAdminDashboardResponse {
  summary: {
    totalDistributors: number;
    openTickets: number;
    pendingWaybills: number;
    activeOfficers: number;
  };
  pendingLoadingRequests: PendingLoadingRequest[];
}
