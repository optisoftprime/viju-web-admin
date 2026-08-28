"use client";

import { useEffect, useMemo, useState } from "react";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button, Input, Modal, Select, Text } from "./common";
import { useCreateOfficer } from "@/hooks/api/useOfficer";
import {
  BroadcastRegion,
  CreateOfficerRequest,
  CreateOfficerResponse,
} from "@/lib/api/types";
import { REGIONS } from "@/constants/regions";
import { formatRegion } from "@/utils/formatter";
import {
  CREATE_ROLE_OPTIONS,
  ManagedRole,
  ROLE_LABELS,
  roleRequiresRegion,
} from "@/constants/roles";
import {
  getErrorCode,
  getErrorField,
  getErrorMessages,
} from "@/utils/apiError";

interface AddManagedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (created: CreateOfficerResponse) => void;
  /**
   * Which roles the picker offers. The Officers screen passes ["OFFICER"] so
   * it keeps creating account officers only; the Users screen passes nothing
   * and gets all four. With a single role the picker is not rendered at all.
   */
  roles?: ManagedRole[];
  title?: string;
  /**
   * Spec 40: pin every account created here to one region and hide the picker.
   *
   * A REGIONAL_ADMIN creates staff for their OWN region and nowhere else, so
   * the region is not a choice for them - it is a fact about who is asking.
   * Passing the enum here also stops a display label ("South-South") ever
   * reaching the API, which would be a 400.
   */
  lockedRegion?: BroadcastRegion;
}

/**
 * Phone shape the API accepts: an optional leading "+", then 7-20 characters
 * that must start with a digit and may contain digits, spaces and hyphens.
 * No parentheses. Separators count toward the 20, so the service strips them
 * before sending; validating the typed value against the same shape keeps the
 * message accurate either way.
 */
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,19}$/;

const schema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required("Full Name is required")
    .min(2, "Full Name must be at least 2 characters")
    .max(120, "Full Name must be at most 120 characters"),
  emailAddress: yup
    .string()
    .trim()
    .required("Email Address is required")
    .email("Invalid email")
    .max(255, "Email must be at most 255 characters"),
  role: yup.string().required("Role is required"),
  /**
   * An ADMIN is organisation-wide: the API rejects a region on one outright,
   * so the field is only required - and only sent - for the other three.
   * Expressed as a test rather than .when() so the field stays optional in
   * the inferred type and the form keeps one shape across both branches.
   */
  region: yup
    .string()
    .test("region-required", "Region is required", function (value) {
      return roleRequiresRegion(this.parent?.role) ? Boolean(value?.trim()) : true;
    }),
  phoneNumber: yup
    .string()
    .trim()
    .required("Phone Number is required")
    .matches(PHONE_PATTERN, "Enter a valid phone number, e.g. +2348012345678"),
  temporaryPassword: yup
    .string()
    .required("Temporary Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .oneOf([yup.ref("temporaryPassword")], "Passwords must match"),
});

/**
 * Two shapes, because yup and react-hook-form disagree about `region`.
 *
 * The raw form always has the key (it is a rendered input, empty for an
 * ADMIN); the validated output has it optional. Passing both to useForm keeps
 * the resolver, the controls and the submit handler on the same page.
 */
type FormValues = {
  fullName: string;
  emailAddress: string;
  role: string;
  region: string | undefined;
  phoneNumber: string;
  temporaryPassword: string;
  confirmPassword: string;
};

type FormData = yup.InferType<typeof schema>;

const regions = REGIONS;

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

/**
 * Maps the API's `field` onto the form control that holds it, so a duplicate
 * email lands under the email input rather than in a toast.
 */
const FIELD_TO_INPUT: Record<string, keyof FormValues> = {
  email: "emailAddress",
  phone: "phoneNumber",
  name: "fullName",
  role: "role",
  region: "region",
  password: "temporaryPassword",
};

