import React, { useState } from "react";
import { Text } from "./Text";
import eyeclose from "@/assets/icons/eye-close.svg";
import Image from "next/image";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  label?: string;
  name: string;
  type?: "text" | "email" | "password" | "number";
  value?: string;
  error?: string;
  disabled?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPasswordToggle?: boolean;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      name,
      type = "text",
      value,
      error,
      disabled = false,
      onChange,
      showPasswordToggle = type === "password",
      className = "",
      ...rest
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === "password";
    const inputType = isPasswordType && showPassword ? "text" : type;
    const hasError = !!error;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={name} className="block">
            <Text variant="body" color="foreground" weight="medium">
              {label}
            </Text>
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={name}
            name={name}
            type={inputType}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`
              w-full text-[14px] px-4 py-2 rounded-lg
              transition-colors
              border ${hasError ? "border-primary" : "border-gray-400/30"}
              focus:outline-none
              ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "bg-gray-50"}
              ${className}
            `.trim()}
            {...rest}
          />

          {isPasswordType && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {showPassword ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="#9BA3B0"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <Image
                  src={eyeclose}
                  alt="Hide password"
                  width={20}
                  height={20}
                  className="w-4 h-4 "
                />
              )}
            </button>
          )}
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

Input.displayName = "Input";
