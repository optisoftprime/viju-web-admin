"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Text, Input, Button } from "@/components/common";
import { useForgotPassword } from "@/hooks/api/useAuth";
import { toast } from "sonner";

// Validation schema
const forgotPasswordValidationSchema = yup.object({
  identifier: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormInputs = yup.InferType<
  typeof forgotPasswordValidationSchema
>;

export default function ForgotPasswordForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: yupResolver(forgotPasswordValidationSchema),
    mode: "onBlur",
  });

  const forgotPasswordMutation = useForgotPassword();
  const formValues = watch();

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    try {
      // Store identifier in session storage for use in OTP form
      sessionStorage.setItem("forgotPasswordEmail", data.identifier);
      await forgotPasswordMutation.mutateAsync({
        identifier: data.identifier,
      });
    } catch (error) {
      // Error is handled by the mutation's onError callback with toast
      toast.error(
        "Forgot password submission error: " + (error as Error).message,
      );
    }
  };

  const isLoading = isSubmitting || forgotPasswordMutation.isPending;

  return (
    <div className="flex items-center justify-center h-full px-8 py-12">
      <div className="w-full max-w-md">
        {/* Back Navigation */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="mt-8">
          <Text variant="h3" weight="bold" color="foreground">
            Forgot Password
          </Text>
          <Text variant="caption" color="muted" className="mt-2">
            Kindly enter your email address
          </Text>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 mt-6">
          {/* Email Address Input */}
          <div>
            <Text
              variant="small"
              weight="semibold"
              color="foreground"
              className="mb-2 block"
            >
              Email Address
            </Text>
            <Input
              placeholder="Enter email address"
              type="email"
              value={formValues.identifier || ""}
              {...register("identifier")}
              error={errors.identifier?.message}
              disabled={isLoading}
            />
          </div>

          {/* Continue Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-primary via-orange to-primary"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
