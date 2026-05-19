import React from "react";
import { Text } from "./Text";

export type SelectOption = {
  value: string;
  label: string;
};

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  label: string;
  name: string;
  options: SelectOption[];
  value?: string;
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  loading?: boolean;
  className?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      name,
      options,
      value,
      error,
      disabled = false,
      onChange,
      loading = false,
      className = "",
      ...rest
    },
    ref,
  ) => {
    const hasError = !!error;
    const isDisabled = disabled || loading || options.length === 0;

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={name} className="block">
          <Text variant="body" color="foreground" weight="medium">
            {label}
          </Text>
        </label>

        {loading ? (
          // Loading skeleton
          <div className="w-full h-10 bg-muted/20 rounded-lg animate-pulse" />
        ) : (
          <div className="relative">
            <select
              ref={ref}
              id={name}
              name={name}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={isDisabled}
              className={`
                w-full px-4 py-2 rounded-lg appearance-none
                border-2 transition-colors
                focus:outline-none focus:ring-2 ring-orange
                bg-white
                ${hasError ? "border-primary" : "border-muted"}
                ${isDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}
                ${className}
              `.trim()}
              {...rest}
            >
              <option value="">-- Select {label} --</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Dropdown arrow */}
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        )}

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

Select.displayName = "Select";
