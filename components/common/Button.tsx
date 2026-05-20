import React from "react";

export interface ButtonProps {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "orange" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const sizeMap = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const variantMap = {
  primary: "bg-primary text-white hover:bg-primary/80",
  secondary: "bg-secondary text-white hover:bg-secondary/80",
  orange: "bg-orange text-white hover:bg-orange/80",
  outline: "border border-muted text-foreground hover:bg-milkwhite",
  outlinePrimary:
    "border border-primary text-primary hover:bg-primary hover:text-white",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = "button",
      variant = "primary",
      size = "md",
      disabled = false,
      loading = false,
      fullWidth = false,
      gradient = false,
      onClick,
      children,
      className = "",
    },
    ref,
  ) => {
    const sizeClass = sizeMap[size];
    let variantClass = variantMap[variant];

    // Apply gradient background if enabled
    if (
      gradient &&
      (variant === "primary" || variant === "secondary" || variant === "orange")
    ) {
      variantClass = `bg-gradient-to-r from-primary via-orange to-primary text-white hover:opacity-90`;
    }

    const widthClass = fullWidth ? "w-full" : "";
    const disabledClass =
      disabled || loading ? "opacity-50 cursor-not-allowed" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        className={`
          rounded-lg font-semibold transition-all
          focus:ring-2 ring-orange ring-offset-0
          ${sizeClass}
          ${variantClass}
          ${widthClass}
          ${disabledClass}
          ${className}
        `.trim()}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
