import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";

function MultiSelectField({
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
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const [open, setOpen] = useState(false);
        const [search, setSearch] = useState("");
        const wrapperRef = useRef(null);

        const selectedValues = Array.isArray(field.value) ? field.value : [];

        useEffect(() => {
          const handleClickOutside = (event) => {
            if (
              wrapperRef.current &&
              !wrapperRef.current.contains(event.target)
            ) {
              setOpen(false);
            }
          };

          document.addEventListener("mousedown", handleClickOutside);
          return () =>
            document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const optionMap = useMemo(() => {
          const map = new Map();
          options.forEach((opt) => map.set(String(opt.value), opt));
          return map;
        }, [options]);

        const getLabel = (value) =>
          optionMap.get(String(value))?.label ?? value;

        const filteredOptions = useMemo(() => {
          if (searchMode !== "internal") return options;
          if (!filterOptions || !search) return options;

          return options.filter((opt) =>
            String(opt.label).toLowerCase().includes(search.toLowerCase()),
          );
        }, [options, search, searchMode, filterOptions]);

        const handleSelect = (value) => {
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

        const removeItem = (value) => {
          const filtered = selectedValues.filter(
            (item) => String(item) !== String(value),
          );
          field.onChange(filtered);
        };

        const handleSearch = (value) => {
          setSearch(value);
          setOpen(true);

          if (searchMode === "external") {
            onSearchChange?.(value);
          }
        };

        return (
          <div ref={wrapperRef} className="space-y-2 relative">
            {label && (
              <label className="block text-sm font-medium">{label}</label>
            )}

            <div
              className={`w-full border rounded-md px-3 py-2 flex flex-wrap gap-2 items-center ${background} ${
                fieldState.error ? "border-red-500" : "border-gray-300"
              }`}
              onClick={() => setOpen(true)}
            >
              {selectedValues.map((item) => (
                <div
                  key={String(item)}
                  className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md text-sm"
                >
                  {getLabel(item)}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item);
                    }}
                    className="text-red-500 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}

              <input
                value={search}
                disabled={disabled}
                placeholder={placeholder}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {open && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto border rounded-md bg-white dark:bg-slate-900 shadow-lg">
                {filteredOptions.length === 0 ? (
                  <div className="p-2 text-sm text-gray-400">
                    No results found
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
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
