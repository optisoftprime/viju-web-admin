import React from "react";
import { Text } from "./Text";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type"
> {
  label: string;
  name: string;
  checked?: boolean;
  error?: string;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      name,
      checked = false,
      error,
      onChange,
      disabled = false,
      className = "",
      ...rest
    },
    ref,
  ) => {
    const hasError = !!error;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <input
            ref={ref}
            id={name}
            type="checkbox"
            name={name}
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={disabled}
            className={`
              w-5 h-5 rounded border-2 transition-colors cursor-pointer
              focus:outline-none focus:ring-2 ring-orange ring-offset-0
              ${hasError ? "border-primary" : "border-muted"}
              ${checked ? "bg-primary border-primary" : ""}
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${className}
            `.trim()}
            {...rest}
          />
          <label htmlFor={name} className="cursor-pointer">
            <Text
              variant="body"
              color="foreground"
              weight="normal"
              className={disabled ? "opacity-50" : ""}
            >
              {label}
            </Text>
          </label>
        </div>

        {/* Error space - reserved even when empty to prevent layout shift */}
        <div className="h-5">
          {hasError && (
            <Text variant="caption" color="primary" weight="medium">
              {error}
            </Text>
          )}
        </div>
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
