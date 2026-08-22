"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button, Text } from "../common";
import { BoldTopText } from "../common/BoldTopText";
import assignedIcon from "@/assets/icons/assigned.svg";
import completedIcon from "@/assets/icons/completed.svg";
import uploadIcon from "@/assets/icons/upload.svg";
import loadingInProgressIcon from "@/assets/icons/loading-in-progress.svg";
import {
  useLoadingQueueItem,
  useUpdateLoadingStatus,
  useCreateLoadingWaybill,
} from "@/hooks/api/useLoading";
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
  { key: "IN_PROGRESS", label: "Loading in Progress", icon: loadingInProgressIcon },
  { key: "COMPLETED", label: "Completed", icon: completedIcon },
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB, matching the UI hint

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
 * Proof of loading is OPTIONAL when marking a load in progress and REQUIRED to
 * complete one, since the waybill is the document the distributor is shown.
 */
const SelectedAssignement = ({ assignmentId }: SelectedAssignementProps) => {
  const { data, isLoading, error } = useLoadingQueueItem(assignmentId);
  const updateStatus = useUpdateLoadingStatus();
  const createWaybill = useCreateLoadingWaybill();

  const fileInputRef = useRef<HTMLInputElement>(null);
  /** The status the officer picked but has not submitted yet */
  const [stagedStatus, setStagedStatus] = useState<StagedStatus | null>(null);
  /** The chosen file, held in the browser until submit - never uploaded early */
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
  const isBusy = updateStatus.isPending || createWaybill.isPending || isUploading;

  /**
   * Pressing the primary button with nothing staged means "submit the
   * waybill", and recording a waybill completes the load - so an unstaged
   * submit is a completion and carries the completion's rules.
   */
  const targetStatus: StagedStatus = stagedStatus ?? "COMPLETED";
  const isCompleting = targetStatus === "COMPLETED";

  /** Proof already on file from an earlier visit counts towards the requirement */
  const existingAttachmentUrl = safeText(data?.attachmentUrl, "");
  const hasProof = Boolean(stagedFile || existingAttachmentUrl);

  /** The step the indicator highlights - the staged pick, else what is saved */
  const highlightedStep = stagedStatus ?? status;

  const submitHint = useMemo(() => {
    if (isCompleted) return "This load is complete.";
    if (isCompleting) {
      return hasProof
        ? "Submitting records the waybill and completes this load."
        : "Attach the proof of loading - it is required to complete a load.";
    }
    return "Submitting marks this load as Loading in Progress. Proof of loading is optional at this step.";
  }, [isCompleted, isCompleting, hasProof]);

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
    if (isBusy || isCompleted) return;
    setStagedStatus((current) => (current === next ? null : next));
  };

  /**
   * Staging only - the file is held and previewed in the browser. Uploading
   * on pick is what used to complete the load as a side effect of attaching.
   */
  const handleFilePick = (file?: File | null) => {
    if (!file) return;

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
    if (isBusy || isCompleted) return;

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

    // Completing: the waybill document is required
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
      await createWaybill.mutateAsync({
        id: assignmentId,
        body: {
          truckPlateNumber,
          driverName,
          quantityCartons,
          ...(attachmentUrl ? { attachmentUrl } : {}),
        },
      });
      toast.success("Waybill recorded. This load is now complete.");
      setStagedStatus(null);
      clearStagedFile();
    } catch {
      // useCreateLoadingWaybill already surfaced the API message
    }
  };

  const headerBadge = isCompleted
    ? "bg-[#D4FFE9] text-[#04B054]"
    : isInProgress
      ? "bg-[#4B5BD1]/20 text-[#4B5BD1]"
      : "bg-[#FFF4E1] text-[#FFA10B]";

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

      <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-2 pt-6 border-t border-muted/30 bg-white">
        <BoldTopText top="Truck" bottom={safeText(data.truckPlateNumber)} />
        <BoldTopText top="Driver" bottom={safeText(data.driverName)} />
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

      {/* -------------------------------------------------- LO-04 status */}
      <div className="p-4 bg-white my-6 rounded-xl border border-muted/20">
        <Text variant="small" color="muted" weight="semibold" className="mb-4">
          Update Status
        </Text>

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
            disabled={isBusy || isInProgress || isCompleted}
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
            disabled={isBusy || isCompleted}
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

        {stagedStatus && !isCompleted && (
          <Text variant="caption" color="orange" className="mt-3 block">
            Not saved yet - press the button below to apply this status.
          </Text>
        )}

        {isCompleted && (
          <Text variant="caption" color="muted" className="mt-3 block">
            This load is complete and can no longer be moved backwards.
          </Text>
        )}
      </div>

      {/* -------------------------------------------------- LO-05 waybill */}
      <div className="p-4 bg-white my-6 rounded-xl border border-muted/20">
        <Text variant="small" color="muted" weight="bold">
          Waybill / Loading Bill
        </Text>
        <Text variant="caption" color="muted" weight="medium" className="mb-2">
          Upload the issued document. It becomes visible in the distributor&apos;s
          mobile app. Required to complete a load, optional to mark one in
          progress.
        </Text>

        {/* Already captured on a previous visit */}
        {existingAttachmentUrl && !stagedFile && (
          <a
            href={existingAttachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            View the proof of loading already on file
          </a>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy || isCompleted}
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
        disabled={isBusy || isCompleted}
        onClick={handleSubmitWaybill}
      >
        {isCompleted ? "Completed" : "Submit Waybill"}
      </Button>

      <Text variant="caption" color="muted" className="mt-2 block text-center">
        {submitHint}
      </Text>
    </div>
  );
};

export default SelectedAssignement;
