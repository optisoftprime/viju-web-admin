"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button, Input, Modal, Select, Text } from "./common";
import { useCreateOfficer } from "@/hooks/api/useOfficer";
import { BroadcastRegion } from "@/lib/api/types";

interface AddAccountOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Validation schema
const schema = yup.object({
  fullName: yup.string().required("Full Name is required").min(3),
  emailAddress: yup
    .string()
    .email("Invalid email")
    .required("Email Address is required"),
  region: yup.string().required("Region is required"),
  phoneNumber: yup
    .string()
    .required("Phone Number is required")
    .matches(/^\d{10,}$/, "Phone number must be at least 10 digits"),
  temporaryPassword: yup
    .string()
    .required("Temporary Password is required")
    .min(8),
  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("temporaryPassword")], "Passwords must match"),
});

type FormData = yup.InferType<typeof schema>;

const regions = [
  { label: "Lagos", value: "LAGOS" },
  { label: "South West", value: "SOUTH_WEST" },
  { label: "South East", value: "SOUTH_EAST" },
  { label: "North", value: "NORTH" },
];

// Generate password function
const generatePassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 15; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function AddAccountOfficerModal({
  isOpen,
  onClose,
  onSuccess,
}: AddAccountOfficerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOfficerMutation = useCreateOfficer();
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const temporaryPassword = watch("temporaryPassword");

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setValue("temporaryPassword", newPassword);
    console.log("Generated password:", newPassword);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createOfficerMutation.mutateAsync({
        name: data.fullName,
        email: data.emailAddress,
        phone: data.phoneNumber,
        region: data.region as BroadcastRegion,
        password: data.temporaryPassword,
      });

      console.log("Officer created:", data);
      reset();
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      setIsSubmitting(false);
      console.error("Error creating officer:", error);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-2">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-muted/20">
          <Text variant="body" weight="bold">
            Add Account Officer
          </Text>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          {/* Full Name */}
          <div>
            <Text variant="small" weight="semibold">
              Full Name
            </Text>
            <Input
              placeholder="Enter full name"
              {...register("fullName")}
              error={errors.fullName?.message}
            />
          </div>

          {/* Email Address */}
          <div>
            <Text variant="small" weight="semibold">
              Email Address
            </Text>
            <Input
              type="email"
              placeholder="Enter email address"
              {...register("emailAddress")}
              error={errors.emailAddress?.message}
            />
          </div>

          {/* Region */}
          <div>
            <Select
              name="region"
              control={control}
              label="Region"
              options={regions}
              error={errors.region?.message}
              placeholder="Select Region"
            />
          </div>

          {/* Phone Number */}
          <div className="mt-2 space-y-2">
            <Text variant="small" weight="semibold">
              Phone Number
            </Text>
            <Input
              placeholder="Enter phone number"
              {...register("phoneNumber")}
              error={errors.phoneNumber?.message}
            />
          </div>

          {/* Temporary Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Text variant="small" weight="semibold">
                Temporary Password
              </Text>
            </div>
            <div className="relative">
              <Input
                type="password"
                placeholder="Enter temporary password"
                {...register("temporaryPassword")}
                error={errors.temporaryPassword?.message}
              />
              <div
                onClick={handleGeneratePassword}
                className="cursor-pointer absolute right-9 top-4.5 -translate-y-1/2"
              >
                <Text variant="small" weight="bold" color="foreground">
                  Generate
                </Text>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <Text variant="small" weight="semibold">
              Confirm Password
            </Text>
            <Input
              type="password"
              placeholder="Confirm password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
          </div>

          <Text variant="caption" weight="medium" color="foreground">
            The officer will receive an email with their login credentials
          </Text>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-muted/20">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-foreground"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
              className="gradient"
            >
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
