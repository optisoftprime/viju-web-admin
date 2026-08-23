"use client";

import AuthBanner from "@/components/auth/AuthBanner";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { AuthLayout } from "@/components/common";
import ArrowBack from "@/components/common/ArrowBack";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      leftChildren={<AuthBanner showLockup={true} />}
      rightChildren={
        <>
          {/* Back to wherever they came from - the login page is the only
              screen without one */}
          <div className="px-6 pt-6">
            <ArrowBack />
          </div>
          <ResetPasswordForm />
        </>
      }
    />
  );
}
