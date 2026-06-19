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
