"use client";

import { useState } from "react";
import { MainLayout } from "@/components/common";
import { Text, Card, Button } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { Upload } from "lucide-react";
import Image from "next/image";
import assignedIcon from "@/assets/icons/assigned.svg";
import completedIcon from "@/assets/icons/completed.svg";
import loadingInProgressIcon from "@/assets/icons/loading-in-progress.svg";

interface LoadingQueueItem {
  id: string;
  orderId: string;
  distributorName: string;
  region: string;
  submittedAt: string;
  status: "assigned" | "in-progress" | "completed";
}

interface SelectedItemDetail {
  orderId: string;
  distributorName: string;
  region: string;
  submittedAt: string;
  truck: string;
  driver: string;
  loadingDate: string;
  quantity: string;
  currentStatus: "assigned" | "in-progress" | "completed";
}

// Mock loading queue data
const mockLoadingQueue: LoadingQueueItem[] = [
  {
    id: "1",
    orderId: "ORD-0099",
    distributorName: "Ibonodu Mega Distributor",
    region: "RJ-290 - Tomorrow, 09:00 AM",
    submittedAt: "Today, 10:10 AM",
    status: "assigned",
  },
  {
    id: "2",
    orderId: "ORD-0098",
    distributorName: "Unity Stores Nig. Ltd",
    region: "RJ-290 LL - Tomorrow, 08:30 AM",
    submittedAt: "Today, 09:15 AM",
    status: "in-progress",
  },
];

// Mock detail data mapping
const mockDetailsMap: Record<string, SelectedItemDetail> = {
  "1": {
    orderId: "ORD-0099",
    distributorName: "Ibonodu Mega Distributor",
    region: "RJ-290 LL",
    submittedAt: "Today, 09:00 AM",
    truck: "LAG-23+LA",
    driver: "Drake John",
    loadingDate: "Tomorrow 09:30",
    quantity: "320 cartons",
    currentStatus: "assigned",
  },
  "2": {
    orderId: "ORD-0098",
    distributorName: "Unity Stores Nig. Ltd",
    region: "RJ-29 LL",
    submittedAt: "Tomorrow, 08:30 AM",
    truck: "LAG-290-LA",
    driver: "Drake John",
    loadingDate: "Tomorrow 09:30",
    quantity: "320 cartons",
    currentStatus: "in-progress",
  },
};

