"use client";

import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { MainLayout, Card, Button, Input, Text } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import ArrowBack from "@/components/common/ArrowBack";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateProfilePhoto, useChangePassword } from "@/hooks/api/useAuth";
import { formatRole } from "@/constants/roles";
import { formatRegion } from "@/utils/formatter";
import { safeText } from "@/utils/safe";
import PasswordStrengthMeter from "@/components/common/PasswordStrengthMeter";
import {
  assessPassword,
  PASSWORD_REQUIREMENT_TEXT,
} from "@/utils/passwordStrength";
import {
  validateImageFile,
  IMAGE_ACCEPT_ATTRIBUTE,
  IMAGE_TYPES_LABEL,
} from "@/utils/imageValidation";
import {
  getErrorCode,
  getErrorField,
  getErrorMessages,
} from "@/utils/apiError";

/** Matches the upload limit the chat composer already applies */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const passwordSchema = yup.object({
  currentPassword: yup.string().required("Enter your current password"),
  newPassword: yup
    .string()
    .required("Enter a new password")
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    /**
     * Spec 43: a weak password cannot be submitted at all.
     *
     * Enforced in the schema rather than only by disabling the button - a
     * disabled button is an affordance, and this is a rule. The message is
     * deliberately the requirement itself, so a form submitted by keyboard
     * still says what is wrong.
     */
    .test(
      "password-strength",
      PASSWORD_REQUIREMENT_TEXT,
      (value) => assessPassword(value ?? "").isAcceptable,
    )
    .notOneOf(
      [yup.ref("currentPassword")],
      "The new password must be different from the current one",
    ),
  confirmNewPassword: yup
    .string()
    .required("Confirm the new password")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

type PasswordForm = yup.InferType<typeof passwordSchema>;

/**
 * The API's `field` onto the input that holds it.
 *
 * Both password failures now carry `field` themselves, so this is only the
 * translation from wire name to form name - not a guess from the code. The
 * code map below stays as the fallback for a response that omits it.
 */
const FIELD_TO_INPUT: Record<string, keyof PasswordForm> = {
  currentPassword: "currentPassword",
  newPassword: "newPassword",
};

const CODE_TO_FIELD: Record<string, keyof PasswordForm> = {
  INVALID_CURRENT_PASSWORD: "currentPassword",
  PASSWORD_REUSED: "newPassword",
};

/**
 * An ERP-mirrored account has no local password hash, so there is nothing for
 * the current-password box to be checked against. That is not a wrong entry -
 * it is the wrong flow - so it is said as such rather than shown against a
 * field the person cannot fix by retyping.
 */
const NO_PASSWORD_SET = "NO_PASSWORD_SET";

function ProfilePageContent() {
  const { user } = useAuthStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const photoMutation = useUpdateProfilePhoto();
  const passwordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: yupResolver(passwordSchema) });

  /**
   * Drives the meter; the schema is what actually blocks a weak password.
   *
   * `useWatch` rather than `watch()` - the latter returns a fresh function on
   * every render, which the React Compiler cannot memoise around, so it bails
   * out of optimising this whole component.
   */
  const newPassword = useWatch({ control, name: "newPassword" }) ?? "";
  const isPasswordStrong = assessPassword(newPassword).isAcceptable;

  const name = safeText(user?.name, "User");
  const photoUrl = user?.profilePhotoUrl?.trim() || "";

  /**
   * Spec 42: validate by MAGIC NUMBER before anything is uploaded.
   *
   * The `accept` attribute and `File.type` are both derived from the file
   * name, so a renamed PDF passes both. Reading the header is the only way to
   * know what the bytes actually are - and rejecting here means the user gets
   * a specific message instead of a round trip and a generic 400.
   */
  const handleFilePick = async (file?: File | null) => {
    if (!file) return;

    setPhotoError(null);

    const result = await validateImageFile(file, {
      maxBytes: MAX_PHOTO_BYTES,
    });

    if (!result.ok) {
      setPhotoError(result.error ?? "That file could not be used.");
      return;
    }

    try {
      await photoMutation.mutateAsync(file);
      toast.success("Profile picture updated.");
    } catch (error) {
      const messages = getErrorMessages(error);
      setPhotoError(
        messages[0] ?? "Could not update your picture. Please try again.",
      );
    }
  };

  const onChangePassword = async (values: PasswordForm) => {
    setPasswordErrors([]);
    setPasswordChanged(false);

    try {
      await passwordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      // Cleared on success so the values are not left sitting in the DOM
      reset({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setPasswordChanged(true);
      toast.success("Password changed.");
    } catch (error) {
      const code = getErrorCode(error);
      const messages = getErrorMessages(error);

      /**
       * This account signs in against the ERP and has no password here to
       * prove knowledge of. Pointing at a box would be misleading - the answer
       * is a different flow entirely.
       */
      if (code === NO_PASSWORD_SET) {
        setPasswordErrors([
          messages[0] ??
            "This account has no password set here.",
          'Sign out and use "Forgot password" to set one.',
        ]);
        return;
      }

      // The response names the field; the code map is the fallback for one
      // that does not
      const wireField = getErrorField(error);
      const input =
        (wireField ? FIELD_TO_INPUT[wireField] : undefined) ??
        (code ? CODE_TO_FIELD[code] : undefined);

      // A wrong current password belongs on that input, not in a toast - the
      // person needs to see which of the three boxes to correct
      if (input && messages[0]) {
        setError(input, { type: "server", message: messages[0] });
        return;
      }

      setPasswordErrors(
        messages.length
          ? messages
          : ["Could not change your password. Please try again."],
      );
    }
  };

  const isUploading = photoMutation.isPending;
  const isSavingPassword = isSubmitting || passwordMutation.isPending;

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        <ArrowBack />
        <PageHeader
          title="My Profile"
          subtitle="Your picture and your password"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ---------------------------------------------- profile picture */}
          <Card border={false}>
            <Text variant="body" weight="bold" color="foreground">
              Profile Picture
            </Text>
            <Text variant="caption" color="muted" className="mt-1 block">
              {IMAGE_TYPES_LABEL}, up to 5MB.
            </Text>

            <div className="flex items-center gap-4 mt-5">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border border-muted/20"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold uppercase"
                >
                  {name.charAt(0)}
                </span>
              )}

              <div className="min-w-0">
                <Text variant="caption" weight="bold" color="foreground">
                  {name}
                </Text>
                <Text variant="thinnote" color="muted" className="block">
                  {formatRole(user?.role, "Staff")}
                  {user?.region ? ` - ${formatRegion(user.region)}` : ""}
                </Text>

                <Button
                  variant="outline"
                  size="xs"
                  loading={isUploading}
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 border-muted/30"
                >
                  {photoUrl ? "Change picture" : "Upload picture"}
                </Button>
              </div>
            </div>

            {photoError && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                <Text variant="caption" weight="medium" color="primary">
                  {photoError}
                </Text>
              </div>
            )}

            <input
              // Re-keyed on the current photo so picking the SAME file again
              // after a rejection still fires onChange
              key={photoUrl || "empty"}
              ref={fileInputRef}
              hidden
              type="file"
              name="profilePhoto"
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              onChange={(event) => handleFilePick(event.target.files?.[0])}
            />

            <Text variant="thinnote" color="muted" className="mt-4 block">
              The file is checked by its contents, not its name - renaming a
              file does not change its format.
            </Text>
          </Card>

          {/* ---------------------------------------------------- password */}
          <Card border={false}>
            <Text variant="body" weight="bold" color="foreground">
              Change Password
            </Text>
            <Text variant="caption" color="muted" className="mt-1 block">
              Enter your current password to confirm it is you. Forgotten it?
              Sign out and use &quot;Forgot password&quot; instead.
            </Text>

            <form
              onSubmit={handleSubmit(onChangePassword)}
              className="space-y-1 mt-4"
            >
              <div>
                <Text variant="small" weight="semibold">
                  Current Password
                </Text>
                <Input
                  type="password"
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  {...register("currentPassword")}
                  error={errors.currentPassword?.message}
                />
              </div>

              <div>
                <Text variant="small" weight="semibold">
                  New Password
                </Text>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  {...register("newPassword")}
                  error={errors.newPassword?.message}
                />
                {/* Spec 43 - red / yellow / green, with the rules named */}
                <PasswordStrengthMeter value={newPassword} className="-mt-3" />
              </div>

              <div>
                <Text variant="small" weight="semibold">
                  Confirm New Password
                </Text>
                <Input
                  type="password"
                  placeholder="Repeat the new password"
                  autoComplete="new-password"
                  {...register("confirmNewPassword")}
                  error={errors.confirmNewPassword?.message}
                />
              </div>

              {passwordErrors.length > 0 && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 space-y-1">
                  {passwordErrors.map((message) => (
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

              {/*
                Spec 42 §4, confirmed: changing a password does NOT invalidate
                other sessions - refresh tokens are untouched on every device.
                So nothing is said about other devices and the current session
                is deliberately left signed in. If that behaviour ever changes,
                this notice is where the warning belongs.
              */}
              {passwordChanged && (
                <div className="rounded-lg border border-[#04B054]/30 bg-[#D4FFE9] px-3 py-2">
                  <Text variant="caption" weight="medium" color="statusgreen">
                    Your password has been changed. Use it the next time you
                    sign in - you are still signed in here.
                  </Text>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  variant="primary"
                  type="submit"
                  loading={isSavingPassword}
                  // The schema refuses a weak password either way; this just
                  // stops the reader finding out by pressing the button
                  disabled={!isPasswordStrong || isSavingPassword}
                  className="bg-linear-to-r from-primary via-orange to-primary"
                >
                  Change Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

/**
 * Spec 42: profile self-service.
 *
 * Open to every signed-in role rather than the three the spec names - an admin
 * has a picture and a password too, and gating them out would be an
 * inconsistency to explain rather than a rule to enforce. Nothing here reaches
 * another user's record; both routes act on the token's own account.
 */
export default function ProfilePage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
