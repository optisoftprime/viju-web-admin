/**
 * Toaster Provider
 * Sonner toast notifications provider
 */

"use client";

import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster position="top-right" richColors closeButton theme="light" expand />
  );
}
