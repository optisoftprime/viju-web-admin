"use client";

import React, { useState } from "react";

// Interface for table column definition
export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

// Interface for table props
export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onActionClick?: (action: string, row: T) => void;
  className?: string;
  showSerialNumber?: boolean;
  /**
   * Sorting is server-side: the table only reports which column was clicked.
   * Supply all three to enable it - without `onSort` the headers stay plain,
   * so every existing table is unaffected.
   */
  sortKey?: string | null;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
  /**
   * Extra classes for a single row, e.g. dimming a read-only record.
   * Returns nothing for rows that need no special treatment.
   */
  rowClassName?: (row: T) => string | undefined;
  /**
   * Stable identity for a row. Defaults to the array index, which is fine for
   * a static table but wrong when rows can carry a null id - pass the field
   * that is unique across the result set.
   */
  rowKey?: (row: T, index: number) => string;
  /**
   * Bulk selection (spec 39). Off unless `selectable` is set, so every
   * existing table is unaffected.
   *
   * Identity comes from `rowKey` - pass one whenever selection is on, or the
   * checkbox state follows the array index and breaks the moment the page
   * changes. Selection is OWNED BY THE PARENT: this component renders the
   * boxes and reports intent, it never keeps a list of its own, so a parent
   * can hold selections across pages.
   */
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Rows that cannot be picked, e.g. a record the action does not apply to */
  isRowSelectable?: (row: T) => boolean;
}

/**
 * The status palette.
 *
 * Seven bands, each meaning one thing. Kept as named tones rather than raw
 * hex at the call sites so a status can never be given a colour that already
 * means something else.
 */
export type StatusTone =
  | "negative"
  | "neutral"
  | "positive"
  | "waiting"
  | "owned"
  | "active"
  | "new";

export interface StatusBadgeStyle {
  bgColor: string;
  textColor: string;
}

const STATUS_TONES: Record<StatusTone, StatusBadgeStyle> = {
  /** Called off, refused, failed - something went wrong or was stopped */
  negative: { bgColor: "bg-[#FFE4E4]", textColor: "text-[#D42D2D]" },
  /** Switched off or shelved - not an error, and not in play either */
  neutral: { bgColor: "bg-[#ECEFF3]", textColor: "text-[#5B6472]" },
  /** Finished well - completed, resolved, delivered, paid, in service */
  positive: { bgColor: "bg-[#D4FFE9]", textColor: "text-[#04B054]" },
  /** Needs somebody to act - pending, awaiting, unassigned, part-done */
  waiting: { bgColor: "bg-[#FFF4E1]", textColor: "text-[#FFA10B]" },
  /** Has an owner but has not started - assigned */
  owned: { bgColor: "bg-[#EDE4FF]", textColor: "text-[#6B46C1]" },
  /** Under way right now - in progress, processing, loading */
  active: { bgColor: "bg-[#D4D9FF]", textColor: "text-[#4B5BD1]" },
  /** Just arrived and untouched - an open ticket, a new submission */
  new: { bgColor: "bg-[#D6F4FF]", textColor: "text-[#0E7490]" },
};

/**
 * Which tone a status word belongs to.
 *
 * ORDER MATTERS - the first match wins, and several of these overlap as
 * substrings. Three pairs in particular:
 *
 *   - "inactive" contains "active", so the off states are matched FIRST.
 *     This was the real bug: nothing matched either word, so **Active and
 *     Inactive rendered in exactly the same colour** on the Users and
 *     Officers tables - the one place the distinction is the whole point of
 *     the column.
 *   - "unassigned" contains "assigned", so it is matched before it.
 *   - "Pending Assignment" contains "assign", so pending is matched before it.
 *
 * Matching on substrings rather than an enum is deliberate: statuses reach
 * this from four different vocabularies (loading requests, tickets, ERP
 * orders, staff accounts) and some are humanised for display before they
 * arrive. A word list degrades to a readable neutral badge for something new,
 * where an enum lookup would have to throw or guess.
 */
