"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OtpInput from "react-otp-input";
import { Text, Button, Input } from "@/components/common";
import { useVerifyOTP, useResetPassword } from "@/hooks/api/useAuth";
import Link from "next/link";
import { toast } from "sonner";

export default function OTPForm() {
  const [step, setStep] = useState<"otp" | "password">("otp"); // Step 1: OTP, Step 2: Password
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const router = useRouter();
  const verifyOTPMutation = useVerifyOTP();
  const resetPasswordMutation = useResetPassword();

  // Retrieve identifier from session storage
  useEffect(() => {
    const storedIdentifier = sessionStorage.getItem("forgotPasswordEmail");
    if (storedIdentifier) {
      setIdentifier(storedIdentifier);
    }
  }, []);

  // Step 1: Handle OTP submission
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || !identifier || otp.length !== 6) {
      return;
    }

    try {
      const response = await verifyOTPMutation.mutateAsync({
        identifier,
        code: otp,
      });
      // Store reset token for next step
      setResetToken(response.reset_token);
      // Move to password step
      setStep("password");
    } catch (error) {
      // Error is handled by the mutation's onError callback with toast
      toast.error("OTP verification error: " + (error as Error).message);
    }
  };

  // Step 2: Handle password reset submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword || !resetToken) {
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        reset_token: resetToken,
        newPassword,
      });
      // Redirect to login on success is handled by mutation
    } catch (error) {
      // Error is handled by the mutation's onError callback with toast
      toast.error("Password reset error: " + (error as Error).message);
    }
  };

  const isOTPLoading = verifyOTPMutation.isPending || otp.length !== 6;
  const isPasswordLoading =
    resetPasswordMutation.isPending ||
    !newPassword ||
    !confirmPassword ||
    newPassword !== confirmPassword;

  return (
    <div className="flex items-center justify-center h-full px-8 py-12">
      <div className="w-full max-w-md">
        {step === "otp" ? (
          <>
            {/* OTP Step Header */}
            <div className="mt-8">
              <Text variant="h3" weight="bold" color="foreground">
                Enter your verification code
              </Text>
              <Text variant="caption" color="muted" className="mt-2">
                We sent a 6 digits code to {identifier || "your email"}
              </Text>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleOTPSubmit} className="space-y-6 mt-6">
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
                      disabled={verifyOTPMutation.isPending}
                    />
                  )}
                />
              </div>

              {/* Verify OTP Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-primary via-orange to-primary"
                disabled={isOTPLoading}
              >
                {verifyOTPMutation.isPending ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          </>
        ) : (
          <>
            {/* Password Step Header */}
            <div className="mt-8">
              <Text variant="h3" weight="bold" color="foreground">
                Create New Password
              </Text>
              <Text variant="caption" color="muted" className="mt-2">
                Please enter your new password
              </Text>
            </div>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-2 mt-6">
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

              {/* Confirm Password Input */}
              <div>
                <Text
                  variant="small"
                  weight="bold"
                  color="foreground"
                  className="mb-2 block"
                >
                  Confirm Password
                </Text>
                <div className="relative">
                  <Input
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={resetPasswordMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showConfirmPassword ? (
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

              {/* Reset Password Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full bg-gradient-to-r from-primary via-orange to-primary"
                disabled={isPasswordLoading}
              >
                {resetPasswordMutation.isPending
                  ? "Resetting..."
                  : "Reset Password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
