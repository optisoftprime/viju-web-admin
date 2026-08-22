"use client";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Text } from "./Text";
import dropdown from "@/assets/icons/arrow-down.svg";
import Image from "next/image";

export type SelectOption = {
  value: string;
  label: string;
};

export interface SelectProps<T extends FieldValues> {
  name: Path<T>;
  /**
   * Widened past `Control<T>` so a form that declares a separate transformed
   * output type - useForm<Values, Context, Output> - can still pass its
   * control here. The field itself is still typed by `name`.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  control: Control<T, any, any>;
  label?: string;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export const Select = <T extends FieldValues>({
  name,
  control,
  label,
  options,
  error,
  disabled = false,
  loading = false,
  placeholder,
  className = "",
}: SelectProps<T>) => {
  const hasError = !!error;
  const isDisabled = disabled || loading;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={name}>
          <Text variant="body" color="foreground" weight="medium">
            {label}
          </Text>
        </label>
      )}

      {loading ? (
        <div className="w-full h-10 bg-muted/20 rounded-lg animate-pulse" />
      ) : (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <div className="relative">
              <select
                {...field}
                id={name}
                disabled={isDisabled}
                className={`
                  w-full px-4 py-2 rounded-md appearance-none
                  border transition-colors
                  focus:outline-none focus:ring-1
                  text-[13px] font-medium bg-white
                  ${hasError ? "border-primary" : "border-muted/50"}
                  ${
                    isDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""
                  }
                  ${className}
                `}
              >
                <option value="">{placeholder || `Select ${label}`}</option>

                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <Image
                src={dropdown}
                width={20}
                height={20}
                alt="dropdown"
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  w-5
                  h-5
                  pointer-events-none
                "
              />
            </div>
          )}
        />
      )}

      {hasError && (
        <Text variant="caption" color="primary" weight="medium">
          {error}
        </Text>
      )}
    </div>
  );
};

export default Select;
