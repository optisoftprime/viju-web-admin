"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { getStatusBadgeStyle } from "@/components/common/Table";
import { formatToNairaExact, formatDateTime } from "@/utils/formatter";

/**
 * How a field's value should be presented.
 * - text      short single-line value (default)
 * - longtext  free text that may wrap over several lines
 * - status    rendered as a badge, matching the table's status column
 * - amount    formatted as Naira when given a number
 * - date      formatted as a readable date/time when given an ISO string
 * - id        reference/serial value, rendered monospaced so it stays scannable
 */
export type DetailFieldType =
  | "text"
  | "longtext"
  | "status"
  | "amount"
  | "date"
  | "id";

export interface DetailField {
  label: string;
  value: React.ReactNode;
  type?: DetailFieldType;
  /** Let a long value span the full width instead of one grid column */
  fullWidth?: boolean;
}

export interface DetailSection {
  /** Optional heading - omit for an ungrouped block of fields */
  title?: string;
  fields: DetailField[];
}

interface RowDetailsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  sections: DetailSection[];
  /** Optional actions rendered under the details, e.g. a row action button */
  footer?: React.ReactNode;
}

const isEmpty = (value: React.ReactNode) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (typeof value === "string" && value.trim() === "");

/**
 * Render a single value according to its type.
 * Values already formatted upstream (e.g. "₦1,240,000") are passed through
 * untouched - only raw numbers and ISO dates get formatted here.
 */
const renderValue = (field: DetailField): React.ReactNode => {
  const { value, type = "text" } = field;

  if (isEmpty(value)) {
    return (
      <Text variant="caption" weight="medium" color="muted">
        N/A
      </Text>
    );
  }

  if (type === "status") {
    const status = String(value);
    const { bgColor, textColor } = getStatusBadgeStyle(status);
    return (
      <span
        className={`${bgColor} ${textColor} py-1 px-3 rounded-xl text-[12px] font-semibold inline-block w-max`}
      >
        {status}
      </span>
    );
  }

  if (type === "amount") {
    return (
      <Text variant="caption" weight="medium" color="foreground">
        {/* Exact, not rounded - an amount here is an ERP figure and the
            tables it opens from now render every decimal the API sent */}
        {typeof value === "number" ? formatToNairaExact(value) : String(value)}
      </Text>
    );
  }

  if (type === "date") {
    const raw = String(value);
    const formatted = formatDateTime(raw);
    return (
      <Text variant="caption" weight="medium" color="muted">
        {formatted || raw}
      </Text>
    );
  }

  if (type === "id") {
    return (
      <span className="font-mono text-[12px] text-muted break-all">
        {String(value)}
      </span>
    );
  }

  if (type === "longtext") {
    return (
      <p className="text-[13px] font-medium text-muted whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
        {String(value)}
      </p>
    );
  }

  // Default: allow React nodes through, stringify everything else
  return React.isValidElement(value) ? (
    value
  ) : (
    <Text variant="caption" weight="medium" color="muted">
      {String(value)}
    </Text>
  );
};

/**
 * Row Details Modal
 * Shared read-only view of a single table row. Fields are grouped into
 * labelled sections rather than dumped as a raw object.
 */
export default function RowDetailsModal({
  open,
  onClose,
  title,
  subtitle,
  sections,
  footer,
}: RowDetailsModalProps) {
  const visibleSections = sections.filter(
    (section) => section.fields.length > 0,
  );

  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full max-w-lg mx-auto max-h-[80vh] overflow-y-auto p-1">
        {/* Header */}
        <div className="border-b border-muted/20 pb-3 pr-8">
          <Text variant="body" weight="bold" color="foreground">
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" weight="medium" color="muted">
              {subtitle}
            </Text>
          )}
        </div>

        {/* Grouped Details */}
        <div className="space-y-6 pt-5">
          {visibleSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="space-y-3">
              {section.title && (
                <Text
                  variant="caption"
                  weight="bold"
                  color="muted"
                  className="uppercase tracking-wider"
                >
                  {section.title}
                </Text>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {section.fields.map((field, fieldIdx) => (
                  <div
                    key={fieldIdx}
                    className={
                      field.fullWidth || field.type === "longtext"
                        ? "sm:col-span-2 space-y-1"
                        : "space-y-1"
                    }
                  >
                    <Text variant="small" weight="bold" color="foreground">
                      {field.label}
                    </Text>
                    {renderValue(field)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Optional actions */}
        {footer && (
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-muted/20">
            {footer}
          </div>
        )}
      </div>
    </Modal>
  );
}
