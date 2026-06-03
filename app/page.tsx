"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthBanner from "@/components/auth/AuthBanner";
import LoginForm from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/common";
import { useAuthStore } from "@/store/auth.store";

const RootPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <AuthLayout
      leftChildren={<AuthBanner showLockup={false} />}
      rightChildren={<LoginForm />}
    />
  );
};

export default RootPage;
