"use client";

import AuthBanner from "@/components/auth/AuthBanner";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { AuthLayout } from "@/components/common";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      leftChildren={<AuthBanner showLockup={true} />}
      rightChildren={<ResetPasswordForm />}
    />
  );
}
