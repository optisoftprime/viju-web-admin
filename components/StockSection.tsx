"use client";

import { useState, useMemo } from "react";
import { Text } from "@/components/common";

interface Stock {
  id: string;
  product: string;
  stockBalance: string;
  reservedStock: string;
  awaitingLoading: string;
  lastStockUpdate: string;
  status: "Available" | "Low Stock" | "Out of Stock";
}

interface StockSectionProps {
  stocks?: Stock[];
}

// Mock stocks data
const mockStocks: Stock[] = [
  {
    id: "1",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "2",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "3",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "4",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "5",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "6",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "7",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "8",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Out of Stock",
  },
  {
    id: "9",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "10",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "11",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "12",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "13",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "14",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "15",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "16",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "17",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "18",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "19",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "20",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Low Stock",
  },
  {
    id: "21",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Available",
  },
  {
    id: "22",
    product: "Viju Apple Drink",
    stockBalance: "2,500 Cartons",
    reservedStock: "300",
    awaitingLoading: "120",
    lastStockUpdate: "15 April 2026, 10:45 AM",
    status: "Out of Stock",
  },
];

const getStatusBadge = (status: "Available" | "Low Stock" | "Out of Stock") => {
  if (status === "Available") {
    return {
      text: status,
      bgColor: "#D4FFE9",
      textColor: "#04B054",
    };
  } else if (status === "Low Stock") {
    return {
      text: status,
      bgColor: "#FFF4E1",
      textColor: "#FFA10B",
    };
  } else if (status === "Out of Stock") {
    return {
      text: status,
      bgColor: "#FFE5E5",
      textColor: "#E63946",
    };
  }
  return {
    text: status,
    bgColor: "#F0F5F9",
    textColor: "#4B5BD1",
  };
};

export default function StockSection({
  stocks = mockStocks,
}: StockSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return stocks.slice(startIndex, startIndex + itemsPerPage);
  }, [stocks, currentPage]);

  const totalItems = stocks.length;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                PRODUCT
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                STOCK BALANCE
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                RESERVED STOCK
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                AWAITING LOADING
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                LAST STOCK UPDATE
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                STATUS
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {paginatedStocks.map((stock, index) => {
              const statusBadge = getStatusBadge(stock.status);
              const bgColor = index % 2 === 1 ? "white" : "bg-[#F0F5F9]";
              const borderClass =
                index % 2 === 1 ? "" : "border-b border-[#F0F5F9]";

              return (
                <tr key={stock.id} className={`${bgColor} ${borderClass}`}>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {stock.product}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {stock.stockBalance}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {stock.reservedStock}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {stock.awaitingLoading}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {stock.lastStockUpdate}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    <span
                      style={{
                        backgroundColor: statusBadge.bgColor,
                        color: statusBadge.textColor,
                      }}
                      className="px-3 py-1 rounded-full text-sm font-semibold inline-block"
                    >
                      {statusBadge.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {stocks.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-6">
          <Text variant="small" color="muted">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </Text>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-muted/20 rounded-lg text-sm font-medium text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1),
                )
              }
              disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
              className="px-4 py-2 border border-muted/20 rounded-lg text-sm font-medium text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
