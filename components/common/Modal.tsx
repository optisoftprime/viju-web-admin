import React, { useEffect } from "react";
import { Button } from "./Button";
import { Text } from "./Text";

export interface ModalProps {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  children,
  onClose,
  loading = false,
  actions,
  className = "",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/50"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
      <div
        className={`
          relative bg-milkwhite rounded-xl shadow-lg
          max-w-md w-full mx-4
          ${className}
        `.trim()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted">
          {title && (
            <Text variant="h2" color="foreground" weight="semibold">
              {title}
            </Text>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-muted hover:text-foreground transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="flex gap-3 p-6 border-t border-muted">{actions}</div>
        )}
      </div>
    </div>
  );
};

Modal.displayName = "Modal";
