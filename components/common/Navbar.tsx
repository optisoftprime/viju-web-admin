"use client";

import { useState } from "react";
import { ChevronDown, Bell, LogOut, LucideLogOut, Menu } from "lucide-react";
import { Text } from "./Text";
import SearchInput from "./SearchInput";
import LogoutModal from "./LogoutModal";
import NotificationSidebar from "@/components/NotificationSidebar";
import { useAuthStore } from "@/src/store/auth.store";
import Logo from "./Logo";

/**
 * Interface for Navbar component props
 * @param pageTitle - The title of the current page to display
 * @param notificationCount - Number of unread notifications to display
 */
interface NavbarProps {
  pageTitle?: string;
  notificationCount?: number;
}

/**
 * Navbar Component
 * Displays the top navigation bar with page title, search input, role switcher, and notification bell
 * This component is fixed to the top of the page and spans the full width except for the sidebar
 *
 * @param {NavbarProps} props - Component props
 * @returns {JSX.Element} - Rendered navbar component
 */
export default function Navbar({
  showSidebar,
  setShowSidebar,
  pageTitle = "Dashboard",
  notificationCount = 0,
}: NavbarProps & {
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showLogoutButton, setShowLogoutButton] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const { user } = useAuthStore();
  /**
   * Handle search callback from SearchInput component
   * Logs the search value and can be extended for actual search functionality
   */
  const handleSearch = (value: string) => {
    // This can be extended to trigger actual search functionality
    // For now, the SearchInput component handles logging
  };

  return (
    <nav className="fixed top-0 left-0 right-0 md:left-[22%] z-10 md:right-0 h-fit bg-white px-2 md:px-8 py-4 flex items-center justify-between">
      {/* Left Section - Page Title */}
      <div className="hidden md:block min-w-0">
        <Text variant="body" weight="medium" color="foreground">
          {pageTitle}
        </Text>
      </div>

      <Logo width="w-10" height="h-10" className="md:hidden" />

      {/* Center Section - Search Bar */}
      {/* <div className="flex-1 mx-8">
        <SearchInput
          placeholder="Search customers, tickets, officers..."
          onSearch={handleSearch}
          debounceDelay={500}
        />
      </div> */}

      {/* Right Section - Role Switcher & Notifications */}
      <div className="flex items-center gap-6">
        {/* Role Switcher - Allows viewing as different roles */}
        <div
          onClick={() => setShowLogoutButton((p) => !p)}
          className="relative rounded-md cursor-pointer px-4 py-2 border border-muted/20 space-y-2 hover:bg-gray-50 transition-colors"
        >
          <div className="hidden md:flex items-center gap-2 text-sm text-muted font-medium">
            <span className="text-xs">Viewing as:</span>{" "}
            <span className="text-black text-[13px] font-semibold">
              {user?.role === "OFFICER"
                ? "Account Officer"
                : user?.role === "ADMIN"
                  ? "Administrator"
                  : user?.role === "LOADING_OFFICER"
                    ? "Loading Officer"
                    : "Admin"}
            </span>
            {showLogoutButton ? (
              <ChevronDown className="w-4 h-4 rotate-180" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {/* <ChevronDown className="w-4 h-4" /> */}
          </div>
          {/* toggle logout  */}
          {showLogoutButton && (
            <div
              onClick={() => setIsLogoutModalOpen(!isLogoutModalOpen)}
              className="absolute top-full bg-red-600 px-6 py-2 rounded-md shadow-lg z-50 flex my-3 gap-2 items-center"
            >
              <LucideLogOut className="w-4 h-4 text-white" />
              <span className="text-[12px] font-semibold text-white">
                Log Out
              </span>
            </div>
          )}
        </div>

        {/* Notification Bell - Shows unread notification count */}
        <button
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className=" cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 p-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        <Menu
          onClick={() => setShowSidebar((prev) => !prev)}
          className="cursor-pointer w-6 h-6 text-primary"
        />
      </div>

      {/* Logout Modal */}
      <LogoutModal
        open={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />

      {/* Notification Sidebar */}
      <NotificationSidebar
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </nav>
  );
}
