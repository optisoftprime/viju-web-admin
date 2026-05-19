import React from "react";
import { Text } from "./Text";

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

const TableSkeleton = ({ columns }: { columns: any[] }) => (
  <tbody>
    {[...Array(5)].map((_, rowIdx) => (
      <tr key={rowIdx} className="border-b border-muted hover:bg-milkwhite/50">
        {columns.map((_, colIdx) => (
          <td key={colIdx} className="px-4 py-3">
            <div className="h-4 bg-muted/20 rounded animate-pulse w-20" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const Table = React.forwardRef<HTMLTableElement, TableProps<any>>(
  ({ columns, data, loading = false, onRowClick, className = "" }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={`w-full border-collapse rounded-lg overflow-hidden ${className}`.trim()}
        >
          <thead>
            <tr className="bg-milkwhite border-b-2 border-muted">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left font-semibold"
                >
                  <Text variant="body" color="foreground" weight="semibold">
                    {column.sortable ? (
                      <button className="flex items-center gap-2 hover:text-primary transition-colors">
                        {column.title}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      </button>
                    ) : (
                      column.title
                    )}
                  </Text>
                </th>
              ))}
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton columns={columns} />
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <Text variant="body" color="muted">
                    No data available
                  </Text>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`border-b border-muted ${
                    rowIdx % 2 === 0 ? "bg-milkwhite/30" : ""
                  } ${onRowClick ? "hover:bg-milkwhite cursor-pointer" : "hover:bg-milkwhite/50"}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-4 py-3">
                      <Text variant="body" color="foreground">
                        {column.render
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || "-")}
                      </Text>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    );
  },
);

Table.displayName = "Table";
