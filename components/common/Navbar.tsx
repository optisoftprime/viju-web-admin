"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Bell,
  LogOut,
  LucideLogOut,
  Menu,
  UserRound,
} from "lucide-react";
import { Text } from "./Text";
import SearchInput from "./SearchInput";
import LogoutModal from "./LogoutModal";
import NotificationSidebar from "@/components/NotificationSidebar";
import { useAuthStore } from "@/src/store/auth.store";
import { useNotifications } from "@/hooks/api/useNotification";
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
 * Displays the top navigation bar with page title, search input, account menu, and notification bell
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

  // Same query key as the sidebar, so the bell and the panel share one request
  const { data: notificationsData } = useNotifications({
    page: 1,
    pageSize: 20,
  });
  const unreadCount = notificationsData?.unread ?? notificationCount;

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

      {/* Right Section - Account Menu & Notifications */}
      <div className="flex items-center gap-6">
        {/* Account Menu - Shows the signed in user and exposes log out */}
        <div
          onClick={() => setShowLogoutButton((p) => !p)}
          className="relative hidden md:block rounded-md cursor-pointer px-4 py-2 border border-muted/20 space-y-2 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-muted font-medium">
            {/* Spec 42 - the user's own picture once they have set one */}
            {user?.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePhotoUrl}
                alt=""
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="w-6 h-6 bg-primary text-white rounded-full flex uppercase text-[11px] font-bold items-center justify-center">
                {user?.name?.charAt(0) || "U"}
              </span>
            )}
            <span className="text-black text-[13px] font-semibold">
              {user?.name || "User"}
            </span>
            {showLogoutButton ? (
              <ChevronDown className="w-4 h-4 rotate-180" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
          {/* Spec 42 - the account menu now leads somewhere as well as out */}
          {showLogoutButton && (
            <div className="absolute top-full right-0 z-50 my-3 w-44 rounded-md bg-white shadow-lg border border-muted/20 overflow-hidden">
              <Link
                href="/profile"
                onClick={(event) => {
                  // The wrapper toggles this menu on click; without this the
                  // menu reopens as the navigation starts
                  event.stopPropagation();
                  setShowLogoutButton(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <UserRound className="w-4 h-4 text-foreground" />
                <span className="text-[12px] font-semibold text-foreground">
                  My Profile
                </span>
              </Link>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowLogoutButton(false);
                  setIsLogoutModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 transition-colors"
              >
                <LucideLogOut className="w-4 h-4 text-white" />
                <span className="text-[12px] font-semibold text-white">
                  Log Out
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell - Shows unread notification count */}
        <button
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="relative cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <Menu
          onClick={() => setShowSidebar((prev) => !prev)}
          className="md:hidden cursor-pointer w-6 h-6 text-primary"
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