const TONE_RULES: { tone: StatusTone; match: string[] }[] = [
  { tone: "negative", match: ["cancel", "reject", "declin", "fail", "void", "error"] },
  // Before "active" - see above
  /**
   * "closed" sits here rather than with the positive states on purpose.
   *
   * A RESOLVED ticket was fixed; a CLOSED one was shut, which is not the same
   * claim - and both can appear in the ticket audit at once, so they were the
   * only two statuses left sharing a colour inside one table. An ERP order
   * reading CLOSED renders grey as a result, which is a fair description of a
   * finished order and still clearly distinct from PROCESSING and OPEN
   * beside it.
   */
  { tone: "neutral", match: ["inactive", "deactivat", "suspend", "disabl", "expire", "archiv", "draft", "closed"] },
  // Before "assign"
  { tone: "waiting", match: ["unassign"] },
  // Before "paid" - a part payment is not a payment
  { tone: "waiting", match: ["part"] },
  // Before "assign" - "Pending Assignment" is a wait, not an assignment
  { tone: "waiting", match: ["pending", "await", "queue", "hold", "unresolved"] },
  { tone: "owned", match: ["assign"] },
  { tone: "active", match: ["progress", "processing", "loading", "ongoing", "transit", "started"] },
  { tone: "new", match: ["open", "new", "submitted", "received"] },
  { tone: "positive", match: ["complete", "resolved", "deliver", "success", "paid", "done", "fulfil", "active", "enabled", "approved"] },
];

/** The tone for a status string, or "neutral" for one we do not recognise */
export const getStatusTone = (status: string): StatusTone => {
  const value = typeof status === "string" ? status.toLowerCase().trim() : "";
  if (!value) return "neutral";

  for (const rule of TONE_RULES) {
    if (rule.match.some((word) => value.includes(word))) return rule.tone;
  }

  /**
   * Neutral, not "waiting".
   *
   * The default used to be the same orange as Pending, which meant every
   * status the list did not know about silently claimed to be pending -
   * including Open, Resolved and Closed, so the whole ticket audit table was
   * one colour. A grey badge asserts nothing, which is the honest answer for
   * a value we cannot interpret.
   */
  return "neutral";
};

/**
 * Badge styling for a status.
 *
 * Exported so detail views render statuses exactly like the table does - the
 * row and the modal it opens must never disagree about a colour.
 */
export const getStatusBadgeStyle = (status: string): StatusBadgeStyle =>
  STATUS_TONES[getStatusTone(status)];

// Function to render status badge with dynamic colors
const renderStatusBadge = (status: string) => {
  const { bgColor, textColor } = getStatusBadgeStyle(status);
  return (
    <span className="flex justify-center items-center">
      <span
        className={`${bgColor} ${textColor} py-1 px-2 rounded-xl flex items-center justify-center w-max h-max`}
      >
        {status}
      </span>
    </span>
  );
};

