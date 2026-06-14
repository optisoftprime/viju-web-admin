"use client";

import { useState } from "react";
import { MainLayout } from "@/components/common";
import { Text, Button } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import AddFlyerModal from "@/components/AddFlyerModal";
import PreviewFlyerModal from "@/components/PreviewFlyerModal";
import SuccessModal from "@/components/SuccessModal";
import FlyerCard from "@/components/FlyerCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import flyImage from "@/assets/images/image 11.png";
import { StaticImageData } from "next/image";

interface Flyer {
  id: string;
  name: string;
  image: string | StaticImageData;
  position: number;
  status?: string;
}

// Mock flyer data
const mockFlyerData: Flyer[] = [
  {
    id: "1",
    name: "Viju Milk 330 ml",
    image: flyImage,
    position: 1,
    status: "active",
  },
  {
    id: "2",
    name: "Viju Milk 330 ml",
    image: flyImage,
    position: 2,
    status: "active",
  },
  {
    id: "3",
    name: "Viju Milk 330 ml",
    image: flyImage,
    position: 3,
    status: "active",
  },
  {
    id: "4",
    name: "Viju Milk 330 ml",
    image: flyImage,
    position: 4,
    status: "active",
  },
  {
    id: "5",
    name: "Viju Milk 330 ml",
    image: flyImage,
    position: 5,
    status: "active",
  },
  {
    id: "6",
    name: "Viju Milk 330 ml",
    image: flyImage,
    position: 6,
    status: "active",
  },
];

export default function FlyerPage() {
  const [flyers, setFlyers] = useState<Flyer[]>(mockFlyerData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    flyer: Flyer | null;
  }>({
    isOpen: false,
    flyer: null,
  });

  const handleAddFlyer = (flyerData: { name: string; image: string }) => {
    const newFlyer: Flyer = {
      id: (flyers.length + 1).toString(),
      name: flyerData.name,
      image: flyerData.image,
      position: flyers.length + 1,
      status: "active",
    };

    setFlyers([...flyers, newFlyer]);
    setSuccessModal({
      isOpen: true,
      title: "Flyer Created Successfully",
      message: "Your new flyer has been added to the system.",
    });
  };

  const handleDeactivateFlyer = (flyer: Flyer) => {
    setSelectedFlyer(flyer);
    setIsPreviewModalOpen(true);
  };

  const handleConfirmDeactivate = (flyer: Flyer) => {
    setFlyers(
      flyers.map((f) => (f.id === flyer.id ? { ...f, status: "inactive" } : f)),
    );
    setSuccessModal({
      isOpen: true,
      title: "Flyer Deactivated Successfully",
      message: "The flyer has been deactivated.",
    });
  };

  const handleDeleteFlyer = (flyer: Flyer) => {
    setDeleteConfirmation({
      isOpen: true,
      flyer: flyer,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.flyer) {
      setFlyers(flyers.filter((f) => f.id !== deleteConfirmation.flyer?.id));
      setDeleteConfirmation({
        isOpen: false,
        flyer: null,
      });
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="h-screen overflow-y-auto space-y-6 px-4 pt-4 pb-30">
          {/* Page Header with Add Button */}
          <div className="flex items-center justify-between">
            {/* Information Banner */}
            <div className="bg-blue-400/20 border border-blue-400/20 rounded-lg p-2 max-w-xl">
              <Text variant="caption" color="statuslightblue" weight="medium">
                <span className="text-statuslightblue">
                  These cards appear in the scrollable flyer on the distributor
                  mobile home screen. Reorder by drag. Deactivated cards are
                  hidden from the app.
                </span>
              </Text>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-primary via-orange to-primary"
            >
              + Add Flyer
            </Button>
          </div>

          {/* Flyer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
            {flyers.map((flyer) => (
              <FlyerCard
                key={flyer.id}
                flyer={flyer}
                onDeactivate={handleDeactivateFlyer}
                onDelete={handleDeleteFlyer}
              />
            ))}
          </div>

          {flyers.length === 0 && (
            <div className="text-center py-12">
              <Text variant="body" color="muted">
                No flyers yet. Click "Add Flyer" to get started.
              </Text>
            </div>
          )}
        </div>

        {/* Add Flyer Modal */}
        <AddFlyerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddFlyer}
        />

        {/* Preview Flyer Modal */}
        <PreviewFlyerModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          flyer={selectedFlyer || undefined}
          onConfirm={handleConfirmDeactivate}
        />

        {/* Success Modal */}
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() =>
            setSuccessModal({ isOpen: false, title: "", message: "" })
          }
          title={successModal.title}
          message={successModal.message}
          buttonText="Continue"
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && deleteConfirmation.flyer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
              <Text variant="h3" weight="bold">
                Delete Flyer
              </Text>
              <Text variant="body" color="muted">
                Are you sure you want to delete "{deleteConfirmation.flyer.name}
                "? This action cannot be undone.
              </Text>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setDeleteConfirmation({ isOpen: false, flyer: null })
                  }
                  className="text-muted border border-muted/20"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}
