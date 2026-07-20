"use client";

import React from "react";

interface AuthLayoutProps {
  leftChildren: React.ReactNode;
  rightChildren: React.ReactNode;
}

export default function AuthLayout({
  leftChildren,
  rightChildren,
}: AuthLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* Left Side - Gradient Background with Branding */}
      <div className="bg-linear-to-b from-primary via-orange to-primary  md:h-full md:min-h-screen flex items-center justify-center">
        {leftChildren}
      </div>

      {/* Right Side - Dynamic Content */}
      <div>{rightChildren}</div>
    </div>
  );
}
