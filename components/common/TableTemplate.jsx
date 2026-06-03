"use client";

import React from "react";
import { ACTION_CONFIG } from "./rowActionsInTable/ActionConfig";
import ActionIcon from "./rowActionsInTable/ActionIcon";
import ActionIconAndText from "./rowActionsInTable/ActionIconAndText";
import { Icon } from "@iconify/react";
import { truncate } from "@/utils/stringFormater";

const Table = ({
  headers = [],
  rows = [],

  onCellClick,

  onLeftIconClick,
  onRightIconClick,
  onMiddleIconClick,

  tableContainerStyle = "table-auto w-full text-left",
  tableHeaderStyle = "hidden lg:table-cell px-4 py-4 whitespace-nowrap bg-slate-200 dark:bg-slate-700 font-semibold text-md text-primary",
  tableRowStyle = "dark:hover:bg-slate-700 hover:bg-slate-50 border-t border-slate-200 dark:border-slate-700  dark:bg-slate-800  transition-colors text-xs",
  tableDataStyle = " block lg:table-cell text-[14px] px-4 py-5 cursor-pointer text-primary",

  showSelection = false,
  showSerialNumber = true,

  onRowSelect,
  onSelectAll,
  loading,
  error,
  selectedIds,
  setSelectedIds,
  currentPage = 0,
}) => {
  // const [selectedIds, setSelectedIds] = useState([]);

  // Reset selection if rows change

  const handleRowSelected = (uuid, checked) => {
    const updated = checked
      ? [...selectedIds, uuid]
      : selectedIds.filter((id) => id !== uuid);

    setSelectedIds(updated);
    onRowSelect?.(uuid, checked);
  };

  const handleSelectAll = (checked) => {
    const allIds = rows.map((r) => r.uuid);

    const updated = checked ? allIds : [];

    setSelectedIds(updated);
    onSelectAll?.(checked, updated);
  };

  const allSelected =
    rows.length > 0 &&
    selectedIds &&
    rows &&
    selectedIds.length === rows.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-slate-600 dark:text-slate-300">
          Loading...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Icon
            icon="heroicons:exclamation-triangle"
            className="h-12 w-12 text-red-500 mx-auto mb-2"
          />
          <p className="text-red-600 dark:text-red-400 mb-2">
            Failed to load data
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error?.message || "something went wrong"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className={tableContainerStyle}>
          <thead>
            <tr>
              {showSerialNumber && <th className={tableHeaderStyle}>#</th>}
              {showSelection && rows.length > 0 && (
                <th className={tableHeaderStyle}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}

              {headers.map((header, i) => (
                <th key={i} className={tableHeaderStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  No result found
                </td>
              </tr>
            )}

            {rows.map((row, i) => (
              <tr key={row.uuid} className={tableRowStyle}>
                {showSerialNumber && (
                  <td className={tableDataStyle}>{currentPage * 10 + i + 1}</td>
                )}
                {/* Checkbox column */}
                {showSelection && (
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.uuid || row.uuid)}
                      onChange={(e) =>
                        handleRowSelected(
                          row.uuid || {
                            userUuid: row.userUuid,
                            requestUuid: row.requestUuid,
                          },
                          e.target.checked,
                        )
                      }
                    />
                  </td>
                )}

                {headers.map((header, colIndex) => {
                  const cell = row[header];

                  // Action icons
                  if (
                    header === "Action" &&
                    typeof cell === "string" &&
                    ACTION_CONFIG[cell]
                  ) {
                    const { iconArr, iconStrName } = ACTION_CONFIG[cell];

                    return (
                      <td key={header} className={tableDataStyle}>
                        <ActionIcon
                          iconArr={iconArr}
                          rowIndex={
                            row.uuid || {
                              userUuid: row.userUuid,
                              requestUuid: row.requestUuid,
                            }
                          }
                          colIndex={colIndex}
                          leftIconName={
                            iconStrName.startsWith("Edit") ? "edit" : "view"
                          }
                          middleIconName={
                            iconStrName.includes("Delete")
                              ? "trash"
                              : iconStrName.includes("Refresh")
                                ? "refresh"
                                : iconStrName.includes("Suspend") ||
                                    iconStrName.includes("Block")
                                  ? "suspend"
                                  : iconStrName.includes("Verify")
                                    ? "verify"
                                    : iconStrName.includes("Edit")
                                      ? "edit"
                                      : iconStrName.includes("Play")
                                        ? "play"
                                        : "edit"
                          }
                          rightIconName={
                            iconStrName.includes("Delete")
                              ? "trash"
                              : iconStrName.includes("Block")
                                ? "suspend"
                                : "view"
                          }
                          onLeftIconClick={onLeftIconClick}
                          onRightIconClick={onRightIconClick}
                          onMiddleIconClick={onMiddleIconClick}
                        />
                      </td>
                    );
                  }

                  // Icon + text variant
                  if (header === "Action" && cell === "IconAndText") {
                    return (
                      <td key={header} className={tableDataStyle}>
                        <ActionIconAndText
                          rowIndex={row.uuid}
                          colIndex={colIndex}
                          onLeftIconClick={onLeftIconClick}
                          onRightIconClick={onRightIconClick}
                        />
                      </td>
                    );
                  }

                  // Normal cell
                  return (
                    <td
                      key={header}
                      className={tableDataStyle}
                      onClick={() => onCellClick?.(row.uuid, colIndex, cell)}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE STACKED VIEW */}
      <div className="md:hidden space-y-4 bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-700 hover:bg-slate-50">
        {rows.length === 0 && (
          <div className="text-center py-6 text-gray-500">No result found</div>
        )}

        {rows.map((row, i) => (
          <div key={row.uuid} className="rounded-lg p-4 shadow-sm my-2">
            {showSerialNumber && <div>{currentPage * 10 + i + 1}</div>}
            {showSelection && (
              <div className="mb-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.uuid)}
                  onChange={(e) =>
                    handleRowSelected(row.uuid, e.target.checked)
                  }
                />
              </div>
            )}

            {headers.map((header, colIndex) => {
              const cell = row[header];

              // ACTIONS
              if (
                header === "Action" &&
                typeof cell === "string" &&
                ACTION_CONFIG[cell]
              ) {
                const { iconArr } = ACTION_CONFIG[cell];

                return (
                  <div
                    key={header}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <span className="font-semibold text-primary">{header}</span>
                    <ActionIcon
                      iconArr={iconArr}
                      rowIndex={row.uuid}
                      colIndex={colIndex}
                      onLeftIconClick={onLeftIconClick}
                      onRightIconClick={onRightIconClick}
                      onMiddleIconClick={onMiddleIconClick}
                    />
                  </div>
                );
              }

              if (header === "Action" && cell === "IconAndText") {
                return (
                  <div
                    key={header}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <span className="font-semibold text-primary">{header}</span>
                    <ActionIconAndText
                      rowIndex={row.uuid}
                      colIndex={colIndex}
                      onLeftIconClick={onLeftIconClick}
                      onRightIconClick={onRightIconClick}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={header}
                  className="flex justify-between items-center py-2 border-b"
                  onClick={() => onCellClick?.(row.uuid, colIndex, cell)}
                >
                  <span className="font-semibold text-primary">{header}</span>
                  <span className="text-primary text-sm">
                    {truncate(cell, 14)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Table;
