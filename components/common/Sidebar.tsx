"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import Logo from "./Logo";
import { Text } from "./Text";
import LogoutModal from "./LogoutModal";
import { useAuthStore } from "@/store/auth.store";
import { getPortalName } from "@/src/utils/greeting";
import { formatRegion } from "@/src/utils/formatter";
import { formatRole, normalizeStaffRole } from "@/constants/roles";

interface NavLinkItem {
  name: string;
  url: string;
  icon: string;
  isActive?: boolean;
  secondaryLink?: string;
}

interface NavCategory {
  category: string;
  type?: string;
  links: NavLinkItem[];
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    LayoutDashboard: LucideIcons.LayoutDashboard,
    Building2: LucideIcons.Building2,
    Truck: LucideIcons.Truck,
    Users: LucideIcons.Users,
    UserCheck: LucideIcons.UserCheck,
    Ticket: LucideIcons.Ticket,
    ClipboardList: LucideIcons.ClipboardList,
    Globe: LucideIcons.Globe,
    Megaphone: LucideIcons.Megaphone,
    History: LucideIcons.History,
    FileImage: LucideIcons.FileImage,
    MessageSquare: LucideIcons.MessageSquare,
    LogOut: LucideIcons.LogOut,
  };

  const Icon = iconMap[iconName];
  return Icon ? <Icon className="w-5 h-5" /> : null;
};

