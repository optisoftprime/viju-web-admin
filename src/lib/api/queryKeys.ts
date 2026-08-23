/**
 * React Query Keys
 */

export const queryKeys = {
  all: ["query"],
  auth: {
    all: ["auth"],
    me: ["auth", "me"],
  },
  users: {
    all: ["users"],
    profile: ["users", "profile"],
    detail: (id: string) => ["users", "detail", id],
  },
  audits: {
    all: ["audits"],
    tickets: ["audits", "tickets"],
    ticketsList: (filters: Record<string, unknown>) => [
      "audits",
      "tickets",
      filters,
    ],
  },
  /**
   * Role-scoped dashboard stats. Named here so anything that can move a tile -
   * reading a chat, sending a message, an assignment - can invalidate it
   * without rebuilding the key by hand.
   */
  dashboard: {
    all: ["query", "dashboard"],
  },
  customers: {
    all: ["customers"],
    list: ["customers", "list"],
    customersList: (filters: Record<string, unknown>) => [
      "customers",
      "list",
      filters,
    ],
    /**
     * RA-07: GET /regional/customers. Kept under ["customers"] so an
     * assignment still invalidates it, but separate from the admin list -
     * the two are scoped differently and must not share a cache entry.
     */
    regionalList: (filters: Record<string, unknown>) => [
      "customers",
      "regional",
      filters,
    ],
  },
  officers: {
    all: ["officers"],
    list: ["officers", "list"],
    officersList: (filters: Record<string, unknown>) => [
      "officers",
      "list",
      filters,
    ],
  },
  flyers: {
    all: ["flyers"],
    list: ["flyers", "list"],
  },
  notifications: {
    all: ["notifications"],
    list: (params: Record<string, unknown>) => [
      "notifications",
      "list",
      params,
    ],
  },
};

/**
 * Caches holding officer <-> customer assignment data.
 * Invalidated together after any assignment or reassignment so every
 * surface (customer lists, officer lists, dashboards) reflects the change.
 */
export const assignmentQueryKeys = [
  queryKeys.customers.all,
  queryKeys.officers.all,
  queryKeys.all, // dashboard stats and tables are keyed under ["query", ...]
];
