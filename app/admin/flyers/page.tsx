"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/common";
import { Text, Button } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import AddFlyerModal from "@/components/AddFlyerModal";
import PreviewFlyerModal from "@/components/PreviewFlyerModal";
import SuccessModal from "@/components/SuccessModal";
import FlyerCard from "@/components/FlyerCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  useFlyers,
  useCreateFlyer,
  useUpdateFlyer,
  useDeleteFlyer,
} from "@/hooks/api/useFlyer";
import { Flyer } from "@/lib/api/types";

export default function FlyerPage() {
  const { data: flyersData, isLoading, error } = useFlyers();
  const createFlyerMutation = useCreateFlyer();
  const updateFlyerMutation = useUpdateFlyer();
  const deleteFlyerMutation = useDeleteFlyer();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);
  const [editingFlyer, setEditingFlyer] = useState<Flyer | null>(null);
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

  // Transform API data to display format
  const flyers = useMemo(() => {
    return (flyersData || []).map((flyer) => ({
      ...flyer,
      image: flyer.imageUrl,
      position: flyer.sortOrder,
    }));
  }, [flyersData]);

  const handleAddFlyerClick = () => {
    setEditingFlyer(null);
    setIsAddModalOpen(true);
  };

  const handleEditFlyer = (flyer: any) => {
    setEditingFlyer(flyer);
    setIsAddModalOpen(true);
  };

  const handleAddFlyer = async (flyerData: {
    name: string;
    imageUrl: string;
  }) => {
    try {
      if (editingFlyer) {
        // Update mode
        await updateFlyerMutation.mutateAsync({
          id: editingFlyer.id,
          data: flyerData,
        });
        setSuccessModal({
          isOpen: true,
          title: "Flyer Updated Successfully",
          message: "Your flyer has been updated.",
        });
      } else {
        // Create mode
        await createFlyerMutation.mutateAsync(flyerData);
        setSuccessModal({
          isOpen: true,
          title: "Flyer Created Successfully",
          message: "Your new flyer has been added to the system.",
        });
      }
    } catch (err) {
      setSuccessModal({
        isOpen: true,
        title: "Error",
        message: "Failed to save flyer. Please try again.",
      });
    }
  };

  const handleDeactivateFlyer = (flyer: any) => {
    setSelectedFlyer(flyer);
    setIsPreviewModalOpen(true);
  };

  const handleConfirmDeactivate = async (flyer: any) => {
    try {
      await updateFlyerMutation.mutateAsync({
        id: flyer.id,
        data: { isActive: false },
      });
      setSuccessModal({
        isOpen: true,
        title: "Flyer Deactivated Successfully",
        message: "The flyer has been deactivated.",
      });
    } catch (err) {
      setSuccessModal({
        isOpen: true,
        title: "Error",
        message: "Failed to deactivate flyer. Please try again.",
      });
    }
  };

  const handleDeleteFlyer = (flyer: any) => {
    setDeleteConfirmation({
      isOpen: true,
      flyer: flyer,
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.flyer) {
      try {
        await deleteFlyerMutation.mutateAsync(deleteConfirmation.flyer.id);
        setDeleteConfirmation({
          isOpen: false,
          flyer: null,
        });
      } catch (err) {
        console.error("Failed to delete flyer:", err);
      }
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
              onClick={handleAddFlyerClick}
              className="bg-linear-to-r from-primary via-orange to-primary text-[12px]"
            >
              + Add Flyer
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <Text variant="body" color="muted">
                Loading flyers...
              </Text>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <Text variant="body" color="muted">
                Error loading flyers. Please try again.
              </Text>
            </div>
          )}

          {/* Flyer Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {flyers.map((flyer) => (
                <FlyerCard
                  key={flyer.id}
                  flyer={flyer}
                  onEdit={handleEditFlyer}
                  onDeactivate={handleDeactivateFlyer}
                  onDelete={handleDeleteFlyer}
                />
              ))}
            </div>
          )}

          {!isLoading && !error && flyers.length === 0 && (
            <div className="text-center py-12">
              <Text variant="body" color="muted">
                No flyers yet. Click "Add Flyer" to get started.
              </Text>
            </div>
          )}
        </div>

        {/* Add/Edit Flyer Modal */}
        <AddFlyerModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingFlyer(null);
          }}
          onSubmit={handleAddFlyer}
          flyer={editingFlyer}
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
                " ? This action cannot be undone.
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
