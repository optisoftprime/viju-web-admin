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
    resetPassword: "/auth/staff/password-reset/confirm",
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
    reassign: "/admin/customers/{id}/reassign",
  },
  audits: {
    tickets: "/admin/audit/tickets",
  },
  officers: {
    list: "/admin/officers",
    create: "/admin/officers",
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
  },
};
