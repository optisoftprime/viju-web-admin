"use client";

import { useState } from "react";
import { Text } from "@/components/common";
import Pagination from "@/components/Pagination";
import { Modal } from "@/components/common/Modal";
import { BoldTopText } from "@/components/common/BoldTopText";
import { useInvoiceDetail } from "@/hooks/api/useOfficerCustomer";
import {
  formatDateTime,
  formatToNairaExact,
  formatToNairaOrDash,
  formatNumberExact,
} from "@/utils/formatter";
import { safeText } from "@/utils/safe";
import type { OrderRow, PaymentHistory } from "@/lib/api/types";

interface InvoicesSectionProps {
  /** The current page of orders. `invoices[]` became `data[]` + `meta`. */
  invoices: OrderRow[];
  /** The TAB's own figures - not part of the list, and they do not page */
  walletBalance?: number;
  paymentHistory?: PaymentHistory[];
  /** Most recent ERP sync across the balance, the WHOLE history and payments */
  lastUpdated?: string;
  /** Needed to open a row - the detail route is scoped to the distributor */
  customerId: string | null;

  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * The Invoices tab, rebuilt on the officer-parity contract.
 *
 * Two things changed and both are visible here:
 *
 *   - the list is PAGINATED, and it no longer carries line items. It used to
 *     invent the columns it could not fill - "Wallet Balance ₦0", "Amount Paid
 *     ₦0", every row hardcoded "Part Paid" - because the shape it was written
 *     against did not have them. Those columns are gone rather than lying.
 *   - opening a row fetches the order's merged product lines, which is where
 *     the detail actually lives now.
 *
 * The wallet balance is shown ONCE, above the table, because that is what it
 * is: the account's figure, not a property of each order.
 */
export default function InvoicesSection({
  invoices,
  walletBalance,
  paymentHistory = [],
  lastUpdated,
  customerId,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: InvoicesSectionProps) {
  const [openOrder, setOpenOrder] = useState<OrderRow | null>(null);

  const { data: detail, isLoading: isDetailLoading } = useInvoiceDetail(
    customerId,
    openOrder?.id ?? null,
  );

  return (
    <div className="space-y-4">
      {/* Account figures - the tab's own, stated once */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-6">
          <BoldTopText
            top="Wallet Balance"
            bottom={formatToNairaOrDash(walletBalance)}
          />
          <BoldTopText
            top="Payments Recorded"
            bottom={String(paymentHistory.length)}
          />
        </div>
        {lastUpdated && (
          <Text variant="thinnote" color="muted">
            {/* Across the whole history, not this page - so paging never
                moves it */}
            Last updated {formatDateTime(lastUpdated)}
          </Text>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {[
                "ORDER NO",
                "ORDER DATE",
                "CARTONS",
                "ORDER VALUE",
                "STATUS",
              ].map((title) => (
                <th
                  key={title}
                  className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-left bg-[#F0F5F9]"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {invoices.map((order, index) => (
              <tr
                key={order.id}
                onClick={() => setOpenOrder(order)}
                className={`${
                  index % 2 === 1 ? "bg-white" : "bg-[#F0F5F9]"
                } cursor-pointer hover:opacity-80`}
              >
                {/* erpId is the ERP document number - what to show, not `id` */}
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {safeText(order.erpId, order.id)}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {formatDateTime(order.orderDate)}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {formatNumberExact(order.totalItems ?? 0)}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {formatToNairaExact(order.totalValue ?? 0)}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#F0F5F9] text-[#4B5BD1]">
                    {safeText(order.status, "—")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={pageSize}
        onPrevious={() => onPageChange(Math.max(1, currentPage - 1))}
        onNext={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        onItemsPerPageChange={(size) => {
          onPageSizeChange(size);
          onPageChange(1);
        }}
      />

      {/* Order detail - the lines the list no longer carries */}
      <Modal open={!!openOrder} onClose={() => setOpenOrder(null)}>
        <div className="max-h-[80vh] overflow-y-auto">
          <div className="border-b border-muted/20 pb-3 pr-8">
            <Text variant="body" weight="bold" color="foreground">
              {safeText(detail?.orderId ?? openOrder?.erpId, "Order")}
            </Text>
            <Text variant="caption" weight="medium" color="muted">
              {openOrder ? formatDateTime(openOrder.orderDate) : ""}
            </Text>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5">
            <BoldTopText
              top="Cartons"
              bottom={formatNumberExact(
                detail?.totalItems ?? openOrder?.totalItems ?? 0,
              )}
            />
            <BoldTopText
              top="Order Value"
              bottom={formatToNairaExact(
                detail?.totalValue ?? openOrder?.totalValue ?? 0,
              )}
            />
            <BoldTopText
              top="Invoice No"
              bottom={safeText(detail?.linkedInvoiceNumber, "—")}
            />
            <BoldTopText
              top="Account Balance"
              bottom={formatToNairaOrDash(detail?.accountBalance)}
            />
          </div>

          {isDetailLoading && (
            <Text variant="caption" color="muted" className="block py-4">
              Loading order lines...
            </Text>
          )}

          {!isDetailLoading && detail && (
            <>
              <Text
                variant="caption"
                weight="bold"
                color="muted"
                className="uppercase tracking-wider"
              >
                Products
              </Text>

              <div className="overflow-x-auto mt-2">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["PRODUCT", "CODE", "QTY", "UNIT PRICE", "AMOUNT"].map(
                        (title) => (
                          <th
                            key={title}
                            className="whitespace-nowrap text-[11px] font-bold text-muted p-2 text-left bg-[#F0F5F9]"
                          >
                            {title}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((line, index) => (
                      <tr
                        // The ERP carries itemCode on a minority of rows, and
                        // lines are merged by product - the name is the key
                        key={`${line.product}-${index}`}
                        className={index % 2 === 1 ? "bg-white" : "bg-[#F0F5F9]"}
                      >
                        <td className="text-left text-[12px] font-medium text-foreground p-2">
                          {safeText(line.product, "—")}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {safeText(line.itemCode, "—")}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {formatNumberExact(line.quantity ?? 0)}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {formatToNairaOrDash(line.unitPrice)}
                        </td>
                        {/*
                          Rendered AS GIVEN. `amount` is authoritative and sums
                          to the order value; recomputing it as quantity ×
                          unitPrice is wrong, because a merged line's rate is
                          an effective one rounded to 2dp and cannot multiply
                          back to the exact naira.
                        */}
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {formatToNairaOrDash(line.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detail.lines.length === 0 && (
                <Text variant="caption" color="muted" className="block py-4">
                  The ERP records no product lines for this order.
                </Text>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
