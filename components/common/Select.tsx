import React from "react";
import { Text } from "./Text";
import dropdown from "@/assets/icons/arrow-down.svg";
import Image from "next/image";

export type SelectOption = {
  value: string;
  label: string;
};

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  label?: string;
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
        {label && (
          <label htmlFor={name} className="block">
            <Text variant="body" color="foreground" weight="medium">
              {label}
            </Text>
          </label>
        )}

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
                w-full px-4 py-1 rounded-2xl appearance-none
                border-2 transition-colors
                focus:outline-none focus:ring-1 ring-none text-[13px] font-bold
                bg-white
                ${hasError ? "border-primary" : "border-muted/40"}
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
            <Image
              src={dropdown}
              width={20}
              height={20}
              alt="drop down"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
            />
          </div>
        )}

        {/* Error space - reserved even when empty to prevent layout shift */}
        {hasError && (
          <div className="h-5">
            <Text variant="caption" color="primary" weight="medium">
              {error}
            </Text>
          </div>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
