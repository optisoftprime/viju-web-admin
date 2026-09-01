"use client";

import { Text } from "@/components/common";
import { BoldTopText } from "@/components/common/BoldTopText";
import { formatDateTime, formatNumberExact } from "@/utils/formatter";
import { safeText } from "@/utils/safe";
import type { StockProduct } from "@/lib/api/types";

interface StockSectionProps {
  totalPurchasedCartons: number;
  totalLoadedCartons: number;
  totalRemainingCartons: number;
  /** Percent */
  loadingProgress: number;
  /** ONLY products with something still to collect */
  products: StockProduct[];
  lastUpdated?: string;
  /** Set on the portfolio view - how many distributors were counted */
  customers?: number;
  /** True when a date window is applied, which changes what the totals mean */
  isFiltered?: boolean;
}

/**
 * The Stock tab, rebuilt as the ERP stock BALANCE.
 *
 * `catalogue` is gone. It listed every product in the local `Stock` table with
 * reserved / awaiting figures derived by a DIFFERENT route from the one the
 * distributor's own app reads - so the officer and the distributor could
 * disagree about the same account, which is the worst possible outcome for a
 * screen whose entire job is reconciliation. Both now read one ERP query.
 */
export default function StockSection({
  totalPurchasedCartons,
  totalLoadedCartons,
  totalRemainingCartons,
  loadingProgress,
  products,
  lastUpdated,
  customers,
  isFiltered = false,
}: StockSectionProps) {
  const progress = Math.max(0, Math.min(100, loadingProgress ?? 0));

  return (
    <div className="space-y-5">
      {/* Totals */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <BoldTopText
            top="Purchased"
            bottom={`${formatNumberExact(totalPurchasedCartons ?? 0)} cartons`}
          />
          <BoldTopText
            top="Loaded"
            bottom={`${formatNumberExact(totalLoadedCartons ?? 0)} cartons`}
          />
          <BoldTopText
            top="Still to Collect"
            bottom={`${formatNumberExact(totalRemainingCartons ?? 0)} cartons`}
          />
          {typeof customers === "number" && (
            <BoldTopText
              top="Distributors"
              bottom={formatNumberExact(customers)}
            />
          )}
        </div>

        {lastUpdated && (
          <Text variant="thinnote" color="muted">
            Last updated {formatDateTime(lastUpdated)}
          </Text>
        )}
      </div>

      {/* Loading progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Text variant="small" weight="semibold" color="foreground">
            Loading progress
          </Text>
          <Text variant="small" weight="bold" color="foreground">
            {progress}%
          </Text>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F0F5F9] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#04B054] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/*
        A filtered figure is NOT a slice of the whole.
        The window selects orders PLACED in it, minus whatever has since been
        delivered against them however late - so an order placed before the
        window is excluded outright even if it is still uncollected, and two
        adjacent windows do not add up to the unfiltered total.
      */}
      {isFiltered && (
        <div className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3">
          <Text variant="caption" weight="medium" color="orange">
            These totals cover orders placed in the selected dates only. They
            are not a slice of the overall balance - an order placed earlier is
            excluded even if it is still uncollected.
          </Text>
        </div>
      )}

      {/* Outstanding products */}
      <div>
        <Text
          variant="caption"
          weight="bold"
          color="muted"
          className="uppercase tracking-wider"
        >
          Still to collect
        </Text>

        {products.length === 0 ? (
          /*
            An empty list with non-zero totals is CORRECT, not a failure -
            it means everything purchased has been collected.
          */
          <div className="mt-2 rounded-lg border border-muted/20 bg-white px-4 py-6 text-center">
            <Text variant="caption" weight="medium" color="foreground">
              Nothing outstanding
            </Text>
            <Text variant="thinnote" color="muted" className="block mt-1">
              Every carton purchased has been collected.
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {[
                    "PRODUCT",
                    "CODE",
                    "PAID",
                    "LOADED",
                    "REMAINING",
                    "LAST ORDER",
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
                {products.map((product, index) => (
                  <tr
                    /*
                      Keyed on the NAME. `itemCode` is null on most rows - the
                      ERP carries it on a fraction of line rows, and rows are
                      grouped by product name in the first place.
                    */
                    key={`${product.productName}-${index}`}
                    className={index % 2 === 1 ? "bg-white" : "bg-[#F0F5F9]"}
                  >
                    <td className="text-left text-[13px] font-medium text-foreground p-2">
                      {safeText(product.productName, "—")}
                    </td>
                    <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                      {safeText(product.itemCode, "—")}
                    </td>
                    <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                      {formatNumberExact(product.quantityPaid ?? 0)}
                    </td>
                    <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                      {formatNumberExact(product.quantityLoaded ?? 0)}
                    </td>
                    <td className="whitespace-nowrap text-left text-[13px] font-bold text-foreground p-2">
                      {formatNumberExact(product.quantityRemaining ?? 0)}
                    </td>
                    <td className="whitespace-nowrap text-left text-[13px] font-medium text-muted p-2">
                      {safeText(product.lastOrderDate, "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {products.length > 0 && (
          <Text variant="thinnote" color="muted" className="mt-2 block">
            {/* Says so explicitly, because the arithmetic invites the wrong
                conclusion otherwise */}
            Only products with cartons still to collect are listed, so this does
            not add up to the purchased total.
          </Text>
        )}
      </div>
    </div>
  );
}
