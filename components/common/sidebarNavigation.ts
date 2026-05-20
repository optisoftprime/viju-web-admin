// TypeScript Interfaces for Sidebar Navigation
export interface NavLinkItem {
  name: string;
  url: string;
  icon: string; // Asset path, SVG component name, or Lucide icon key
  isActive?: boolean;
}

export interface NavCategory {
  category: string;
  links: NavLinkItem[];
}

// Sidebar Navigation Schema Data
export const sidebarNavigationData: NavCategory[] = [
  {
    category: "ACCOUNT OFFICER",
    links: [
      {
        name: "Officer's Dashboard",
        url: "/dashboard/officer",
        icon: "LayoutDashboard",
        isActive: true,
      },
    ],
  },
  {
    category: "REGIONAL ADMIN",
    links: [
      {
        name: "Regional Dashboard",
        url: "/dashboard/regional",
        icon: "Building2",
      },
      { name: "Loading Request", url: "/requests/loading", icon: "Truck" },
      { name: "Distributors", url: "/regional/distributors", icon: "Users" },
      { name: "Officers", url: "/regional/officers", icon: "UserCheck" },
    ],
  },
  {
    category: "LOADING OFFICER",
    links: [
      {
        name: "My Loading Queue",
        url: "/loading/queue",
        icon: "ClipboardList",
      },
    ],
  },
  {
    category: "ADMINISTRATOR",
    links: [
      { name: "Org Dashboard", url: "/admin/dashboard", icon: "Globe" },
      { name: "Broadcasts", url: "/admin/broadcasts", icon: "Megaphone" },
      {
        name: "Interaction Audits",
        url: "/admin/audits",
        icon: "History",
      },
      { name: "Distributors", url: "/admin/distributors", icon: "Users" },
      { name: "Officers", url: "/admin/officers", icon: "UserCheck" },
      {
        name: "Product Flyers",
        url: "/admin/flyers",
        icon: "FileImage",
      },
    ],
  },
];
