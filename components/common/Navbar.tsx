"use client";

import { Search, ChevronDown, Bell } from "lucide-react";
import { Text } from "./Text";
import { Input } from "./Input";

interface NavbarProps {
  pageTitle?: string;
  notificationCount?: number;
}

export default function Navbar({
  pageTitle = "Dashboard",
  notificationCount = 0,
}: NavbarProps) {
  return (
    <nav className="fixed top-0 left-[22%] right-0 h-fit bg-white px-8 py-4 flex items-center justify-between z-40">
      {/* Left Section - Page Title */}
      <div className="min-w-0">
        <Text variant="body" weight="medium" color="foreground">
          {pageTitle}
        </Text>
      </div>

      {/* Center Section - Search Bar */}
      <div className="flex-1 mx-8">
        <div className="relative max-w-md">
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-transparent hover:border-muted/30 focus-within:border-muted/30 transition-colors">
            <Search className="w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search customers, tickets, officers..."
              className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder-muted placeholder:font-medium"
            />
          </div>
        </div>
      </div>

      {/* Right Section - Role Switcher & Notifications */}
      <div className="flex items-center gap-6">
        {/* Role Switcher */}
        <button className="flex items-center gap-2 px-4 py-2 border border-muted/20  hover:bg-gray-50 transition-colors text-sm text-muted font-medium">
          <span className="text-xs">Viewing as:</span>{" "}
          <span className="text-black text-[13px] font-semibold">
            Account Officer
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 p-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
