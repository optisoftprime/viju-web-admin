"use client";

import { useEffect, useRef, useState } from "react";
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

const SelectedAssignement = ({ assignmentId }: SelectedAssignementProps) => {
  const { data, isLoading, error } = useLoadingQueueItem(assignmentId);
  const updateStatus = useUpdateLoadingStatus();
  const createWaybill = useCreateLoadingWaybill();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Reset the staged upload whenever a different assignment is opened
  useEffect(() => {
    setAttachmentUrl(null);
    setAttachmentName("");
  }, [assignmentId]);

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

  const status = safeText(data.status, "ASSIGNED").toUpperCase();
  const isCompleted = status === "COMPLETED";
  const isInProgress = status === "IN_PROGRESS";
  const isBusy = updateStatus.isPending || createWaybill.isPending || isUploading;

  const advance = async (next: "IN_PROGRESS" | "COMPLETED") => {
    if (isBusy) return;
    try {
      await updateStatus.mutateAsync({
        id: assignmentId,
        body: { status: next },
      });
      toast.success(
        next === "COMPLETED" ? "Load marked complete." : "Loading started.",
      );
    } catch {
      // useUpdateLoadingStatus already surfaced the API message
    }
  };

  const handleFilePick = async (file?: File | null) => {
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File must be 10MB or smaller.");
      return;
    }

    setIsUploading(true);
    try {
      // POST /uploads now requires the Authorization header - chatService uses
      // apiClient, whose interceptor attaches it automatically.
      const url = await chatService.uploadFile(file, "waybill-documents");
      if (!url) throw new Error("Upload did not return a URL");
      setAttachmentUrl(url);
      setAttachmentName(file.name);
      toast.success("Proof of loading attached.");
    } catch (uploadError) {
      toast.error(
        getErrorMessage(uploadError) || "Could not upload that file.",
      );
    } finally {
      setIsUploading(false);
      // Allow re-picking the same file after a failure
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /**
   * LO-05 - recording the waybill ALSO completes the load, so there is no
   * follow-up call to the status route.
   */
  const handleSubmitWaybill = async () => {
    if (isBusy) return;

    const truckPlateNumber = safeText(data.truckPlateNumber, "");
    const driverName = safeText(data.driverName, "");
    const quantityCartons = safeNumber(data.quantityCartons, 0);

    if (!truckPlateNumber || !driverName || quantityCartons <= 0) {
      toast.error(
        "This load is missing truck, driver or quantity details. Contact your regional admin.",
      );
      return;
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
      setAttachmentUrl(null);
      setAttachmentName("");
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
            const isActive = step.key === status;
            return (
              <div
                key={step.key}
                className={`flex items-center py-2 justify-center gap-1 rounded-md ${
                  isActive
                    ? "border border-blue-700 bg-blue-700"
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
            onClick={() => advance("IN_PROGRESS")}
            className="w-full border-muted/30 bg-white"
          >
            Mark Loading in Progress
          </Button>
          <Button
            variant="outline"
            disabled={isBusy || isCompleted}
            onClick={() => advance("COMPLETED")}
            className="w-full border-muted/30 bg-white"
          >
            Mark Completed
          </Button>
        </div>

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
          mobile app.
        </Text>

        {/* Already captured on a previous visit */}
        {data.attachmentUrl && !attachmentUrl && (
          <a
            href={data.attachmentUrl}
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
                : attachmentName || "Drop file or click to upload"}
            </Text>
            <Text variant="thinnote" color="muted" weight="medium">
              PDF, JPG, PNG - up to 10MB
            </Text>
          </div>
        </button>

        <input
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
        loading={createWaybill.isPending}
        disabled={isBusy || isCompleted}
        onClick={handleSubmitWaybill}
      >
        {isCompleted ? "Completed" : "Submit Waybill"}
      </Button>
    </div>
  );
};

export default SelectedAssignement;
