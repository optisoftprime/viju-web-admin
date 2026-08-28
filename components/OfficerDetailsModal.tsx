"use client";

import React, { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/common/Modal";
import AttachmentPreview from "@/components/common/AttachmentPreview";
import { Text } from "@/components/common/Text";
import { useAuditChats } from "@/hooks/api/useAudit";
import { useOfficer, useUpdateOfficerProfile } from "@/hooks/api/useOfficer";
import { formatRegion } from "@/utils/formatter";
import { safeArray, safeText, safeNumber, safeDateText } from "@/utils/safe";
import { formatRole, formatRoleScope, roleRequiresRegion } from "@/constants/roles";
import { REGIONS } from "@/constants/regions";
import { getErrorMessage } from "@/utils/apiError";
import type { BroadcastRegion } from "@/lib/api/types";
import type {
  AuditChatThread,
  AuditChatMessage,
  StaffActor,
} from "@/lib/api/types";

export interface OfficerProfile {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  region?: string | null;
  /**
   * Region as the API enum, e.g. "LAGOS". `region` above may be a display
   * label from the table row - the picker has to write back the enum, so the
   * unformatted value is passed separately when the caller has it.
   */
  regionValue?: string | null;
  /** Wire role value from the list row, e.g. "OFFICER" */
  role?: string | null;
  status?: string | null;
  customers?: number | null;
  tickets?: number | null;
  lastLogin?: string | null;
  createdAt?: string | null;
}

interface OfficerDetailsModalProps {
  open: boolean;
  onClose: () => void;
  officer: OfficerProfile | null;
}

/**
 * Who performed an audited action.
 *
 * Every *By object is nullable - an account that predates managed users has
 * no creator, and an admin whose own record was removed leaves null behind.
 * That is a dash, not "Unknown admin".
 */
function actorText(actor?: StaffActor | null): string {
  const name = safeText(actor?.name, "");
  const email = safeText(actor?.email, "");
  if (name && email) return `${name} (${email})`;
  return name || email || "-";
}

/** One label/value pair in the profile grid */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Text variant="small" weight="bold" color="foreground">
        {label}
      </Text>
      <Text variant="caption" weight="medium" color="muted">
        {value}
      </Text>
    </div>
  );
}

/**
 * A single chat message inside an expanded thread.
 * Staff messages sit on the right, the customer messages on the left.
 */
function ChatBubble({ message }: { message: AuditChatMessage }) {
  const isStaff = message?.senderType === "STAFF";
  const body = safeText(message?.content, "");
  const attachment =
    typeof message?.attachmentUrl === "string" && message.attachmentUrl.trim()
      ? message.attachmentUrl
      : null;

  // A message with neither text nor an attachment has nothing to render
  if (!body && !attachment) return null;

  return (
    <div className={`flex ${isStaff ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 ${
          isStaff ? "bg-primary/10" : "bg-muted/10"
        }`}
      >
        {body && (
          <p className="text-[12px] text-foreground whitespace-pre-wrap break-words">
            {body}
          </p>
        )}
        {/* Spec 43 - the picture itself, not the word */}
        {attachment && (
          <AttachmentPreview url={attachment} size="sm" className="mt-1" />
        )}
        <p className="text-[10px] text-muted mt-1">
          {safeDateText(message?.createdAt, "")}
        </p>
      </div>
    </div>
  );
}

/**
 * One conversation between this officer and a customer. Collapsed to a
 * summary row until clicked, so a long history does not flood the modal.
 */