export default function Sidebar({ showSidebar }: { showSidebar: boolean }) {
  const { user } = useAuthStore();
  // const user = {
  //   role: "LOADING_OFFICER",
  //   name: "John Ade",
  // };
  // const user = {
  //   role: "REGIONAL_ADMIN",
  //   name: "John Ade",
  // };

  // const { user } = useAuthStore();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  /**
   * The scope badge under the brand.
   *
   * An admin works across the whole organisation; every other role is scoped
   * to the region on their staff record.
   *
   * Spec 41: a LOADING OFFICER works a WAREHOUSE, not a region - they are
   * posted to one depot inside a region, and "Lagos Region" overstated what
   * they cover. The region value is the same; only the noun changes.
   */
  const scopeNoun =
    normalizeStaffRole(user?.role) === "LOADING_OFFICER"
      ? "Warehouse"
      : "Region";

  const regionLabel =
    normalizeStaffRole(user?.role) === "ADMIN"
      ? "All Regions"
      : user?.region
        ? `${formatRegion(user.region)} ${scopeNoun}`
        : `Lagos ${scopeNoun}`;

  // Log user info when component mounts or user changes

  const sidebarNavigationData: NavCategory[] = [
    {
      category: "ACCOUNT OFFICER",
      type: "OFFICER",
      links: [
        {
          name: "Officer's Dashboard",
          url: "/dashboard",
          icon: "LayoutDashboard",
        },
        /**
         * Spec 39: an account officer now receives loading requests and
         * assigns or cancels them, exactly as a regional admin does. Same
         * page - it reads the route the signed-in role is authorised on.
         */
        { name: "Loading Request", url: "/requests/loading", icon: "Truck" },
        /**
         * Spec 41: every conversation in one place, instead of one thread at a
         * time behind a tab on a customer row.
         */
        { name: "Chat", url: "/chat", icon: "MessageSquare" },
      ],
    },
    {
      category: "REGIONAL ADMIN",
      type: "REGIONAL_ADMIN",
      links: [
        {
          name: "Regional Dashboard",
          url: "/dashboard",
          icon: "Building2",
        },
        { name: "Loading Request", url: "/requests/loading", icon: "Truck" },
        {
          name: "Customers",
          url: "/regional-admin/distributors",
          icon: "Users",
        },
        {
          name: "Officers",
          url: "/regional-admin/officers",
          icon: "UserCheck",
        },
        {
          name: "Open Tickets",
          url: "/regional-admin/tickets",
          icon: "Ticket",
        },
        /**
         * Spec 40: a regional admin does everything an admin does, scoped to
         * their own region. These four are the SAME pages the admin uses -
         * each one region-scopes itself from the signed-in role rather than
         * existing twice.
         */
        { name: "Broadcasts", url: "/broadcast", icon: "Megaphone" },
        {
          name: "Interaction Audits",
          url: "/admin/audits",
          icon: "History",
        },
        { name: "Users", url: "/admin/users", icon: "Users" },
        {
          name: "Product Flyers",
          url: "/admin/flyers",
          icon: "FileImage",
        },
      ],
    },
    {
      category: "LOADING OFFICER",
      type: "LOADING_OFFICER",
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
      type: "ADMIN",
      links: [
        {
          name: "Dashboard",
          url: "/dashboard",
          icon: "Globe",
          secondaryLink: "/admin/distributors",
        },
        { name: "Broadcasts", url: "/broadcast", icon: "Megaphone" },
        {
          name: "Interaction Audits",
          url: "/admin/audits",
          icon: "History",
        },
        {
          name: "Customer Reassignment",
          url: "/admin/reassignment",
          icon: "Users",
        },
        { name: "Users", url: "/admin/users", icon: "Users" },
        { name: "Officers", url: "/admin/officers", icon: "UserCheck" },
        {
          name: "Product Flyers",
          url: "/admin/flyers",
          icon: "FileImage",
        },
      ],
    },
  ].filter((type) => type.type === normalizeStaffRole(user?.role));

  const navigationData: NavCategory[] = sidebarNavigationData;

  return (
    /*
     * h-screen, not min-h-screen: min-h lets the element grow past the
     * viewport, so overflow-y-auto has nothing to clip against and the menu
     * items below the fold become unreachable. Fixing the height to the
     * viewport makes this element the scroll container for its own content.
     *
     * overscroll-contain stops the scroll chaining to the page once the
     * sidebar hits top or bottom.
     */
    <aside
      className={`${showSidebar ? "absolute inset-y-0 left-0" : "hidden md:static md:block"} bg-primary z-20 p-6 h-screen overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.35)_transparent]`}
    >
      {/* Brand Identity Section */}
      <div className="flex z-20 items-center gap-2 mb-6">
        <Logo width="w-10" height="h-10" />
        <div className="flex flex-col">
          <Text variant="h3" weight="bold" color="white">
            Viju
          </Text>
          <Text variant="caption" weight="medium" color="white">
            {getPortalName(user?.role)}
          </Text>
        </div>
      </div>

      {/* Region Status Badge - hidden when the account carries no region */}
      {regionLabel && (
        <div className="flex items-center gap-1 rounded-lg p-3 bg-orange mb-12">
          <span className="w-2 h-2 bg-success rounded-full"></span>
          <Text
            variant="caption"
            weight="medium"
            color="white"
            className="uppercase"
          >
            {regionLabel}
          </Text>
        </div>
      )}

      {/* Navigation Links Section */}
      <nav className="space-y-2">
        {navigationData.map((category: NavCategory, categoryIndex: number) => (
          <div key={categoryIndex} className="mb-6">
            <Text
              variant="caption"
              weight="semibold"
              color="white"
              className="tracking-wider mb-2 block uppercase"
            >
              {category.category}
            </Text>
            <div className="flex flex-col gap-1">
              {category.links.map((link: NavLinkItem, linkIndex: number) => {
                const isActive =
                  pathname === link.url || pathname === link.secondaryLink;
                return (
                  <Link
                    key={linkIndex}
                    href={link.url}
                    className={
                      isActive
                        ? "bg-white text-black rounded-lg p-3 font-semibold flex items-center gap-3 transition-colors"
                        : "text-white hover:bg-white hover:text-black rounded-lg p-3 flex items-center gap-3 transition-colors"
                    }
                  >
                    {getIconComponent(link.icon)}
                    <span className="text-sm">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Section - User Profile & Logout */}
      <div className="border-t border-gray-300/40 py-8 mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 p-2 bg-white text-orange rounded-full flex uppercase font-bold items-center justify-center">
            {user?.name?.charAt(0) || "U"}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-white">
              {formatRole(user?.role, "Staff")}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full cursor-pointer flex items-center gap-3 text-white hover:bg-orange-600/50 rounded-lg p-3 transition-colors text-sm"
        >
          {getIconComponent("LogOut")}

          <Text variant="caption" weight="medium" color="white">
            Log out
          </Text>
        </button>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        open={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </aside>
  );
}
