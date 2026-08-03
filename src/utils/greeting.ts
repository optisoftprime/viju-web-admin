"use client";

import { useEffect, useState } from "react";

export type PortalRole =
  | "ADMIN"
  | "OFFICER"
  | "STAFF"
  | "REGIONAL_ADMIN"
  | "LOADING_OFFICER";

/**
 * Returns the greeting that matches the given time of day.
 * Morning: 00:00 - 11:59, Afternoon: 12:00 - 16:59, Evening: 17:00 - 23:59
 */
export const getGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

/**
 * Keeps the greeting in sync with the viewer's local clock.
 * The greeting is only resolved after mount so the server-rendered markup
 * (which uses the server timezone) never mismatches during hydration.
 */
export const useGreeting = (): string => {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    setGreeting(getGreeting());

    // Re-check every minute so a session left open overnight stays accurate
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return greeting;
};

/**
 * Resolves the portal name for a role so branding stays consistent
 * across the sidebar, navbar and dashboard headers.
 */
export const getPortalName = (role?: string): string => {
  switch (role) {
    case "OFFICER":
      return "Account Officer Portal";
    case "ADMIN":
      return "Admin Portal";
    case "REGIONAL_ADMIN":
      return "Regional Admin Portal";
    case "LOADING_OFFICER":
      return "Loading Officer Portal";
    default:
      return "Portal";
  }
};
