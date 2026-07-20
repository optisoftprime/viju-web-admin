"use client";

import { useState, useMemo } from "react";
import { Text } from "@/components/common";
import { Order as APIOrder } from "@/src/lib/api/types";
import { formatDateTime } from "@/src/utils/formatter";

interface Invoice {
  id: string;
  invoiceNo: string;
  walletBalance: string;
  invoiceDate: string;
  invoiceAmount: string;
  amountPaid: string;
  outstandingAmount: string;
  paymentStatus: "Paid" | "Part Paid";
}

interface InvoicesSectionProps {
  invoices?: Invoice[] | APIOrder[];
  paymentHistory?: any[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

// Mock invoices data
const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "2",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "3",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "4",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "5",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "6",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "7",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "8",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "9",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "10",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "11",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "12",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "13",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "14",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "15",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "16",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "17",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "18",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "19",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "20",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
  {
    id: "21",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦2,700,000",
    outstandingAmount: "₦2,700,000",
    paymentStatus: "Paid",
  },
  {
    id: "22",
    invoiceNo: "INV-001",
    walletBalance: "₦4,000,000",
    invoiceDate: "2026-03-23",
    invoiceAmount: "₦2,700,000",
    amountPaid: "₦1,000,000",
    outstandingAmount: "₦600,000",
    paymentStatus: "Part Paid",
  },
];

const getStatusBadge = (status: "Paid" | "Part Paid") => {
  if (status === "Paid") {
    return {
      text: status,
      bgColor: "#D4FFE9",
      textColor: "#04B054",
    };
  } else if (status === "Part Paid") {
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

// Helper function to map API Order to component Invoice format
const mapAPIOrderToInvoice = (apiOrder: APIOrder): Invoice => {
  return {
    id: apiOrder.id,
    invoiceNo: apiOrder.erpId || apiOrder.id,
    walletBalance: "₦0", // Not available in API Order
    invoiceDate: apiOrder.orderDate,
    invoiceAmount: `₦${(apiOrder.totalValue || 0).toLocaleString()}`,
    amountPaid: "₦0", // Not available in API Order
    outstandingAmount: `₦${(apiOrder.totalValue || 0).toLocaleString()}`,
    paymentStatus: "Part Paid" as const,
  };
};

export default function InvoicesSection({
  invoices = mockInvoices,
  paymentHistory = [],
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange,
}: InvoicesSectionProps) {
  const [internalPage, setInternalPage] = useState(1);
  const itemsPerPage = 10;

  // Convert API orders to component invoices if needed
  const mappedInvoices = useMemo(() => {
    return invoices.map((invoice) => {
      // Check if it's an API order (has items property)
      if ("items" in invoice) {
        return mapAPIOrderToInvoice(invoice as APIOrder);
      }
      return invoice as Invoice;
    });
  }, [invoices]);

  // Use external pagination if provided, otherwise use internal
  const currentPage = externalCurrentPage ?? internalPage;
  const totalPages =
    externalTotalPages ?? Math.ceil(mappedInvoices.length / itemsPerPage);
  const handlePageChange = onPageChange ?? setInternalPage;

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return mappedInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [mappedInvoices, currentPage]);

  const totalItems = mappedInvoices.length;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr>
              <th className="text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                INVOICE NO
              </th>
              <th className="text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                WALLET BALANCE
              </th>
              <th className="text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                INVOICE DATE
              </th>
              <th className="text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                INVOICE AMOUNT
              </th>
              <th className="text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                AMOUNT PAID
              </th>
              <th className="text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                OUTSTANDING AMOUNT
              </th>
              <th className="text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                PAYMENT STATUS
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {paginatedInvoices.map((invoice, index) => {
              const statusBadge = getStatusBadge(invoice.paymentStatus);
              const bgColor = index % 2 === 1 ? "white" : "bg-[#F0F5F9]";
              const borderClass =
                index % 2 === 1 ? "" : "border-b border-[#F0F5F9]";

              return (
                <tr key={invoice.id} className={`${bgColor} ${borderClass}`}>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {invoice.invoiceNo}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {invoice.walletBalance}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {formatDateTime(invoice.invoiceDate)}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {invoice.invoiceAmount}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {invoice.amountPaid}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    {invoice.outstandingAmount}
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
      {mappedInvoices.length > itemsPerPage && (
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
              disabled={currentPage === totalPages}
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
