"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Text, Input, Button } from "@/components/common";
import {
  useLogin,
  getLoginErrorMessage,
  isPasswordNotSetError,
} from "@/hooks/api/useAuth";
import { SESSION_ENDED_KEY } from "@/lib/api/client";

/**
 * Validation schema.
 *
 * Staff sign in with their email address and password. The request still
 * posts them as `username` / `code` - that mapping lives in useLogin, not
 * here, because the payload keys are an API detail and these are the fields
 * the user actually fills in.
 */
const loginValidationSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup.string().required("Password is required"),
});

type LoginFormInputs = yup.InferType<typeof loginValidationSchema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(loginValidationSchema),
    mode: "onBlur",
  });

  const loginMutation = useLogin();

  /**
   * Why the last session ended, when the interceptor ended it for us.
   * A deactivated user is bounced here mid-session and needs to be told why,
   * rather than left staring at a login form that just rejected them.
   */
  const [sessionEndedMessage, setSessionEndedMessage] = useState("");

  // Read after mount, not in a lazy initialiser: sessionStorage does not
  // exist on the server, and seeding this during render would make the
  // server and client markup disagree.
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(SESSION_ENDED_KEY);
      if (stored) {
        window.sessionStorage.removeItem(SESSION_ENDED_KEY);
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
        setSessionEndedMessage(stored);
      }
    } catch {
      // A blocked sessionStorage just means no banner
    }
  }, []);

  const onSubmit = async (data: LoginFormInputs) => {
    // A fresh attempt supersedes whatever ended the previous session
    setSessionEndedMessage("");

    try {
      await loginMutation.mutateAsync(data);
    } catch {
      // Rendered inline below and toasted by the mutation's onError
    }
  };

  const isLoading = isSubmitting || loginMutation.isPending;

  // The API's wording is written for the user - render it verbatim
  const loginError = loginMutation.error
    ? getLoginErrorMessage(loginMutation.error)
    : "";

  // "This account has no password yet" is only actionable via the reset flow,
  // so that link stops being a footnote and becomes the next step.
  const needsPasswordReset = isPasswordNotSetError(loginMutation.error);

  return (
    <div className="flex items-center justify-center h-full px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mt-8">
          <Text
            variant="h3"
            weight="bold"
            color="foreground"
            className="tracking-tighter"
          >
            Welcome Back
          </Text>
          <Text variant="small" color="muted" className="">
            Sign in with your viju staff credentials
          </Text>
        </div>

        {/* Why the previous session ended, e.g. a deactivated account */}
        {sessionEndedMessage && (
          <div className="mt-4 rounded-lg border border-orange/40 bg-orange/10 px-4 py-3">
            <Text variant="caption" weight="medium" color="orange">
              {sessionEndedMessage}
            </Text>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 mt-6">
          {/* Email Input */}
          <div>
            <Text
              variant="small"
              weight="bold"
              color="foreground"
              className="mb-2 block"
            >
              Email
            </Text>
            <Input
              placeholder="Enter your email address"
              type="email"
              autoComplete="username"
              {...register("email")}
              error={errors.email?.message}
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div>
            <Text
              variant="small"
              weight="bold"
              color="foreground"
              className="mb-2 block"
            >
              Password
            </Text>
            <Input
              placeholder="Enter your password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              error={errors.password?.message}
              disabled={isLoading}
            />
          </div>

          {/* Sign-in failure, in the API's own words */}
          {loginError && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 space-y-2">
              <Text variant="caption" weight="medium" color="primary">
                {loginError}
              </Text>
              {needsPasswordReset && (
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-orange underline hover:text-primary transition-colors block"
                >
                  Set your password now
                </Link>
              )}
            </div>
          )}

          {/* Helper Text */}
          <Text variant="caption" color="muted" className="text-center block">
            This portal is for Viju staff only. If you are a customer, please
            use the viju mobile app
          </Text>

          {/* Sign In Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-primary via-orange to-primary"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>

          {/* Forgot Password Link */}
          <div className="flex justify-between items-center mt-2">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-orange hover:text-primary transition-colors"
            >
              Forgot Password
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
