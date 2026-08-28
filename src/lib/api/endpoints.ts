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
    /**
     * Spec 42 (PR-1): the signed-in staff member's own profile photo.
     * Body carries the URL returned by POST /uploads.
     */
    photo: "/users/profile/photo",
    /**
     * Spec 42 (PR-2): change your own password by supplying the current one.
     *
     * Deliberately NOT the forgot-password flow - that proves control of an
     * inbox, this proves knowledge of the password, and they answer different
     * questions. The server compares `currentPassword` against the stored hash
     * before writing the new one.
     */
    changePassword: "/users/profile/password",
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
    /**
     * Spec 39 (C-2): assign one officer to many customers in one call.
     * Per-customer results, no surrounding transaction. A customer that
     * already held the officer comes back in `succeeded`.
     */
    bulkReassign: "/admin/customers/bulk-reassign",
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
    // AD-18: deactivate / reactivate, and (spec 39) edit name / phone /
    // region / password on the same route
    update: "/admin/officers/{id}",
    /**
     * Spec 39 (O-2): move a batch of officers to another region in one call.
     * Per-officer results, no surrounding transaction - nine moved and one
     * failed leaves nine moved. Duplicates collapsed; max 500 per call.
     */
    bulkRegion: "/admin/officers/bulk-region",
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
    /**
     * C-1: clear a customer's unread messages for staff WITHOUT pulling the
     * thread. Fetching the history already marks it read, so this is only
     * needed to drop the count from a list, or to drop it instantly rather
     * than waiting on the thread request. Idempotent.
     */
    markRead: "/chat/{customerId}/read",
    /**
     * Spec 41 (CH-3): the signed-in officer's CONVERSATIONS - one row per
     * thread, ordered by recency across their whole portfolio, then paged.
     *
     * A different resource from "my customers": it returns only accounts with
     * a thread, and carries only what a conversation list renders, so the
     * screen no longer pays for wallet balances, stock figures and ticket
     * counts it never displays.
     *
     * READ-ONLY - listing does NOT mark anything read. Only
     * `GET /chat/{customerId}` does that (C-1), which is right when a human
     * opens a conversation. A list that cleared the count would clear it for
     * every staff member, since the count is shared.
     */
    officerThreads: "/officers/chats",
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
    /** Spec 39: a regional admin can call off a load before it is loaded */
    cancelLoadingRequest: "/regional/loading-requests/{id}/cancel",
    /**
     * RA-07: every customer in the caller's own region. Same rows, filters,
     * sorting and meta as /admin/customers - only the path and the region
     * handling differ. A REGIONAL_ADMIN must NOT send `region` (it comes from
     * the token); an ADMIN must, since they have no home region.
     */
    customers: "/regional/customers",
  },
  // LO-02..LO-05: loading / warehouse officer queue
  loading: {
    queue: "/loading/queue",
    detail: "/loading/queue/{id}",
    status: "/loading/queue/{id}/status",
    waybill: "/loading/queue/{id}/waybill",
    /**
     * Spec 39 (L-2): the loading officer's own note on a load, e.g. "customer
     * loading 800 cartons on 26/08/2026, remaining a balance of 200".
     *
     * ASSIGNED OFFICER ONLY - anyone else is a 403, the same gate the status
     * and waybill routes use. Max 500 characters. An empty (or whitespace)
     * string is a valid save and clears the note back to null. Answers the
     * full assignment detail, so one body re-renders the screen.
     */
    description: "/loading/queue/{id}/description",
  },
  /**
   * Spec 39 (A-1): an ACCOUNT OFFICER now receives loading requests and
   * assigns or cancels them, exactly as a regional admin does. Same rows, same
   * filters, same bodies - a different authorisation scope, so a different
   * path. Served by the same backend service methods, so the two cannot drift.
   *
   * The scope is the officer's OWN portfolio - primary or secondary, the same
   * set GET /officers/customers returns - resolved from their staff record.
   * There is no officerId parameter: one officer cannot read another's work.
   */
  officerLoading: {
    loadingRequests: "/officers/loading-requests",
    assignLoadingRequest: "/officers/loading-requests/{id}/assign",
    cancelLoadingRequest: "/officers/loading-requests/{id}/cancel",
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
