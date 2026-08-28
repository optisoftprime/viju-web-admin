"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button, Input, Modal, Select, Text } from "./common";
import { useUpdateOfficerProfile } from "@/hooks/api/useOfficer";
import { REGIONS } from "@/constants/regions";
import { formatRegion } from "@/utils/formatter";
import { formatRole, roleRequiresRegion } from "@/constants/roles";
import type {
  BroadcastRegion,
  UpdateOfficerProfileRequest,
} from "@/lib/api/types";
import { getErrorCode, getErrorField, getErrorMessages } from "@/utils/apiError";

export interface EditableUser {
  id: string;
  name: string;
  /** Wire role value, e.g. "OFFICER" - decides whether region is editable */
  roleValue?: string | null;
  /** API enum, not the display label */
  regionValue?: string | null;
  phone?: string | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: EditableUser | null;
  onSuccess?: () => void;
  /**
   * Spec 40: a REGIONAL_ADMIN edits staff in their OWN region and cannot move
   * one out of it, so the picker is replaced by a statement of fact.
   */
  lockedRegion?: BroadcastRegion;
}

/** Same shape the create form validates against - the API is the same route */
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,19}$/;

const schema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required("Full Name is required")
    .min(2, "Full Name must be at least 2 characters")
    .max(120, "Full Name must be at most 120 characters"),
  region: yup.string(),
  phoneNumber: yup
    .string()
    .trim()
    .required("Phone Number is required")
    .matches(PHONE_PATTERN, "Enter a valid phone number, e.g. +2348012345678"),
  /**
   * Optional on an EDIT. Leaving it blank keeps the current password - a
   * required field here would force a credential rotation on every name fix.
   */
  password: yup
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  confirmPassword: yup
    .string()
    .transform((value) => (value === "" ? undefined : value))
    .oneOf([yup.ref("password"), undefined], "Passwords must match"),
});

type FormValues = {
  fullName: string;
  region: string | undefined;
  phoneNumber: string;
  password: string | undefined;
  confirmPassword: string | undefined;
};

type FormData = yup.InferType<typeof schema>;

/** Maps the API's `field` onto the control that holds it */
const FIELD_TO_INPUT: Record<string, keyof FormValues> = {
  name: "fullName",
  phone: "phoneNumber",
  region: "region",
  password: "password",
};

/**
 * Spec 39: edit a user from the Users table.
 *
 * Exactly the four fields the spec names - Full Name, Region, Phone Number and
 * Password. Email and role are deliberately absent: email is the sign-in
 * identity and role decides what the account can reach, so neither is a field
 * you change on the way past in a table.
 *
 * ONLY WHAT CHANGED IS SENT. An untouched password is not resubmitted (it
 * would rotate a credential nobody asked to rotate) and an ADMIN never sends a
 * region at all, since the API refuses one for an organisation-wide account.
 */
