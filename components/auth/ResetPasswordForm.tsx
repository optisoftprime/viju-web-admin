"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Image from "next/image";
import { Text, Input, Button, Modal } from "@/components/common";
import verifiedMark from "@/assets/images/verifiedmark.png";
import { toast } from "sonner";

// Validation schema
const resetPasswordValidationSchema = yup.object({
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

type ResetPasswordFormInputs = yup.InferType<
  typeof resetPasswordValidationSchema
>;

export default function ResetPasswordForm() {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>({
    resolver: yupResolver(resetPasswordValidationSchema),
  });

  const formValues = watch();

  const onSubmit = (data: ResetPasswordFormInputs) => {
    // Show success modal
    setIsSuccessModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-center h-full px-8 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mt-8">
            <Text variant="h3" weight="bold" color="foreground">
              Create New Password
            </Text>
            <Text variant="caption" color="muted" className="mt-2">
              Enter new password to secure your account
            </Text>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 mt-6">
            {/* New Password Input */}
            <div>
              <Text
                variant="small"
                weight="semibold"
                color="foreground"
                className="mb-2 block"
              >
                New Password
              </Text>
              <Input
                placeholder="Enter new password"
                type="password"
                value={formValues.newPassword || ""}
                {...register("newPassword")}
                error={errors.newPassword?.message}
              />
            </div>

            {/* Confirm New Password Input */}
            <div>
              <Text
                variant="small"
                weight="semibold"
                color="foreground"
                className="mb-2 block"
              >
                Confirm New Password
              </Text>
              <Input
                placeholder="Confirm new password"
                type="password"
                value={formValues.confirmPassword || ""}
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-linear-to-r from-primary via-orange to-primary"
            >
              Verify
            </Button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        open={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-3">
          {/* Verified Mark Image */}
          <Image
            src={verifiedMark}
            alt="Password reset successful"
            width={80}
            height={80}
            className="object-contain w-35.25 h-35.25"
          />

          {/* Success Message */}
          <div className="text-center space-y-2">
            <Text variant="h3" weight="bold" color="foreground">
              Password Reset Successful!
            </Text>
            <Text variant="body" color="muted">
              Your password has been updated, you can now log in with your
              password
            </Text>
          </div>

          {/* Thank You Button */}
          <div className="w-full px-[10%]">
            <Button
              variant="primary"
              size="lg"
              fullWidth={true}
              onClick={() => setIsSuccessModalOpen(false)}
              className="bg-linear-to-r from-primary via-orange to-primary"
            >
              Thank you
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
