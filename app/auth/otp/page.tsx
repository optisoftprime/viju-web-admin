"use client";

import AuthBanner from "@/components/auth/AuthBanner";
import OTPForm from "@/components/auth/OTPForm";
import { AuthLayout } from "@/components/common";

export default function OTPPage() {
  return (
    <AuthLayout
      leftChildren={<AuthBanner showLockup={true} />}
      rightChildren={<OTPForm />}
    />
  );
}
