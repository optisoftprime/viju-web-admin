"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthBanner from "@/components/auth/AuthBanner";
import LoginForm from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/common";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <AuthLayout
      leftChildren={<AuthBanner showLockup={false} />}
      rightChildren={<LoginForm />}
    />
  );
}