function ChatThread({ thread }: { thread: AuditChatThread }) {
  const [expanded, setExpanded] = useState(false);
  const messages = safeArray<AuditChatMessage>(thread?.messages);
  const total = safeNumber(thread?.messageCount, messages.length);

  return (
    <div className="border border-muted/20 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/5"
      >
        <div className="min-w-0">
          <Text variant="caption" weight="bold" color="foreground">
            {safeText(thread?.customer?.name, "Unknown customer")}
          </Text>
          <Text variant="small" weight="medium" color="muted">
            {total} {total === 1 ? "message" : "messages"}
            {thread?.lastMessageAt
              ? ` - last ${safeDateText(thread.lastMessageAt, "")}`
              : ""}
          </Text>
        </div>
        <span className="text-muted text-[11px] shrink-0">
          {expanded ? "Hide" : "View"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-muted/20 px-3 py-3 space-y-2 max-h-64 overflow-y-auto bg-white">
          {messages.length === 0 ? (
            <Text variant="small" weight="medium" color="muted">
              No messages available for this conversation.
            </Text>
          ) : (
            messages.map((message, index) => (
              <ChatBubble
                key={safeText(message?.id, String(index))}
                message={message}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Officer Details Modal
 * Profile of a single account officer plus their read-only customer
 * conversations.
 *
 * Both halves are keyed on the officer UUID (B-4.1 / B-4.2): the profile from
 * GET /admin/officers/{id}, the conversations from the chat audit filtered by
 * officerId. A regional admin is authorised on both routes within their own
 * region; outside it the API answers 403 and each half degrades independently
 * rather than blanking the modal.
 */
export default function OfficerDetailsModal({
  open,
  onClose,
  officer,
}: OfficerDetailsModalProps) {
  const officerId = officer?.id?.trim() || "";
  const shouldQuery = open && Boolean(officerId);

  // B-4.1 - authoritative profile. The row data renders immediately and each
  // field is replaced as the detail resolves, so the modal is never blank.
  const { data: detail, error: detailError } = useOfficer(
    shouldQuery ? officerId : undefined,
  );

  // B-4.2 - exact UUID filter. Names were ambiguous when two officers shared
  // one, and a regional admin is now authorised on this route.
  const {
    data: chatData,
    isLoading,
    error,
  } = useAuditChats(shouldQuery ? { officerId, pageSize: 50 } : {});

  const threads = safeArray<AuditChatThread>(chatData?.data);

  // Prefer the detail response, fall back to the row the user clicked
  const counts = detail?._count;
  const customerCount =
    counts?.customers ?? detail?.distributors ?? officer?.customers;
  const ticketCount =
    counts?.supportTickets ?? detail?.openTickets ?? officer?.tickets;
  const threadCount = counts?.chatThreads;
  const region = detail?.region ?? officer?.region;
  const status =
    typeof detail?.isActive === "boolean"
      ? detail.isActive
        ? "Active"
        : "Inactive"
      : officer?.status;
  const lastLogin = detail?.lastLoginAt
    ? safeDateText(detail.lastLoginAt)
    : (officer?.lastLogin ?? "Never");

  const roleValue = detail?.role ?? officer?.role;
  const roleLabel = formatRole(roleValue, "Account Officer");

  /**
   * Spec 39: change the officer's region from here.
   *
   * The picker writes the API ENUM, so the value it starts from must be the
   * enum too - `detail.region` when the profile has resolved, else the enum
   * the caller passed. `officer.region` is deliberately NOT used as a
   * fallback: on some screens it is already a display label ("South-South"),
   * and submitting that would be a 400.
   *
   * An ADMIN carries no region and the API refuses one, so the control is
   * absent for that role rather than shown and rejected.
   */
  const canEditRegion = roleRequiresRegion(roleValue);
  const regionValue = safeText(detail?.region ?? officer?.regionValue, "");

  const updateProfile = useUpdateOfficerProfile();
  const [isEditingRegion, setIsEditingRegion] = useState(false);
  const [draftRegion, setDraftRegion] = useState("");

  /**
   * Closing the modal, or opening it on another officer, drops a half-made
   * edit rather than carrying it onto the next profile.
   *
   * Reset during render rather than in an effect - an effect would paint the
   * previous officer's open picker against the new profile for one frame.
   */
  const editingKey = open ? officerId : "";
  const [editingKeyInState, setEditingKeyInState] = useState(editingKey);
  if (editingKeyInState !== editingKey) {
    setEditingKeyInState(editingKey);
    setIsEditingRegion(false);
    setDraftRegion("");
  }

  const handleSaveRegion = async () => {
    if (!officerId || !draftRegion || updateProfile.isPending) return;

    if (draftRegion === regionValue) {
      setIsEditingRegion(false);
      return;
    }

    try {
      await updateProfile.mutateAsync({
        officerId,
        body: { region: draftRegion as BroadcastRegion },
      });
      setIsEditingRegion(false);
      toast.success(`Region changed to ${formatRegion(draftRegion)}.`);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Could not change the region");
    }
  };

  /**
   * The audit block only makes sense for an account this portal manages. A
   * WAREHOUSE_OFFICER is still ERP-sourced and carries none of these stamps.
   */
  const isManaged = detail?.isManaged === true;
  const hasAuditTrail =
    isManaged ||
    Boolean(detail?.createdBy || detail?.deactivatedAt || detail?.reactivatedAt);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full max-w-lg mx-auto max-h-[80vh] overflow-y-auto p-1">
        {/* Header */}
        <div className="border-b border-muted/20 pb-3 pr-8">
          <Text variant="body" weight="bold" color="foreground">
            {safeText(officer?.name, "Officer")}
          </Text>
          <Text variant="caption" weight="medium" color="muted">
            {roleLabel} profile
          </Text>
        </div>

        {/* Profile */}
        <div className="space-y-3 pt-5">
          <Text
            variant="caption"
            weight="bold"
            color="muted"
            className="uppercase tracking-wider"
          >
            Profile
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <Field
              label="Email"
              value={safeText(detail?.email ?? officer?.email)}
            />
            <Field
              label="Phone Number"
              value={safeText(detail?.phone ?? officer?.phone)}
            />
            <Field label="Role" value={roleLabel} />

            {/* Spec 39 - region, editable in place behind the pen icon */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Text variant="small" weight="bold" color="foreground">
                  Region
                </Text>
                {canEditRegion && !isEditingRegion && (
                  <button
                    type="button"
                    aria-label="Change region"
                    onClick={() => {
                      setDraftRegion(regionValue);
                      setIsEditingRegion(true);
                    }}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isEditingRegion ? (
                <div className="flex items-center gap-2">
                  <select
                    value={draftRegion}
                    aria-label="Region"
                    onChange={(event) => setDraftRegion(event.target.value)}
                    disabled={updateProfile.isPending}
                    className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-muted/50 bg-white text-[13px] font-medium"
                  >
                    <option value="">Select region</option>
                    {REGIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Save region"
                    onClick={handleSaveRegion}
                    disabled={!draftRegion || updateProfile.isPending}
                    className="text-[#04B054] hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Discard region change"
                    onClick={() => setIsEditingRegion(false)}
                    disabled={updateProfile.isPending}
                    className="text-muted hover:text-primary disabled:opacity-40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Text variant="caption" weight="medium" color="muted">
                  {formatRoleScope(roleValue, formatRegion(region))}
                </Text>
              )}

              {/*
                Moving an officer does NOT move their book, and the reassign
                route requires the officer to be in the CUSTOMER's region - so
                anyone left behind can no longer be reassigned to them. Only
                worth saying when they actually hold customers.
              */}
              {isEditingRegion && safeNumber(customerCount, 0) > 0 && (
                <Text variant="thinnote" color="orange" className="block">
                  Their {safeNumber(customerCount, 0)} customer
                  {safeNumber(customerCount, 0) === 1 ? "" : "s"} stay where
                  they are and will need reassigning separately.
                </Text>
              )}
            </div>
            <Field label="Status" value={safeText(status)} />
            <Field label="Customers" value={safeNumber(customerCount, 0)} />
            <Field label="Open Tickets" value={safeNumber(ticketCount, 0)} />
            <Field label="Last Login" value={safeText(lastLogin, "Never")} />
            <Field
              label="Conversations"
              value={
                typeof threadCount === "number"
                  ? threadCount
                  : threads.length
              }
            />
          </div>
        </div>

        {/* Audit trail - who created this account, and who last changed it */}
        {hasAuditTrail && (
          <div className="space-y-3 pt-6">
            <Text
              variant="caption"
              weight="bold"
              color="muted"
              className="uppercase tracking-wider"
            >
              Account History
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <Field
                label="Created"
                value={safeDateText(detail?.createdAt, "-")}
              />
              <Field label="Created By" value={actorText(detail?.createdBy)} />
              <Field
                label="Deactivated"
                value={safeDateText(detail?.deactivatedAt, "-")}
              />
              <Field
                label="Deactivated By"
                value={actorText(detail?.deactivatedBy)}
              />
              <Field
                label="Reactivated"
                value={safeDateText(detail?.reactivatedAt, "-")}
              />
              <Field
                label="Reactivated By"
                value={actorText(detail?.reactivatedBy)}
              />
            </div>
          </div>
        )}

        {/* A 403/404 on the profile leaves the clicked row's values in place */}
        {detailError ? (
          <Text variant="small" weight="medium" color="muted" className="pt-3">
            Full profile could not be loaded; showing the summary from the list.
          </Text>
        ) : null}

        {/* Customer conversations */}
        <div className="space-y-3 pt-6">
          <Text
            variant="caption"
            weight="bold"
            color="muted"
            className="uppercase tracking-wider"
          >
            Customer Chats
          </Text>

          {!shouldQuery && (
            <Text variant="small" weight="medium" color="muted">
              Conversations are unavailable for this officer.
            </Text>
          )}

          {shouldQuery && isLoading && (
            <Text variant="small" weight="medium" color="muted">
              Loading conversations...
            </Text>
          )}

          {shouldQuery && !isLoading && error && (
            <Text variant="small" weight="medium" color="muted">
              Conversations could not be loaded for this officer.
            </Text>
          )}

          {shouldQuery && !isLoading && !error && threads.length === 0 && (
            <Text variant="small" weight="medium" color="muted">
              This officer has no recorded conversations with customers.
            </Text>
          )}

          {shouldQuery && !isLoading && !error && threads.length > 0 && (
            <div className="space-y-2">
              {threads.map((thread, index) => (
                <ChatThread
                  key={safeText(thread?.id, String(index))}
                  thread={thread}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
