"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Text, Input, Button } from "@/components/common";

// Validation schema
const forgotPasswordValidationSchema = yup.object({
  email: yup
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
    formState: { errors },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: yupResolver(forgotPasswordValidationSchema),
  });

  const formValues = watch();

  const onSubmit = (data: ForgotPasswordFormInputs) => {
    console.log("Forgot Password Form Submitted:", data);
  };

  return (
    <div className="flex items-center justify-center h-full px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mt-8">
          <Text variant="h3" weight="bold" color="foreground">
            Forgot Password
          </Text>
          <Text variant="caption" color="muted" className="mt-2">
            Kindly enter phone number
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
              value={formValues.email || ""}
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          {/* Continue Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-primary via-orange to-primary"
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
