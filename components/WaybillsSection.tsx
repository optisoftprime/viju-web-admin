"use client";

import { useState, useMemo } from "react";
import { Text } from "@/components/common";
import Pagination from "@/components/Pagination";
import RowDetailsModal from "@/components/RowDetailsModal";
import { DEFAULT_SECTION_PAGE_SIZE } from "@/constants/pagination";
import { Waybill as APIWaybill } from "@/src/lib/api/types";

interface Waybill {
  id: string;
  waybill: string;
  linkedOrderId: string;
  product: string;
  quantity: string;
  loadingDate: string;
  destination: string;
  driverVehicle: string;
  status: "Completed" | "In Progress" | "Pending Assign...";
}

interface WaybillsSectionProps {
  waybills?: Waybill[] | APIWaybill[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  /** Server page size, when the parent drives pagination */
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  /** Total rows across all pages - defaults to the rows handed in */
  totalItems?: number;
}

// Mock waybills data
const mockWaybills: Waybill[] = [
  {
    id: "1",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "2",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "In Progress",
  },
  {
    id: "3",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "4",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Pending Assign...",
  },
  {
    id: "5",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "6",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "In Progress",
  },
  {
    id: "7",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "In Progress",
  },
  {
    id: "8",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "9",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Pending Assign...",
  },
  {
    id: "10",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "11",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "In Progress",
  },
  {
    id: "12",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "In Progress",
  },
  {
    id: "13",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "14",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Pending Assign...",
  },
  {
    id: "15",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "16",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "In Progress",
  },
  {
    id: "17",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "18",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "In Progress",
  },
  {
    id: "19",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "20",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Pending Assign...",
  },
  {
    id: "21",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "Completed",
  },
  {
    id: "22",
    waybill: "WB-19045",
    linkedOrderId: "ORD-3467",
    product: "Viju Apple Drink",
    quantity: "120 Cartons",
    loadingDate: "15 April 2026,",
    destination: "Yaba Ware House",
    driverVehicle: "Jimoh Ibrahim KJA-20452",
    status: "In Progress",
  },
];

const getStatusBadge = (
  status: "Completed" | "In Progress" | "Pending Assign...",
) => {
  if (status === "Completed") {
    return {
      text: status,
      bgColor: "#D4FFE9",
      textColor: "#04B054",
    };
  } else if (status === "In Progress") {
    return {
      text: status,
      bgColor: "#FFF4E1",
      textColor: "#FFA10B",
    };
  } else if (status === "Pending Assign...") {
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

// Helper function to map API Waybill to component Waybill format
const mapAPIWaybillToWaybill = (apiWaybill: APIWaybill): Waybill => {
  return {
    id: apiWaybill.id,
    waybill: apiWaybill.reference,
    linkedOrderId: apiWaybill.linkedPurchaseId,
    product: "Product", // Not available in API response
    quantity: `${apiWaybill.quantityCartons} Cartons`,
    loadingDate: new Date(apiWaybill.requestedLoadingDate).toLocaleDateString(
      "en-NG",
    ),
    destination: apiWaybill.destination,
    driverVehicle: `${apiWaybill.driverName} ${apiWaybill.truckPlateNumber}`,
    status:
      apiWaybill.status === "Completed" ||
      apiWaybill.status === "In Progress" ||
      apiWaybill.status === "Pending Assign..."
        ? (apiWaybill.status as any)
        : "In Progress",
  };
};

export default function WaybillsSection({
  waybills = mockWaybills,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange,
  pageSize: externalPageSize,
  onPageSizeChange,
  totalItems: externalTotalItems,
}: WaybillsSectionProps) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(
    DEFAULT_SECTION_PAGE_SIZE,
  );
  const [detailsRow, setDetailsRow] = useState<Waybill | null>(null);
  const itemsPerPage = externalPageSize ?? internalPageSize;

  // Convert API waybills to component waybills if needed
  const mappedWaybills = useMemo(() => {
    return waybills.map((waybill) => {
      // Check if it's an API waybill (has linkedPurchaseId property)
      if ("linkedPurchaseId" in waybill) {
        return mapAPIWaybillToWaybill(waybill as APIWaybill);
      }
      return waybill as Waybill;
    });
  }, [waybills]);

  // Use external pagination if provided, otherwise use internal
  const isServerPaged = externalCurrentPage !== undefined;
  const currentPage = externalCurrentPage ?? internalPage;
  const totalPages =
    externalTotalPages ?? Math.ceil(mappedWaybills.length / itemsPerPage);
  const handlePageChange = onPageChange ?? setInternalPage;

  /**
   * Server-paged rows already arrive one page at a time - slicing again
   * would hide part of the page.
   */
  const paginatedWaybills = useMemo(() => {
    if (isServerPaged) return mappedWaybills;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return mappedWaybills.slice(startIndex, startIndex + itemsPerPage);
  }, [mappedWaybills, currentPage, itemsPerPage, isServerPaged]);

  const totalItems = externalTotalItems ?? mappedWaybills.length;

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
              <th className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                WAYBILL
              </th>
              <th className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                LINKED ORDER ID
              </th>
              <th className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                PRODUCT
              </th>
              <th className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                QUANTITY
              </th>
              <th className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                LOADING DATE
              </th>
              <th className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                DESTINATION
              </th>
              <th className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                DRIVER/VEHICLE
              </th>
              <th className="whitespace-nowrap text-[12px] font-bold text-muted p-2 text-center bg-[#F0F5F9]">
                STATUS
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {paginatedWaybills.map((waybill, index) => {
              const statusBadge = getStatusBadge(waybill.status);
              const bgColor = index % 2 === 1 ? "white" : "bg-[#F0F5F9]";
              const borderClass =
                index % 2 === 1 ? "" : "border-b border-[#F0F5F9]";

              return (
                <tr
                  key={waybill.id}
                  onClick={() => setDetailsRow(waybill)}
                  className={`${bgColor} ${borderClass} cursor-pointer`}
                >
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {waybill.waybill}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {waybill.linkedOrderId}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {waybill.product}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {waybill.quantity}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {waybill.loadingDate}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {waybill.destination}
                  </td>
                  <td className="whitespace-nowrap text-left text-[14px] font-medium text-muted p-2">
                    {waybill.driverVehicle}
                  </td>
                  <td className="text-left text-[14px] font-medium text-muted p-2">
                    <span
                      style={{
                        backgroundColor: statusBadge.bgColor,
                        color: statusBadge.textColor,
                      }}
                      className="px-3 py-1 whitespace-nowrap rounded-full text-sm font-semibold inline-block"
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
        title={detailsRow?.waybill || "Waybill"}
        subtitle="Waybill details"
        sections={[
          {
            title: "Waybill",
            fields: [
              { label: "Waybill", value: detailsRow?.waybill, type: "id" },
              {
                label: "Linked Order",
                value: detailsRow?.linkedOrderId,
                type: "id",
              },
              { label: "Status", value: detailsRow?.status, type: "status" },
              { label: "Loading Date", value: detailsRow?.loadingDate },
            ],
          },
          {
            title: "Shipment",
            fields: [
              { label: "Product", value: detailsRow?.product, fullWidth: true },
              { label: "Quantity", value: detailsRow?.quantity },
              { label: "Destination", value: detailsRow?.destination },
              {
                label: "Driver / Vehicle",
                value: detailsRow?.driverVehicle,
                fullWidth: true,
              },
            ],
          },
        ]}
      />
    </div>
  );
}
