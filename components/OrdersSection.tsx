"use client";

import { useState, useMemo } from "react";
import { Table, Text } from "@/components/common";
import Pagination from "@/components/Pagination";
import RowDetailsModal from "@/components/RowDetailsModal";
import StatusBadge from "@/components/common/StatusBadge";
import { DEFAULT_SECTION_PAGE_SIZE } from "@/constants/pagination";
import { Order as APIOrder } from "@/src/lib/api/types";
import { formatDateTime, formatToNairaExact } from "@/src/utils/formatter";

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
  /** Server page size, when the parent drives pagination */
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  /** Total rows across all pages - defaults to the rows handed in */
  totalItems?: number;
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

// Helper function to map API Order to component Order format
const mapAPIOrderToOrder = (apiOrder: APIOrder): Order => {
  return {
    id: apiOrder.id,
    orderId: apiOrder.erpId || apiOrder.id,
    orderDate: apiOrder.orderDate,
    product: apiOrder.items?.[0]?.productName || "N/A",
    quantity: apiOrder.totalItems || 0,
    // Exact - toLocaleString() caps at 3 fraction digits and would round
    totalValue: formatToNairaExact(apiOrder.totalValue || 0),
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
  pageSize: externalPageSize,
  onPageSizeChange,
  totalItems: externalTotalItems,
}: OrdersSectionProps) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(
    DEFAULT_SECTION_PAGE_SIZE,
  );
  const [detailsRow, setDetailsRow] = useState<Order | null>(null);
  const itemsPerPage = externalPageSize ?? internalPageSize;

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
  const isServerPaged = externalCurrentPage !== undefined;
  const currentPage = externalCurrentPage ?? internalPage;
  const totalPages =
    externalTotalPages ?? Math.ceil(mappedOrders.length / itemsPerPage);
  const handlePageChange = onPageChange ?? setInternalPage;

  /**
   * Server-paged rows already arrive one page at a time - slicing again
   * would hide part of the page.
   */
  const paginatedOrders = useMemo(() => {
    if (isServerPaged) return mappedOrders;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return mappedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [mappedOrders, currentPage, itemsPerPage, isServerPaged]);

  const totalItems = externalTotalItems ?? mappedOrders.length;

  /**
   * Changing the page size restarts at page 1 so the offset stays valid
   */
  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    } else {
      setInternalPageSize(size);
    }
    handlePageChange(1);
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr>
              <th className="whitespace-nowrap text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                ORDER ID
              </th>
              <th className="whitespace-nowrap text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                ORDER DATE
              </th>
              <th className="whitespace-nowrap text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                PRODUCT
              </th>
              <th className="whitespace-nowrap text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                QUANTITY
              </th>
              <th className="whitespace-nowrap text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                TOTAL VALUE
              </th>
              <th className="whitespace-nowrap text-[14px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                STATUS
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {paginatedOrders.map((order, index) => {
              const bgColor = index % 2 === 1 ? "white" : "bg-[#F0F5F9]";
              const borderClass =
                index % 2 === 1 ? "" : "border-b border-[#F0F5F9]";

              return (
                <tr
                  key={order.id}
                  onClick={() => setDetailsRow(order)}
                  className={`${bgColor} ${borderClass} cursor-pointer`}
                >
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {order.orderId}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {formatDateTime(order.orderDate)}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {order.product}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {order.quantity}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {order.totalValue}
                  </td>
                  {/*
                    The shared palette. This table used to carry its own
                    two-status map, which is why "Processing" was amber here
                    and blue on the loading tables - the same word meaning two
                    different things depending on which screen you were on.
                  */}
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPrevious={() => handlePageChange(Math.max(1, currentPage - 1))}
        onNext={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        onItemsPerPageChange={handlePageSizeChange}
      />

      {/* Row Details Modal - opened by clicking any row */}
      <RowDetailsModal
        open={!!detailsRow}
        onClose={() => setDetailsRow(null)}
        title={detailsRow?.orderId || "Order"}
        subtitle="Order details"
        sections={[
          {
            title: "Order",
            fields: [
              { label: "Order ID", value: detailsRow?.orderId, type: "id" },
              { label: "Status", value: detailsRow?.status, type: "status" },
              {
                label: "Order Date",
                value: detailsRow?.orderDate,
                type: "date",
              },
              { label: "Quantity", value: detailsRow?.quantity },
            ],
          },
          {
            title: "Items",
            fields: [
              { label: "Product", value: detailsRow?.product, fullWidth: true },
              {
                label: "Total Value",
                value: detailsRow?.totalValue,
                type: "amount",
              },
            ],
          },
        ]}
      />
    </div>
  );
}
