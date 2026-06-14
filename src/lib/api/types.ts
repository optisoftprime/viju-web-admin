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
  totalOutstandingBalance: number;
  activeOfficers: number;
  openTickets: number;
  unReadMessage: number;
  byRegion: Array<{
    region: {
      name: string;
      dist: number;
    };
    distributors: number;
    walletBalance: number;
    openTickets: number;
    activeOfficers: number;
  }>;
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

// Broadcast Types
export type BroadcastRegion = "LAGOS" | "SOUTH_WEST" | "SOUTH_EAST" | "NORTH";

export interface BroadcastRegionalRequest {
  regions: BroadcastRegion[];
  message: string;
}

export interface BroadcastIndividualRequest {
  customerId: string;
  message: string;
  deliveryAllowance?: number;
}

export interface BroadcastHistoryFilters {
  type?: "REGIONAL" | "INDIVIDUAL";
  region?: BroadcastRegion;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface BroadcastHistoryItem {
  id: string;
  type: "REGIONAL" | "INDIVIDUAL";
  message: string;
  regions?: BroadcastRegion[];
  customerId?: string;
  distributorName?: string;
  deliveryAllowance?: number;
  sentBy: string;
  sentAt: string;
}

export interface BroadcastDetail {
  id: string;
  type: "REGIONAL" | "INDIVIDUAL";
  message: string;
  regions?: BroadcastRegion[];
  customerId?: string;
  distributorName?: string;
  deliveryAllowance?: number;
  sentBy: string;
  sentAt: string;
  status: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  erpId?: string;
  region?: BroadcastRegion;
  phone?: string;
  email?: string;
}

export interface CustomerListResponse {
  content: Customer[];
  number: number;
  totalPages: number;
  totalElements: number;
  size: number;
}
