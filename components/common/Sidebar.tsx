"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import Logo from "./Logo";
import { Text } from "./Text";
import LogoutModal from "./LogoutModal";
import { useAuthStore } from "@/store/auth.store";

interface NavLinkItem {
  name: string;
  url: string;
  icon: string;
  isActive?: boolean;
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
    ClipboardList: LucideIcons.ClipboardList,
    Globe: LucideIcons.Globe,
    Megaphone: LucideIcons.Megaphone,
    History: LucideIcons.History,
    FileImage: LucideIcons.FileImage,
    LogOut: LucideIcons.LogOut,
  };

  const Icon = iconMap[iconName];
  return Icon ? <Icon className="w-5 h-5" /> : null;
};

export default function Sidebar() {
  // const { user } = useAuthStore();
  const user = {
    role: "LOADING_OFFICER",
    name: "John Ade",
  };
  // const user = {
  //   role: "REGIONAL_ADMIN",
  //   name: "John Ade",
  // };

  // const { user } = useAuthStore();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Log user info when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log("Logged-in user:", user);
    }
  }, [user]);

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
          name: "Distributors",
          url: "/regional-admin/distributors",
          icon: "Users",
        },
        {
          name: "Officers",
          url: "/regional-admin/officers",
          icon: "UserCheck",
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
        { name: "Org Dashboard", url: "/dashboard", icon: "Globe" },
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
        { name: "Officers", url: "/admin/officers", icon: "UserCheck" },
        {
          name: "Product Flyers",
          url: "/admin/flyers",
          icon: "FileImage",
        },
      ],
    },
  ].filter((type) => type.type === user?.role);

  const navigationData: NavCategory[] = sidebarNavigationData;

  return (
    <aside className="bg-primary p-6 max-h-screen overflow-y-auto">
      {/* Brand Identity Section */}
      <div className="flex items-center gap-2 mb-6">
        <Logo width="w-10" height="h-10" />
        <div className="flex flex-col">
          <Text variant="h3" weight="bold" color="white">
            Viju
          </Text>
          <Text variant="caption" weight="medium" color="white">
            Account Officer Portal
          </Text>
        </div>
      </div>

      {/* Region Status Badge */}
      <div className="flex items-center justify-between gap-1 rounded-lg p-3 bg-orange mb-12">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-success rounded-full"></span>
          <Text variant="caption" weight="medium" color="white">
            LAGOS REGION
          </Text>
        </div>
        <Text variant="thinnote" weight="normal" color="white">
          VJ-RM-01
        </Text>
      </div>

      {/* Navigation Links Section */}
      <nav className="flex-1 overflow-y-auto space-y-2">
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
                const isActive = pathname === link.url;
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
            <span className="text-xs text-white capitalize">
              {user?.role?.toLowerCase() || "Staff"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center gap-3 text-white hover:bg-orange-600/50 rounded-lg p-3 transition-colors text-sm"
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
