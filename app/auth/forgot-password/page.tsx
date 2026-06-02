"use client";

import AuthBanner from "@/components/auth/AuthBanner";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { AuthLayout } from "@/components/common";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      leftChildren={<AuthBanner showLockup={true} />}
      rightChildren={<ForgotPasswordForm />}
    />
  );
}
