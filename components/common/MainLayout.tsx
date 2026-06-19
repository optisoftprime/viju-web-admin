"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface MainLayoutProps {
  children?: React.ReactNode;
  pageTitle?: string;
  notificationCount?: number;
}

export default function MainLayout({
  children,
  pageTitle = "Dashboard",
  notificationCount = 0,
}: MainLayoutProps) {
  return (
    <div className="fixed grid grid-cols-[22%_78%]  w-full">
      {/* Sidebar - 20% */}
      <Sidebar />

      {/* Right Section - 80% */}
      <div className="">
        {/* Navbar - Fixed at top */}
        <Navbar pageTitle={pageTitle} notificationCount={notificationCount} />

        {/* Main Content Area */}
        <main className="pt-20 overflow-y-auto bg-milkwhite">{children}</main>
      </div>
    </div>
  );
}
