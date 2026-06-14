import React, { useState } from "react";
import Image from "next/image";
import eyeclose from "@/assets/icons/eye-close.svg";
import { Text } from "./Text";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      type = "text",
      showPasswordToggle = type === "password",
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={props.id || props.name}>
            <Text variant="body" color="foreground" weight="medium">
              {label}
            </Text>
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={`
              w-full px-4 py-2 rounded-lg text-sm
              border
              ${error ? "border-primary" : "border-muted/50"}
              focus:outline-none
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed bg-gray-50"
                  : "bg-gray-50"
              }
              ${className}
            `}
            {...props}
          />

          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
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
                  alt="Show password"
                  width={16}
                  height={16}
                />
              )}
            </button>
          )}
        </div>

        <div className="min-h-[20px]">
          {error && (
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
