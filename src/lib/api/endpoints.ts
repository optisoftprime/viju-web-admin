/**
 * API Endpoints
 */

export const endpoints = {
  auth: {
    login: "/auth/staff/login",
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
  },
};
