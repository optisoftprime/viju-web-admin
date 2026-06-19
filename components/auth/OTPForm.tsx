"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OtpInput from "react-otp-input";
import { Text, Button, Input } from "@/components/common";
import { useResetPassword } from "@/hooks/api/useAuth";
import Link from "next/link";

export default function OTPForm() {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const router = useRouter();
  const resetPasswordMutation = useResetPassword();

  // Retrieve identifier from session storage
  useEffect(() => {
    const storedIdentifier = sessionStorage.getItem("forgotPasswordEmail");
    if (storedIdentifier) {
      setIdentifier(storedIdentifier);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || !newPassword || !identifier) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        identifier,
        code: otp,
        newPassword,
      });
    } catch (error) {
      // Error is handled by the mutation's onError callback with toast
      console.error("Password reset submission error:", error);
    }
  };

  const isLoading =
    resetPasswordMutation.isPending ||
    (otp.length === 6 && !newPassword) ||
    !identifier;

  return (
    <div className="flex items-center justify-center h-full px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mt-8">
          <Text variant="h2" weight="bold" color="foreground">
            Enter your verification code
          </Text>
          <Text variant="caption" color="muted" className="mt-2">
            We sent a 6 digits code to {identifier || "your email"}
          </Text>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* OTP Input */}
          <div>
            <Text
              variant="small"
              weight="semibold"
              color="foreground"
              className="mb-2 block"
            >
              Verification Code
            </Text>
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderSeparator={<span className="mx-1"></span>}
              renderInput={(props) => (
                <input
                  {...props}
                  style={{
                    backgroundColor: "#FFC6A7",
                  }}
                  className="rounded-lg text-black font-bold text-[20px] p-4 flex justify-center items-center w-12 h-12"
                />
              )}
            />
          </div>

          {/* New Password Input */}
          <div>
            <Text
              variant="small"
              weight="bold"
              color="foreground"
              className="mb-2 block"
            >
              New Password
            </Text>
            <div className="relative">
              <Input
                name="newPassword"
                placeholder="Enter your new password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full bg-gradient-to-r from-primary via-orange to-primary"
            disabled={
              otp.length !== 6 ||
              !newPassword ||
              resetPasswordMutation.isPending
            }
          >
            {resetPasswordMutation.isPending
              ? "Resetting..."
              : "Reset Password"}
          </Button>
        </form>

        <div className="flex justify-between items-center mt-2">
          <Link
            href="/auth/login"
            className="text-sm text-orange hover:text-primary transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
