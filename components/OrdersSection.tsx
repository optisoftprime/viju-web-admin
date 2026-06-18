"use client";

import { useState, useMemo } from "react";
import { Table, Text } from "@/components/common";
import Pagination from "@/components/Pagination";
import { Order as APIOrder } from "@/src/lib/api/types";
import { formatDateTime } from "@/src/utils/formatter";

interface Order {
  id: string;
  orderId: string;
  orderDate: string;
  product: string;
  quantity: number;
  totalValue: string;
  status: "Delivered" | "Processing";
}

interface OrdersSectionProps {
  orders?: Order[] | APIOrder[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: "1",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "2",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "3",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "4",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
  {
    id: "5",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "6",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "7",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
  {
    id: "8",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "9",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "10",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
  {
    id: "11",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "12",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
  {
    id: "13",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "14",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
  {
    id: "15",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "16",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
  {
    id: "17",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "18",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
  {
    id: "19",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "20",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
  {
    id: "21",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Delivered",
  },
  {
    id: "22",
    orderId: "ORD-001",
    orderDate: "2026-03-23",
    product: "V-smart chocolate 400 ml",
    quantity: 3,
    totalValue: "₦1,240,000",
    status: "Processing",
  },
];

const getStatusBadge = (status: "Delivered" | "Processing") => {
  if (status === "Delivered") {
    return {
      text: status,
      bgColor: "#D4FFE9",
      textColor: "#04B054",
    };
  } else if (status === "Processing") {
    return {
      text: status,
      bgColor: "#FFF4E1",
      textColor: "#FFA10B",
    };
  }
  return {
    text: status,
    bgColor: "#F0F5F9",
    textColor: "#4B5BD1",
  };
};

// Helper function to map API Order to component Order format
const mapAPIOrderToOrder = (apiOrder: APIOrder): Order => {
  return {
    id: apiOrder.id,
    orderId: apiOrder.erpId || apiOrder.id,
    orderDate: apiOrder.orderDate,
    product: apiOrder.items?.[0]?.productName || "N/A",
    quantity: apiOrder.totalItems || 0,
    totalValue: `₦${(apiOrder.totalValue || 0).toLocaleString()}`,
    status:
      apiOrder.status === "Delivered" || apiOrder.status === "Processing"
        ? apiOrder.status
        : "Processing",
  };
};

export default function OrdersSection({
  orders = mockOrders,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange,
}: OrdersSectionProps) {
  const [internalPage, setInternalPage] = useState(1);
  const itemsPerPage = 10;

  // Convert API orders to component orders if needed
  const mappedOrders = useMemo(() => {
    return orders.map((order) => {
      // Check if it's an API order (has items property)
      if ("items" in order) {
        return mapAPIOrderToOrder(order as APIOrder);
      }
      return order as Order;
    });
  }, [orders]);

  // Use external pagination if provided, otherwise use internal
  const currentPage = externalCurrentPage ?? internalPage;
  const totalPages =
    externalTotalPages ?? Math.ceil(mappedOrders.length / itemsPerPage);
  const handlePageChange = onPageChange ?? setInternalPage;

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return mappedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [mappedOrders, currentPage]);

  const totalItems = mappedOrders.length;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                ORDER ID
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                ORDER DATE
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                PRODUCT
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                QUANTITY
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                TOTAL VALUE
              </th>
              <th className="text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                STATUS
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {paginatedOrders.map((order, index) => {
              const statusBadge = getStatusBadge(order.status);
              const bgColor = index % 2 === 1 ? "white" : "bg-[#F0F5F9]";
              const borderClass =
                index % 2 === 1 ? "" : "border-b border-[#F0F5F9]";

              return (
                <tr key={order.id} className={`${bgColor} ${borderClass}`}>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {order.orderId}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {formatDateTime(order.orderDate)}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {order.product}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {order.quantity}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {order.totalValue}
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
      {mappedOrders.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-6">
          <Text variant="small" color="muted">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
          </Text>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-muted/20 rounded-lg text-sm font-medium text-muted hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
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
