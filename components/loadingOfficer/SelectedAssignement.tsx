"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Text, Textarea } from "../common";
import { BoldTopText } from "../common/BoldTopText";
import assignedIcon from "@/assets/icons/assigned.svg";
import completedIcon from "@/assets/icons/completed.svg";
import uploadIcon from "@/assets/icons/upload.svg";
import loadingInProgressIcon from "@/assets/icons/loading-in-progress.svg";
import {
  useLoadingQueueItem,
  useUpdateLoadingStatus,
  useCreateLoadingWaybill,
  useUpdateLoadingDescription,
} from "@/hooks/api/useLoading";
import CancelLoadingRequestModal from "@/components/CancelLoadingRequestModal";
import AttachmentPreview from "@/components/common/AttachmentPreview";
import { getStatusBadgeStyle } from "@/components/common/Table";
import { chatService } from "@/services/chat.service";
import { getErrorMessage } from "@/utils/apiError";
import { safeText, safeNumber, safeDateText, humanizeEnum } from "@/utils/safe";

interface SelectedAssignementProps {
  /** Row selected in the queue. Null before anything is chosen. */
  assignmentId: string | null;
}

/** Only forward moves are legal: ASSIGNED -> IN_PROGRESS -> COMPLETED */
const STEPS = [
  { key: "ASSIGNED", label: "Assigned", icon: assignedIcon },
  {
    key: "IN_PROGRESS",
    label: "Loading in Progress",
    icon: loadingInProgressIcon,
  },
  { key: "COMPLETED", label: "Completed", icon: completedIcon },
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB, matching the UI hint

/** Spec 39 - the note the officer leaves against a load */
const MAX_DESCRIPTION = 500;

type StagedStatus = "IN_PROGRESS" | "COMPLETED";

/**
 * One assignment, with its status control and its waybill upload.
 *
 * NOTHING here talks to the API until the primary button is pressed. Choosing
 * "Mark Loading in Progress" / "Mark Completed" only stages the intent, and
 * picking a file only previews it locally - so an officer can change their
 * mind, or attach the proof after choosing the status, without either action
 * having already been written. Attaching a file used to complete the load as
 * a side effect; now the status route and the waybill route are called from
 * one place, handleSubmitWaybill.
 *
 * Completing a load takes BOTH deliberate acts: "Mark Completed" pressed AND
 * a waybill document attached. Neither alone submits anything, and the primary
 * button stays disabled until both are true - so a load cannot be completed by
 * pressing submit with nothing chosen, and never without the document the
 * distributor is shown.
 *
 * Proof of loading stays OPTIONAL when marking a load in progress.
 */
const SelectedAssignement = ({ assignmentId }: SelectedAssignementProps) => {
  const { data, isLoading, error } = useLoadingQueueItem(assignmentId);
  const updateStatus = useUpdateLoadingStatus();
  const createWaybill = useCreateLoadingWaybill();
  const updateDescription = useUpdateLoadingDescription();

  const fileInputRef = useRef<HTMLInputElement>(null);
  /** The status the officer picked but has not submitted yet */
  const [stagedStatus, setStagedStatus] = useState<StagedStatus | null>(null);
  /** The chosen file, held in the browser until submit - never uploaded early */
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  /**
   * Spec 39 - the note being typed. Held separately from what is saved so the
   * box can be edited and abandoned; it is only sent when Save is pressed.
   */
  const [draftDescription, setDraftDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  /** Spec 39 - the cancel confirmation, which also collects the reason */
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  /**
   * Everything staged belongs to ONE assignment, so opening a different row
   * discards it. Reset during render rather than in an effect - an effect
   * would paint the previous row's staged status against the new row first.
   */
  const [stagedFor, setStagedFor] = useState<string | null>(assignmentId);
  if (stagedFor !== assignmentId) {
    setStagedFor(assignmentId);
    setStagedStatus(null);
    setStagedFile(null);
    setDraftDescription("");
    setIsEditingDescription(false);
    setIsCancelOpen(false);
  }

  /**
   * A local preview, so the officer sees what they attached without anything
   * having been uploaded. A PDF has no inline preview and falls back to a
   * labelled tile.
   */
  const previewUrl = useMemo(
    () =>
      stagedFile && stagedFile.type.startsWith("image/")
        ? URL.createObjectURL(stagedFile)
        : null,
    [stagedFile],
  );

  // An object URL has to be released or every re-pick leaks one
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const status = safeText(data?.status, "ASSIGNED").toUpperCase();
  const isCompleted = status === "COMPLETED";
  const isInProgress = status === "IN_PROGRESS";
  /**
   * Spec 39 - a load called off by the regional admin or the account officer
   * lands here as CANCELLED. It is as final as COMPLETED: nothing can be
   * staged, submitted or uploaded against it.
   */
  const isCancelled = status === "CANCELLED";
  const isClosed = isCompleted || isCancelled;

  /**
   * Spec 41: a load can no longer be called off once loading has started.
   * Cancelling mid-load would leave stock already moved with nothing to
   * account for it. ASSIGNED is still cancellable - that is a plan, not work.
   */
  const canCancel = !isClosed && !isInProgress;
  const isBusy =
    updateStatus.isPending || createWaybill.isPending || isUploading;

  /** Spec 39 - what is actually saved against this load right now */
  const savedDescription = safeText(data?.description, "");
  /**
   * Spec 42 - when the note was last written or changed.
   *
   * NOT `data.updatedAt`: a status change bumps that too, so it would date the
   * note to the moment the load was completed. Rendered only when the API
   * actually sends it (TS-1) - a wrong timestamp on a handover note is worse
   * than none, since the whole point of it is when the count was taken.
   */
  const descriptionUpdatedAt = safeText(data?.descriptionUpdatedAt, "");

  /**
   * The status to submit is ONLY ever the one that was explicitly chosen.
   *
   * It used to fall back to "COMPLETED" when nothing was staged, which meant
   * pressing submit on an untouched load completed it. Completion now requires
   * the "Mark Completed" button to have been pressed.
   */
  const targetStatus: StagedStatus | null = stagedStatus;
  const isCompleting = targetStatus === "COMPLETED";

  /**
   * Proof already on file from an earlier visit counts: it is a real uploaded
   * URL and it is what gets sent to the waybill route.
   */
  const existingAttachmentUrl = safeText(data?.attachmentUrl, "");
  const hasProof = Boolean(stagedFile || existingAttachmentUrl);

  /**
   * The two conditions completion needs, together. Marking a load in progress
   * needs only the status.
   */
  const canSubmit =
    !isBusy &&
    !isClosed &&
    (targetStatus === "IN_PROGRESS" || (isCompleting && hasProof));

  /** The step the indicator highlights - the staged pick, else what is saved */
  const highlightedStep = stagedStatus ?? status;

  const submitHint = useMemo(() => {
    if (isCancelled) {
      return "This load was cancelled and can no longer be worked on.";
    }
    if (isCompleted) return "This load is complete.";
    if (!targetStatus) {
      return "Choose a status above - a load is never submitted without one.";
    }
    if (isCompleting) {
      return hasProof
        ? "Submitting records the waybill and completes this load."
        : "Attach the proof of loading - it is required to complete a load.";
    }
    return "Submitting marks this load as Loading in Progress. Proof of loading is optional at this step.";
  }, [isCancelled, isCompleted, isCompleting, hasProof, targetStatus]);

  if (!assignmentId) {
    return (
      <div className="p-6 bg-white rounded-xl border border-muted/20 text-center">
        <Text variant="caption" color="muted">
          Select an assignment to see its details.
        </Text>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-muted/20 text-center">
        <Text variant="caption" color="muted">
          Loading assignment...
        </Text>
      </div>
    );
  }

  // 403 (another officer's load) and 404 both land here - the API message is
  // renderable, so show it rather than a generic failure.
  if (error || !data) {
    return (
      <div className="p-6 bg-white rounded-xl border border-muted/20 text-center">
        <Text variant="caption" color="muted">
          {getErrorMessage(error) || "This assignment could not be loaded."}
        </Text>
      </div>
    );
  }

  /**
   * Staging only. The API is untouched until the primary button is pressed,
   * so a mis-click costs nothing - pressing the same button again clears it.
   */
  const stageStatus = (next: StagedStatus) => {
    if (isBusy || isClosed) return;
    setStagedStatus((current) => (current === next ? null : next));
  };

  /**
   * Spec 39 - the loading officer calling off their own load.
   *
   * Goes through PATCH /loading/queue/{id}/status with CANCELLED, which takes
   * the same optional `reason` as the regional admin's and account officer's
   * /cancel routes. Blank reasons are dropped rather than sent as "", so
   * "no reason recorded" stays distinguishable from "the reason was blank".
   *
   * Deliberately NOT staged like the two forward moves: cancelling is
   * destructive and irreversible from this portal, so it is confirmed in a
   * modal that names the load and sent in one deliberate act, rather than left
   * sitting as an intent a later Submit could apply by accident.
   *
   * Only the DISTRIBUTOR is notified on this path - telling an officer about
   * their own action is noise. The other two roles' cancellations notify the
   * assigned loading officer as well.
   */
  const handleCancelLoad = async (reason: string) => {
    if (isBusy || !canCancel || !assignmentId) return;

    try {
      await updateStatus.mutateAsync({
        id: assignmentId,
        body: { status: "CANCELLED", ...(reason ? { reason } : {}) },
      });
      setIsCancelOpen(false);
      setStagedStatus(null);
      clearStagedFile();
      toast.success("Loading request cancelled.");
    } catch {
      // useUpdateLoadingStatus already surfaced the API message, including the
      // 409 "A completed load cannot be reopened."
    }
  };

  /**
   * Spec 39 - save the note. It is independent of the status, so it can be
   * written while a load is in progress and corrected afterwards. Clearing the
   * box saves an empty note rather than being refused - a wrong note left in
   * place would be worse than none.
   */
  const handleSaveDescription = async () => {
    if (!assignmentId || updateDescription.isPending) return;

    const description = draftDescription.trim();
    if (description === savedDescription) {
      setIsEditingDescription(false);
      return;
    }

    try {
      await updateDescription.mutateAsync({
        id: assignmentId,
        body: { description },
      });
      setIsEditingDescription(false);
      toast.success(description ? "Description saved." : "Description cleared.");
    } catch {
      // useUpdateLoadingDescription already surfaced the API message
    }
  };

  /**
   * Staging only - the file is held and previewed in the browser. Uploading
   * on pick is what used to complete the load as a side effect of attaching.
   */
  const handleFilePick = (file?: File | null) => {
    if (!file || isClosed) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File must be 10MB or smaller.");
      setStagedFile(null);
      return;
    }

    setStagedFile(file);
  };

  /**
   * The file input is keyed on what is staged, so dropping the file remounts
   * it empty - which is what lets the same file be picked again afterwards.
   */
  const clearStagedFile = () => setStagedFile(null);

  /**
   * The one place either route is called.
   *
   *   IN_PROGRESS -> PATCH /loading/queue/{id}/status. The status route takes
   *     no attachment, so a staged file is deliberately left staged rather
   *     than uploaded into nothing - it is still there to complete with.
   *   COMPLETED   -> upload the proof, then POST /loading/queue/{id}/waybill,
   *     which records the document AND completes the load in one call.
   */
  const handleSubmitWaybill = async () => {
    if (isBusy || isClosed) return;

    // Both guards mirror `canSubmit`, which already disables the button. They
    // are here because a disabled button is a UI affordance, not a rule.
    if (!targetStatus) {
      toast.error("Choose a status before submitting this load.");
      return;
    }

    if (!isCompleting) {
      try {
        await updateStatus.mutateAsync({
          id: assignmentId,
          body: { status: "IN_PROGRESS" },
        });
        setStagedStatus(null);
        toast.success("Loading started.");
      } catch {
        // useUpdateLoadingStatus already surfaced the API message
      }
      return;
    }

    // Completing: the waybill document is required, and it is what the
    // endpoint is called with
    if (!hasProof) {
      toast.error("Attach the proof of loading before completing this load.");
      return;
    }

    const truckPlateNumber = safeText(data.truckPlateNumber, "");
    const driverName = safeText(data.driverName, "");
    const quantityCartons = safeNumber(data.quantityCartons, 0);

    if (!truckPlateNumber || !driverName || quantityCartons <= 0) {
      toast.error(
        "This load is missing truck, driver or quantity details. Contact your regional admin.",
      );
      return;
    }

    let attachmentUrl = existingAttachmentUrl;

    if (stagedFile) {
      setIsUploading(true);
      try {
        // POST /uploads requires the Authorization header - chatService uses
        // apiClient, whose interceptor attaches it automatically.
        const uploaded = await chatService.uploadFile(
          stagedFile,
          "waybill-documents",
        );
        if (!uploaded) throw new Error("Upload did not return a URL");
        attachmentUrl = uploaded;
      } catch (uploadError) {
        toast.error(
          getErrorMessage(uploadError) || "Could not upload that file.",
        );
        return;
      } finally {
        setIsUploading(false);
      }
    }

    try {
      // `hasProof` was checked above, so by here there is always a URL - the
      // load is never completed with an empty attachment
      if (!attachmentUrl) {
        toast.error("The proof of loading could not be attached. Try again.");
        return;
      }

      await createWaybill.mutateAsync({
        id: assignmentId,
        body: {
          truckPlateNumber,
          driverName,
          quantityCartons,
          attachmentUrl,
        },
      });
      toast.success("Waybill recorded. This load is now complete.");
      setStagedStatus(null);
      clearStagedFile();
    } catch {
      // useCreateLoadingWaybill already surfaced the API message
    }
  };

  /**
   * From the SHARED palette rather than a local ladder, so this load's badge
   * matches the one on the regional admin's table for the same request. The
   * local version left ASSIGNED on the fallback amber, which now reads as
   * "pending" everywhere else.
   */
  const headerBadgeStyle = getStatusBadgeStyle(humanizeEnum(status, "Assigned"));
  const headerBadge = `${headerBadgeStyle.bgColor} ${headerBadgeStyle.textColor}`;

  return (
    <div>
      <div className="p-4 bg-white rounded-xl space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Text variant="caption" color="muted" weight="normal">
            <span>{safeText(data.waybill, "-")}</span>
            {/* On /loading/queue, orderId IS the ERP order reference */}
            <span className="ml-5">{safeText(data.orderId, "-")}</span>
          </Text>

          <span
            className={`p-1 text-[12px] font-medium rounded whitespace-nowrap ${headerBadge}`}
          >
            {humanizeEnum(status, "Assigned")}
          </span>
        </div>

        <Text variant="body" color="foreground" weight="bold">
          {safeText(data.distributorName, "Unknown distributor")}
        </Text>

        <Text variant="caption" color="muted" weight="normal">
          {safeText(data.region, "No region")} -{" "}
          {safeDateText(data.submittedAt, "No submission date")}
        </Text>
      </div>

      <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-5 gap-2 pt-6 border-t border-muted/30 bg-white">
        <BoldTopText top="Truck" bottom={safeText(data.truckPlateNumber)} />
        <BoldTopText top="Driver" bottom={safeText(data.driverName)} />
        {/* Spec 43 - the officer has to reach the driver at the gate, and the
            number was on the record but never shown */}
        <BoldTopText
          top="Driver Phone"
          bottom={safeText(data.driverPhone)}
        />
        <BoldTopText
          top="Loading Date"
          bottom={safeDateText(data.loadingDate)}
        />
        <BoldTopText
          top="Quantity"
          bottom={
            data.quantityCartons != null
              ? `${safeNumber(data.quantityCartons)} cartons`
              : "N/A"
          }
        />
      </div>

      {/* description section  */}
      {/*
        Spec 39: the loading officer's own note on this load - what was
        actually loaded, and what is still owed. It is saved on its own
        endpoint, so writing one never moves the status, and it is what the
        DESCRIPTION column on the regional admin / account officer table shows.
      */}
      <div className="p-4 bg-white my-6 rounded-xl border border-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Text variant="small" color="muted" weight="bold">
              Description
            </Text>
            <Text variant="caption" color="muted" weight="medium">
              e.g. customer loading 800 cartons on 26/08/2026, remaining a
              balance of 200 cartons
            </Text>
            {/* Spec 42 - when this note was last touched */}
            {savedDescription && descriptionUpdatedAt && (
              <Text variant="thinnote" color="muted" className="mt-1 block">
                Last updated {safeDateText(descriptionUpdatedAt, "-")}
              </Text>
            )}
          </div>

          {!isEditingDescription && !isCancelled && (
            <Button
              variant="outline"
              size="xs"
              disabled={updateDescription.isPending}
              onClick={() => {
                setDraftDescription(savedDescription);
                setIsEditingDescription(true);
              }}
              className="border-muted/30 whitespace-nowrap"
            >
              {savedDescription ? "Edit" : "Add description"}
            </Button>
          )}
        </div>

        {isEditingDescription ? (
          <div className="mt-3 space-y-2">
            <Textarea
              label="Loading description"
              name="loadingDescription"
              value={draftDescription}
              placeholder="What was loaded, and what is still outstanding?"
              maxLength={MAX_DESCRIPTION}
              onChange={(value: string) => setDraftDescription(value)}
              disabled={updateDescription.isPending}
              className="min-h-24 rounded-md"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="xs"
                disabled={updateDescription.isPending}
                onClick={() => {
                  setIsEditingDescription(false);
                  setDraftDescription("");
                }}
                className="border-muted/30"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="xs"
                loading={updateDescription.isPending}
                onClick={handleSaveDescription}
              >
                Save Description
              </Button>
            </div>
          </div>
        ) : (
          <Text
            variant="caption"
            color={savedDescription ? "foreground" : "muted"}
            weight="medium"
            className="mt-3 block whitespace-pre-wrap"
          >
            {savedDescription || "No description has been added for this load."}
          </Text>
        )}
      </div>

      {/* -------------------------------------------------- LO-04 status */}
      <div className="p-4 bg-white my-6 rounded-xl border border-muted/20">
        <Text variant="small" color="muted" weight="semibold" className="mb-4">
          Update Status
        </Text>
        {/* steps section  */}
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((step) => {
            const isActive = step.key === highlightedStep;
            // A staged step is highlighted but dashed - it is a choice, not a
            // saved state, until the primary button is pressed
            const isStaged = isActive && step.key === stagedStatus;
            return (
              <div
                key={step.key}
                className={`flex items-center py-2 justify-center gap-1 rounded-md ${
                  isActive
                    ? isStaged
                      ? "border border-dashed border-blue-700 bg-blue-700/80"
                      : "border border-blue-700 bg-blue-700"
                    : "border border-muted/30 bg-gray-100"
                }`}
              >
                <Image
                  src={step.icon}
                  alt={step.label}
                  width={40}
                  height={40}
                  className="w-3 h-3"
                />
                <Text
                  variant="caption"
                  color={isActive ? "white" : "muted"}
                  weight="medium"
                >
                  {step.label}
                </Text>
              </div>
            );
          })}
        </div>

        {/* Backward moves are rejected server-side, so disable them here too */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            variant="outline"
            disabled={isBusy || isInProgress || isClosed}
            onClick={() => stageStatus("IN_PROGRESS")}
            className={`w-full ${
              stagedStatus === "IN_PROGRESS"
                ? "border-blue-700 bg-blue-700/10"
                : "border-muted/30 bg-white"
            }`}
          >
            Mark Loading in Progress
          </Button>
          <Button
            variant="outline"
            disabled={isBusy || isClosed}
            onClick={() => stageStatus("COMPLETED")}
            className={`w-full ${
              stagedStatus === "COMPLETED"
                ? "border-blue-700 bg-blue-700/10"
                : "border-muted/30 bg-white"
            }`}
          >
            Mark Completed
          </Button>
        </div>

        {/*
          Spec 39: cancelling this load. Kept out of the two-button row above
          because it is not a third status to stage - it is confirmed and sent
          on the spot, so a staged intent can never be applied by accident.
        */}
        {/* Spec 41 - gone entirely once loading is under way, rather than
            shown disabled: there is no state this load can return to in which
            pressing it would work, so an inert button is just noise */}
        {canCancel && (
          <Button
            variant="outline"
            fullWidth
            disabled={isBusy}
            onClick={() => setIsCancelOpen(true)}
            className="mt-2 border-primary text-primary hover:bg-primary/5"
          >
            Cancel Loading Request
          </Button>
        )}

        {isInProgress && !isClosed && (
          <Text variant="caption" color="muted" className="mt-3 block">
            This load is already being loaded and can no longer be cancelled.
            Complete it, or speak to your regional admin.
          </Text>
        )}

        {/* Same confirmation the regional admin and account officer get */}
        <CancelLoadingRequestModal
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          onConfirm={handleCancelLoad}
          isSubmitting={updateStatus.isPending}
          distributor={safeText(data.distributorName, "Unknown distributor")}
          waybill={safeText(data.waybill, "-")}
          officer="You"
          status={humanizeEnum(status, "Assigned")}
          subtitle="The distributor is notified immediately."
        />

        {stagedStatus && !isClosed && (
          <Text variant="caption" color="orange" className="mt-3 block">
            Not saved yet - press the button below to apply this status.
          </Text>
        )}

        {isCompleted && (
          <Text variant="caption" color="muted" className="mt-3 block">
            This load is complete and can no longer be moved backwards.
          </Text>
        )}

        {isCancelled && (
          <Text variant="caption" color="muted" className="mt-3 block">
            This load was cancelled. It cannot be reopened here - the
            distributor has to submit a new request.
          </Text>
        )}
      </div>

      {/* -------------------------------------------------- LO-05 waybill */}
      <div className="p-4 bg-white my-6 rounded-xl border border-muted/20">
        <Text variant="small" color="muted" weight="bold">
          Waybill / Loading Bill
        </Text>
        <Text variant="caption" color="muted" weight="medium" className="mb-2">
          Upload the issued document. It becomes visible in the
          distributor&apos;s mobile app. Required to complete a load, optional
          to mark one in progress.
        </Text>

        {/* Already captured on a previous visit - spec 43 shows the proof
            rather than describing it, so it can be checked at a glance */}
        {existingAttachmentUrl && !stagedFile && (
          <div className="mt-2">
            <Text variant="thinnote" color="muted" className="mb-1 block">
              Proof of loading already on file
            </Text>
            <AttachmentPreview url={existingAttachmentUrl} size="sm" />
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy || isClosed}
          className="mt-4 w-full cursor-pointer border border-dashed rounded-xl border-muted p-4 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="flex-col items-center justify-center flex gap-2 space-y-2">
            <Image
              src={uploadIcon}
              alt="Upload"
              width={60}
              height={60}
              className="w-5 h-5 mt-3"
            />
            <Text variant="caption" color="foreground" weight="medium">
              {isUploading
                ? "Uploading..."
                : stagedFile?.name || "Drop file or click to upload"}
            </Text>
            <Text variant="thinnote" color="muted" weight="medium">
              PDF, JPG, PNG - up to 10MB
            </Text>
          </div>
        </button>

        {/* Local preview - nothing has been sent anywhere yet */}
        {stagedFile && (
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-muted/20 p-3">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={stagedFile.name}
                className="h-20 w-20 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md bg-gray-100">
                <Text variant="caption" color="muted" weight="medium">
                  PDF
                </Text>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <Text variant="caption" color="foreground" weight="medium">
                {stagedFile.name}
              </Text>
              <Text variant="thinnote" color="muted" className="block">
                Attached but not uploaded - it is sent when you submit.
              </Text>
              <button
                type="button"
                onClick={clearStagedFile}
                disabled={isBusy}
                className="mt-1 text-primary underline text-xs disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <input
          key={`${assignmentId}-${stagedFile?.name ?? "empty"}`}
          ref={fileInputRef}
          hidden
          type="file"
          name="waybill"
          id="waybill"
          accept="image/*,application/pdf"
          onChange={(event) => handleFilePick(event.target.files?.[0])}
        />
      </div>

      <Button
        variant="primary"
        fullWidth
        loading={isBusy}
        disabled={!canSubmit}
        onClick={handleSubmitWaybill}
      >
        {isCancelled
          ? "Cancelled"
          : isCompleted
            ? "Completed"
            : isCompleting
              ? "Complete Loading"
              : "Submit Waybill"}
      </Button>

      <Text variant="caption" color="muted" className="mt-2 block text-center">
        {submitHint}
      </Text>
    </div>
  );
};

export default SelectedAssignement;
