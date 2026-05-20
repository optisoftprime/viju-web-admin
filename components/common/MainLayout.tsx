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
        <main className="mt-20 flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