export default function AddManagedUserModal({
  isOpen,
  onClose,
  onSuccess,
  roles,
  title,
  lockedRegion,
}: AddManagedUserModalProps) {
  const roleOptions = useMemo(
    () =>
      roles?.length
        ? roles.map((role) => ({ value: role, label: ROLE_LABELS[role] }))
        : CREATE_ROLE_OPTIONS,
    [roles],
  );

  /**
   * The API defaults an omitted role to OFFICER, so the picker does too. A
   * screen that restricts the list gets the first role it allowed instead.
   */
  const defaultRole: string = roles?.length ? roles[0] : "OFFICER";

  // Validation failures arrive as an array of strings with no field attached
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const createOfficerMutation = useCreateOfficer();
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormData>({
    resolver: yupResolver(schema),
    defaultValues: { role: defaultRole, region: lockedRegion ?? "" },
  });

  const selectedRole = watch("role") || defaultRole;
  const needsRegion = roleRequiresRegion(selectedRole);

  /**
   * Switching to ADMIN must not leave a stale region behind to be submitted.
   * With a locked region the value is restored rather than cleared, so it
   * survives a role change back to one of the region-scoped roles.
   */
  useEffect(() => {
    setValue("region", needsRegion ? (lockedRegion ?? "") : "");
  }, [needsRegion, setValue, lockedRegion]);

  // A reopened modal starts clean rather than showing the last attempt
  useEffect(() => {
    if (!isOpen) {
      reset({ role: defaultRole, region: lockedRegion ?? "" });
      setFormErrors([]);
    }
  }, [isOpen, reset, defaultRole, lockedRegion]);

  const handleGeneratePassword = () => {
    setValue("temporaryPassword", generatePassword());
  };

  const onSubmit = async (data: FormData) => {
    setFormErrors([]);

    // Exactly the declared keys - the API rejects any property it does not
    // know, so nothing from the form model is spread in wholesale.
    const payload: CreateOfficerRequest = {
      name: data.fullName.trim(),
      email: data.emailAddress.trim(),
      phone: data.phoneNumber.trim(),
      role: selectedRole as CreateOfficerRequest["role"],
      password: data.temporaryPassword,
    };

    // The locked region wins outright - the hidden input is a convenience,
    // not the source of truth for who the creator is
    const region = lockedRegion ?? data.region;
    if (needsRegion && region) {
      payload.region = region as BroadcastRegion;
    }

    try {
      const created = await createOfficerMutation.mutateAsync(payload);
      reset({ role: defaultRole, region: lockedRegion ?? "" });
      onSuccess?.(created);
      onClose();
    } catch (error) {
      const code = getErrorCode(error);
      const field = getErrorField(error);
      const messages = getErrorMessages(error);

      // A business rule names the input it belongs to; a pipe failure does not
      const input = field ? FIELD_TO_INPUT[field] : undefined;
      if (code && input && messages[0]) {
        setError(input, { type: "server", message: messages[0] });
        return;
      }

      setFormErrors(
        messages.length
          ? messages
          : ["Could not create this user. Please try again."],
      );
    }
  };

  const isBusy = isSubmitting || createOfficerMutation.isPending;
  const singleRole = roleOptions.length === 1;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-2">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-muted/20">
          <Text variant="body" weight="bold">
            {title ?? (singleRole ? "Add Account Officer" : "Add User")}
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

          {/* Role - omitted when the screen only ever creates one kind */}
          {singleRole ? (
            <input type="hidden" {...register("role")} />
          ) : (
            <div>
              <Select
                name="role"
                control={control}
                label="Role"
                options={roleOptions}
                error={errors.role?.message}
                placeholder="Select Role"
              />
            </div>
          )}

          {/* Region - hidden for an ADMIN, who is organisation-wide, and
              fixed for a regional admin, who creates only for their own */}
          {needsRegion && lockedRegion ? (
            <div className="mt-2 rounded-lg bg-muted/10 px-3 py-2">
              <Text variant="small" weight="semibold">
                Region
              </Text>
              <Text variant="caption" color="muted">
                {formatRegion(lockedRegion)} - accounts you create belong to
                your own region.
              </Text>
            </div>
          ) : needsRegion ? (
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
          ) : (
            <div className="mt-2 rounded-lg bg-muted/10 px-3 py-2">
              <Text variant="caption" color="muted">
                An admin works across the whole organisation and is not scoped
                to a region.
              </Text>
            </div>
          )}

          {/* Phone Number */}
          <div className="mt-2 space-y-2">
            <Text variant="small" weight="semibold">
              Phone Number
            </Text>
            <Input
              placeholder="e.g. +2348012345678"
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

          {/* Validation failures that name no single field */}
          {formErrors.length > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 space-y-1">
              {formErrors.map((message) => (
                <Text
                  key={message}
                  variant="caption"
                  weight="medium"
                  color="primary"
                >
                  {message}
                </Text>
              ))}
            </div>
          )}

          <Text variant="caption" weight="medium" color="foreground">
            The user will receive an email with their login credentials
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
              loading={isBusy}
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
