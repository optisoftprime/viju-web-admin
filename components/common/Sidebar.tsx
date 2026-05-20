"use client";

import Image from "next/image";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { sidebarNavigationData } from "./sidebarNavigation";
import Logo from "./Logo";
import { Text } from "./Text";

interface NavLinkItem {
  name: string;
  url: string;
  icon: string;
  isActive?: boolean;
}

interface NavCategory {
  category: string;
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
  const navigationData: NavCategory[] = sidebarNavigationData;

  return (
    <aside className="bg-primary p-6 max-h-screen overflow-y-auto">
      {/* Brand Identity Section */}
      <div className="flex items-center gap-4 mb-6">
        <Logo />
        <div className="flex flex-col">
          <Text variant="h3" weight="bold" color="white">
            Viju
          </Text>
          <Text variant="caption" weight="thin" color="white">
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
              {category.links.map((link: NavLinkItem, linkIndex: number) => (
                <Link
                  key={linkIndex}
                  href={link.url}
                  className={
                    link.isActive
                      ? "bg-white text-black rounded-lg p-3 font-semibold flex items-center gap-3 transition-colors"
                      : "text-white hover:bg-white hover:text-black rounded-lg p-3 flex items-center gap-3 transition-colors"
                  }
                >
                  {getIconComponent(link.icon)}
                  <span className="text-sm">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Section - User Profile & Logout */}
      <div className="border-t border-gray-300/40 py-8 mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 p-2 bg-white text-orange rounded-full flex uppercase font-bold items-center justify-center">
            A
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Viju</span>
            <span className="text-xs text-white">Account Officer</span>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 text-white hover:bg-orange-600/50 rounded-lg p-3 transition-colors text-sm">
          {getIconComponent("LogOut")}

          <Text variant="caption" weight="medium" color="white">
            Log out
          </Text>
        </button>
      </div>
    </aside>
  );
}
