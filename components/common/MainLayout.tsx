"use client";

import React, { useState } from "react";
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
  const [showSidebar, setShowSidebar] = useState(false);
  return (
    <div className="fixed z-10 grid grid-cols-1 md:grid-cols-[22%_78%]  w-full ">
      {/* Sidebar - 20% */}
      <Sidebar showSidebar={showSidebar} />

      {/* Right Section - 80% */}
      <div className="">
        {/* Navbar - Fixed at top */}
        <Navbar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          pageTitle={pageTitle}
          notificationCount={notificationCount}
        />

        {/* Main Content Area */}
        <main className="pt-20 overflow-y-auto bg-milkwhite">{children}</main>
      </div>
    </div>
  );
}
