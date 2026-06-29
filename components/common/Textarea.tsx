import React from "react";
import { Text } from "./Text";

export interface TextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange"
> {
  label: string;
  name: string;
  value?: string;
  error?: string;
  maxLength?: number;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      name,
      value = "",
      error,
      maxLength,
      onChange,
      disabled = false,
      className = "",
      ...rest
    },
    ref,
  ) => {
    const hasError = !!error;
    const charCount = value.length;
    const showCharCount = maxLength !== undefined;

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={name} className="block">
          <Text variant="body" color="foreground" weight="medium">
            {label}
          </Text>
        </label>

        <textarea
          ref={ref}
          id={name}
          name={name}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`
            w-full px-4 py-2 rounded-md
            border transition-colors
            focus:outline-none focus:ring-2 ring-orange
            resize-y
            ${hasError ? "border-primary" : "border-muted/50"}
            ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}
            ${className}
          `.trim()}
          {...rest}
        />

        {/* Character count and error space */}
        <div className="h-5 flex justify-between items-start">
          {showCharCount && (
            <Text variant="caption" color="muted" weight="normal">
              {charCount}
              {maxLength ? `/${maxLength}` : ""}
            </Text>
          )}
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

Textarea.displayName = "Textarea";
