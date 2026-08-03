"use client";

import { useState, useMemo } from "react";
import { Text } from "@/components/common";
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
}: WaybillsSectionProps) {
  const [internalPage, setInternalPage] = useState(1);
  const itemsPerPage = 10;

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
  const currentPage = externalCurrentPage ?? internalPage;
  const totalPages =
    externalTotalPages ?? Math.ceil(mappedWaybills.length / itemsPerPage);
  const handlePageChange = onPageChange ?? setInternalPage;

  const paginatedWaybills = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return mappedWaybills.slice(startIndex, startIndex + itemsPerPage);
  }, [mappedWaybills, currentPage]);

  const totalItems = mappedWaybills.length;

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
                <tr key={waybill.id} className={`${bgColor} ${borderClass}`}>
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
      {mappedWaybills.length > itemsPerPage && (
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
