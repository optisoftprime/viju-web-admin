"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Text, Input, Button } from "@/components/common";
import { useLogin } from "@/hooks/api/useAuth";
import { useState } from "react";

// Validation schema
const loginValidationSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = yup.InferType<typeof loginValidationSchema>;

export default function LoginForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(loginValidationSchema),
    mode: "onBlur",
  });

  const loginMutation = useLogin();
  const formValues = watch();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled by the mutation's onError callback with toast
      console.error("Login submission error:", error);
    }
  };

  const isLoading = isSubmitting || loginMutation.isPending;

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
              User Name
            </Text>
            <Input
              placeholder="Enter your user name"
              type="text"
              value={formValues.email || ""}
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
              value={formValues.password || ""}
              {...register("password")}
              error={errors.password?.message}
              disabled={isLoading}
            />
          </div>

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
              Forget Password
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
