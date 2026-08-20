/**
 * API Endpoints
 */

export const endpoints = {
  auth: {
    login: "/auth/staff/login",
    loginTwo: "/auth/staff/web-login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    forgotPassword: "/auth/staff/password-reset/request",
    verifyOTP: "/auth/staff/password-reset/verify-otp",
    resetPassword: "/auth/staff/password-reset/reset",
  },
  user: {
    me: "/users/me",
    profile: "/users/profile",
    updateProfile: "/users/profile",
  },
  dashboard: {
    adminDashboard: "/admin/dashboard",
    officerDashboard: "/officers/dashboard",
    regionalDashboard: "/regional/dashboard",
    officerCustomers: "/officers/customers",
  },
  broadcasts: {
    sendRegional: "/admin/broadcasts/regional",
    sendIndividual: "/admin/broadcasts/individual",
    history: "/admin/broadcasts/history",
    detail: "/admin/broadcasts",
  },
  customers: {
    list: "/admin/customers",
    // B-3: ERP-parity detail for a single customer
    detail: "/admin/customers/{id}",
    reassign: "/admin/customers/{id}/reassign",
    export: "/admin/customers/export.csv",
  },
  audits: {
    tickets: "/admin/audit/tickets",
    export: "/admin/audit/tickets/export.csv",
    // AD-12: chat audit, one row per THREAD
    chats: "/admin/audit/chats",
    chatsExport: "/admin/audit/chats/export.csv",
  },
  officers: {
    list: "/admin/officers",
    create: "/admin/officers",
    // B-4.1: officer profile, readable by a regional admin in their own region
    detail: "/admin/officers/{id}",
    reassignCustomers: "/admin/officers/{id}/reassign-customers",
    // AD-18: deactivate / reactivate
    update: "/admin/officers/{id}",
  },
  flyers: {
    list: "/admin/product-flyers",
    create: "/admin/product-flyers",
    update: "/admin/product-flyers/{id}",
    delete: "/admin/product-flyers/{id}",
  },
  officerCustomers: {
    overview: "/officers/customers/{id}/overview",
    orders: "/officers/customers/{id}/orders",
    invoices: "/officers/customers/{id}/invoices",
    stock: "/officers/customers/{id}/stock",
    waybills: "/officers/customers/{id}/waybills",
    tickets: "/tickets/{id}",
    list: "/tickets/officer",
    sendReply: "/tickets/{id}/replies",
    status: "/tickets/{id}/status",
  },
  chat: {
    history: "/chat/{otherUserId}",
    sendMessage: "/chat/{receiverId}",
  },
  notifications: {
    list: "/notifications/me",
    readAll: "/notifications/me/read-all",
    read: "/notifications/{id}/read",
  },
  uploads: {
    file: "/uploads",
  },
  // AO-10 / CC-03: server-sent events (SSE, not WebSocket)
  realtime: {
    stream: "/realtime/stream",
  },
  // RA-06: regional loading requests
  regional: {
    loadingRequests: "/regional/loading-requests",
    assignLoadingRequest: "/regional/loading-requests/{id}/assign",
  },
  // LO-02..LO-05: loading / warehouse officer queue
  loading: {
    queue: "/loading/queue",
    detail: "/loading/queue/{id}",
    status: "/loading/queue/{id}/status",
    waybill: "/loading/queue/{id}/waybill",
  },
  // B-2: ERP data-quality surfaces
  erp: {
    unmappedCustomers: "/admin/erp/unmapped-customers",
    syncStatus: "/admin/erp/sync-status",
  },
  // CC-05: public contact form
  contact: {
    submit: "/contact",
  },
};