export default function EditUserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
  lockedRegion,
}: EditUserModalProps) {
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const updateMutation = useUpdateOfficerProfile();

  const needsRegion = roleRequiresRegion(user?.roleValue);

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: "",
      region: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Which user the form currently holds. Reset during render rather than in
   * an effect - the previous attempt's errors would otherwise be painted
   * against the newly opened user for one frame before being cleared.
   */
  const loadedKey = isOpen ? (user?.id ?? "") : "";
  const [formKey, setFormKey] = useState(loadedKey);
  if (formKey !== loadedKey) {
    setFormKey(loadedKey);
    setFormErrors([]);
  }

  /**
   * Load the selected user into the form. Keyed on the id as well as `isOpen`
   * so opening a different row while the modal is mounted does not leave the
   * previous user's values in the inputs. `reset` belongs in an effect - it
   * notifies react-hook-form's subscribers and is not safe during render.
   */
  useEffect(() => {
    if (!isOpen || !user) return;

    reset({
      fullName: user.name ?? "",
      region: user.regionValue ?? "",
      // "-" is the table's empty marker, not a phone number
      phoneNumber: user.phone && user.phone !== "-" ? user.phone : "",
      password: "",
      confirmPassword: "",
    });
  }, [isOpen, user, reset]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setFormErrors([]);

    const body: UpdateOfficerProfileRequest = {};

    const name = data.fullName.trim();
    if (name && name !== user.name) body.name = name;

    const phone = data.phoneNumber.trim();
    if (phone && phone !== (user.phone ?? "")) body.phone = phone;

    /**
     * With a locked region there is nothing to change - the user is already in
     * it, and sending it would be a no-op at best. Left out entirely so an
     * edit that only touched the name does not carry a region it did not mean
     * to assert.
     */
    if (
      needsRegion &&
      !lockedRegion &&
      data.region &&
      data.region !== (user.regionValue ?? "")
    ) {
      body.region = data.region as BroadcastRegion;
    }

    if (data.password) body.password = data.password;

    // Nothing to send is not an error - it is a no-op, and saying so is
    // clearer than a request that returns 200 having changed nothing
    if (Object.keys(body).length === 0) {
      setFormErrors(["Nothing has been changed yet."]);
      return;
    }

    try {
      await updateMutation.mutateAsync({ officerId: user.id, body });
      onSuccess?.();
      onClose();
    } catch (error) {
      const code = getErrorCode(error);
      const field = getErrorField(error);
      const messages = getErrorMessages(error);

      const input = field ? FIELD_TO_INPUT[field] : undefined;
      if (code && input && messages[0]) {
        setError(input, { type: "server", message: messages[0] });
        return;
      }

      setFormErrors(
        messages.length
          ? messages
          : ["Could not update this user. Please try again."],
      );
    }
  };

  const isBusy = isSubmitting || updateMutation.isPending;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-4 border-b border-muted/20">
          <div>
            <Text variant="body" weight="bold">
              Edit User
            </Text>
            <Text variant="caption" color="muted">
              {user?.name}
              {user?.roleValue ? ` - ${formatRole(user.roleValue)}` : ""}
            </Text>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
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

          {/* Region - an ADMIN is organisation-wide and the API refuses one;
              a regional admin cannot move anyone out of their own region */}
          {needsRegion && lockedRegion ? (
            <div className="mt-2 rounded-lg bg-muted/10 px-3 py-2">
              <Text variant="small" weight="semibold">
                Region
              </Text>
              <Text variant="caption" color="muted">
                {formatRegion(lockedRegion)} - you can only manage staff in your
                own region.
              </Text>
            </div>
          ) : needsRegion ? (
            <div>
              <Select
                name="region"
                control={control}
                label="Region"
                options={REGIONS}
                error={errors.region?.message}
                placeholder="Select Region"
              />
              {/*
                The backend found officers sitting outside the region their
                customers are in - a live consequence of this control. Moving
                an officer does NOT move their book, and the reassign route
                requires the officer to be in the CUSTOMER's region, so any
                customer left behind can no longer be reassigned to them.
                Said here rather than discovered later; the bulk modal has
                carried the same warning since spec 39.
              */}
              <Text variant="thinnote" color="orange" className="block -mt-1">
                Changing a region does not move this user&apos;s customers. Any
                they hold in the old region will need reassigning separately.
              </Text>
            </div>
          ) : (
            <div className="mt-2 rounded-lg bg-muted/10 px-3 py-2">
              <Text variant="caption" color="muted">
                An admin works across the whole organisation and is not scoped
                to a region.
              </Text>
            </div>
          )}

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

          <div>
            <Text variant="small" weight="semibold">
              New Password
            </Text>
            <Input
              type="password"
              placeholder="Leave blank to keep the current password"
              {...register("password")}
              error={errors.password?.message}
            />
          </div>

          <div>
            <Text variant="small" weight="semibold">
              Confirm New Password
            </Text>
            <Input
              type="password"
              placeholder="Repeat the new password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
          </div>

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

          <Text variant="caption" weight="medium" color="muted">
            Only the fields you change are sent. A blank password leaves the
            current one in place.
          </Text>

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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
