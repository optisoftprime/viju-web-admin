"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";

export interface SelectOption {
  label: string;
  value: string | number;
}

interface MultiSelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  background?: string;
  searchMode?: "internal" | "external";
  onSearchChange?: (value: string) => void;
  filterOptions?: boolean;
}

export function MultiSelectField<T extends FieldValues>({
  name,
  control,
  label,
  options = [],
  placeholder = "Select option",
  disabled = false,
  background = "bg-white dark:bg-slate-900",
  searchMode = "external",
  onSearchChange,
  filterOptions = true,
}: MultiSelectFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const [open, setOpen] = useState(false);
        const [search, setSearch] = useState("");
        const wrapperRef = useRef<HTMLDivElement>(null);

        const selectedValues = Array.isArray(field.value) ? field.value : [];

        useEffect(() => {
          const handleClickOutside = (event: MouseEvent) => {
            if (
              wrapperRef.current &&
              !wrapperRef.current.contains(event.target as Node)
            ) {
              setOpen(false);
            }
          };

          document.addEventListener("mousedown", handleClickOutside);
          return () =>
            document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const optionMap = useMemo(() => {
          const map = new Map<string, SelectOption>();
          options.forEach((opt) => map.set(String(opt.value), opt));
          return map;
        }, [options]);

        const getLabel = (value: string | number): string =>
          optionMap.get(String(value))?.label ?? String(value);

        const filteredOptions = useMemo(() => {
          if (searchMode !== "internal") return options;
          if (!filterOptions || !search) return options;

          return options.filter((opt) =>
            String(opt.label).toLowerCase().includes(search.toLowerCase()),
          );
        }, [options, search, searchMode, filterOptions]);

        const handleSelect = (value: string | number) => {
          if (!value) return;

          const normalized = String(value);

          if (!selectedValues.map(String).includes(normalized)) {
            field.onChange([...selectedValues, value]);
          }

          setSearch("");
          setOpen(false);

          if (searchMode === "external") {
            onSearchChange?.("");
          }
        };

        const removeItem = (value: string | number) => {
          const filtered = selectedValues.filter(
            (item: any) => String(item) !== String(value),
          );
          field.onChange(filtered);
        };

        const handleSearch = (value: string) => {
          setSearch(value);
          setOpen(true);

          if (searchMode === "external") {
            onSearchChange?.(value);
          }
        };

        return (
          <div ref={wrapperRef} className="space-y-2 relative">
            {label && (
              <label className="block text-sm font-medium text-foreground">
                {label}
              </label>
            )}

            <div
              className={`w-full border rounded-md px-3 py-2 flex flex-wrap gap-2 items-center cursor-pointer  ${
                fieldState.error ? "border-red-500" : "border-[#E5E7EB]"
              }`}
              onClick={() => !disabled && setOpen(true)}
            >
              {selectedValues.map((item: any) => (
                <div
                  key={String(item)}
                  className="flex items-center gap-1   px-2 py-1 rounded-md text-sm text-foreground"
                >
                  {getLabel(item)}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item);
                    }}
                    className="text-red-500 font-bold hover:text-red-700"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </div>
              ))}

              <input
                value={search}
                disabled={disabled}
                placeholder={placeholder}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder-muted disabled:opacity-60"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {open && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto border rounded-md bg-white shadow-lg border-[#E5E7EB]">
                {filteredOptions.length === 0 ? (
                  <div className="p-2 text-sm text-muted">No results found</div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className="cursor-pointer px-3 py-2 text-sm  text-foreground"
                    >
                      {option.label}
                    </div>
                  ))
                )}
              </div>
            )}

            {fieldState.error && (
              <p className="text-xs text-red-500">{fieldState.error.message}</p>
            )}
          </div>
        );
      }}
    />
  );
}

export default MultiSelectField;