function LoadingQueueContent() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    mockLoadingQueue.length > 0 ? mockLoadingQueue[0].id : null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const selectedItem = selectedItemId
    ? mockLoadingQueue.find((item) => item.id === selectedItemId)
    : null;
  const selectedDetail = selectedItemId ? mockDetailsMap[selectedItemId] : null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleSubmit = () => {
    if (!uploadedFile) {
      setError("Please upload a document before submitting");
      return;
    }
    console.log("Submitting:", {
      selectedItemId,
      selectedStatus,
      uploadedFile: uploadedFile.name,
    });
    // Handle submission
    setUploadedFile(null);
    setSelectedStatus(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
        return assignedIcon;
      case "in-progress":
        return loadingInProgressIcon;
      case "completed":
        return completedIcon;
      default:
        return assignedIcon;
    }
  };

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-30 space-y-6 overflow-y-auto h-screen bg-milkwhite/90">
        {/* Page Header */}
        <PageHeader
          title="My Loading Queue"
          subtitle="Manage your assigned loading requests"
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-[30%_70%] gap-6">
          {/* Left Column - Assigned List */}
          <div className="space-y-4">
            <Text variant="body" weight="bold" color="foreground">
              Assigned to you
            </Text>

            {mockLoadingQueue.length > 0 ? (
              <div className="space-y-3">
                {mockLoadingQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`cursor-pointer transition-all border rounded-xl ${
                      selectedItemId === item.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setSelectedStatus(null);
                      setUploadedFile(null);
                      setError(null);
                    }}
                  >
                    <Card border={false} className="bg-transparent">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <Text
                              variant="caption"
                              weight="bold"
                              color="foreground"
                            >
                              {item.orderId}
                            </Text>
                            <Text variant="thinnote" color="foreground">
                              {item.distributorName}
                            </Text>
                          </div>
                          <div
                            className={`inline-block px-2 py-1 rounded text-[10px] font-semibold ${
                              item.status === "assigned"
                                ? "bg-orange/20 text-orange"
                                : item.status === "in-progress"
                                  ? "bg-blue-500/20 text-blue-600"
                                  : "bg-success/20 text-success"
                            }`}
                          >
                            {item.status === "assigned"
                              ? "Assigned"
                              : item.status === "in-progress"
                                ? "In progress"
                                : "Completed"}
                          </div>
                        </div>
                        <Text variant="caption" color="muted">
                          {item.region}
                        </Text>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Card border={false}>
                <div className="flex items-center justify-center p-8 text-center">
                  <Text variant="caption" color="muted">
                    No loading requests assigned to you
                  </Text>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Detail View */}
          <div className="space-y-4">
            {selectedDetail && selectedItem ? (
              <>
                {/* Header Section */}
                <Card border={false}>
                  <div className="flex items-start justify-between pb-4 border-b">
                    <div>
                      <Text variant="body" weight="bold" color="foreground">
                        {selectedDetail.orderId}
                      </Text>
                      <Text variant="caption" color="muted">
                        {selectedDetail.distributorName}
                      </Text>
                      <Text variant="caption" color="muted">
                        RJ-290 LL - Tomorrow, 08:30 AM
                      </Text>
                    </div>
                    <div
                      className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                        selectedItem.status === "assigned"
                          ? "bg-orange/20 text-orange"
                          : selectedItem.status === "in-progress"
                            ? "bg-blue-500/20 text-blue-600"
                            : "bg-success/20 text-success"
                      }`}
                    >
                      {selectedItem.status === "assigned"
                        ? "Assigned"
                        : selectedItem.status === "in-progress"
                          ? "In progress"
                          : "Completed"}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
                    <div>
                      <Text variant="caption" color="muted" weight="medium">
                        Truck
                      </Text>
                      <Text variant="small" weight="bold" color="foreground">
                        {selectedDetail.truck}
                      </Text>
                    </div>
                    <div>
                      <Text variant="caption" color="muted" weight="medium">
                        Driver
                      </Text>
                      <Text variant="small" weight="bold" color="foreground">
                        {selectedDetail.driver}
                      </Text>
                    </div>
                    <div>
                      <Text variant="caption" color="muted" weight="medium">
                        Loading Date
                      </Text>
                      <Text variant="small" weight="bold" color="foreground">
                        {selectedDetail.loadingDate}
                      </Text>
                    </div>
                    <div>
                      <Text variant="caption" color="muted" weight="medium">
                        Quantity
                      </Text>
                      <Text variant="small" weight="bold" color="foreground">
                        {selectedDetail.quantity}
                      </Text>
                    </div>
                  </div>
                </Card>

                {/* Status Update Section */}
                <Card border={false}>
                  <div className="space-y-3">
                    <Text variant="body" weight="bold" color="foreground">
                      Update Status
                    </Text>

                    <div className="flex flex-wrap gap-3">
                      {[
                        {
                          id: "assigned",
                          label: "Assigned",
                          icon: assignedIcon,
                        },
                        {
                          id: "in-progress",
                          label: "Mark Loading in Progress",
                          icon: loadingInProgressIcon,
                        },
                        {
                          id: "completed",
                          label: "Mark Completed",
                          icon: completedIcon,
                        },
                      ].map((status) => (
                        <Button
                          key={status.id}
                          variant={
                            selectedStatus === status.id ? "primary" : "outline"
                          }
                          onClick={() => setSelectedStatus(status.id)}
                          className={`flex items-center gap-2 ${
                            selectedStatus === status.id
                              ? status.id === "in-progress" ||
                                status.id === "completed"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-[#0000F9] text-white border-[#0000F9]"
                              : "border-muted/30 text-muted"
                          }`}
                        >
                          <Image
                            src={status.icon}
                            alt={status.label}
                            width={16}
                            height={16}
                            className="w-4 h-4"
                          />
                          {status.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Document Upload Section */}
                <Card border={false}>
                  <div className="space-y-3">
                    <Text variant="body" weight="bold" color="foreground">
                      Waybill/Loading Bill
                    </Text>
                    <Text variant="caption" color="muted">
                      Upload the loading document. If it becomes visible in the
                      distribution module app
                    </Text>

                    {/* Upload Area */}
                    <label className="block">
                      <div className="border-2 border-dashed border-muted/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Upload className="w-8 h-8 text-muted" />
                          <Text variant="small" weight="medium" color="muted">
                            {uploadedFile
                              ? `Selected: ${uploadedFile.name}`
                              : "Drop file or click to upload"}
                          </Text>
                        </div>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </div>
                    </label>

                    {error && (
                      <Text
                        variant="caption"
                        color="foreground"
                        className="text-red-600"
                      >
                        {error}
                      </Text>
                    )}

                    {uploadedFile && (
                      <Text variant="caption" color="success" weight="medium">
                        ✓ {uploadedFile.name} uploaded
                      </Text>
                    )}
                  </div>
                </Card>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-linear-to-r from-primary via-orange to-primary text-white py-3 font-semibold"
                >
                  Submit
                </Button>
              </>
            ) : (
              <Card border={false}>
                <div className="flex items-center justify-center p-12 text-center min-h-[400px]">
                  <Text variant="caption" color="muted">
                    Select a loading request to view details
                  </Text>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

/**
 * Loading Queue Page - Protected Route Wrapper
 */
export default function LoadingQueuePage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <LoadingQueueContent />
    </ProtectedRoute>
  );
}
