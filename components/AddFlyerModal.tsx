"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { chatService } from "@/services/chat.service";
import { getErrorMessage } from "@/utils/apiError";
import PreviewFlyerModal from "@/components/PreviewFlyerModal";

interface Flyer {
  id?: string;
  name: string;
  imageUrl?: string;
  /** F-1: the flyer's own copy, shown under the artwork */
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface AddFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (flyerData: {
    name: string;
    imageUrl: string;
    description: string;
  }) => void;
  flyer?: Flyer | null;
}

/** Enough room for a promotion's copy without becoming an article */
const MAX_DESCRIPTION_LENGTH = 500;

export default function AddFlyerModal({
  isOpen,
  onClose,
  onSubmit,
  flyer,
}: AddFlyerModalProps) {
  const isEditMode = !!flyer?.id;

  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
    description: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // "Preview flyer before publishing" - shows exactly what the distributor
  // will see, using the same modal the flyers grid uses.
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    imageUrl?: string;
    description?: string;
  }>({});

  // Initialize form data when modal opens or flyer changes
  useEffect(() => {
    if (isOpen && isEditMode && flyer) {
      setFormData({
        name: flyer.name,
        imageUrl: flyer.imageUrl || "",
        // Absent on a flyer saved before the details field existed, and on
        // every flyer until the API persists it - both read as empty
        description: flyer.description ?? "",
      });
      setImagePreview(flyer.imageUrl || null);
    } else if (isOpen) {
      setFormData({ name: "", imageUrl: "", description: "" });
      setImagePreview(null);
    }
    setErrors({});
  }, [isOpen, isEditMode, flyer]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });

    // Clear error if field is filled
    if (value.trim()) {
      setErrors({ ...errors, name: undefined });
    }
  };

  /**
   * F-1: the flyer's details. Optional - a flyer can be pure artwork - so the
   * only rule is the length cap, cleared as soon as the text is back inside it.
   */
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, description: value }));

    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  /**
   * Upload the chosen file and keep the CDN URL the API returns.
   *
   * This previously stored the FileReader base64 data URI directly in
   * `imageUrl` and POSTed that to the API - which is why flyers failed to
   * display: a data URI is not a URL the CDN (or next/image) can serve.
   * The local preview still uses the data URI; only the SAVED value changes.
   */
  const uploadFlyerImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        imageUrl: "Please upload a valid image file",
      }));
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        imageUrl: "File size must be less than 5MB",
      }));
      return;
    }

    // Instant local preview while the upload runs
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    setErrors((prev) => ({ ...prev, imageUrl: undefined }));

    try {
      // POST /uploads now requires the Authorization header - apiClient
      // attaches it automatically.
      const url = await chatService.uploadFile(file, "product-flyers");

      if (!url) throw new Error("Upload did not return a URL");

      setFormData((prev) => ({ ...prev, imageUrl: url }));
      setImagePreview(url);
    } catch (error) {
      setImagePreview(null);
      setErrors((prev) => ({
        ...prev,
        imageUrl: getErrorMessage(error) || "Could not upload that image",
      }));
      toast.error(getErrorMessage(error) || "Could not upload that image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFlyerImage(file);
    // allow re-picking the same file after a failed upload
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) void uploadFlyerImage(files[0]);
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      imageUrl?: string;
      description?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Flyer Name is required";
    }

    // Optional, so only the cap is enforced
    if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Flyer Details must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`;
    }

    if (isUploading) {
      newErrors.imageUrl = "Please wait for the image upload to finish";
    } else if (!formData.imageUrl) {
      newErrors.imageUrl = "Flyer Image is required";
    } else if (formData.imageUrl.startsWith("data:")) {
      // Guard against ever saving a data URI again
      newErrors.imageUrl = "Image is still uploading. Please try again.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Trimmed here so a details box holding only whitespace is saved as
      // empty rather than as blank copy under the artwork
      onSubmit({ ...formData, description: formData.description.trim() });
      // Reset form
      setFormData({ name: "", imageUrl: "", description: "" });
      setImagePreview(null);
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({ name: "", imageUrl: "", description: "" });
    setImagePreview(null);
    setIsUploading(false);
    setErrors({});
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="space-y-6 w-full max-w-lg">
        {/* Modal Header */}
        <div>
          <Text variant="h3" weight="bold">
            {isEditMode ? "Edit Flyer" : "Add Flyer"}
          </Text>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Flyer Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-muted">
              Flyer Name
            </label>
            <Input
              type="text"
              placeholder="Enter flyer name"
              value={formData.name}
              onChange={handleNameChange}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <Text variant="small" className="text-red-500">
                {errors.name}
              </Text>
            )}
          </div>

          {/* Flyer Details - the promotion's own copy. Optional: a flyer can
              be pure artwork, so this never blocks a save. */}
          <div className="space-y-2">
            <label
              htmlFor="flyer-description"
              className="block text-sm font-semibold text-muted"
            >
              Flyer Details{" "}
              <span className="font-normal text-muted/70">(optional)</span>
            </label>
            <textarea
              id="flyer-description"
              name="description"
              rows={4}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="What is this flyer about? Offer, dates, terms..."
              value={formData.description}
              onChange={handleDescriptionChange}
              className={`w-full px-4 py-2 rounded-lg text-sm border bg-gray-50 resize-y focus:outline-none ${
                errors.description ? "border-red-500" : "border-muted/50"
              }`}
            />
            <div className="flex items-start justify-between gap-3">
              {errors.description ? (
                <Text variant="small" className="text-red-500">
                  {errors.description}
                </Text>
              ) : (
                <span />
              )}
              <Text variant="caption" color="muted">
                {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
              </Text>
            </div>
          </div>

          {/* Flyer Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-muted">
              Flyer Image
            </label>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 mb-3">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            )}

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange/50 transition-colors bg-gray-50/50"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted" />
                <Text variant="body" weight="semibold" className="mb-1">
                  Drop file or click to upload
                </Text>
                <Text variant="caption" color="muted">
                  JPG, PNG, GIF (Max 5MB)
                </Text>
              </label>
            </div>

            {errors.imageUrl && (
              <Text variant="small" className="text-red-500">
                {errors.imageUrl}
              </Text>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="text-muted border border-muted/20"
          >
            Cancel
          </Button>

          {/* Preview before publishing - disabled until there is something
              to look at, so it can never open an empty frame */}
          <Button
            variant="outline"
            disabled={!imagePreview || isUploading}
            onClick={() => setIsPreviewOpen(true)}
          >
            Preview
          </Button>

          <Button
            variant="primary"
            loading={isUploading}
            onClick={handleSubmit}
            className="bg-orange hover:bg-orange/90"
          >
            {isEditMode ? "Update Flyer" : "Create Flyer"}
          </Button>
        </div>
      </div>

      {/* Preview uses the staged image, so it reflects unsaved edits */}
      <PreviewFlyerModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        flyer={{
          id: flyer?.id || "preview",
          name: formData.name || "Untitled flyer",
          description: formData.description,
          imageUrl: imagePreview || formData.imageUrl || undefined,
          sortOrder: flyer?.sortOrder,
          isActive: flyer?.isActive,
        }}
      />
    </Modal>
  );
}