// Table skeleton loading component
const TableSkeleton = ({
  columns,
  extraColumns = 0,
}: {
  columns: any[];
  extraColumns?: number;
}) => (
  <tbody>
    {[...Array(5)].map((_, rowIdx) => (
      <tr key={rowIdx} className="border-b border-muted">
        {[...Array(columns.length + extraColumns)].map((_, colIdx) => (
          <td key={colIdx} className="p-2">
            <div className="h-4 bg-muted/20 rounded animate-pulse w-20" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// Main Table Component
export const Table = React.forwardRef<HTMLTableElement, TableProps<any>>(
  (
    {
      columns,
      data,
      loading = false,
      onRowClick,
      onActionClick,
      sortKey,
      sortOrder = "desc",
      onSort,
      rowClassName,
      rowKey,
      selectable = false,
      selectedKeys,
      onSelectionChange,
      isRowSelectable,
      className = "",
      showSerialNumber = false,
    },
    ref,
  ) => {
    /**
     * The key for a row. Falls back to the index so a table that turns
     * selection on without a `rowKey` still behaves on a single page rather
     * than crashing - it is the wrong identity across pages, which is why
     * `rowKey` is documented as required here.
     */
    const keyFor = (row: (typeof data)[number], index: number) =>
      rowKey ? rowKey(row, index) : String(index);

    const selected = new Set(selectedKeys ?? []);

    // Only rows the parent allows count toward "all on this page"
    const selectableKeys = data
      .map((row, index) =>
        isRowSelectable?.(row) === false ? null : keyFor(row, index),
      )
      .filter((key): key is string => key !== null);

    const allOnPageSelected =
      selectableKeys.length > 0 &&
      selectableKeys.every((key) => selected.has(key));
    const someOnPageSelected =
      !allOnPageSelected && selectableKeys.some((key) => selected.has(key));

    const toggleRow = (key: string) => {
      const next = new Set(selected);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onSelectionChange?.(Array.from(next));
    };

    /**
     * The header box adds or removes THIS page only - selections made on
     * other pages are left alone, which is what makes a cross-page bulk
     * action possible.
     */
    const toggleAllOnPage = () => {
      const next = new Set(selected);
      if (allOnPageSelected) {
        selectableKeys.forEach((key) => next.delete(key));
      } else {
        selectableKeys.forEach((key) => next.add(key));
      }
      onSelectionChange?.(Array.from(next));
    };

    const selectionColumnCount = selectable ? 1 : 0;

    return (
      <div className="overflow-x-auto border border-[#E0E7F0] w-full rounded-tl-lg rounded-tr-lg">
        <table
          ref={ref}
          className={`w-full border-collapse ${className}`.trim()}
        >
          {/* Table Header */}
          <thead>
            <tr>
              {/* Selection Column Header - picks or clears this page */}
              {selectable && (
                <th className="w-10 p-2 text-center bg-[#F0F5F9]">
                  <input
                    type="checkbox"
                    aria-label="Select every row on this page"
                    checked={allOnPageSelected}
                    ref={(node) => {
                      // Partial selection reads as a dash, not as unchecked
                      if (node) node.indeterminate = someOnPageSelected;
                    }}
                    disabled={selectableKeys.length === 0}
                    onChange={toggleAllOnPage}
                    className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                </th>
              )}

              {/* Serial Number Column Header */}
              {showSerialNumber && (
                <th className="text-[13px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                  #
                </th>
              )}

              {/* Regular Column Headers */}
              {columns.map((column) => {
                const canSort = Boolean(column.sortable && onSort);
                const isActive = canSort && sortKey === String(column.key);

                return (
                  <th
                    key={String(column.key)}
                    className="whitespace-nowrap text-[13px] font-bold text-muted p-3 text-left bg-[#F0F5F9]"
                    aria-sort={
                      isActive
                        ? sortOrder === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(String(column.key))}
                        className={`inline-flex items-center gap-1 hover:text-primary ${
                          isActive ? "text-primary" : ""
                        }`}
                      >
                        {column.title}
                        {/* Arrow shows direction on the active column only */}
                        <span aria-hidden="true" className="text-[10px]">
                          {isActive ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      </button>
                    ) : (
                      column.title
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          {loading ? (
            <TableSkeleton columns={columns} extraColumns={selectionColumnCount} />
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (showSerialNumber ? 1 : 0) +
                    selectionColumnCount
                  }
                  className="text-left text-[13px] font-medium text-muted p-2"
                >
                  No data available
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {data.map((row, rowIdx) => {
                // Determine row background color (alternating)
                const bgColor = rowIdx % 2 === 0 ? "bg-white" : "bg-[#F0F5F9]";
                const borderClass =
                  rowIdx % 2 === 0 ? "" : "border border-[#E0E7F0]";

                return (
                  <tr
                    key={rowKey ? rowKey(row, rowIdx) : rowIdx}
                    className={`${bgColor} ${borderClass} ${
                      onRowClick ? " cursor-pointer" : ""
                    } ${rowClassName?.(row) ?? ""}`.trim()}
                    onClick={() => onRowClick?.(row)}
                  >
                    {/* Selection Column - never opens the row */}
                    {selectable && (
                      <td
                        className="w-10 p-2 text-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label="Select this row"
                          checked={selected.has(keyFor(row, rowIdx))}
                          disabled={isRowSelectable?.(row) === false}
                          onChange={() => toggleRow(keyFor(row, rowIdx))}
                          className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    )}

                    {/* Serial Number Column */}
                    {showSerialNumber && (
                      <td className="text-left text-[13px] font-medium text-muted p-2 ">
                        {rowIdx + 1}
                      </td>
                    )}

                    {/* Regular Columns */}
                    {columns.map((column) => {
                      const value = row[column.key];
                      const columnTitle = column.title.toUpperCase();

                      // Handle STATUS column with badge
                      if (columnTitle === "STATUS") {
                        return (
                          <td
                            key={String(column.key)}
                            className="text-left text-[13px] font-medium text-muted p-2"
                          >
                            {renderStatusBadge(String(value))}
                          </td>
                        );
                      }

                      // Handle ACTION column as clickable link
                      if (columnTitle === "ACTION") {
                        return (
                          <td
                            key={String(column.key)}
                            className="text-left text-[13px] font-medium p-2"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onActionClick?.(String(value), row);
                              }}
                              className="text-primary underline hover:text-orange transition-colors"
                            >
                              {String(value)}
                            </button>
                          </td>
                        );
                      }

                      // Default column rendering
                      return (
                        <td
                          key={String(column.key)}
                          className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2"
                        >
                          {column.render
                            ? column.render(value, row)
                            : String(value)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
    );
  },
);

Table.displayName = "Table";
