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

export interface LoginTwoCredentials {
  username: string;
  code: string;
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

// Audit Types
export interface AuditTicketReply {
  id: string;
  ticketId: string;
  senderType: "STAFF" | "CUSTOMER";
  customerId?: string;
  staffId?: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  staff?: {
    id: string;
    name: string;
  };
}

export interface AuditTicketCustomer {
  id: string;
  name: string;
  region: BroadcastRegion;
}

export interface AuditTicket {
  id: string;
  ticketId: string;
  customerId: string;
  category: string;
  subject: string;
  description: string;
  attachmentUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: AuditTicketCustomer;
  replies: AuditTicketReply[];
}

export interface AuditTicketsListResponse {
  data: AuditTicket[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Officer Types
export interface Officer {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: BroadcastRegion;
  isActive: boolean;
  _count?: {
    customers: number;
  };
}

export interface OfficersListResponse {
  data: Officer[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateOfficerRequest {
  name: string;
  email: string;
  phone: string;
  region: BroadcastRegion;
  password: string;
}

// Customer with Officer Assignments
export interface CustomerWithOfficers {
  id: string;
  name: string;
  erpId: string;
  phone: string;
  region: BroadcastRegion;
  accountStatus: string;
  outstandingBalance: number;
  _count?: {
    supportTickets: number;
  };
  officerAssignments?: Array<{
    staff: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface CustomersListResponse {
  data: CustomerWithOfficers[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ReassignCustomerRequest {
  newOfficerId: string;
}

// Flyer Types
export interface Flyer {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlyerRequest {
  name: string;
  imageUrl: string;
}

export interface UpdateFlyerRequest {
  name?: string;
  imageUrl?: string;
  isActive?: boolean;
}

// Officer Customer Overview Types
export interface AssignedOfficer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface DistributorOverview {
  id: string;
  name: string;
  accountNumber: string;
  phone: string;
  email: string | null;
  region: BroadcastRegion;
  accountStatus: string;
  walletBalance: number;
  assignedOfficers: AssignedOfficer[];
  lastUpdated: string;
}

// Officer Customer Orders Types
export interface OrderItem {
  id: string;
  purchaseId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  erpId: string;
  customerId: string;
  orderDate: string;
  totalItems: number;
  totalValue: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Officer Customer Invoices Types
export interface PaymentHistory {
  id: string;
  erpId: string;
  customerId: string;
  date: string;
  amount: number;
  reference: string;
  runningBalance: number;
  createdAt: string;
}

export interface InvoicesResponse {
  walletBalance: number;
  invoices: Order[];
  paymentHistory: PaymentHistory[];
}

// Officer Customer Stock Types
export interface StockCatalogue {
  id: string;
  erpId: string;
  productName: string;
  quantity: number;
  updatedAt: string;
}

export interface AwaitingLoading {
  productName: string;
  reserved: number;
  loaded: number;
  remaining: number;
}

export interface StockResponse {
  catalogue: StockCatalogue[];
  awaitingLoading: AwaitingLoading[];
}
