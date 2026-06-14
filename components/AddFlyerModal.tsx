"use client";

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Upload } from "lucide-react";
import Image from "next/image";

interface AddFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (flyerData: { name: string; image: string }) => void;
}

export default function AddFlyerModal({
  isOpen,
  onClose,
  onSubmit,
}: AddFlyerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    image: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; image?: string }>({});

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, name: value });
    console.log("Form values:", { ...formData, name: value });

    // Clear error if field is filled
    if (value.trim()) {
      setErrors({ ...errors, name: undefined });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, image: "Please upload a valid image file" });
        return;
      }

      // Validate file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors({
          ...errors,
          image: "File size must be less than 5MB",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData({ ...formData, image: result });
        setImagePreview(result);
        console.log("Form values:", {
          ...formData,
          image: "base64_image_data",
        });
        setErrors({ ...errors, image: undefined });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, image: "Please upload a valid image file" });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors({
          ...errors,
          image: "File size must be less than 5MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData({ ...formData, image: result });
        setImagePreview(result);
        console.log("Form values:", {
          ...formData,
          image: "base64_image_data",
        });
        setErrors({ ...errors, image: undefined });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; image?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Flyer Name is required";
    }

    if (!formData.image) {
      newErrors.image = "Flyer Image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      // Reset form
      setFormData({ name: "", image: "" });
      setImagePreview(null);
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({ name: "", image: "" });
    setImagePreview(null);
    setErrors({});
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="space-y-6 w-full max-w-lg">
        {/* Modal Header */}
        <div>
          <Text variant="h3" weight="bold">
            Add Flyer
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

            {errors.image && (
              <Text variant="small" className="text-red-500">
                {errors.image}
              </Text>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="text-muted border border-muted/20"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="bg-orange hover:bg-orange/90"
          >
            Create Flyer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
