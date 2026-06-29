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
}

// Type for status badge colors
type StatusColor = "pending" | "success" | "in-progress";

// Function to get badge styling based on status
const getStatusBadgeStyle = (
  status: string,
): { bgColor: string; textColor: string } => {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes("pending")) {
    return {
      bgColor: "bg-[#FFF4E1]",
      textColor: "text-[#FFA10B]",
    };
  } else if (
    lowerStatus.includes("success") ||
    lowerStatus.includes("assigned") ||
    lowerStatus.includes("completed")
  ) {
    return {
      bgColor: "bg-[#D4FFE9]",
      textColor: "text-[#04B054]",
    };
  } else if (
    lowerStatus.includes("progress") ||
    lowerStatus.includes("in progress")
  ) {
    return {
      bgColor: "bg-[#D4D9FF]",
      textColor: "text-[#4B5BD1]",
    };
  }

  return {
    bgColor: "bg-[#FFF4E1]",
    textColor: "text-[#FFA10B]",
  };
};

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
const TableSkeleton = ({ columns }: { columns: any[] }) => (
  <tbody>
    {[...Array(5)].map((_, rowIdx) => (
      <tr key={rowIdx} className="border-b border-muted">
        {columns.map((_, colIdx) => (
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
      className = "",
      showSerialNumber = false,
    },
    ref,
  ) => {
    return (
      <div className="overflow-x-auto border border-[#E0E7F0] w-full rounded-tl-lg rounded-tr-lg">
        <table
          ref={ref}
          className={`w-full border-collapse ${className}`.trim()}
        >
          {/* Table Header */}
          <thead>
            <tr>
              {/* Serial Number Column Header */}
              {showSerialNumber && (
                <th className="text-[13px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                  #
                </th>
              )}

              {/* Regular Column Headers */}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="text-[13px] font-bold text-muted p-3 text-left bg-[#F0F5F9]"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          {loading ? (
            <TableSkeleton columns={columns} />
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td
                  colSpan={columns.length + (showSerialNumber ? 1 : 0)}
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
                    key={rowIdx}
                    className={`${bgColor} ${borderClass} ${
                      onRowClick ? " cursor-pointer" : ""
                    }`}
                    onClick={() => onRowClick?.(row)}
                  >
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
                          className="text-left text-[13px] font-medium text-muted p-2"
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
