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
    region?: BroadcastRegion;
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

export interface User {
  id: string;
  name: string;
  role: "ADMIN" | "OFFICER" | "STAFF" | "REGIONAL_ADMIN" | "LOADING_OFFICER";
  email?: string;
  // Staff region - absent for org-wide admins and for tokens issued before
  // the login response started returning it
  region?: BroadcastRegion;
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
/**
 * B-2 / B-1.2: how the ERP feed reconciles against what has been projected
 * into the application tables. `awaitingProjection > 0` means the projector is
 * behind and the local rows are an incomplete view of the ERP.
 */
export interface ErpReconciliation {
  /** "ERP" when a feed is attached, "LOCAL" when counts are local-only */
  source?: "ERP" | "LOCAL" | string | null;
  erpTotal?: number | null;
  vijuTotal?: number | null;
  syncedTotal?: number | null;
  awaitingProjection?: number | null;
  unmappedRegionCount?: number | null;
  lastSyncAt?: string | null;
}

export interface AdminDashboardStats {
  /** ERP-reconciled count - use this for the Total Customers tile */
  totalCustomers?: number | null;
  /** Locally known only; tracks syncedTotal until projection catches up */
  totalActiveCustomers?: number | null;
  customersWithoutOfficer?: number | null;
  totalOutstandingBalance?: number | null;
  activeOfficers?: number | null;
  openTickets?: number | null;
  unReadMessage?: number | null;
  lastErpSyncAt?: string | null;
  unmappedRegionCount?: number | null;
  erpReconciliation?: ErpReconciliation | null;
  byRegion?: Array<{
    region?: {
      name?: string | null;
      dist?: number | null;
    } | null;
    distributors?: number | null;
    walletBalance?: number | null;
    openTickets?: number | null;
    activeOfficers?: number | null;
  }> | null;
}

/**
 * B-2: GET /admin/erp/unmapped-customers
 * ERP rows whose BP_CLUSTER_CODE is not one of Viju's regions (1-5). They are
 * quarantined rather than persisted with a garbage region.
 */
export interface UnmappedCustomer {
  erpId?: string | null;
  name?: string | null;
  phone?: string | null;
  bpClusterCode?: string | null;
  bpClusterName?: string | null;
  lastSeenAt?: string | null;
}

/**
 * POST /uploads - the only folders the API accepts. Anything else is rejected
 * with "folder must be one of the following values: ...", so this is typed
 * rather than a bare string.
 */
export type UploadFolder =
  | "profile-photos"
  | "chat-attachments"
  | "ticket-attachments"
  | "waybill-documents"
  | "product-flyers"
  | "misc";

/** B-2: GET /admin/erp/sync-status - one row per ingest/projection job */
export interface ErpSyncJob {
  job?: string | null;
  status?: string | null;
  lastRunAt?: string | null;
  rowsFetched?: number | null;
  rowsProjected?: number | null;
  error?: string | null;
}

export interface ErpSyncStatus {
  available?: boolean | null;
  lastSyncAt?: string | null;
  jobs?: ErpSyncJob[] | null;
  customersByRegion?: Array<{
    region?: string | null;
    count?: number | null;
  }> | null;
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

/**
 * Officer dashboard tab filter (UI-level value)
 * Translated to the endpoint's boolean flags before the request is sent
 */
export type OfficerCustomerFilter = "all" | "activeTickets" | "overdue";

/**
 * Query params supported by GET /officers/customers
 */
export interface OfficerCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  overdue?: boolean;
  activeTickets?: boolean;
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
export type BroadcastRegion =
  | "LAGOS"
  | "EASTERN"
  | "SOUTH_SOUTH"
  | "WESTERN"
  | "NORTH";

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

export type BroadcastType = "REGIONAL" | "INDIVIDUAL";

/**
 * Broadcast record as returned by POST /admin/broadcasts/{regional,individual}
 */
export interface Broadcast {
  id: string;
  reference: string;
  type: BroadcastType;
  message: string;
  targetRegions: BroadcastRegion[];
  targetCustomerId: string | null;
  deliveryAllowance: number | null;
  allowancePaymentId: string | null;
  sentById: string;
  sentAt: string;
  deliveredCount: number;
  createdAt: string;
}

/**
 * Broadcast record with the relations the history/detail endpoints expand
 */
export interface BroadcastHistoryItem extends Broadcast {
  sentBy: {
    name: string;
    email: string;
  } | null;
  targetCustomer: {
    id: string;
    name: string;
  } | null;
}

export interface BroadcastHistoryResponse {
  data: BroadcastHistoryItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface BroadcastAllowancePayment {
  id: string;
  erpId: string | null;
  customerId: string;
  date: string;
  amount: number;
  reference: string;
  runningBalance: number;
  createdAt: string;
}

export interface BroadcastDetail extends BroadcastHistoryItem {
  allowancePayment?: BroadcastAllowancePayment | null;
}

// Notification Types
/**
 * Named AppNotification so it does not shadow the DOM `Notification` global
 */
export interface AppNotification {
  id: string;
  customerId: string | null;
  staffId: string | null;
  content: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export interface NotificationsResponse {
  unread: number;
  data: AppNotification[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface NotificationsParams {
  page?: number;
  pageSize?: number;
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
  createdAt?: string;
  /** AD-15 - null until the officer has logged in at least once */
  lastLoginAt?: string | null;
  _count?: {
    customers?: number;
    /** AD-15 - OPEN tickets across that officer's customers */
    supportTickets?: number;
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

/**
 * B-4.1: GET /admin/officers/{id}
 * `role` is "OFFICER" (not "ACCOUNT_OFFICER"). `distributors`/`openTickets`
 * are deprecated aliases of the _count fields - read _count.
 */
export interface OfficerDetail {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  region?: BroadcastRegion | null;
  role?: string | null;
  isActive?: boolean | null;
  /** null until the officer has logged in at least once - render "Never" */
  lastLoginAt?: string | null;
  createdAt?: string | null;
  _count?: {
    customers?: number;
    supportTickets?: number;
    chatThreads?: number;
  } | null;
  customers?: Array<{
    id: string;
    name?: string | null;
    erpId?: string | null;
    region?: BroadcastRegion | null;
  }> | null;
  /** @deprecated alias of _count.customers */
  distributors?: number | null;
  /** @deprecated alias of _count.supportTickets */
  openTickets?: number | null;
}

export interface CreateOfficerRequest {
  name: string;
  email: string;
  phone: string;
  region: BroadcastRegion;
  password: string;
}

// Customer with Officer Assignments
// Every field past `id` is optional: the ERP projector is still catching up, so
// a row can legitimately arrive with most values null.
export interface CustomerWithOfficers {
  id: string;
  name: string;
  erpId: string;
  phone: string;
  region?: BroadcastRegion | null;
  accountStatus?: string | null;
  outstandingBalance?: number | null;
  /** B-1.1: cartons paid for but not yet loaded, floored at 0 */
  stockBalanceCartons?: number | null;
  /** B-1.1: when the ERP last reported this customer; null when it has no row */
  lastSyncedAt?: string | null;
  /** B-1.1: mirrors the ?hasOfficer= filter so the column needs no lookup */
  hasOfficer?: boolean | null;
  assignedOfficerId?: string | null;
  createdAt?: string | null;
  _count?: {
    supportTickets?: number;
  };
  officerAssignments?: Array<{
    id?: string;
    isPrimary?: boolean;
    assignedAt?: string | null;
    staff?: {
      id: string;
      name: string;
      email?: string;
    } | null;
  }>;
}

/** Sortable columns accepted by GET /admin/customers (B-1.1) */
export type CustomerSortBy =
  | "name"
  | "erpId"
  | "region"
  | "outstandingBalance"
  | "supportTickets"
  | "createdAt";

export type SortOrder = "asc" | "desc";

/**
 * B-3: GET /admin/customers/{id}
 * Optional fields are returned as explicit null rather than omitted.
 * NOTE `address` is always null today - the ERP customer master has no address
 * field, so the UI must render that row only when it is non-null.
 */
export interface CustomerDetail {
  id: string;
  erpId?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  region?: BroadcastRegion | null;
  isActive?: boolean | null;
  accountStatus?: string | null;
  outstandingBalance?: number | null;
  stockBalanceCartons?: number | null;
  creditLimit?: number | null;
  officerAssignments?: Array<{
    id?: string;
    isPrimary?: boolean;
    assignedAt?: string | null;
    staff?: {
      id: string;
      name: string;
      email?: string | null;
    } | null;
  }> | null;
  _count?: {
    supportTickets?: number;
  } | null;
  lastErpSyncAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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

/**
 * PATCH /admin/customers/{id}/reassign
 * Moves a single customer to a new officer
 */
export interface ReassignCustomerResponse {
  message: string;
}

/**
 * PATCH /admin/officers/{id}/reassign-customers
 * Moves every customer of the source officer to a new officer
 */
export interface ReassignOfficerCustomersRequest {
  newOfficerId: string;
}

export interface ReassignOfficerCustomersResponse {
  reassigned: number;
  fromOfficerId: string;
  toOfficerId: string;
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

// Officer Customer Waybills Types
export interface Waybill {
  id: string;
  reference: string;
  customerId: string;
  region: BroadcastRegion;
  linkedPurchaseId: string;
  truckPlateNumber: string;
  driverName: string;
  driverPhone: string;
  requestedLoadingDate: string;
  quantityCartons: number;
  destination: string;
  termsAcceptedAt: string;
  externalFormUrl: string;
  status: string;
  assignedOfficerId: string;
  assignedAt: string;
  assignedById: string;
  loadingStartedAt?: string;
  completedAt?: string;
  waybillDocumentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaybillsResponse {
  data: Waybill[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Officer Tickets Types
export interface OfficerTicketCustomer {
  id: string;
  erpId: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface OfficerTicket {
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
  customer: OfficerTicketCustomer;
  repliesCount?: number;
}

export interface OfficerTicketsResponse {
  data: OfficerTicket[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TicketReply {
  id: string;
  ticketId: string;
  senderType: "CUSTOMER" | "STAFF";
  customerId?: string;
  staffId?: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface TicketCustomer {
  id: string;
  erpId: string;
  name: string;
  phone: string;
  email: string;
  profilePhotoUrl?: string;
  accountStatus: string;
  outstandingBalance: number;
  region: BroadcastRegion;
  failedLoginAttempts: number;
  lockedUntil?: string;
  assignedOfficerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketThread {
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
  replies: TicketReply[];
  customer: TicketCustomer;
}

export interface SendTicketReplyRequest {
  content: string;
  attachmentUrl?: string;
}

export interface TicketStatusUpdateRequest {
  status: string;
}

export interface TicketStatusUpdateResponse {
  id: string;
  status: string;
  updatedAt?: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  customerId: string;
  staffId: string;
  senderType: "STAFF" | "CUSTOMER";
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  readAt?: string | null;
}

export interface SendMessageRequest {
  content: string;
  attachmentUrl?: string;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
}

// Password Reset Types
export interface ForgotPasswordRequest {
  identifier: string;
}

export interface VerifyOTPRequest {
  identifier: string;
  code: string;
}

export interface VerifyOTPResponse {
  reset_token: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  newPassword: string;
}

/* ==========================================================================
 * Backend Implementation Handoff (v1.0, 20 Aug 2026)
 * Shapes for the endpoints the backend shipped. Every optional field is
 * marked optional and nullable where the handoff says it can be absent.
 * ========================================================================== */

/** Shared sort params - accepted by the four list endpoints (AO-05) */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * RA-03: GET /users/me. `region` is null for an org-wide ADMIN.
 * Fields beyond id/name/role are optional so an older token still parses.
 */
export interface CurrentUser {
  id: string;
  name: string;
  role: User["role"];
  type?: string;
  email?: string | null;
  phone?: string | null;
  region?: BroadcastRegion | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  profilePhotoUrl?: string | null;
}

/** AD-18: PATCH /admin/officers/{id} */
export interface UpdateOfficerRequest {
  isActive: boolean;
}

/**
 * 409 body when the officer still holds customers. Branch on `code`,
 * never on the message text.
 */
export interface OfficerHasCustomersError {
  message: string;
  code: "OFFICER_HAS_CUSTOMERS";
  assignedCustomers: number;
  statusCode: 409;
}

/**
 * AD-12: chat audit. A row is a THREAD, not a message.
 * `id` is "<customerId>:<officerId>" - encode before putting it in a URL.
 * customer / officer can be null if a record was deleted.
 */
export interface AuditChatMessage {
  id: string;
  senderType: "STAFF" | "CUSTOMER" | string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface AuditChatThread {
  id: string;
  customer: { id: string; name: string; region: BroadcastRegion } | null;
  officer: { id: string; name: string } | null;
  messageCount: number;
  lastMessageAt: string | null;
  /** Capped at the 200 most recent - messageCount is the true total */
  messages: AuditChatMessage[];
}

export interface AuditChatsListResponse {
  data: AuditChatThread[];
  meta: AuditTicketsListResponse["meta"];
}

/**
 * RA-06 / LO-02: loading request row. The regional list and the assign
 * response share this shape.
 *
 * NOTE the two orderId meanings flagged in the handoff:
 *   /loading/queue            -> orderId is the ERP order reference ("ORD-0099")
 *   /regional/loading-requests -> orderId is the internal purchase id, and the
 *                                 ERP reference lives in `reference`
 */
export interface LoadingRequest {
  id: string;
  waybill?: string | null;
  reference?: string | null;
  distributorName?: string | null;
  orderId?: string | null;
  truckPlateNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  quantityCartons?: number | null;
  loadingDate?: string | null;
  submittedAt?: string | null;
  region?: BroadcastRegion | null;
  status: LoadingRequestStatus | string;
  assignedOfficer?: { id: string; name: string } | null;
}

/** Vocabulary used by /loading/* and /regional/loading-requests */
export type LoadingRequestStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Separate vocabulary: the officer waybills tab
 * (/officers/customers/{id}/waybills) still returns the database spelling.
 * Do NOT share one enum across both.
 */
export type CustomerWaybillStatus =
  | "PENDING_ASSIGNMENT"
  | "LOADING_IN_PROGRESS"
  | "COMPLETED"
  | string;

export interface LoadingRequestsListResponse {
  data: LoadingRequest[];
  meta: AuditTicketsListResponse["meta"];
}

export interface AssignLoadingOfficerRequest {
  loadingOfficerId: string;
}

/** LO-03: assignment detail - a superset of the queue row */
export interface LoadingQueueDetail extends LoadingRequest {
  attachmentUrl?: string | null;
  updatedAt?: string | null;
}

/** LO-04: only these two are valid targets; ASSIGNED is a 400, not a 409 */
export interface UpdateLoadingStatusRequest {
  status: "IN_PROGRESS" | "COMPLETED";
}

/** LO-05: recording a waybill also COMPLETES the load */
export interface CreateWaybillRequest {
  truckPlateNumber: string;
  driverName: string;
  quantityCartons: number;
  attachmentUrl?: string;
}

export interface LoadingWaybill {
  id: string;
  waybillNumber?: string | null;
  loadingRequestId?: string | null;
  truckPlateNumber?: string | null;
  driverName?: string | null;
  quantityCartons?: number | null;
  attachmentUrl?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

/** CC-05: public contact form */
export interface ContactRequest {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

/**
 * AO-12: the live `type` enum is a CLOSED but LARGER set than the spec.
 * Treated as a string union with a fallback so an unknown value cannot break
 * the bell - always provide a default icon/route branch.
 */
export type NotificationType =
  | "CHAT_MESSAGE"
  | "TICKET_CREATED"
  | "TICKET_REPLY"
  | "TICKET_STATUS"
  | "ASSIGNMENT"
  | "WAYBILL_SUBMITTED"
  | "WAYBILL_ASSIGNED"
  | "WAYBILL_STATUS_CHANGED"
  | "WAYBILL_COMPLETED"
  | "BROADCAST";

/** AO-10 / CC-03: SSE frame payloads */
export interface RealtimeChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachmentUrl?: string | null;
  createdAt: string;
}

export interface RealtimeTicketUpdate {
  id: string;
  ticketId: string;
  status: string;
}

export interface RealtimeNotification {
  id: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
