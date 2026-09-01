"use client";

import { useState } from "react";
import { Text } from "@/components/common";
import Pagination from "@/components/Pagination";
import { Modal } from "@/components/common/Modal";
import { BoldTopText } from "@/components/common/BoldTopText";
import { useWaybillDetail } from "@/hooks/api/useOfficerCustomer";
import {
  formatDateTime,
  formatNumberExact,
  formatNumberOrDash,
  formatToNairaOrDash,
} from "@/utils/formatter";
import { safeText } from "@/utils/safe";
import type { ErpWaybill } from "@/lib/api/types";

interface WaybillsSectionProps {
  waybills: ErpWaybill[];
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
 * The Waybills tab — now the ERP's OWN goods-movement documents.
 *
 * ⚠️ This is a different resource than it used to show. It listed the loading
 * requests raised through this portal; it now lists what the ERP recorded as
 * moved, whether or not it ever passed through the app. That is what the
 * distributor sees in their own app, and it is what an officer needs to
 * reconcile an account against.
 *
 * The loading requests are not lost - they are the `/requests/loading` screen,
 * which is where the assign and cancel actions live.
 *
 * `raw_sales_order` is one row per order line, so the API rolls rows up to one
 * per document. `lines` reports how many collapsed into each.
 */
export default function WaybillsSection({
  waybills,
  lastUpdated,
  customerId,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: WaybillsSectionProps) {
  const [openDocNo, setOpenDocNo] = useState<string | null>(null);

  const { data: detail, isLoading: isDetailLoading } = useWaybillDetail(
    customerId,
    openDocNo,
  );

  const openRow = waybills.find((row) => row.docNo === openDocNo) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text variant="thinnote" color="muted">
          Goods-movement documents recorded by the ERP.
        </Text>
        {lastUpdated && (
          <Text variant="thinnote" color="muted">
            Last updated {formatDateTime(lastUpdated)}
          </Text>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {[
                "DOC NO",
                "DOC DATE",
                "PRODUCTS",
                "ORDERED",
                "DELIVERED",
                "REMAINING",
                "TOTAL (INC. TAX)",
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
            {waybills.map((waybill, index) => (
              <tr
                // docNo is the identity - these rows have no `id`
                key={waybill.docNo}
                onClick={() => setOpenDocNo(waybill.docNo)}
                className={`${
                  index % 2 === 1 ? "bg-white" : "bg-[#F0F5F9]"
                } cursor-pointer hover:opacity-80`}
              >
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {safeText(waybill.docNo, "—")}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {safeText(waybill.docDate, "—")}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {formatNumberExact(waybill.products ?? 0)}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {formatNumberExact(waybill.quantityOrdered ?? 0)}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {formatNumberExact(waybill.quantityDelivered ?? 0)}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-bold text-foreground p-2">
                  {formatNumberExact(waybill.quantityRemaining ?? 0)}
                </td>
                {/* Null wherever the ERP states no money - a dash, never ₦0 */}
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  {formatToNairaOrDash(waybill.totalAmountAfterTax)}
                </td>
                <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                  <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#F0F5F9] text-[#4B5BD1]">
                    {safeText(waybill.status, "—")}
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

      {/* Document detail */}
      <Modal open={!!openDocNo} onClose={() => setOpenDocNo(null)}>
        <div className="max-h-[80vh] overflow-y-auto">
          <div className="border-b border-muted/20 pb-3 pr-8">
            <Text variant="body" weight="bold" color="foreground">
              {safeText(openDocNo, "Document")}
            </Text>
            <Text variant="caption" weight="medium" color="muted">
              {safeText(detail?.docDate ?? openRow?.docDate, "")}
            </Text>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5">
            <BoldTopText
              top="Ordered"
              bottom={formatNumberExact(
                detail?.quantityOrdered ?? openRow?.quantityOrdered ?? 0,
              )}
            />
            <BoldTopText
              top="Delivered"
              bottom={formatNumberExact(
                detail?.quantityDelivered ?? openRow?.quantityDelivered ?? 0,
              )}
            />
            <BoldTopText
              top="Remaining"
              bottom={formatNumberExact(
                detail?.quantityRemaining ?? openRow?.quantityRemaining ?? 0,
              )}
            />
            {/* The ERP's document-level QTY_TOTAL - NOT the sum of the items,
                so it is labelled as the ERP's own figure */}
            <BoldTopText
              top="ERP Qty Total"
              bottom={formatNumberOrDash(detail?.quantity ?? openRow?.quantity)}
            />
            <BoldTopText
              top="Before Tax"
              bottom={formatToNairaOrDash(
                detail?.totalAmountBeforeTax ?? openRow?.totalAmountBeforeTax,
              )}
            />
            <BoldTopText
              top="VAT"
              bottom={formatToNairaOrDash(detail?.taxVat ?? openRow?.taxVat)}
            />
            <BoldTopText
              top="After Tax"
              bottom={formatToNairaOrDash(
                detail?.totalAmountAfterTax ?? openRow?.totalAmountAfterTax,
              )}
            />
            <BoldTopText
              top="Ship To"
              bottom={safeText(detail?.shipTo ?? openRow?.shipTo, "—")}
            />
          </div>

          {isDetailLoading && (
            <Text variant="caption" color="muted" className="block py-4">
              Loading document items...
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
                Items
              </Text>
              <Text variant="thinnote" color="muted" className="block mb-2">
                {/* Says so, because the invoice detail DOES merge and the two
                    sitting side by side would otherwise look inconsistent */}
                Reproduced as the ERP records them - a priced line and its
                free-goods companion both appear.
              </Text>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {[
                        "DESCRIPTION",
                        "CODE",
                        "SPEC",
                        "PRICE",
                        "QTY",
                        "DELIVERED",
                        "REMAINING",
                        "AFTER TAX",
                      ].map((title) => (
                        <th
                          key={title}
                          className="whitespace-nowrap text-[11px] font-bold text-muted p-2 text-left bg-[#F0F5F9]"
                        >
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item, index) => (
                      <tr
                        key={item.id ?? `${item.itemCode}-${index}`}
                        className={index % 2 === 1 ? "bg-white" : "bg-[#F0F5F9]"}
                      >
                        <td className="text-left text-[12px] font-medium text-foreground p-2">
                          {safeText(item.description, "—")}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {safeText(item.itemCode, "—")}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {safeText(item.specification, "—")}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {formatToNairaOrDash(item.price)}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {formatNumberExact(item.quantity ?? 0)}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {formatNumberExact(item.quantityDelivered ?? 0)}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-bold text-foreground p-2">
                          {formatNumberExact(item.quantityRemaining ?? 0)}
                        </td>
                        <td className="whitespace-nowrap text-left text-[12px] font-medium text-muted p-2">
                          {formatToNairaOrDash(item.totalAmountAfterTax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detail.items.length === 0 && (
                <Text variant="caption" color="muted" className="block py-4">
                  The ERP records no item lines for this document.
                </Text>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
